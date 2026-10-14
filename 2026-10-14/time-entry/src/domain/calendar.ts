/**
 * Calendar concepts.
 *
 * An *illustrative day* is the day a shift window is filed under by the admin.
 * It may run past local midnight ("next day's night"), so positions inside it
 * are expressed as a *day minute*: minutes elapsed since the local midnight
 * that starts the illustrative day. 25:30 → 1530.
 */
import { MINUTE, clamp, type Instant } from './time';

/** ISO calendar date, YYYY-MM-DD. Pure label, no time zone. */
export type DayKey = string;

/** The only thing the domain needs to know about a time zone. Implemented by an adapter. */
export interface Zone {
  startOfDay(day: DayKey): Instant;
  dayOf(instant: Instant): DayKey;
  /** Wall-clock minutes since local midnight, 0..1439. */
  clockOf(instant: Instant): number;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toUtc = (day: DayKey): number => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number): DayKey => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

export const addDays = (day: DayKey, n: number): DayKey => fromUtc(toUtc(day) + n * 86_400_000);
export const diffDays = (a: DayKey, b: DayKey): number => Math.round((toUtc(a) - toUtc(b)) / 86_400_000);
/** 0 = Monday … 6 = Sunday. */
export const weekdayOf = (day: DayKey): number => (new Date(toUtc(day)).getUTCDay() + 6) % 7;
export const mondayOf = (day: DayKey): DayKey => addDays(day, -weekdayOf(day));
export const monthOf = (day: DayKey): string => day.slice(0, 7);
export const dayParts = (day: DayKey) => {
  const [year, month, date] = day.split('-').map(Number);
  return { year, month, date };
};

export const dayMinuteToInstant = (zone: Zone, day: DayKey, minute: number): Instant =>
  zone.startOfDay(day) + minute * MINUTE;
export const instantToDayMinute = (zone: Zone, day: DayKey, t: Instant): number =>
  Math.round((t - zone.startOfDay(day)) / MINUTE);

export const formatClock = (clock: number): string => `${pad(Math.floor(clock / 60) % 24)}:${pad(clock % 60)}`;

/** Parse "9:30", "0930", "21.05", "7" → wall-clock minutes; null when not a time. */
export function parseClock(text: string): number | null {
  const m = text.trim().match(/^(\d{1,2})(?:[:.\s]?(\d{2}))?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] === undefined ? 0 : Number(m[2]);
  if (h > 24 || min > 59 || (h === 24 && min > 0)) return null;
  return (h % 24) * 60 + min;
}

/**
 * Turn a typed wall-clock time into a day minute inside [min, max].
 * The same clock reading can occur twice in an illustrative day (09:00 today,
 * 09:00 "next day's night") and DST can shift things by an hour, so we test
 * candidates against the zone instead of doing arithmetic. When no candidate
 * lies in range the nearest one is clamped – input never escapes the window.
 */
export function resolveClock(zone: Zone, day: DayKey, clock: number, min: number, max: number): number {
  const candidates: number[] = [];
  for (let wrap = 0; wrap <= 2; wrap++) {
    for (const shift of [0, -60, 60]) {
      const c = clock + wrap * 1440 + shift;
      if (zone.clockOf(dayMinuteToInstant(zone, day, c)) === clock) candidates.push(c);
    }
  }
  if (candidates.length === 0) candidates.push(clock);
  const inside = candidates.find((c) => c >= min && c <= max);
  if (inside !== undefined) return inside;
  const distance = (c: number) => (c < min ? min - c : c - max);
  const nearest = candidates.reduce((best, c) => (distance(c) < distance(best) ? c : best));
  return clamp(nearest, min, max);
}

// ── Paging through illustrative weeks ───────────────────────────────────────

export interface Page {
  /** 'week' when a whole week fits, otherwise a 'range': a chunk of the week. */
  mode: 'week' | 'range';
  /** The Monday this page's week starts on – the fixed point of the column system. */
  monday: DayKey;
  days: DayKey[];
  prevAnchor: DayKey | null;
  nextAnchor: DayKey | null;
  /** Everything that lies before / after the visible days, for the nav captions. */
  before: { from: DayKey; to: DayKey } | null;
  after: { from: DayKey } | null;
}

/**
 * Columns always start at a Monday. When the whole week fits, a page is a
 * week. When it does not, the week is cut into chunks of `fit` days counted
 * from Monday – so chunk boundaries never move with the period or the screen,
 * only the number of days per chunk does. Resizing keeps the week and shows
 * the chunk that holds the anchor day.
 *
 * @param fit      how many day columns the screen can hold
 * @param weekdays which weekdays are shown at all (0 = Monday); Monday–Sunday by default
 */
export function pageOf(
  first: DayKey,
  last: DayKey,
  anchor: DayKey,
  fit: number,
  weekdays: readonly number[] = [0, 1, 2, 3, 4, 5, 6],
): Page {
  const size = fit >= weekdays.length ? weekdays.length : Math.max(1, Math.floor(fit));
  const mode = size === weekdays.length ? 'week' : 'range';
  const firstMonday = mondayOf(first);
  const lastMonday = mondayOf(last);
  const chunksPerWeek = Math.ceil(weekdays.length / size);
  const weekDays = (monday: DayKey) => weekdays.map((wd) => addDays(monday, wd));
  const chunk = (monday: DayKey, k: number) => weekDays(monday).slice(k * size, (k + 1) * size);

  // the anchor's week and the chunk holding it; an anchor on a hidden weekday falls forward
  let monday = clampDay(mondayOf(anchor), firstMonday, lastMonday);
  let k = 0;
  const position = weekDays(monday).findIndex((d) => d >= anchor);
  if (position < 0) {
    if (monday < lastMonday) monday = addDays(monday, 7);
  } else {
    k = Math.floor(position / size);
  }
  const days = chunk(monday, k);
  const prev = k > 0 ? { monday, k: k - 1 } : monday > firstMonday ? { monday: addDays(monday, -7), k: chunksPerWeek - 1 } : null;
  const next = k < chunksPerWeek - 1 ? { monday, k: k + 1 } : monday < lastMonday ? { monday: addDays(monday, 7), k: 0 } : null;
  const firstVisible = days[0];
  const lastVisible = days[days.length - 1];
  return {
    mode,
    monday,
    days,
    prevAnchor: prev ? chunk(prev.monday, prev.k)[0] : null,
    nextAnchor: next ? chunk(next.monday, next.k)[0] : null,
    before: firstVisible > first ? { from: first, to: addDays(firstVisible, -1) } : null,
    after: lastVisible < last ? { from: addDays(lastVisible, 1) } : null,
  };
}

const clampDay = (day: DayKey, lo: DayKey, hi: DayKey): DayKey => (day < lo ? lo : day > hi ? hi : day);
