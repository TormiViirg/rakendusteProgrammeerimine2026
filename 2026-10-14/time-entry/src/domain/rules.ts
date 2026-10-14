/**
 * Who may do what, when. The backend re-checks all of this; the front end
 * follows the same rules so that it never offers something that will bounce.
 * Time is judged per open piece: an evening piece may still be open while the
 * morning piece of the same day is already frozen.
 */
import type { DaySelection, OpenDay, Team } from './model';
import { pieceAt, setOverlaps, type Instant, type Interval, type IntervalSet } from './time';

export interface Status {
  /** Over: nothing responds, but no lock is shown. */
  past: boolean;
  /** Grace period crossed: time can still be added, never removed. */
  locked: boolean;
}

/** A volunteer in several teams gets the harshest (longest) grace for all of them. */
export const harshestGrace = (teams: readonly Team[]): number => teams.reduce((max, t) => Math.max(max, t.graceMs), 0);

export const pieceStatus = (piece: Interval, now: Instant, graceMs: number): Status => ({
  past: now >= piece.end,
  locked: now >= piece.start - graceMs,
});

/** Day-level flags for tabs and headers. */
export function dayStatus(open: OpenDay, now: Instant, graceMs: number): Status & { empty: boolean } {
  const statuses = open.pieces.map((p) => pieceStatus(p, now, graceMs));
  return {
    empty: open.pieces.length === 0,
    past: statuses.length > 0 && statuses.every((s) => s.past),
    locked: statuses.some((s) => s.locked && !s.past),
  };
}

/** The open pieces that still accept time. */
export const livePieces = (open: OpenDay, now: Instant): IntervalSet => open.pieces.filter((p) => now < p.end);

/** The frozen part of what the backend accepted: this can never be removed. */
export const lockedFloor = (open: OpenDay, selection: DaySelection, now: Instant, graceMs: number): Interval[] =>
  open.pieces
    .filter((p) => pieceStatus(p, now, graceMs).locked)
    .flatMap((p) => selection.confirmed.filter((c) => c.start < p.end && c.end > p.start).map((c) => ({ start: Math.max(c.start, p.start), end: Math.min(c.end, p.end) })));

export const canAdd = (status: Status): boolean => !status.past;

/** A chosen piece can go while its open piece is unlocked, or when the backend never accepted any of it. */
export function canRemove(piece: Interval, selection: DaySelection, open: OpenDay, now: Instant, graceMs: number): boolean {
  const host = pieceAt(open.pieces, piece.start);
  if (!host) return false;
  const status = pieceStatus(host, now, graceMs);
  return !status.past && (!status.locked || !setOverlaps(selection.confirmed, piece));
}

/** The lock badge is for "frozen but still alive" – a past piece shows none. */
export const showsLock = (status: Status): boolean => status.locked && !status.past;
