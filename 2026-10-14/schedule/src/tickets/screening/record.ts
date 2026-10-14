import { LOCATED_CHECKS, fixedLength, idList, optionalId, optionalInRange, optionalMinutes, required, wholeMinutes, type Check } from '../../core/shift/checks'
import type { LocatedRecord } from '../../core/shift/records'

/**
 * A shift with a film.
 *
 * A film always comes with its hall, its programmes (categories), its runtime,
 * the time between screenings, an audience type and a screening code — and
 * none of those exist without a film.
 */
export interface ScreeningRecord extends LocatedRecord {
  kind: 'screening'
  roleId: string
  hallId: string
  /** id into the content store */
  filmId: string
  /** optional marker shown before the title: "Press / …" */
  filmPrefixId?: string
  /** ids into the content store; at least one */
  programmeIds: string[]
  /** runtime in minutes, at least 1 */
  durationMin: number
  /** minutes to the next screening, 0 or more; shown with at most three digits */
  gapMin: number
  audienceId: string
  /** always SESSION_CODE_LENGTH characters */
  sessionCode: string
  /** minimum age, shown as "+18". A number only; 0 or absent = no limit, no badge. */
  ageRating?: number | null
  subtitleIds?: string[]
  /** minutes. No valid value → the item is not shown at all. */
  bcMin?: number | null
  qaMin?: number | null
}

export const SESSION_CODE_LENGTH = 6

/** The time between screenings is shown with at most three digits. */
export const GAP_DISPLAY_MAX = 999

/** Age ratings that get a badge: two digits fit the diamond. */
export const AGE_RATING = { min: 1, max: 99 }

/** The rating to print, or undefined for "no badge" (absent, no limit, or not a valid rating). */
export const validRating = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isInteger(v) && v >= AGE_RATING.min && v <= AGE_RATING.max ? v : undefined


export const screeningChecks: Check[] = [
  ...LOCATED_CHECKS,
  required('roleId'),
  required('hallId'),
  required('filmId'),
  optionalId('filmPrefixId'),
  idList('programmeIds', 1),
  wholeMinutes('durationMin', 1),
  wholeMinutes('gapMin', 0),
  required('audienceId'),
  required('sessionCode'),
  fixedLength('sessionCode', SESSION_CODE_LENGTH),
  idList('subtitleIds', 0),
  optionalMinutes('bcMin'),
  optionalMinutes('qaMin'),
  // absent, null and 0 all mean "no age limit"
  optionalInRange('ageRating', (v) => validRating(v) !== undefined, [undefined, null, 0]),
]
