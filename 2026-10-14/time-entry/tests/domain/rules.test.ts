import { describe, expect, it } from 'vitest';
import { canAdd, canRemove, dayStatus, harshestGrace, lockedFloor, pieceStatus, showsLock } from '../../src/domain/rules';
import { HOUR } from '../../src/domain/time';
import { at, openOf, selection, span, team, windowOf } from './fixtures';

const w = windowOf('a', '2026-11-05', '09:30', '21:00');
const open = openOf(w);
const GRACE = 36 * HOUR;

describe('grace period and past days, judged per open piece', () => {
  it.each([
    { id: 'EC-GRACE-01', boundary: 'long before the grace point', now: at('2026-11-01', '12:00'), locked: false, past: false },
    { id: 'BV-GRACE-02', boundary: '1 ms before the grace point', now: w.interval.start - GRACE - 1, locked: false, past: false },
    { id: 'BV-GRACE-03', boundary: 'exactly at the grace point', now: w.interval.start - GRACE, locked: true, past: false },
    { id: 'EC-GRACE-04', boundary: 'during the window', now: at('2026-11-05', '12:00'), locked: true, past: false },
    { id: 'BV-PAST-05', boundary: '1 ms before the window ends', now: w.interval.end - 1, locked: true, past: false },
    { id: 'BV-PAST-06', boundary: 'exactly at the window end', now: w.interval.end, locked: true, past: true },
  ])('$id $boundary', ({ now, locked, past }) => {
    expect(pieceStatus(w.interval, now, GRACE)).toEqual({ locked, past });
  });

  it('BV-PAST-07 a window that runs past midnight is not past at 00:30 of the next calendar day', () => {
    const night = windowOf('a', '2026-11-03', '20:30', '26:30');
    expect(pieceStatus(night.interval, at('2026-11-04', '00:30'), GRACE).past).toBe(false);
    expect(pieceStatus(night.interval, at('2026-11-04', '02:30'), GRACE).past).toBe(true);
  });

  it('EC-DAY-01 two pieces on one day: the morning may be frozen while the evening is still open', () => {
    const day = openOf(windowOf('a', '2026-11-03', '09:30', '18:00'), windowOf('b', '2026-11-03', '20:30', '26:30'));
    const now = at('2026-11-02', '12:00'); // 21.5 h before the morning, 32.5 h before the evening
    expect(pieceStatus(day.pieces[0], now, 24 * HOUR).locked).toBe(true);
    expect(pieceStatus(day.pieces[1], now, 24 * HOUR).locked).toBe(false);
    expect(dayStatus(day, now, 24 * HOUR)).toEqual({ empty: false, past: false, locked: true });
  });
  it('BV-DAY-02 a day is past only when its last piece is over', () => {
    const day = openOf(windowOf('a', '2026-11-03', '09:30', '18:00'), windowOf('b', '2026-11-03', '20:30', '26:30'));
    expect(dayStatus(day, at('2026-11-03', '19:00'), GRACE).past).toBe(false);
    expect(dayStatus(day, at('2026-11-04', '02:30'), GRACE).past).toBe(true);
  });
  it('BV-DAY-03 a day without any window is empty, neither past nor locked', () => {
    expect(dayStatus({ day: '2026-11-07', pieces: [], teamIds: [], addedSinceSeen: [] }, at('2026-11-20', '12:00'), GRACE)).toEqual({ empty: true, past: false, locked: false });
  });

  it.each([
    { id: 'EC-TEAM-01', klass: 'one team', graces: [24], expected: 24 },
    { id: 'EC-TEAM-02', klass: 'two teams: the harsher (longer) one applies to both', graces: [24, 36], expected: 36 },
    { id: 'BV-TEAM-03', klass: 'equal graces', graces: [36, 36], expected: 36 },
    { id: 'BV-TEAM-04', klass: 'a team with no grace at all', graces: [0, 12], expected: 12 },
  ])('$id $klass', ({ graces, expected }) => {
    expect(harshestGrace(graces.map((g, i) => team(`t${i}`, g)))).toBe(expected * HOUR);
  });

  const piece = span('2026-11-05', '10:00', '12:00');
  it('EC-PERM-01 unlocked: add and remove', () => {
    const now = at('2026-11-01', '12:00');
    expect(canAdd(pieceStatus(w.interval, now, GRACE))).toBe(true);
    expect(canRemove(piece, selection({ current: [piece], confirmed: [piece] }), open, now, GRACE)).toBe(true);
    expect(showsLock(pieceStatus(w.interval, now, GRACE))).toBe(false);
  });
  it('EC-PERM-02 locked: add yes, remove a confirmed shift no, remove a not-yet-confirmed one yes', () => {
    const now = at('2026-11-05', '08:00');
    const fresh = span('2026-11-05', '14:00', '15:00');
    const sel = selection({ current: [piece, fresh], confirmed: [piece] });
    expect(canAdd(pieceStatus(w.interval, now, GRACE))).toBe(true);
    expect(canRemove(piece, sel, open, now, GRACE)).toBe(false);
    expect(canRemove(fresh, sel, open, now, GRACE)).toBe(true);
    expect(showsLock(pieceStatus(w.interval, now, GRACE))).toBe(true);
    expect(lockedFloor(open, sel, now, GRACE)).toEqual([piece]);
  });
  it('EC-PERM-03 past: nothing responds and no lock is shown', () => {
    const now = at('2026-11-06', '08:00');
    expect(canAdd(pieceStatus(w.interval, now, GRACE))).toBe(false);
    expect(canRemove(piece, selection({ current: [piece] }), open, now, GRACE)).toBe(false);
    expect(showsLock(pieceStatus(w.interval, now, GRACE))).toBe(false);
  });
  it('BV-PERM-04 the floor only covers the frozen piece of the day', () => {
    const day = openOf(windowOf('a', '2026-11-03', '09:30', '18:00'), windowOf('b', '2026-11-03', '20:30', '26:30'));
    const morning = span('2026-11-03', '10:00', '12:00');
    const evening = span('2026-11-03', '21:00', '23:00');
    const sel = selection({ current: [morning, evening], confirmed: [morning, evening] });
    const now = at('2026-11-02', '12:00'); // grace 24 h: morning frozen, evening not
    expect(lockedFloor(day, sel, now, 24 * HOUR)).toEqual([morning]);
    expect(canRemove(evening, sel, day, now, 24 * HOUR)).toBe(true);
  });
});
