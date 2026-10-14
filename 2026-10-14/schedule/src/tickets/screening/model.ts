import type { Measure } from '../../core/shift/measure'
import type { Place } from '../../core/shift/place'
import type { TicketModel } from '../../core/ticket/kind'

export interface ScreeningModel extends TicketModel {
  /** "+18"; absent = no badge */
  rating?: string
  audience: string
  /** a screening always has a hall */
  place: Place & { hall: string }
  role: string
  /** already joined with the optional prefix: "Press / Insener Garini Hüperboloid" */
  film: string
  /** language the title is actually in (hyphenation, screen readers) */
  filmLang?: string
  /** separate values — shown joined, listed one per line when cut */
  programme: string[]
  subtitles: string[]
  duration: Measure
  gap: Measure
  /** only with a valid value */
  bc?: Measure
  qa?: Measure
  sessionCode: string
}
