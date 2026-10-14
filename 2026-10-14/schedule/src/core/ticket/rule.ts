import type { Layout } from '../../design/layout'
import type { DeepPartial, Tokens } from '../../design/tokens'
import { merge } from '../design/merge'
import { matches, type Condition, type Features } from './feature'

/**
 * VARIANT RULES — token changes for tickets that carry a certain combination
 * of information.
 *
 *   { id: 'no-subtitles', when: { subtitles: false }, set: { thin: { holo: { strip: 22 } } } }
 *
 * A rule belongs to one kind and one ticket shape. All rules whose condition
 * holds are applied, in the order they are written; a later rule wins where
 * two set the same token. compile.ts rejects rules that touch the outline or
 * the strip (design/invariants.ts) and pairs of rules whose order would matter
 * without one being the more specific.
 */
export interface VariantRule<F extends string = string> {
  id: string
  /** why the rule exists */
  about: string
  when: Condition<F>
  set: DeepPartial<Tokens>
}

export interface AppliedRules {
  overrides: DeepPartial<Tokens>
  /** ids of the rules that matched, in order */
  applied: string[]
}

export function applyRules<F extends string>(rules: readonly VariantRule<F>[], features: Features<F>): AppliedRules {
  let overrides: DeepPartial<Tokens> = {}
  const applied: string[] = []
  for (const rule of rules) {
    if (!matches(rule.when, features)) continue
    overrides = merge(overrides as Tokens, rule.set) as DeepPartial<Tokens>
    applied.push(rule.id)
  }
  return { overrides, applied }
}

export type RulesByLayout<F extends string> = Record<Layout, readonly VariantRule<F>[]>
