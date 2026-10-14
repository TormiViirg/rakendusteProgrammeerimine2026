import type { KindId } from '../../tickets/registry'
import { KIND_CATALOGUE, type KindCatalogue } from './kinds'
import type { EquivalenceClass, Parameter, Point } from './types'

/**
 * THE MASTER CATALOGUE — every input class the tests know, in one place.
 *
 *   parameters/times.ts     when: day · night · multi-day · invalid orders and formats
 *   parameters/numbers.ts   runtime · gap · BC · Q&A · age rating · screening code
 *   parameters/texts.ts     cinema · position · hall · audience · film · prefix · pause · note
 *   parameters/lists.ts     subtitles · programmes
 *   kinds.ts                which of them each ticket kind has
 *   ../screens.ts           the screens the layout is checked on
 *
 * To add a category: add a class (with its boundary values and what it must
 * lead to) to the parameter it belongs to. Every suite picks it up; nothing
 * else needs to change. docs/TEST-CATALOGUE.md is generated from here.
 */
export const CATALOGUE: Record<KindId, KindCatalogue> = KIND_CATALOGUE
export const CATALOGUE_KINDS = Object.keys(CATALOGUE) as KindId[]

export function parameterOf(kind: KindId, id: string): Parameter {
  const p = CATALOGUE[kind].parameters.find((x) => x.id === id)
  if (!p) throw new Error(`kind "${kind}" has no parameter "${id}"`)
  return p
}

/** Every point of the catalogue, flat: for counting and for the unit tests that visit each one. */
export interface CataloguePoint {
  kind: KindId
  parameter: Parameter
  cls: EquivalenceClass
  point: Point
}

export function allPoints(kind: KindId): CataloguePoint[] {
  return CATALOGUE[kind].parameters.flatMap((parameter) => parameter.classes.flatMap((cls) => cls.points.map((point) => ({ kind, parameter, cls, point }))))
}

export type { EquivalenceClass, Expectation, Parameter, Point, Validity } from './types'
export { classOf, typical } from './types'
