import type { Lookup } from '../ports'

/** A number with a unit: { value: "108", unit: "min" }. */
export interface Measure {
  value: string
  unit?: string
}

/** Plain-text form of a measure (accessible labels, length-based sizing). */
export const measureString = (m: Measure) => [m.value, m.unit].filter(Boolean).join(' ')

export const minutesMeasure = (lookup: Lookup, value: number): Measure => ({ value: String(value), unit: lookup.row('unit', 'min') })

/**
 * Optional minutes (BC, Q&A): a whole number of at least one minute.
 * Anything else — absent, null, 0, negative, a fraction, not a number — is "no
 * valid value" and the item is not shown at all.
 */
export const validMinutes = (v: unknown): number | undefined => (typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : undefined)

/** Absent on purpose: not given, null, or 0 minutes. */
export const isAbsentMinutes = (v: unknown) => v === undefined || v === null || v === 0
