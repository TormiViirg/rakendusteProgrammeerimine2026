/**
 * Something wrong with a record.
 *
 *   error    the ticket would be untrue or cannot be drawn → the shift is not shown
 *            and the page says how many are missing
 *   warning  the ticket is shown without the bad part (or with the raw id)
 *
 * A problem names the FIELD and the kind of defect (the code). The codes are
 * about the defect, not about any particular field or ticket kind, so a new
 * kind needs no new code. Problems go to the ProblemSink port; the test
 * catalogue lists which input classes must produce which (testing/catalogue).
 */
export type Severity = 'error' | 'warning'

export type ProblemCode =
  /** not an object at all, or without an id */
  | 'malformed'
  /** its kind is not in the registry */
  | 'unknown-kind'
  /** the same shift id came twice: only the first is shown */
  | 'duplicate-id'
  /** a required field is absent, empty or not of the right type */
  | 'missing'
  /** not a "YYYY-MM-DDTHH:mm" local date-time, or a date that does not exist */
  | 'bad-datetime'
  /** the shift does not end after it starts */
  | 'time-order'
  /** the arrival time is later than the start */
  | 'arrival-after-start'
  /** not a whole number, or below the smallest allowed value */
  | 'bad-number'
  /** a whole number outside the range that can be shown */
  | 'out-of-range'
  /** a list that needs at least one entry is empty */
  | 'empty-list'
  /** a text that must have a fixed length has another */
  | 'wrong-length'
  /** an id with no row in its lookup table or content store: the raw id is shown */
  | 'unknown-id'
  /** two fields that contradict each other (a hall that belongs to another cinema): shown as sent */
  | 'inconsistent'
  /** a check or the build step threw: a defect in a kind definition, not in the data */
  | 'failed'

export interface Problem {
  shiftId: string
  kind?: string
  field?: string
  code: ProblemCode
  severity: Severity
  /** the offending value, for the log */
  detail?: string
}

/** A problem as a check reports it; the pipeline adds which shift it belongs to. */
export type Finding = Omit<Problem, 'shiftId' | 'kind'>

export const isError = (p: { severity: Severity }) => p.severity === 'error'

/** "sessionCode:wrong-length" — how the tests name a problem. */
export const problemKey = (p: { field?: string; code: ProblemCode }) => `${p.field ?? ''}:${p.code}`
