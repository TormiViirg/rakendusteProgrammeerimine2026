import type { KindId } from '../../tickets/registry'
import { CATALOGUE } from '../catalogue'
import { typical } from '../catalogue/types'
import { describeChoice, makeCase, type Case, type Selection } from './case'
import { allPairs } from './pairwise'

/**
 * STRATEGY: PAIRWISE.
 *
 * Every valid or degraded class of every parameter meets every such class of
 * every other parameter on at least one ticket (representatives only; the
 * boundary values are the `each` suite's job, invalid classes the `invalid`
 * suite's).
 *
 * Coverage: all pairs of classes. This is the suite that finds what only goes
 * wrong in combination — a long cinema name next to an age badge, a missing
 * subtitle row together with a long programme.
 */
export function pairCases(kind: KindId): Case[] {
  const parameters = CATALOGUE[kind].parameters.map((p) => ({ p, classes: p.classes.filter((c) => c.validity !== 'invalid') }))
  const rows = allPairs(
    parameters.map((x) => x.classes.length),
    parameters.map((x) => x.classes.findIndex((c) => c.id === x.p.base)),
  )
  return rows.map((row, n) => {
    const selection: Selection = {}
    parameters.forEach(({ p, classes }, i) => (selection[p.id] = { cls: classes[row[i]], point: typical(classes[row[i]]) }))
    const c = makeCase(kind, 'pairs', n, '', selection)
    // name the case by what differs from the ordinary ticket
    const differs = c.choices.filter((ch, i) => ch.cls !== parameters[i].p.base)
    return { ...c, title: differs.length ? differs.map(describeChoice).join(' · ') : 'the ordinary ticket' }
  })
}
