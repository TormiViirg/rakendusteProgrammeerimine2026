/**
 * Editing a day's selection. One function, three edits, one invariant:
 *
 *     for every frozen open piece:  confirmed ∩ piece  ⊆  current
 *
 * It is enforced by construction – after every edit the result is unioned
 * with the frozen floor – so no code path can remove an accepted shift once
 * the grace period is crossed. Time is clipped to the day's open pieces, so
 * nothing ever lands outside what the admin opened.
 */
import type { DaySelection, OpenDay, Schedule } from './model';
import { selectionOf } from './model';
import { livePieces, lockedFloor } from './rules';
import { clipTo, roundToStep, sameSet, subtract, union, type Instant, type Interval, type IntervalSet } from './time';

export type Edit =
  | { kind: 'add'; interval: Interval }
  | { kind: 'remove'; interval: Interval }
  | { kind: 'replace'; from: Interval; to: Interval };

export type Rejection = 'past' | 'empty' | 'outside';

export type Outcome =
  | { ok: true; selection: DaySelection; /** the lock put something back */ held: boolean }
  | { ok: false; reason: Rejection };

export interface EditContext {
  open: OpenDay;
  now: Instant;
  graceMs: number;
  step: number;
}

/** Round to the step, then keep only what lies inside the open pieces. */
export function snap(raw: Interval, pieces: IntervalSet, step: number): IntervalSet {
  const rounded = { start: roundToStep(raw.start, step), end: roundToStep(raw.end, step) };
  return rounded.end > rounded.start ? clipTo([rounded], pieces) : [];
}

export function applyEdit(selection: DaySelection, ctx: EditContext, edit: Edit): Outcome {
  const live = livePieces(ctx.open, ctx.now);
  if (live.length === 0) return { ok: false, reason: 'past' };

  let next = selection.current;
  if (edit.kind === 'remove') {
    const cut = clipTo([edit.interval], live);
    if (cut.length === 0) return { ok: false, reason: 'outside' };
    for (const piece of cut) next = subtract(next, piece);
  } else {
    const raw = edit.kind === 'add' ? edit.interval : edit.to;
    if (raw.end <= raw.start) return { ok: false, reason: 'empty' };
    const snapped = snap(raw, live, ctx.step);
    if (snapped.length === 0) {
      return { ok: false, reason: clipTo([raw], live).length === 0 ? 'outside' : 'empty' };
    }
    if (edit.kind === 'replace') next = subtract(next, edit.from);
    next = union(next, snapped);
  }

  const floored = union(next, lockedFloor(ctx.open, selection, ctx.now, ctx.graceMs));
  const held = !sameSet(floored, next);
  return { ok: true, selection: { ...selection, current: floored }, held };
}

export const withSelection = (schedule: Schedule, day: string, selection: DaySelection): Schedule => ({
  ...schedule,
  selections: { ...schedule.selections, [day]: selection },
});

/** What the backend acknowledges after "confirm": the working set becomes the floor. */
export function confirmAll(schedule: Schedule): Schedule {
  const selections: Record<string, DaySelection> = {};
  for (const day of Object.keys(schedule.selections)) {
    const s = selectionOf(schedule, day);
    selections[day] = { ...s, confirmed: s.current };
  }
  return { ...schedule, selections };
}

export const isDirty = (schedule: Schedule): boolean =>
  Object.keys(schedule.selections).some((day) => {
    const s = selectionOf(schedule, day);
    return !sameSet(s.current, s.confirmed);
  });
