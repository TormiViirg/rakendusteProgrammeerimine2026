/**
 * The wire format: what the backend sends. Ids into lookup tables and into the
 * content store, raw numbers and local date-times — no display text.
 *
 * Only the parts every shift shares are here. What a ticket kind adds is in
 * tickets/<kind>/record.ts.
 */

/** Local wall-clock time, "YYYY-MM-DDTHH:mm" (festival time zone, no offset). */
export type LocalDateTime = string

/** Every shift. */
export interface ShiftRecordBase {
  id: string
  /** id of the ticket kind (tickets/registry.ts) */
  kind: string
  start: LocalDateTime
  end: LocalDateTime
  /** seed for the decorative barcode; defaults to the shift id */
  barcode?: string
}

/** A shift at a cinema: the cinema and the arrival time are always present; the hall is optional. */
export interface LocatedRecord extends ShiftRecordBase {
  arrival: LocalDateTime
  venueId: string
  hallId?: string
}

/** A record as it arrives, before anything about it has been checked. */
export type RawRecord = { readonly [field: string]: unknown }

/** Optional explicit grouping (test suites); otherwise shifts are grouped by start date. */
export interface ScheduleGroup {
  id: string
  title: string
  shiftIds: string[]
  /** a line shown above a ticket, by shift id (the test suites say what each ticket is for) */
  notes?: Record<string, string>
}

export interface ScheduleResponse {
  /** whatever arrived: every entry is checked before it is used */
  shifts: unknown[]
  groups?: ScheduleGroup[]
  /** paged responses */
  page?: { index: number; count: number; total: number }
}

/** A text in the language it could be delivered in (may differ from the one asked for). */
export interface LocalizedText {
  text: string
  lang: string
}

/**
 * Frequently changing, translated content — fetched per target language.
 * `items` is keyed by collection ("films", "programmes" — whatever the kinds
 * ask for), then by id.
 */
export interface ContentResponse {
  lang: string
  items: Record<string, Record<string, LocalizedText>>
}
