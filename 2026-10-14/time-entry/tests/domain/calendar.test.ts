import { describe, expect, it } from 'vitest';
import { intlZone } from '../../src/adapters/intlZone';
import { dayMinuteToInstant, formatClock, pageOf, parseClock, resolveClock } from '../../src/domain/calendar';
import { EET } from './fixtures';

describe('parsing typed clock times', () => {
  it.each([
    { id: 'EC-PARSE-01', klass: 'HH:MM', text: '09:30', expected: 570 },
    { id: 'EC-PARSE-02', klass: 'H:MM without leading zero', text: '9:30', expected: 570 },
    { id: 'EC-PARSE-03', klass: 'digits only', text: '0930', expected: 570 },
    { id: 'EC-PARSE-04', klass: 'dot separator', text: '21.05', expected: 1265 },
    { id: 'EC-PARSE-05', klass: 'hour only', text: '7', expected: 420 },
    { id: 'BV-PARSE-06', klass: 'lowest valid 00:00', text: '00:00', expected: 0 },
    { id: 'BV-PARSE-07', klass: 'highest valid 23:59', text: '23:59', expected: 1439 },
    { id: 'BV-PARSE-08', klass: '24:00 is read as midnight', text: '24:00', expected: 0 },
    { id: 'BV-PARSE-09', klass: 'just invalid: minute 60', text: '12:60', expected: null },
    { id: 'BV-PARSE-10', klass: 'just invalid: hour 25', text: '25:00', expected: null },
    { id: 'EC-PARSE-11', klass: 'placeholder text', text: 'XX:XX', expected: null },
    { id: 'EC-PARSE-12', klass: 'empty', text: '', expected: null },
  ])('$id $klass: "$text"', ({ text, expected }) => {
    expect(parseClock(text)).toBe(expected);
  });
});

describe('resolving a clock time inside a window (day minutes)', () => {
  const day = '2026-11-03';
  // Window 20:30 → 02:30 next day = day minutes 1230..1590
  it.each([
    { id: 'EC-RES-01', boundary: 'evening value, before midnight', clock: 21 * 60, expected: 1260 },
    { id: 'BV-RES-02', boundary: 'exactly midnight belongs to the night', clock: 0, expected: 1440 },
    { id: 'EC-RES-03', boundary: 'past midnight: 01:00 means next day', clock: 60, expected: 1500 },
    { id: 'BV-RES-04', boundary: 'window end 02:30 itself', clock: 150, expected: 1590 },
    { id: 'BV-RES-05', boundary: 'window start 20:30 itself', clock: 1230, expected: 1230 },
    { id: 'BV-RES-06', boundary: '5 min after the end clamps back to the end', clock: 155, expected: 1590 },
    { id: 'BV-RES-07', boundary: '5 min before the start clamps to the start', clock: 1225, expected: 1230 },
    { id: 'EC-RES-08', boundary: 'midday, far outside: clamps to the nearer edge (start)', clock: 12 * 60, expected: 1230 },
  ])('$id $boundary', ({ clock, expected }) => {
    expect(resolveClock(EET, day, clock, 1230, 1590)).toBe(expected);
  });

  it('EC-RES-09 a window longer than 24 h: the first matching occurrence wins', () => {
    // 08:00 → 08:00 next day (+ the back-to-back neighbour): 08:00 exists at 480 and at 1920
    expect(resolveClock(EET, day, 480, 480, 1920)).toBe(480);
    expect(resolveClock(EET, day, 480, 900, 1920)).toBe(1920);
  });

  const tallinn = intlZone('Europe/Tallinn');
  it('BV-DST-01 autumn change (25 Oct 2026, 04:00 → 03:00): 03:30 happens twice, both resolve to a real instant', () => {
    const d = '2026-10-25';
    const first = resolveClock(tallinn, d, 210, 0, 239);
    const second = resolveClock(tallinn, d, 210, 240, 1500);
    expect(tallinn.clockOf(dayMinuteToInstant(tallinn, d, first))).toBe(210);
    expect(tallinn.clockOf(dayMinuteToInstant(tallinn, d, second))).toBe(210);
    expect(second - first).toBe(60);
  });
  it('BV-DST-02 spring change (29 Mar 2026, 03:00 → 04:00): 05:00 is only four hours after midnight', () => {
    const d = '2026-03-29';
    const minute = resolveClock(tallinn, d, 300, 0, 1440);
    expect(minute).toBe(240);
    expect(formatClock(tallinn.clockOf(dayMinuteToInstant(tallinn, d, minute)))).toBe('05:00');
  });
  it('EC-ZONE-01 the Intl zone agrees with the dummy data offset in winter', () => {
    expect(tallinn.startOfDay('2026-11-03')).toBe(Date.parse('2026-11-02T22:00:00Z'));
    expect(tallinn.dayOf(Date.parse('2026-11-03T22:30:00Z'))).toBe('2026-11-04');
    expect(tallinn.clockOf(Date.parse('2026-11-03T22:30:00Z'))).toBe(30);
  });
});

describe('paging through illustrative weeks – columns always start at Monday', () => {
  const first = '2026-10-28';
  const last = '2026-11-24';
  it.each([
    { id: 'BV-PAGE-01', boundary: '7 columns fit: the whole week (lowest week value)', fit: 7, mode: 'week', count: 7 },
    { id: 'BV-PAGE-02', boundary: '6 columns fit: a range (highest range value)', fit: 6, mode: 'range', count: 6 },
    { id: 'EC-PAGE-03', boundary: '4 columns', fit: 4, mode: 'range', count: 4 },
    { id: 'BV-PAGE-04', boundary: '1 column', fit: 1, mode: 'range', count: 1 },
  ])('$id $boundary', ({ fit, mode, count }) => {
    const page = pageOf(first, last, '2026-11-03', fit);
    expect(page.mode).toBe(mode);
    expect(page.days).toHaveLength(count);
    expect(page.days).toContain('2026-11-03');
    expect(page.monday).toBe('2026-11-02');
  });

  it('EC-PAGE-05 a week runs from Monday to Sunday', () => {
    expect(pageOf(first, last, '2026-11-03', 7).days).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']);
  });
  it('BV-PAGE-06 chunks are cut from Monday: with 4 columns a week is Mon–Thu, then Fri–Sun; the next week starts at Monday again', () => {
    const a = pageOf(first, last, '2026-11-02', 4);
    expect(a.days).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05']);
    const b = pageOf(first, last, a.nextAnchor!, 4);
    expect(b.days).toEqual(['2026-11-06', '2026-11-07', '2026-11-08']);
    const c = pageOf(first, last, b.nextAnchor!, 4);
    expect(c.days[0]).toBe('2026-11-09');
  });
  it('BV-PAGE-07 resizing keeps the week: Thursday is in Mon–Thu at 4 columns, Mon–Wed/Thu–Sat at 3, Thu–Sun at... ', () => {
    expect(pageOf(first, last, '2026-11-05', 4).days[0]).toBe('2026-11-02');
    expect(pageOf(first, last, '2026-11-05', 3).days).toEqual(['2026-11-05', '2026-11-06', '2026-11-07']);
    expect(pageOf(first, last, '2026-11-05', 2).days).toEqual(['2026-11-06', '2026-11-07'].length ? ['2026-11-04', '2026-11-05'] : []);
    expect(pageOf(first, last, '2026-11-05', 1).days).toEqual(['2026-11-05']);
    for (const fit of [1, 2, 3, 4, 5, 6, 7]) expect(pageOf(first, last, '2026-11-05', fit).monday).toBe('2026-11-02');
  });
  it('BV-PAGE-08 the first page starts on the Monday before the period, with days outside it shown (closed)', () => {
    const page = pageOf(first, last, first, 7);
    expect(page.days[0]).toBe('2026-10-26');
    expect(page.prevAnchor).toBeNull();
    expect(page.before).toBeNull();
    expect(page.after).toEqual({ from: '2026-11-02' });
  });
  it('BV-PAGE-09 last week: nothing after it', () => {
    const page = pageOf(first, last, last, 7);
    expect(page.nextAnchor).toBeNull();
    expect(page.before).toEqual({ from: '2026-10-28', to: '2026-11-22' });
  });
  it('EC-PAGE-10 with Monday–Friday configured, five columns make a week and a Sunday anchor falls forward', () => {
    const page = pageOf(first, last, '2026-11-08', 5, [0, 1, 2, 3, 4]);
    expect(page.mode).toBe('week');
    expect(page.days[0]).toBe('2026-11-09');
  });
  it('EC-PAGE-11 stepping forward and back returns to the same page', () => {
    const start = pageOf(first, last, '2026-11-03', 4);
    const next = pageOf(first, last, start.nextAnchor!, 4);
    expect(pageOf(first, last, next.prevAnchor!, 4).days).toEqual(start.days);
  });
});
