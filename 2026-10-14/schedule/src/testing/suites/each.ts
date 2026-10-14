import type { KindId } from '../../tickets/registry'
import { CATALOGUE } from '../catalogue'
import type { Validity } from '../catalogue/types'
import { baseSelection, makeCase, type Case, type SuiteId } from './case'

/**
 * STRATEGY: BASE CHOICE (one factor at a time).
 *
 *   base     every parameter at the representative of its base class — the
 *            ordinary ticket. One case per kind.
 *   each     starting from the base ticket, ONE parameter is moved through
 *            every value the catalogue has for it: the representative and every
 *            boundary value of every valid and degraded class.
 *   invalid  the same for the invalid classes. Invalid values are only ever
 *            tested one at a time: a second fault would hide the first.
 *
 * Coverage: every class and every boundary value appears on at least one
 * ticket, and a failure names the class that caused it.
 */
export function baseCase(kind: KindId): Case {
  return makeCase(kind, 'base', 0, 'the ordinary ticket: every parameter at its base class', baseSelection(kind))
}

function oneAtATime(kind: KindId, suite: SuiteId, wanted: (v: Validity) => boolean): Case[] {
  const base = baseSelection(kind)
  const out: Case[] = []
  for (const p of CATALOGUE[kind].parameters) {
    for (const cls of p.classes) {
      if (!wanted(cls.validity)) continue
      for (const point of cls.points) {
        // the base ticket itself is the `base` suite
        if (cls.id === p.base && !point.edge) continue
        const title = `${p.id} = ${cls.id}${point.edge ? ` · ${point.id} — ${point.about}` : ` — ${cls.about}`}`
        out.push(makeCase(kind, suite, out.length, title, { ...base, [p.id]: { cls, point } }, p))
      }
    }
  }
  return out
}

export const eachCases = (kind: KindId): Case[] => oneAtATime(kind, 'each', (v) => v !== 'invalid')
export const invalidCases = (kind: KindId): Case[] => oneAtATime(kind, 'invalid', (v) => v === 'invalid')
