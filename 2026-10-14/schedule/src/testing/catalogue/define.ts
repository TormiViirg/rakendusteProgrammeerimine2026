import type { ProblemCode } from '../../core/ticket/problem'
import type { EquivalenceClass, ExpectedProblem, Expectation, Localized, Parameter, Point, RecordPatch, Validity } from './types'

/** Helpers that keep the catalogue files short and uniform. */

export interface Edge<V> {
  id: string
  value: V
  /** what this value is the edge of */
  about: string
  /** when this edge raises other problems than its class */
  problems?: ExpectedProblem[]
}

export interface ClassSpec<V> {
  id: string
  about: string
  validity?: Validity
  /** the representative */
  value: V
  edges?: Edge<V>[]
  /** degraded / invalid: the problems every value of the class raises */
  problems?: ExpectedProblem[]
  /** overrides the parameter's `expect` for this class */
  expect?: (value: V) => Expectation[]
}

interface ParameterSpec<V> {
  id: string
  about: string
  base: string
  /** how a value becomes record fields */
  patch: (value: V) => RecordPatch
  /** what every value must lead to, unless the class says otherwise */
  expect?: (value: V) => Expectation[]
  classes: ClassSpec<V>[]
}

export function parameter<V>(spec: ParameterSpec<V>): Parameter {
  const classes: EquivalenceClass[] = spec.classes.map((c) => {
    const values = new Map<Point, V>()
    const point = (id: string, about: string, value: V, edge: boolean, problems: ExpectedProblem[]): Point => {
      const p: Point = { id, about, patch: spec.patch(value), edge, problems }
      values.set(p, value)
      return p
    }
    const validity = c.validity ?? 'valid'
    const own = c.problems ?? []
    if (validity === 'invalid' && own.length === 0 && !(c.edges ?? []).every((e) => e.problems?.length)) throw new Error(`catalogue: ${spec.id}/${c.id} is invalid but names no problem`)
    if (validity === 'valid' && (own.length > 0 || (c.edges ?? []).some((e) => e.problems?.length))) throw new Error(`catalogue: ${spec.id}/${c.id} is valid but names a problem`)
    const expect = c.expect ?? spec.expect ?? (() => [])
    return {
      id: c.id,
      about: c.about,
      validity,
      points: [point('typical', 'representative of the class', c.value, false, own), ...(c.edges ?? []).map((e) => point(e.id, e.about, e.value, true, e.problems ?? own))],
      expect: (p) => expect(values.get(p) as V),
    }
  })
  if (!classes.some((c) => c.id === spec.base)) throw new Error(`parameter "${spec.id}": base class "${spec.base}" does not exist`)
  return { id: spec.id, about: spec.about, base: spec.base, classes }
}

/** A class of a one-field parameter names its defect by code alone: the field is known. */
export interface FieldClass<V> extends Omit<ClassSpec<V>, 'problems'> {
  problem?: ProblemCode
}

/** A parameter that sets one field of the record. */
export const field = <V>(name: string, spec: Omit<ParameterSpec<V>, 'patch' | 'classes'> & { classes: FieldClass<V>[] }): Parameter =>
  parameter({
    ...spec,
    patch: (value) => ({ [name]: value }),
    classes: spec.classes.map(({ problem, ...c }) => ({ ...c, problems: problem ? [{ field: name, code: problem }] : undefined })),
  })

/** The same parameter without some classes (a kind where they cannot occur) and/or with another base. */
export function narrowed(p: Parameter, opts: { without?: string[]; base?: string }): Parameter {
  const classes = p.classes.filter((c) => !opts.without?.includes(c.id))
  const base = opts.base ?? p.base
  if (!classes.some((c) => c.id === base)) throw new Error(`parameter "${p.id}": base class "${base}" was removed`)
  return { ...p, classes, base }
}

/** The same text in every language (numbers, times, codes). */
export const same = (text: string): Localized => ({ et: text, en: text, ru: text })

export const is = (slot: string, text: Localized | string): Expectation => ({ slot, is: typeof text === 'string' ? same(text) : text })
/** For a part that other inputs may switch off (the footer address): if it is drawn, it shows this. */
export const isWhenDrawn = (slot: string, text: Localized | string): Expectation => ({ slot, is: typeof text === 'string' ? same(text) : text, whenDrawn: true })
export const has = (slot: string, text: Localized | string): Expectation => ({ slot, has: typeof text === 'string' ? same(text) : text })
export const present = (slot: string): Expectation => ({ slot, present: true })
export const absent = (slot: string): Expectation => ({ slot, present: false })
