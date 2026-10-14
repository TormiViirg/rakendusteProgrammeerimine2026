import type { Lookup } from '../ports'
import { parseLocal } from './datetime'
import { isNightShift } from './night'
import type { LocalDateTime } from './records'

/** The time block of a ticket, as text. */
export interface ShiftTime {
  /** absent on breaks */
  arrival?: string
  start: string
  end: string
  /** weekday captions under the range — night shifts only */
  startDay?: string
  endDay?: string
}

/** Times are always shown; the weekdays only on night shifts. */
export function buildTime(lookup: Lookup, r: { arrival?: LocalDateTime; start: LocalDateTime; end: LocalDateTime }): { time: ShiftTime; night: boolean } {
  const a = r.arrival === undefined ? null : parseLocal(r.arrival)
  const s = parseLocal(r.start)
  const e = parseLocal(r.end)
  const night = isNightShift(r.start, r.end)
  const weekday = (n: number) => lookup.row('weekday', String(n)) ?? String(n)
  return {
    night,
    time: {
      arrival: a?.time,
      start: s?.time ?? '',
      end: e?.time ?? '',
      startDay: night && s ? weekday(s.weekday) : undefined,
      endDay: night && e ? weekday(e.weekday) : undefined,
    },
  }
}
