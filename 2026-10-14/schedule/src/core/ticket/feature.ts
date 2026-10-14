/**
 * The FEATURE MODEL of a ticket kind.
 *
 * Tickets of one kind differ along a few yes/no axes — is it a night shift,
 * does it have subtitles, an age rating, a BC time … Each axis is a FEATURE,
 * derived from the ticket's model, never stored. One assignment of all
 * features is a VARIANT; a kind with n features has 2ⁿ of them.
 *
 * Everything that changes with what a ticket carries is a function of its
 * variant alone: which optional parts are present (slot.ts) and which token
 * changes apply (rule.ts). So the variants of a kind can be listed, checked
 * and tested exhaustively (compile.ts, testing/suites/variants.ts).
 */

/** One assignment: every feature of a kind, on or off. */
export type Features<F extends string = string> = Readonly<Record<F, boolean>>

export interface FeatureDef<M> {
  /** what the feature means, for the variant table and the docs */
  about: string
  /** read it off the model */
  of: (model: M) => boolean
}

export type FeatureDefs<M, F extends string> = { readonly [K in F]: FeatureDef<M> }

/**
 * A CONDITION is a conjunction of feature values: { night: true, subtitles: false }
 * reads "at night and without subtitles". Features it does not mention may be either.
 */
export type Condition<F extends string = string> = Readonly<Partial<Record<F, boolean>>>

/** Derives the variant of a model. */
export function describe<M, F extends string>(defs: FeatureDefs<M, F>, model: M): Features<F> {
  const out = {} as Record<F, boolean>
  for (const id of Object.keys(defs) as F[]) out[id] = Boolean(defs[id].of(model))
  return out
}

export function matches<F extends string>(when: Condition<F>, features: Features<F>): boolean {
  return (Object.keys(when) as F[]).every((f) => features[f] === when[f])
}

/** Can both conditions hold for the same ticket? */
export function overlap(a: Condition, b: Condition): boolean {
  return Object.keys(a).every((f) => b[f] === undefined || b[f] === a[f])
}

/** Does `a` hold whenever `b` holds? ({ night: true } is implied by { night: true, bc: true }) */
export function impliedBy(a: Condition, b: Condition): boolean {
  return Object.keys(a).every((f) => b[f] === a[f])
}

/** All 2ⁿ variants of a list of features, in a stable order (first feature varies slowest). */
export function enumerate<F extends string>(ids: readonly F[]): Features<F>[] {
  const out: Features<F>[] = []
  for (let n = 0; n < 2 ** ids.length; n++) {
    const v = {} as Record<F, boolean>
    ids.forEach((id, i) => (v[id] = Boolean((n >> (ids.length - 1 - i)) & 1)))
    out.push(v)
  }
  return out
}

/** A readable, stable name: "night +rating −subtitles" → "night+rating". "plain" when nothing is on. */
export function variantName(features: Features): string {
  const on = Object.keys(features).filter((f) => features[f])
  return on.length ? on.join('+') : 'plain'
}

export function conditionText(when: Condition): string {
  const parts = Object.keys(when).map((f) => (when[f] ? f : `no ${f}`))
  return parts.length ? parts.join(', ') : 'always'
}
