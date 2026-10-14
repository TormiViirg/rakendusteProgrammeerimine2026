/**
 * Time algebra. Everything in the domain is a UTC instant in milliseconds;
 * wall-clock time only exists at the edges (see calendar.ts / Zone).
 * Intervals are half-open: [start, end).
 */
export type Instant = number;

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export interface Interval {
  readonly start: Instant;
  readonly end: Instant;
}

/** A normalised interval set: sorted, pairwise disjoint and non-touching. */
export type IntervalSet = readonly Interval[];

export const interval = (start: Instant, end: Instant): Interval => ({ start, end });
export const duration = (i: Interval): number => Math.max(0, i.end - i.start);
export const overlaps = (a: Interval, b: Interval): boolean => a.start < b.end && b.start < a.end;
export const covers = (outer: Interval, inner: Interval): boolean =>
  outer.start <= inner.start && inner.end <= outer.end;

export function intersect(a: Interval, b: Interval): Interval | null {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return end > start ? { start, end } : null;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export type Rounding = 'nearest' | 'floor' | 'ceil';

export function roundToStep(value: number, step: number, mode: Rounding = 'nearest'): number {
  const q = value / step;
  const n = mode === 'floor' ? Math.floor(q) : mode === 'ceil' ? Math.ceil(q) : Math.round(q);
  return n * step;
}

/** Sort and merge overlapping *or touching* intervals; drop empty ones. */
export function normalise(list: readonly Interval[]): IntervalSet {
  const sorted = list.filter((i) => i.end > i.start).sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && i.start <= last.end) {
      if (i.end > last.end) out[out.length - 1] = { start: last.start, end: i.end };
    } else {
      out.push({ start: i.start, end: i.end });
    }
  }
  return out;
}

export const union = (a: readonly Interval[], b: readonly Interval[]): IntervalSet =>
  normalise([...a, ...b]);

export function subtract(set: readonly Interval[], cut: Interval): IntervalSet {
  const out: Interval[] = [];
  for (const i of set) {
    if (!overlaps(i, cut)) {
      out.push(i);
      continue;
    }
    if (i.start < cut.start) out.push({ start: i.start, end: cut.start });
    if (cut.end < i.end) out.push({ start: cut.end, end: i.end });
  }
  return normalise(out);
}

export function clip(set: readonly Interval[], bounds: Interval): IntervalSet {
  const out: Interval[] = [];
  for (const i of set) {
    const x = intersect(i, bounds);
    if (x) out.push(x);
  }
  return normalise(out);
}

/** The part of `set` that lies inside any of `pieces`. */
export function clipTo(set: readonly Interval[], pieces: readonly Interval[]): IntervalSet {
  const out: Interval[] = [];
  for (const i of set) for (const p of pieces) {
    const x = intersect(i, p);
    if (x) out.push(x);
  }
  return normalise(out);
}

export const totalDuration = (set: readonly Interval[]): number =>
  set.reduce((sum, i) => sum + duration(i), 0);

export const setOverlaps = (set: readonly Interval[], probe: Interval): boolean =>
  set.some((i) => overlaps(i, probe));

/** `outer` must be normalised. */
export const setCovers = (outer: IntervalSet, inner: readonly Interval[]): boolean =>
  inner.every((i) => outer.some((o) => covers(o, i)));

export const sameSet = (a: IntervalSet, b: IntervalSet): boolean =>
  a.length === b.length && a.every((i, n) => i.start === b[n].start && i.end === b[n].end);

export const pieceAt = (set: readonly Interval[], t: Instant): Interval | null =>
  set.find((i) => i.start <= t && t < i.end) ?? null;
