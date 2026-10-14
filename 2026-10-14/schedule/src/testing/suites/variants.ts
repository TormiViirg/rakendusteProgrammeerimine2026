import { enumerate, variantName, type Features } from '../../core/ticket/feature'
import { KINDS, type KindId } from '../../tickets/registry'
import { CATALOGUE } from '../catalogue'
import { classOf, typical } from '../catalogue/types'
import { baseSelection, makeCase, type Case } from './case'

/**
 * STRATEGY: EVERY VARIANT.
 *
 * A kind with n features has 2ⁿ variants (core/ticket/feature.ts), and
 * everything structural about a ticket — which parts exist, which rules apply
 * — depends on the variant alone. So each variant is drawn once: every feature
 * is switched on or off through the class the catalogue names as its witness.
 *
 * Coverage: every sub-variant of every kind.
 */
export interface VariantCase extends Case {
  /** the variant the record is meant to produce; the unit tests check that it does */
  features: Features
}

export function variantCases(kind: KindId): VariantCase[] {
  const { parameters, witnesses } = CATALOGUE[kind]
  const features = Object.keys(KINDS[kind].features)
  for (const f of features) if (!witnesses[f]) throw new Error(`catalogue: kind "${kind}" has no witness for feature "${f}"`)

  return enumerate(features).map((assignment, n) => {
    const selection = baseSelection(kind)
    for (const f of features) {
      const w = witnesses[f]
      const p = parameters.find((x) => x.id === w.parameter)
      if (!p) throw new Error(`catalogue: witness of "${f}" names parameter "${w.parameter}", which kind "${kind}" does not have`)
      const cls = classOf(p, assignment[f] ? w.on : w.off)
      selection[p.id] = { cls, point: typical(cls) }
    }
    return { ...makeCase(kind, 'variants', n, variantName(assignment), selection), features: assignment }
  })
}
