/** Read models: what a screen needs to know about a day, derived from state. */
import {
  dayMinuteToInstant,
  diffDays,
  formatClock,
  instantToDayMinute,
  parseClock,
  resolveClock,
  type DayKey,
  type Zone,
} from '../domain/calendar';
import { openDay, selectionOf, type DaySelection, type OpenDay, type Schedule } from '../domain/model';
import { dayStatus, harshestGrace, pieceStatus, type Status } from '../domain/rules';
import type { Tone } from '../domain/stats/rules';
import { MINUTE, type Instant, type Interval } from '../domain/time';

export interface PieceView {
  interval: Interval;
  /** bounds as day minutes */
  from: number;
  to: number;
  status: Status;
}

export interface DayView {
  day: DayKey;
  open: OpenDay;
  pieces: PieceView[];
  selection: DaySelection;
  status: Status & { empty: boolean };
  today: boolean;
  /** The lock badge on day tabs and headers: today and every day before it. */
  tabLock: boolean;
  /** The day itself lies behind us, or everything on it is over. */
  past: boolean;
  /** At least one volunteer or leader entry. */
  filled: boolean;
  crossesMidnight: boolean;
  /** Earliest and latest day minute of the open area (0 / 0 when closed). */
  from: number;
  to: number;
}

export function viewDay(schedule: Schedule, zone: Zone, day: DayKey, now: Instant): DayView {
  const grace = harshestGrace(schedule.teams);
  const today = zone.dayOf(now);
  const open = openDay(schedule, day);
  const pieces = open.pieces.map((interval): PieceView => ({
    interval,
    from: instantToDayMinute(zone, day, interval.start),
    to: instantToDayMinute(zone, day, interval.end),
    status: pieceStatus(interval, now, grace),
  }));
  const status = dayStatus(open, now, grace);
  const selection = selectionOf(schedule, day);
  return {
    day,
    open,
    pieces,
    selection,
    status,
    today: day === today,
    tabLock: diffDays(day, today) <= 0,
    past: pieces.length > 0 ? status.past : diffDays(day, today) < 0,
    filled: selection.current.length + selection.leaderAdded.length > 0,
    crossesMidnight: pieces.some((p) => p.to > 1440),
    from: pieces[0]?.from ?? 0,
    to: pieces[pieces.length - 1]?.to ?? 0,
  };
}

/** The open piece a day minute falls into. */
export const pieceAtMinute = (pieces: PieceView[], minute: number): PieceView | undefined =>
  pieces.find((p) => p.from <= minute && minute < p.to) ?? pieces.find((p) => p.to === minute);

/** Converters between day minutes (what the time wheel edits) and the outside. */
export function clockTools(zone: Zone, day: DayKey, stepMs: number) {
  return {
    step: stepMs / MINUTE,
    toMinute: (t: Instant) => instantToDayMinute(zone, day, t),
    toInstant: (minute: number) => dayMinuteToInstant(zone, day, minute),
    label: (minute: number) => formatClock(zone.clockOf(dayMinuteToInstant(zone, day, minute))),
    parse: (text: string, min: number, max: number): number | null => {
      const clock = parseClock(text);
      return clock === null ? null : resolveClock(zone, day, clock, min, max);
    },
  };
}
export type ClockTools = ReturnType<typeof clockTools>;

/** The feedback engine's tone becomes the border colour of the volunteer's own entries. */
export const accentFor = (tone: Tone): string =>
  tone === 'praise' ? 'var(--accent-good)' : tone === 'nudge' ? 'var(--accent-more)' : 'var(--accent-neutral)';

const pad = (n: number) => String(n).padStart(2, '0');
export const formatDate = (day: DayKey, withYear = true): string => {
  const [y, m, d] = day.split('-');
  return withYear ? `${d}.${m}.${y}` : `${d}.${m}`;
};
export const splitDuration = (ms: number) => {
  const minutes = Math.round(ms / MINUTE);
  return { h: pad(Math.floor(minutes / 60)), m: pad(minutes % 60) };
};
