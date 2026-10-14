import { buildTime } from '../../core/shift/time'
import type { BuildContext } from '../../core/ticket/kind'
import type { BreakModel } from './model'
import type { BreakRecord } from './record'

export function buildBreak(r: BreakRecord, ctx: BuildContext): BreakModel {
  const { time, night } = buildTime(ctx.lookup, { start: r.start, end: r.end })
  return {
    id: r.id,
    time,
    night,
    barcode: r.barcode ?? r.id,
    title: ctx.known('breakId', r.breakId, ctx.lookup.row('break', r.breakId)),
    note: r.noteId ? ctx.known('noteId', r.noteId, ctx.lookup.row('breakNote', r.noteId)) : undefined,
  }
}
