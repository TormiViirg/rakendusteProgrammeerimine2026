import type { ProblemCode } from '../../core/ticket/problem'

/**
 * THE TEST MODEL — equivalence partitioning and boundary value analysis.
 *
 * A PARAMETER is one input of a ticket (the time between screenings, the
 * cinema, the subtitle list …). Its possible values are split into EQUIVALENCE
 * CLASSES: sets of values the tickets are expected to treat alike. Testing one
 * value of a class stands for testing all of them — except at the edges, where
 * mistakes live, so every class also names its BOUNDARY values.
 *
 * Each class says
 *   • what it represents (`about`),
 *   • whether its values are valid, degraded (shown, with a warning) or invalid
 *     (the shift is not shown), and which problem must be reported,
 *   • what must be observable when one of its values is on a ticket (`expect`).
 *
 * Nothing in the tests is "just a value": a value is the representative or a
 * boundary of a named class. The suites (testing/suites) only decide how
 * classes are COMBINED; they never invent values.
 *
 * The master list is testing/catalogue/index.ts.
 */

/** valid: shown as given · degraded: shown without the bad part, with a warning · invalid: the shift is not shown */
export type Validity = 'valid' | 'degraded' | 'invalid'

/** Fields of a record to set. `undefined` means "leave the field out". */
export type RecordPatch = Readonly<Record<string, unknown>>

/** A problem the pipeline must report: which field, which defect. */
export interface ExpectedProblem {
  field: string
  code: ProblemCode
}

/** A text per interface language: { et: 'kolmapäev', en: 'Wednesday', ru: 'среда' }. */
export type Localized = Readonly<Record<string, string>>

/** One concrete value: the representative of its class, or one of its boundaries. */
export interface Point {
  /** "typical", or the name of the edge: "min", "max", "ends-at-midnight" … */
  id: string
  /** why this value: what it is the edge of */
  about: string
  patch: RecordPatch
  /** a boundary value (false: the representative) */
  edge: boolean
  /** degraded / invalid: the problems the pipeline must report for this value — exactly these */
  problems: ExpectedProblem[]
}

/**
 * Something that must be observable on the ticket. Expected texts are worked
 * out by the catalogue itself, from the locale files and the fixtures
 * (fixtures/expected.ts) — never by the code under test.
 */
export type Expectation =
  /** the part marked data-slot="…" is there / is not there */
  | { slot: string; present: boolean }
  /** it is there and shows exactly this — with `whenDrawn`: IF it is there (a part other inputs may switch off), it shows exactly this */
  | { slot: string; is: Localized; whenDrawn?: true }
  /** it is there and its text contains this */
  | { slot: string; has: Localized }
  /** the ticket's accent colour */
  | { tone: string }

export interface EquivalenceClass {
  id: string
  /** what the class represents */
  about: string
  validity: Validity
  /** the representative first, then the boundary values */
  points: Point[]
  /** what a value of this class must lead to */
  expect: (point: Point) => Expectation[]
}

export interface Parameter {
  id: string
  /** what the parameter is */
  about: string
  classes: EquivalenceClass[]
  /** the class every OTHER parameter's tests use for this one: the ordinary case */
  base: string
}

/** A parameter of a kind may leave out classes that cannot occur there. */
export type ParameterList = readonly Parameter[]

export const classOf = (p: Parameter, id: string): EquivalenceClass => {
  const c = p.classes.find((x) => x.id === id)
  if (!c) throw new Error(`parameter "${p.id}" has no class "${id}"`)
  return c
}

export const typical = (c: EquivalenceClass): Point => c.points[0]
