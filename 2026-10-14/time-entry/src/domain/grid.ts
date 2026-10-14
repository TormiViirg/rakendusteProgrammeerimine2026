/**
 * The desktop hour grid.
 *
 *  • The longest open area among the visible days sets the row scale for all.
 *  • Rows after local midnight form a separate "next day's night" section shown
 *    under the day that reached midnight.
 *  • Wherever a day is not open the rows collapse into one crossed-out block.
 *    Such a block ends at midnight and starts again after the night note; a day
 *    with no window at all is two blocks (day and night) or one when there is
 *    no night section.
 */
import { dayMinuteToInstant, instantToDayMinute, type DayKey, type Zone } from './calendar';
import type { DaySelection, OpenDay } from './model';
import type { Status } from './rules';
import { clipTo, setOverlaps, type Interval, type IntervalSet } from './time';

export interface Row {
  /** Day minutes; `to` may exceed 1440. */
  from: number;
  to: number;
  night: boolean;
}

export interface Scale {
  rows: Row[];
  mainCount: number;
  nightCount: number;
}

export interface Extent {
  from: number;
  to: number;
}

export const extentsOf = (zone: Zone, open: OpenDay): Extent[] =>
  open.pieces.map((p) => ({ from: instantToDayMinute(zone, open.day, p.start), to: instantToDayMinute(zone, open.day, p.end) }));

/** Hour-aligned pieces of [from, to); the first and last may be partial hours. */
export function hourPieces(from: number, to: number): Extent[] {
  const out: Extent[] = [];
  let cursor = from;
  while (cursor < to) {
    const next = Math.min(to, (Math.floor(cursor / 60) + 1) * 60);
    out.push({ from: cursor, to: next });
    cursor = next;
  }
  return out;
}

export function buildScale(extents: readonly Extent[]): Scale {
  if (extents.length === 0) return { rows: [], mainCount: 0, nightCount: 0 };
  const from = Math.min(...extents.map((e) => e.from));
  const to = Math.max(...extents.map((e) => e.to));
  const rows = hourPieces(from, to).map((p) => ({ ...p, night: p.from >= 1440 }));
  const nightCount = rows.filter((r) => r.night).length;
  return { rows, mainCount: rows.length - nightCount, nightCount };
}

export const rowInterval = (zone: Zone, day: DayKey, row: Row): Interval => ({
  start: dayMinuteToInstant(zone, day, row.from),
  end: dayMinuteToInstant(zone, day, row.to),
});

/** A part of a cell's row that is not open, as fractions of the row (0..1). */
export interface Gap {
  from: number;
  to: number;
}

export type Block =
  | { kind: 'closed'; fromRow: number; toRow: number; night: boolean }
  /**
   * An hour row with open time in it. Two pieces whose gap is shorter than
   * the row (09:30–17:30 and 17:45–02:00, say) share one cell: `spans` holds
   * every open part of the row, `gaps` the closed parts between and around them.
   */
  | { kind: 'cell'; row: number; spans: IntervalSet; gaps: Gap[] };

export interface DayPlan {
  day: DayKey;
  blocks: Block[];
}

export function planDay(zone: Zone, open: OpenDay, scale: Scale): DayPlan {
  const blocks: Block[] = [];
  let closedFrom: number | null = null;
  const flush = (endRow: number) => {
    if (closedFrom !== null) blocks.push({ kind: 'closed', fromRow: closedFrom, toRow: endRow, night: scale.rows[closedFrom].night });
    closedFrom = null;
  };
  scale.rows.forEach((row, index) => {
    // a crossed-out block never runs through midnight
    if (row.night && index > 0 && !scale.rows[index - 1].night) flush(index - 1);
    const ri = rowInterval(zone, open.day, row);
    const spans = clipTo([ri], open.pieces);
    if (spans.length > 0) {
      flush(index - 1);
      const length = ri.end - ri.start;
      const gaps: Gap[] = [];
      let cursor = ri.start;
      for (const s of spans) {
        if (s.start > cursor) gaps.push({ from: (cursor - ri.start) / length, to: (s.start - ri.start) / length });
        cursor = s.end;
      }
      if (cursor < ri.end) gaps.push({ from: (cursor - ri.start) / length, to: 1 });
      blocks.push({ kind: 'cell', row: index, spans, gaps });
    } else if (closedFrom === null) {
      closedFrom = index;
    }
  });
  flush(scale.rows.length - 1);
  return { day: open.day, blocks };
}

export type CellState = 'leaderAdded' | 'leaderRemoved' | 'selectedLocked' | 'selected' | 'new' | 'free';

export function cellState(spans: readonly Interval[], selection: DaySelection, open: OpenDay, status: Status): CellState {
  const hits = (set: readonly Interval[]) => spans.some((span) => setOverlaps(set, span));
  if (hits(selection.leaderAdded)) return 'leaderAdded';
  if (hits(selection.current)) {
    return status.locked && hits(selection.confirmed) ? 'selectedLocked' : 'selected';
  }
  if (hits(selection.leaderRemoved)) return 'leaderRemoved';
  if (hits(open.addedSinceSeen)) return 'new';
  return 'free';
}

/** The hour slots of a day – the rows with open time in them, the unit the statistics count in ("aega"). */
export function slotsOf(zone: Zone, open: OpenDay): Interval[] {
  const extents = extentsOf(zone, open);
  if (extents.length === 0) return [];
  const from = Math.min(...extents.map((e) => e.from));
  const to = Math.max(...extents.map((e) => e.to));
  return hourPieces(from, to)
    .map((p) => ({ start: dayMinuteToInstant(zone, open.day, p.from), end: dayMinuteToInstant(zone, open.day, p.to) }))
    .filter((row) => setOverlaps(open.pieces, row));
}
