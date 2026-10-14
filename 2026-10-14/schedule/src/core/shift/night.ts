import { parseLocal } from './datetime'
import type { LocalDateTime } from './records'

/**
 * A night shift ends on a later calendar date than it starts. It is the one
 * switch behind the weekday line and the wolf prints — change the definition
 * here if "night" should mean something else (e.g. any shift ending after 23:00).
 *
 *   21:30 → 23:59 same date   day
 *   21:30 → 00:00 next date   night   (the boundary)
 */
export function isNightShift(start: LocalDateTime, end: LocalDateTime): boolean {
  const s = parseLocal(start)
  const e = parseLocal(end)
  return Boolean(s && e && e.dateKey !== s.dateKey)
}
