import { describe, expect, it } from 'vitest';
import { dummyBackend } from '../../src/adapters/dummy/backend';
import { toSchedule } from '../../src/adapters/dummy/mapping';
import { SCENARIOS, utc } from '../../src/adapters/dummy/scenarios';
import { memoryPreferences } from '../../src/adapters/browserPreferences';
import { openDay } from '../../src/domain/model';
import { HOUR, clipTo, sameSet } from '../../src/domain/time';

const clockAt = (iso: string) => ({ now: () => Date.parse(iso) });

describe('dummy data mapping (DTO → domain)', () => {
  it('EC-DTO-01 admin intervals arrive as UTC and stay UTC', () => {
    const schedule = toSchedule(SCENARIOS.demo);
    const tuesdayCarpet = schedule.windows.find((w) => w.id === 'carpet-2026-11-03')!;
    expect(new Date(tuesdayCarpet.interval.start).toISOString()).toBe('2026-11-03T18:30:00.000Z'); // 20:30 Tallinn
    expect(new Date(tuesdayCarpet.interval.end).toISOString()).toBe('2026-11-04T00:30:00.000Z'); // 02:30 next day
    expect(tuesdayCarpet.day).toBe('2026-11-03');
  });
  it('EC-DTO-02 a draft is in the working selection but not in the confirmed floor', () => {
    const s = toSchedule(SCENARIOS.demo).selections['2026-11-05'];
    expect(s.current).toHaveLength(1);
    expect(s.confirmed).toHaveLength(0);
  });
  it('BV-DTO-03 every window lies inside the general interval and nothing is selected outside its window', () => {
    for (const [name, dto] of Object.entries(SCENARIOS)) {
      const schedule = toSchedule(dto);
      for (const w of schedule.windows) {
        expect(w.interval.start).toBeGreaterThanOrEqual(schedule.period.interval.start);
        expect(w.interval.end).toBeLessThanOrEqual(schedule.period.interval.end + 8 * HOUR);
      }
      for (const [day, s] of Object.entries(schedule.selections)) {
        const open = openDay(schedule, day);
        for (const piece of [...s.current, ...s.leaderAdded, ...s.leaderRemoved]) {
          expect(sameSet(clipTo([piece], open.pieces), [{ start: piece.start, end: piece.end }]), `${name} ${day} ${new Date(piece.start).toISOString()}`).toBe(true);
        }
      }
    }
  });
});

describe('dummy backend validates like the real one must', () => {
  const now = SCENARIOS.demo.suggestedNowUtc; // Tue 3 Nov 10:00 Tallinn; harshest grace 36 h
  const start = async () => {
    const backend = dummyBackend(SCENARIOS.demo, clockAt(now), 0);
    const schedule = await backend.load();
    const selections = Object.fromEntries(Object.entries(schedule.selections).map(([day, s]) => [day, s.current]));
    return { backend, schedule, selections };
  };
  const day = (d: string, a: string, b: string) => ({ start: Date.parse(utc(d, a)), end: Date.parse(utc(d, b)) });

  it('EC-BE-01 adding on a locked day is accepted', async () => {
    const { backend, selections } = await start();
    const id = '2026-11-04';
    const result = await backend.confirm({ selections: { ...selections, [id]: [...selections[id], day('2026-11-04', '12:00', '13:00')] }, comments: {}, sentAt: 0 });
    expect(result.ok).toBe(true);
  });
  it('EC-BE-02 removing a confirmed shift on a locked day is rejected', async () => {
    const { backend, selections } = await start();
    const result = await backend.confirm({ selections: { ...selections, '2026-11-04': [] }, comments: {}, sentAt: 0 });
    expect(result).toEqual({ ok: false, rejected: [{ day: '2026-11-04', reason: 'locked' }] });
  });
  it('EC-BE-03 removing on a day that is not locked yet is accepted', async () => {
    const { backend, selections } = await start();
    const result = await backend.confirm({ selections: { ...selections, '2026-11-05': [] }, comments: {}, sentAt: 0 });
    expect(result.ok && sameSet(result.schedule.selections['2026-11-05'].confirmed, [])).toBe(true);
  });
  it('EC-BE-04 anything on a past day is rejected', async () => {
    const { backend, selections } = await start();
    const id = '2026-10-30';
    const result = await backend.confirm({ selections: { ...selections, [id]: [...selections[id], day('2026-10-30', '16:00', '17:00')] }, comments: {}, sentAt: 0 });
    expect(result).toMatchObject({ ok: false, rejected: [{ day: id, reason: 'past' }] });
  });
  it('BV-BE-05 a selection reaching 5 minutes outside its window is rejected', async () => {
    const { backend, selections } = await start();
    const id = '2026-11-06';
    const result = await backend.confirm({ selections: { ...selections, [id]: [day('2026-11-06', '09:25', '10:00')] }, comments: {}, sentAt: 0 });
    expect(result).toMatchObject({ ok: false, rejected: [{ day: id, reason: 'outside' }] });
  });
});

describe('preferences adapter contract', () => {
  it('EC-PREF-01 a value written is read back; an unknown key is null', () => {
    const prefs = memoryPreferences();
    expect(prefs.get('tip.midnight.hidden')).toBeNull();
    prefs.set('tip.midnight.hidden', '1');
    expect(prefs.get('tip.midnight.hidden')).toBe('1');
  });
});

describe('generated boundary combinations', () => {
  it('GEN-01 every combination maps to a valid schedule whose "now" matches its time dimension', async () => {
    const { COMBINATIONS, generate, generatedId } = await import('../../src/adapters/dummy/generated');
    expect(COMBINATIONS).toHaveLength(4 * 4 * 3 * 4);
    expect(new Set(COMBINATIONS.map(generatedId)).size).toBe(COMBINATIONS.length);
    const { harshestGrace, dayStatus } = await import('../../src/domain/rules');
    for (const c of COMBINATIONS) {
      const schedule = toSchedule(generate(c));
      const now = Date.parse(generate(c).suggestedNowUtc);
      const status = dayStatus(openDay(schedule, '2026-11-05'), now, harshestGrace(schedule.teams));
      expect(status.past, generatedId(c)).toBe(c.time === 'past');
      expect(status.locked, generatedId(c)).toBe(c.time === 'locked');
      expect(schedule.teams.length, generatedId(c)).toBe(c.teams === 'one' ? 1 : 2);
    }
  });
});
