import type { DayKey } from './calendar';
import { normalise, type Interval, type IntervalSet } from './time';

export interface Team {
  id: string;
  /** Lookup-table value delivered per language by the backend. */
  names: Readonly<Record<string, string>>;
  /** Any CSS colour; the project only ever uses oklch(). */
  color: string;
  /** How long before a window starts removals are frozen. */
  graceMs: number;
}

/** The general interval the admin enters first (UTC). */
export interface Period {
  interval: Interval;
  timeZone: string;
}

/**
 * The admin's sub-interval: one per illustrative day per team.
 * The volunteer never sees the split by team – the day's windows are merged
 * into one open area (see `openDay`); the backend books time to teams.
 */
export interface ShiftWindow {
  id: string;
  teamId: string;
  day: DayKey;
  interval: Interval;
  /** Parts of the window the admin added after the volunteer last looked. */
  addedSinceSeen: IntervalSet;
}

/** Time a team lead put in or took out – it carries the team, the volunteer's own time does not. */
export interface LeaderPiece extends Interval {
  teamId: string;
}

/** What is chosen on one illustrative day. `current` and `confirmed` are normalised sets. */
export interface DaySelection {
  /** The volunteer's working selection. */
  current: IntervalSet;
  /** What the backend has already accepted – the floor once the grace period is crossed. */
  confirmed: IntervalSet;
  leaderAdded: readonly LeaderPiece[];
  leaderRemoved: readonly LeaderPiece[];
}

export const EMPTY_SELECTION: DaySelection = { current: [], confirmed: [], leaderAdded: [], leaderRemoved: [] };

export interface Targets {
  dayMs: number;
  weekMs: number;
  monthMs: number;
  periodMs: number;
}

/** Distribution of all volunteers' chosen time, as ascending quantiles. */
export interface Cohort {
  quantiles: readonly { p: number; ms: number }[];
}

export interface Contact {
  email: string;
  phone: string;
  emailUntilHours: number;
  callWithinHours: number;
}

export interface Schedule {
  period: Period;
  teams: readonly Team[];
  windows: readonly ShiftWindow[];
  selections: Readonly<Record<DayKey, DaySelection>>;
  /** One message per day; the backend copies it to every team involved. */
  comments: Readonly<Record<DayKey, string>>;
  targets: Targets;
  cohort: Cohort;
  /** Rounding step for volunteer-entered times. */
  stepMs: number;
  contact: Contact;
}

/** The merged open area of a day: every team's window, as one set of pieces. */
export interface OpenDay {
  day: DayKey;
  pieces: IntervalSet;
  teamIds: readonly string[];
  addedSinceSeen: IntervalSet;
}

export const selectionOf = (schedule: Schedule, day: DayKey): DaySelection => schedule.selections[day] ?? EMPTY_SELECTION;
export const teamOf = (schedule: Schedule, teamId: string): Team => schedule.teams.find((t) => t.id === teamId) ?? schedule.teams[0];
export const windowsOn = (schedule: Schedule, day: DayKey): ShiftWindow[] =>
  schedule.windows.filter((w) => w.day === day).sort((a, b) => a.interval.start - b.interval.start);

export function openDay(schedule: Schedule, day: DayKey): OpenDay {
  const windows = windowsOn(schedule, day);
  return {
    day,
    pieces: normalise(windows.map((w) => w.interval)),
    teamIds: [...new Set(windows.map((w) => w.teamId))],
    addedSinceSeen: normalise(windows.flatMap((w) => w.addedSinceSeen)),
  };
}

export const openDays = (schedule: Schedule): OpenDay[] =>
  [...new Set(schedule.windows.map((w) => w.day))].sort().map((day) => openDay(schedule, day));
