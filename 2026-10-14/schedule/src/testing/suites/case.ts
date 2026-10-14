import type { RawRecord } from '../../core/shift/records'
import type { KindId } from '../../tickets/registry'
import { CATALOGUE } from '../catalogue'
import { classOf, typical, type EquivalenceClass, type Expectation, type Parameter, type Point, type Validity } from '../catalogue/types'

/**
 * A TEST CASE — one record, with the class every one of its parameters was
 * taken from. A suite is a list of cases; how the classes are combined is the
 * suite's STRATEGY (see the files next to this one).
 */
export type SuiteId = 'base' | 'each' | 'pairs' | 'variants' | 'invalid'

export interface Choice {
  parameter: string
  cls: string
  point: string
}

export interface Case {
  /** also the shift id of the record */
  id: string
  suite: SuiteId
  kind: KindId
  /** one line: what this case is for */
  title: string
  /** one choice per parameter of the kind */
  choices: Choice[]
  /** the choice under test, where the strategy varies one parameter at a time */
  subject?: Choice
  record: RawRecord
  /** the worst of the chosen classes */
  validity: Validity
  /** the problems the pipeline must report — exactly these, as "field:code" */
  problems: string[]
  /** everything that must be observable on the ticket */
  expect: Expectation[]
}

export type Selection = Record<string, { cls: EquivalenceClass; point: Point }>

/** Every parameter at the representative of its base class: the ordinary ticket of a kind. */
export function baseSelection(kind: KindId): Selection {
  const out: Selection = {}
  for (const p of CATALOGUE[kind].parameters) {
    const cls = classOf(p, p.base)
    out[p.id] = { cls, point: typical(cls) }
  }
  return out
}

const RANK: Record<Validity, number> = { valid: 0, degraded: 1, invalid: 2 }

export function makeCase(kind: KindId, suite: SuiteId, n: number, title: string, selection: Selection, subject?: Parameter): Case {
  const { fixed, parameters } = CATALOGUE[kind]
  const id = `${kind}.${suite}.${n}`
  const record: Record<string, unknown> = { id, ...fixed }
  const choices: Choice[] = []
  const expect: Expectation[] = []
  const problems = new Set<string>()
  let validity: Validity = 'valid'

  for (const p of parameters) {
    const { cls, point } = selection[p.id]
    Object.assign(record, point.patch)
    choices.push({ parameter: p.id, cls: cls.id, point: point.id })
    if (RANK[cls.validity] > RANK[validity]) validity = cls.validity
    for (const p of point.problems) problems.add(`${p.field}:${p.code}`)
    expect.push(...cls.expect(point))
  }
  // `undefined` in a patch means "the field is not sent"
  for (const key of Object.keys(record)) if (record[key] === undefined) delete record[key]

  return {
    id,
    suite,
    kind,
    title,
    choices,
    subject: subject && choices.find((c) => c.parameter === subject.id),
    record,
    validity,
    problems: [...problems].sort(),
    // an invalid record is not drawn: nothing to observe on a ticket
    expect: validity === 'invalid' ? [] : expect,
  }
}

export const describeChoice = (c: Choice) => `${c.parameter} = ${c.cls}${c.point === 'typical' ? '' : ` · ${c.point}`}`
