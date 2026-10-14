import type { Layout } from '../../design/layout'
import { matches, type Condition, type Features } from './feature'

/**
 * SLOTS — the optional parts of a ticket and when they are present.
 *
 * A slot is present or absent as a function of the ticket's variant and its
 * shape, nothing else. The views do not decide: they render the slots the plan
 * hands them (core/ticket/plan.ts) and mark each with `data-slot`, which is
 * what the browser checks look for.
 */
export type SlotRule<F extends string = string> = (features: Features<F>, layout: Layout) => boolean

export type SlotRules<F extends string, S extends string> = { readonly [K in S]: SlotRule<F> }

/** Present when the condition holds; `only` restricts it to one ticket shape. */
export const when =
  <F extends string>(condition: Condition<F>, opts: { only?: Layout } = {}): SlotRule<F> =>
  (features, layout) =>
    (opts.only === undefined || opts.only === layout) && matches(condition, features)

/**
 * The cinema's address in the footer row: shown when the ticket has an
 * address and at most `max` of the footer's columns are filled.
 * `columns` lists, per shape, the features behind the optional columns and how
 * many columns are always there.
 */
export function footerAddress<F extends string>(
  addressFeature: F,
  spec: Record<Layout, { optional: readonly F[]; always: number; max: number }>,
): SlotRule<F> {
  return (features, layout) => {
    const { optional, always, max } = spec[layout]
    const filled = always + optional.filter((f) => features[f]).length
    return features[addressFeature] && filled <= max
  }
}

export function resolveSlots<F extends string, S extends string>(rules: SlotRules<F, S>, features: Features<F>, layout: Layout): Record<S, boolean> {
  const out = {} as Record<S, boolean>
  for (const id of Object.keys(rules) as S[]) out[id] = rules[id](features, layout)
  return out
}
