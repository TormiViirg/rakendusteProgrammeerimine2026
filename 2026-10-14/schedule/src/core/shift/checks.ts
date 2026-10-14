import type { Finding, ProblemCode, Severity } from '../ticket/problem'
import { parseLocal } from './datetime'
import { isAbsentMinutes, validMinutes } from './measure'
import type { RawRecord } from './records'

/**
 * Checks: small, named rules a record must satisfy. A ticket kind lists the
 * ones that apply to it (tickets/<kind>/record.ts); the pipeline runs them
 * before anything is built. A check returns what it found, or nothing.
 */
export type Check = (record: RawRecord) => Finding | Finding[] | null

/** JSON for the log; never throws (a record may hold anything). */
export function show(value: unknown): string | undefined {
  if (value === undefined) return undefined
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

const finding = (field: string, code: ProblemCode, severity: Severity, value?: unknown): Finding => ({ field, code, severity, detail: show(value) })

const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

/** A non-empty string. */
export const required =
  (field: string): Check =>
  (r) =>
    isText(r[field]) ? null : finding(field, 'missing', 'error', r[field])

/** A local date-time that exists. */
export const dateTime =
  (field: string): Check =>
  (r) =>
    parseLocal(r[field]) ? null : finding(field, r[field] === undefined ? 'missing' : 'bad-datetime', 'error', r[field])

/** The shift ends after it starts (a shift of no length is not a shift). */
export const endsAfterStart: Check = (r) => {
  const s = parseLocal(r.start)
  const e = parseLocal(r.end)
  return s && e && e.ordinal <= s.ordinal ? finding('end', 'time-order', 'error', [r.start, r.end]) : null
}

/** Volunteers arrive before, or exactly when, the shift starts. */
export const arrivesBeforeStart: Check = (r) => {
  const a = parseLocal(r.arrival)
  const s = parseLocal(r.start)
  return a && s && a.ordinal > s.ordinal ? finding('arrival', 'arrival-after-start', 'error', [r.arrival, r.start]) : null
}

/** A whole number of minutes: at least `min`. */
export const wholeMinutes =
  (field: string, min: number): Check =>
  (r) => {
    const v = r[field]
    if (v === undefined || v === null) return finding(field, 'missing', 'error')
    return typeof v === 'number' && Number.isInteger(v) && v >= min ? null : finding(field, 'bad-number', 'error', v)
  }

/** Optional minutes (BC, Q&A): absent is fine; a value that is not valid is left out with a warning. */
export const optionalMinutes =
  (field: string): Check =>
  (r) =>
    isAbsentMinutes(r[field]) || validMinutes(r[field]) !== undefined ? null : finding(field, 'bad-number', 'warning', r[field])

/** A list of ids with at least `min` entries. */
export const idList =
  (field: string, min: number): Check =>
  (r) => {
    const v = r[field]
    if (v === undefined || v === null) return min > 0 ? finding(field, 'missing', 'error') : null
    if (!Array.isArray(v) || !v.every(isText)) return finding(field, 'missing', 'error', v)
    return v.length >= min ? null : finding(field, 'empty-list', 'error', v)
  }

/** A text that should always have the same length: shown anyway, with a warning. */
export const fixedLength =
  (field: string, length: number): Check =>
  (r) => {
    const v = r[field]
    return isText(v) && v.length !== length ? finding(field, 'wrong-length', 'warning', v) : null
  }

/** An optional whole number in a range (`valid` decides); `none` lists the values that mean "not given". Out of range: left out, with a warning. */
export const optionalInRange =
  (field: string, valid: (v: unknown) => boolean, none: readonly unknown[] = [undefined, null]): Check =>
  (r) => {
    const v = r[field]
    if (none.includes(v) || valid(v)) return null
    return finding(field, typeof v === 'number' && Number.isInteger(v) ? 'out-of-range' : 'bad-number', 'warning', v)
  }

/** An optional id: if given it must be a non-empty string. */
export const optionalId =
  (field: string): Check =>
  (r) =>
    r[field] === undefined || r[field] === null || isText(r[field]) ? null : finding(field, 'missing', 'error', r[field])

/** What every shift needs. */
export const SHIFT_CHECKS: Check[] = [dateTime('start'), dateTime('end'), endsAfterStart]

/** What every shift at a cinema needs on top. (The hall is the kind's business: optional, required, or not shown at all.) */
export const LOCATED_CHECKS: Check[] = [...SHIFT_CHECKS, dateTime('arrival'), arrivesBeforeStart, required('venueId')]
