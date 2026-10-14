/**
 * Layer 1 of the feedback engine: FACTS.
 * A pure projection of the schedule onto numbers, one record per scope.
 * Buckets are formed from illustrative days; all arithmetic is on UTC instants.
 */
import { mondayOf, monthOf, type DayKey, type Zone } from '../calendar';
import { slotsOf } from '../grid';
import { openDays, selectionOf, type Cohort, type OpenDay, type Schedule } from '../model';
import { setOverlaps, totalDuration, union } from '../time';

export const SCOPES = ['day', 'week', 'month', 'period'] as const;
export type ScopeName = (typeof SCOPES)[number];

export interface ScopeFacts {
  selectedSlots: number;
  possibleSlots: number;
  selectedMs: number;
  possibleMs: number;
  /** Distinct illustrative days with at least one chosen slot. */
  days: number;
  targetMs: number;
  /** selectedMs / targetMs, the target capped at what is possible at all. */
  ratio: number;
  missingMs: number;
}

export interface Facts {
  day: ScopeFacts;
  week: ScopeFacts;
  month: ScopeFacts;
  period: ScopeFacts;
  /** Where the volunteer's period total sits in the cohort, 0..1. */
  percentile: number;
}

export type FactPath = `${ScopeName}.${keyof ScopeFacts}` | 'percentile';

export const scopeKeys = (focus: DayKey): Record<ScopeName, string> => ({
  day: `day:${focus}`,
  week: `week:${mondayOf(focus)}`,
  month: `month:${monthOf(focus)}`,
  period: 'period',
});

function measure(schedule: Schedule, zone: Zone, days: readonly OpenDay[], targetMs: number): ScopeFacts {
  let selectedSlots = 0;
  let possibleSlots = 0;
  let selectedMs = 0;
  let possibleMs = 0;
  const chosenDays = new Set<DayKey>();
  for (const open of days) {
    const s = selectionOf(schedule, open.day);
    const chosen = union(s.current, s.leaderAdded);
    const slots = slotsOf(zone, open);
    possibleSlots += slots.length;
    possibleMs += totalDuration(open.pieces);
    selectedMs += totalDuration(chosen);
    const hits = slots.filter((slot) => setOverlaps(chosen, slot)).length;
    selectedSlots += hits;
    if (hits > 0) chosenDays.add(open.day);
  }
  const reachable = Math.min(targetMs, possibleMs);
  return {
    selectedSlots,
    possibleSlots,
    selectedMs,
    possibleMs,
    days: chosenDays.size,
    targetMs: reachable,
    ratio: reachable > 0 ? selectedMs / reachable : 0,
    missingMs: Math.max(0, reachable - selectedMs),
  };
}

/** Piecewise-linear interpolation through the cohort quantiles. */
export function percentileOf(cohort: Cohort, ms: number): number {
  const q = [{ p: 0, ms: 0 }, ...cohort.quantiles];
  for (let i = 1; i < q.length; i++) {
    if (ms <= q[i].ms) {
      const span = q[i].ms - q[i - 1].ms;
      const t = span > 0 ? (ms - q[i - 1].ms) / span : 1;
      return q[i - 1].p + t * (q[i].p - q[i - 1].p);
    }
  }
  return 1;
}

export function deriveFacts(schedule: Schedule, zone: Zone, focus: DayKey): Facts {
  const week = mondayOf(focus);
  const month = monthOf(focus);
  const all = openDays(schedule);
  const t = schedule.targets;
  const period = measure(schedule, zone, all, t.periodMs);
  return {
    day: measure(schedule, zone, all.filter((w) => w.day === focus), t.dayMs),
    week: measure(schedule, zone, all.filter((w) => mondayOf(w.day) === week), t.weekMs),
    month: measure(schedule, zone, all.filter((w) => monthOf(w.day) === month), t.monthMs),
    period,
    percentile: percentileOf(schedule.cohort, period.selectedMs),
  };
}

export function readFact(facts: Facts, path: FactPath): number {
  if (path === 'percentile') return facts.percentile;
  const [scope, key] = path.split('.') as [ScopeName, keyof ScopeFacts];
  return facts[scope][key];
}
