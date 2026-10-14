/**
 * Shared test fixtures. Times are written as Tallinn winter wall-clock (UTC+2)
 * through `at(day, 'HH:MM')`; hours ≥ 24 mean "next day's night".
 */
import type { DayKey, Zone } from '../../src/domain/calendar';
import { openDay, type DaySelection, type OpenDay, type Schedule, type ShiftWindow, type Team } from '../../src/domain/model';
import { HOUR, MINUTE, type Interval } from '../../src/domain/time';

/** A zone with a constant offset – keeps pure-domain tests free of Intl. */
export const fixedZone = (offsetHours: number): Zone => {
  const offset = offsetHours * HOUR;
  const key = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return {
    startOfDay: (day: DayKey) => Date.parse(`${day}T00:00:00Z`) - offset,
    dayOf: (t) => key(t + offset),
    clockOf: (t) => Math.floor((((t + offset) % (24 * HOUR)) + 24 * HOUR) % (24 * HOUR) / MINUTE),
  };
};
export const EET = fixedZone(2);

export const at = (day: DayKey, clock: string): number => {
  const [h, m] = clock.split(':').map(Number);
  return EET.startOfDay(day) + h * HOUR + m * MINUTE;
};
export const span = (day: DayKey, from: string, to: string): Interval => ({ start: at(day, from), end: at(day, to) });

export const team = (id: string, graceHours: number): Team => ({
  id,
  names: { et: id, en: id, ru: id },
  color: 'oklch(0.5 0 0)',
  graceMs: graceHours * HOUR,
});

export const windowOf = (teamId: string, day: DayKey, from: string, to: string): ShiftWindow => ({
  id: `${teamId}-${day}`,
  teamId,
  day,
  interval: span(day, from, to),
  addedSinceSeen: [],
});

export const selection = (partial: Partial<DaySelection> = {}): DaySelection => ({
  current: [],
  confirmed: [],
  leaderAdded: [],
  leaderRemoved: [],
  ...partial,
});

export function scheduleOf(windows: ShiftWindow[], selections: Record<string, DaySelection> = {}, teams: Team[] = [team('a', 24)]): Schedule {
  const days = [...new Set(windows.map((w) => w.day))];
  return {
    period: { interval: { start: at('2026-10-28', '00:00'), end: at('2026-11-25', '00:00') }, timeZone: 'Europe/Tallinn' },
    teams,
    windows,
    selections: Object.fromEntries(days.map((d) => [d, selections[d] ?? selection()])),
    comments: {},
    targets: { dayMs: 6 * HOUR, weekMs: 24 * HOUR, monthMs: 60 * HOUR, periodMs: 80 * HOUR },
    cohort: { quantiles: [{ p: 0.5, ms: 24 * HOUR }, { p: 0.8, ms: 40 * HOUR }, { p: 1, ms: 120 * HOUR }] },
    stepMs: 5 * MINUTE,
    contact: { email: 'x@example.org', phone: '+372 000', emailUntilHours: 24, callWithinHours: 6 },
  };
}

/** The merged open area of a day made of these windows. */
export const openOf = (...windows: ShiftWindow[]): OpenDay => openDay(scheduleOf(windows), windows[0].day);
