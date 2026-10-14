import { describe, expect, it } from 'vitest';
import { MINUTE, normalise, roundToStep, setCovers, subtract, union } from '../../src/domain/time';

const m = (n: number) => n * MINUTE;
const iv = (a: number, b: number) => ({ start: m(a), end: m(b) });

describe('interval sets', () => {
  it.each([
    { id: 'BV-SET-01', boundary: 'gap of exactly 0 (back to back)', input: [iv(0, 60), iv(60, 120)], expected: [iv(0, 120)] },
    { id: 'BV-SET-02', boundary: 'gap of 1 ms – just not touching', input: [iv(0, 60), { start: m(60) + 1, end: m(120) }], expected: [iv(0, 60), { start: m(60) + 1, end: m(120) }] },
    { id: 'EC-SET-03', boundary: 'overlap', input: [iv(0, 90), iv(60, 120)], expected: [iv(0, 120)] },
    { id: 'EC-SET-04', boundary: 'one contains the other', input: [iv(0, 120), iv(30, 60)], expected: [iv(0, 120)] },
    { id: 'BV-SET-05', boundary: 'zero-length interval is dropped', input: [iv(30, 30), iv(0, 10)], expected: [iv(0, 10)] },
    { id: 'EC-SET-06', boundary: 'unsorted input', input: [iv(200, 260), iv(0, 60)], expected: [iv(0, 60), iv(200, 260)] },
  ])('$id normalise: $boundary', ({ input, expected }) => {
    expect(normalise(input)).toEqual(expected);
  });

  it.each([
    { id: 'EC-SUB-01', boundary: 'cut in the middle splits in two', cut: iv(20, 40), expected: [iv(0, 20), iv(40, 60)] },
    { id: 'BV-SUB-02', boundary: 'cut ends exactly at the start – nothing removed', cut: iv(-30, 0), expected: [iv(0, 60)] },
    { id: 'BV-SUB-03', boundary: 'cut equals the interval – nothing left', cut: iv(0, 60), expected: [] },
    { id: 'EC-SUB-04', boundary: 'cut overhangs the end', cut: iv(45, 90), expected: [iv(0, 45)] },
  ])('$id subtract: $boundary', ({ cut, expected }) => {
    expect(subtract([iv(0, 60)], cut)).toEqual(expected);
  });

  it('EC-SET-07 covers: a set covers pieces lying inside its members only', () => {
    const outer = union([iv(0, 60)], [iv(120, 180)]);
    expect(setCovers(outer, [iv(10, 20), iv(120, 180)])).toBe(true);
    expect(setCovers(outer, [iv(50, 130)])).toBe(false);
  });
});

describe('rounding volunteer-entered times to the 5-minute step', () => {
  it.each([
    { id: 'EC-RND-01', boundary: 'already on the step', minute: 1230, expected: 1230 },
    { id: 'EC-RND-02', boundary: 'below the half step rounds down (20:36 → 20:35)', minute: 1236, expected: 1235 },
    { id: 'BV-RND-03', boundary: 'exactly half a step rounds up (20:37:30 → 20:40)', minute: 1237.5, expected: 1240 },
    { id: 'EC-RND-04', boundary: 'above the half step rounds up (20:38 → 20:40)', minute: 1238, expected: 1240 },
    { id: 'BV-RND-05', boundary: 'rounding carries across midnight (23:58 → 24:00)', minute: 1438, expected: 1440 },
  ])('$id $boundary', ({ minute, expected }) => {
    expect(roundToStep(m(minute), m(5)) / MINUTE).toBe(expected);
  });
});
