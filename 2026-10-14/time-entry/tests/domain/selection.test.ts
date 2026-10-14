import { describe, expect, it } from 'vitest';
import { applyEdit, confirmAll, isDirty, snap, type Edit, type EditContext } from '../../src/domain/selection';
import { HOUR, MINUTE, setCovers, totalDuration } from '../../src/domain/time';
import { at, openOf, scheduleOf, selection, span, windowOf } from './fixtures';

const DAY = '2026-11-03';
const w = windowOf('a', DAY, '20:30', '26:30'); // 20:30 → 02:30 next day
const open = openOf(w);
const STEP = 5 * MINUTE;
const GRACE = 24 * HOUR;
const ctx = (now: number, o = open): EditContext => ({ open: o, now, graceMs: GRACE, step: STEP });
const OPEN = ctx(at('2026-11-01', '12:00'));
const LOCKED = ctx(at(DAY, '12:00'));
const PAST = ctx(at('2026-11-04', '03:00'));

describe('snapping an entered interval into the open area', () => {
  it.each([
    { id: 'EC-SNAP-01', boundary: 'inside, on the step', raw: ['21:00', '23:00'], expected: [['21:00', '23:00']] },
    { id: 'EC-SNAP-02', boundary: 'off the step: 20:36 → 20:35', raw: ['20:36', '23:00'], expected: [['20:35', '23:00']] },
    { id: 'BV-SNAP-03', boundary: 'starts before the window: pulled to 20:30', raw: ['19:00', '23:00'], expected: [['20:30', '23:00']] },
    { id: 'BV-SNAP-04', boundary: 'ends after the window: pulled to 02:30', raw: ['23:00', '27:00'], expected: [['23:00', '26:30']] },
    { id: 'BV-SNAP-05', boundary: 'spans midnight exactly on the boundary', raw: ['23:55', '24:05'], expected: [['23:55', '24:05']] },
    { id: 'BV-SNAP-06', boundary: 'whole window', raw: ['20:30', '26:30'], expected: [['20:30', '26:30']] },
    { id: 'BV-SNAP-07', boundary: 'shortest possible: one step', raw: ['26:25', '26:30'], expected: [['26:25', '26:30']] },
    { id: 'BV-SNAP-08', boundary: 'rounds to nothing (2 minutes)', raw: ['21:00', '21:02'], expected: [] },
    { id: 'BV-SNAP-09', boundary: 'end before start', raw: ['23:00', '22:00'], expected: [] },
  ])('$id $boundary', ({ raw, expected }) => {
    expect(snap(span(DAY, raw[0], raw[1]), open.pieces, STEP)).toEqual(expected.map(([a, b]) => span(DAY, a, b)));
  });
  it('BV-SNAP-10 a span across the gap between two teams is clipped to both pieces', () => {
    const two = openOf(windowOf('a', DAY, '09:30', '18:00'), windowOf('b', DAY, '20:30', '26:30'));
    expect(snap(span(DAY, '17:00', '21:00'), two.pieces, STEP)).toEqual([span(DAY, '17:00', '18:00'), span(DAY, '20:30', '21:00')]);
  });
});

describe('editing a selection', () => {
  it('EC-EDIT-01 several intervals may live in one day', () => {
    let s = selection();
    for (const [a, b] of [['20:30', '22:00'], ['23:00', '24:30'], ['25:00', '26:30']]) {
      const out = applyEdit(s, OPEN, { kind: 'add', interval: span(DAY, a, b) });
      expect(out.ok).toBe(true);
      if (out.ok) s = out.selection;
    }
    expect(s.current).toHaveLength(3);
  });
  it('BV-EDIT-02 back-to-back intervals merge into one', () => {
    const first = applyEdit(selection(), OPEN, { kind: 'add', interval: span(DAY, '21:00', '22:00') });
    const second = first.ok && applyEdit(first.selection, OPEN, { kind: 'add', interval: span(DAY, '22:00', '23:00') });
    expect(second && second.ok && second.selection.current).toEqual([span(DAY, '21:00', '23:00')]);
  });
  it.each([
    { id: 'BV-EDIT-03', boundary: 'ends exactly where the window starts', raw: ['19:00', '20:30'] },
    { id: 'BV-EDIT-04', boundary: 'starts exactly where the window ends', raw: ['26:30', '27:00'] },
    { id: 'EC-EDIT-05', boundary: 'earlier the same day, nowhere near', raw: ['09:00', '10:00'] },
  ])('$id add outside is refused: $boundary', ({ raw }) => {
    expect(applyEdit(selection(), OPEN, { kind: 'add', interval: span(DAY, raw[0], raw[1]) })).toEqual({ ok: false, reason: 'outside' });
  });
  it('EC-EDIT-06 unlocked: a confirmed shift can be removed', () => {
    const piece = span(DAY, '21:00', '23:00');
    const out = applyEdit(selection({ current: [piece], confirmed: [piece] }), OPEN, { kind: 'remove', interval: piece });
    expect(out.ok && out.selection.current).toEqual([]);
  });
  it('EC-EDIT-07 locked: removing a confirmed shift is undone by the floor and reported', () => {
    const piece = span(DAY, '21:00', '23:00');
    const out = applyEdit(selection({ current: [piece], confirmed: [piece] }), LOCKED, { kind: 'remove', interval: piece });
    expect(out).toMatchObject({ ok: true, held: true });
    expect(out.ok && out.selection.current).toEqual([piece]);
  });
  it('EC-EDIT-08 locked: adding still works', () => {
    const piece = span(DAY, '21:00', '23:00');
    const out = applyEdit(selection({ current: [piece], confirmed: [piece] }), LOCKED, { kind: 'add', interval: span(DAY, '24:00', '25:00') });
    expect(out).toMatchObject({ ok: true, held: false });
    expect(out.ok && out.selection.current).toHaveLength(2);
  });
  it('EC-EDIT-09 locked: a shift added after the lock and not yet confirmed can still be taken back', () => {
    const confirmed = span(DAY, '21:00', '23:00');
    const fresh = span(DAY, '24:00', '25:00');
    const out = applyEdit(selection({ current: [confirmed, fresh], confirmed: [confirmed] }), LOCKED, { kind: 'remove', interval: fresh });
    expect(out.ok && out.selection.current).toEqual([confirmed]);
  });
  it('BV-EDIT-10 locked: shrinking a confirmed shift by one step is held, growing it by one step is not', () => {
    const piece = span(DAY, '21:00', '23:00');
    const sel = selection({ current: [piece], confirmed: [piece] });
    const shrink = applyEdit(sel, LOCKED, { kind: 'replace', from: piece, to: span(DAY, '21:05', '23:00') });
    const grow = applyEdit(sel, LOCKED, { kind: 'replace', from: piece, to: span(DAY, '20:55', '23:00') });
    expect(shrink.ok && shrink.held).toBe(true);
    expect(shrink.ok && shrink.selection.current).toEqual([piece]);
    expect(grow.ok && grow.held).toBe(false);
    expect(grow.ok && grow.selection.current).toEqual([span(DAY, '20:55', '23:00')]);
  });
  it.each<{ id: string; edit: Edit }>([
    { id: 'EC-EDIT-11 add', edit: { kind: 'add', interval: span(DAY, '21:00', '22:00') } },
    { id: 'EC-EDIT-12 remove', edit: { kind: 'remove', interval: span(DAY, '21:00', '22:00') } },
  ])('$id on a past day does not respond', ({ edit }) => {
    expect(applyEdit(selection(), PAST, edit)).toEqual({ ok: false, reason: 'past' });
  });
  it('BV-EDIT-13 two teams, one day: an edit touching only the past morning piece is refused, the evening still takes time', () => {
    const two = openOf(windowOf('a', DAY, '09:30', '18:00'), windowOf('b', DAY, '20:30', '26:30'));
    const evening = ctx(at(DAY, '19:00'), two); // morning over, evening ahead (and frozen)
    expect(applyEdit(selection(), evening, { kind: 'add', interval: span(DAY, '10:00', '12:00') })).toEqual({ ok: false, reason: 'outside' });
    const out = applyEdit(selection(), evening, { kind: 'add', interval: span(DAY, '17:00', '22:00') });
    expect(out.ok && out.selection.current).toEqual([span(DAY, '20:30', '22:00')]);
  });

  it('INV-LOCK-01 no sequence of edits on a locked day can lose confirmed time', () => {
    const confirmed = [span(DAY, '21:00', '22:30'), span(DAY, '24:00', '25:15')];
    let s = selection({ current: confirmed, confirmed });
    let seed = 20261103;
    const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < 600; i++) {
      const a = at(DAY, '19:00') + Math.floor(random() * 9 * 60) * MINUTE;
      const b = a + Math.floor(random() * 180) * MINUTE;
      const piece = s.current[Math.floor(random() * s.current.length)];
      const edits: Edit[] = [
        { kind: 'add', interval: { start: a, end: b } },
        { kind: 'remove', interval: { start: a, end: b } },
        { kind: 'replace', from: piece, to: { start: a, end: b } },
      ];
      const out = applyEdit(s, LOCKED, edits[Math.floor(random() * 3)]);
      if (out.ok) s = out.selection;
      expect(setCovers(s.current, confirmed)).toBe(true);
      expect(s.current.every((p) => p.start >= w.interval.start && p.end <= w.interval.end)).toBe(true);
    }
    expect(totalDuration(s.current)).toBeGreaterThanOrEqual(totalDuration(confirmed));
  });

  it('EC-CONF-01 confirming turns the working selection into the floor', () => {
    const piece = span(DAY, '21:00', '23:00');
    const schedule = scheduleOf([w], { [DAY]: selection({ current: [piece] }) });
    expect(isDirty(schedule)).toBe(true);
    const done = confirmAll(schedule);
    expect(isDirty(done)).toBe(false);
    expect(done.selections[DAY].confirmed).toEqual([piece]);
  });
});
