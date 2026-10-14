import { describe, expect, it } from 'vitest';
import { countRows, fitText, fitTransition, floorSize, ladder, type FitState } from '../../src/domain/textFit';

const RUNGS = ladder(48, [2, 2, 3, 3, 3, 4, 4]);
/** A fake measure: every character is half the font size wide. */
const rowsAt = (text: string, width: number) => (size: number) => countRows([text], width, (t) => t.length * size * 0.5);

describe('size floor: at most a quarter off, rounded down to whole 2-point steps', () => {
  it.each([
    { id: 'BV-FLOOR-01', base: 36, floor: 28, note: '36 · ¼ = 9 → 8 → 28' },
    { id: 'BV-FLOOR-02', base: 48, floor: 36, note: '12 → 12' },
    { id: 'BV-FLOOR-03', base: 64, floor: 48, note: '16 → 16' },
    { id: 'BV-FLOOR-04', base: 38, floor: 30, note: '9.5 → 8' },
    { id: 'BV-FLOOR-05', base: 8, floor: 6, note: 'smallest base that still steps once' },
    { id: 'BV-FLOOR-06', base: 7, floor: 7, note: 'too small to step at all' },
  ])('$id $base → $floor ($note)', ({ base, floor }) => {
    expect(floorSize(base)).toBe(floor);
    expect(floorSize(base)).toBeGreaterThanOrEqual(base * 0.75);
  });
  it('BV-FLOOR-08 a base where a third would still be whole steps (60 → 40) stops at the quarter (60 → 46)', () => {
    expect(floorSize(60)).toBe(46);
  });
  it('EC-FLOOR-07 a ladder must stop exactly at the floor', () => {
    expect(ladder(36, [2, 2, 3, 3, 4]).at(-1)!.size).toBe(28);
    expect(() => ladder(36, [2, 2, 3, 3])).toThrow();
    expect(() => ladder(36, [2, 3, 2, 3, 4])).toThrow();
  });
});

describe('size ladder', () => {
  it('EC-FIT-01 sizes go down in 2-point steps and rows never shrink as the type gets smaller', () => {
    expect(RUNGS.map((r) => r.size)).toEqual([48, 46, 44, 42, 40, 38, 36]);
    RUNGS.slice(1).forEach((r, i) => expect(r.maxRows).toBeGreaterThanOrEqual(RUNGS[i].maxRows));
    expect(RUNGS.at(-1)!.maxRows).toBeGreaterThan(RUNGS[0].maxRows);
  });
});

describe('fit machine', () => {
  it.each<{ id: string; boundary: string; state: FitState; event: 'fits' | 'overflow'; expected: FitState }>([
    { id: 'EC-FSM-01', boundary: 'fits on the first rung', state: { phase: 'trying', rung: 0 }, event: 'fits', expected: { phase: 'fitted', rung: 0 } },
    { id: 'EC-FSM-02', boundary: 'overflow moves one rung down', state: { phase: 'trying', rung: 0 }, event: 'overflow', expected: { phase: 'trying', rung: 1 } },
    { id: 'BV-FSM-03', boundary: 'overflow on the last rung clamps', state: { phase: 'trying', rung: 6 }, event: 'overflow', expected: { phase: 'clamped', rung: 6 } },
    { id: 'BV-FSM-04', boundary: 'fits on the last rung', state: { phase: 'trying', rung: 6 }, event: 'fits', expected: { phase: 'fitted', rung: 6 } },
    { id: 'EC-FSM-05', boundary: 'fitted is final', state: { phase: 'fitted', rung: 2 }, event: 'overflow', expected: { phase: 'fitted', rung: 2 } },
    { id: 'EC-FSM-06', boundary: 'clamped is final', state: { phase: 'clamped', rung: 6 }, event: 'fits', expected: { phase: 'clamped', rung: 6 } },
  ])('$id $boundary', ({ state, event, expected }) => {
    expect(fitTransition(state, event, RUNGS)).toEqual(expected);
  });

  const words = (n: number) => Array.from({ length: n }, () => 'sõna').join(' ');
  it.each([
    { id: 'EC-FIT-02', boundary: 'short text keeps the base size', text: words(8), size: 48, clamped: false },
    { id: 'BV-FIT-03', boundary: 'three rows needed: refused at 48 and 46, allowed at 44', text: words(20), size: 44, clamped: false },
    { id: 'EC-FIT-04', boundary: 'four rows needed: first allowed at 38', text: words(34), size: 38, clamped: false },
    { id: 'BV-FIT-05', boundary: 'text too long for the smallest rung: clamped there', text: words(80), size: 36, clamped: true },
  ])('$id $boundary', ({ text, size, clamped }) => {
    const result = fitText(RUNGS, rowsAt(text, 1000));
    expect([result.rung.size, result.clamped]).toEqual([size, clamped]);
  });

  it('EC-ROWS-01 each paragraph starts its own row; a single over-long word still takes one row', () => {
    expect(countRows(['aa bb', 'cc'], 100, (t) => t.length * 10)).toBe(2);
    expect(countRows(['aaaa bbbb cccc'], 90, (t) => t.length * 10)).toBe(2);
    expect(countRows(['aaaaaaaaaaaaaaaaaaaa'], 50, (t) => t.length * 10)).toBe(1);
  });
});
