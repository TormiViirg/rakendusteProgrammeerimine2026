import type { ScheduleGroup, ScheduleResponse } from '../../core/shift/records'
import { KINDS, type KindId } from '../../tickets/registry'
import { CATALOGUE, CATALOGUE_KINDS } from '../catalogue'
import { describeChoice, type Case, type SuiteId } from './case'
import { baseCase, eachCases, invalidCases } from './each'
import { pairCases } from './pairs'
import { variantCases } from './variants'

/**
 * THE SUITES — the catalogue's classes, combined by five strategies.
 *
 *   suite      strategy                                   coverage
 *   base       every parameter at its base class          the ordinary ticket of each kind
 *   each       one parameter at a time through all its    every class and every boundary value
 *              valid and degraded values
 *   pairs      all pairs of classes                       every two classes together
 *   variants   every on/off assignment of the features    every sub-variant of every kind
 *   invalid    one invalid value at a time                every way a record can be wrong
 */
export const SUITES: Record<SuiteId, { about: string; cases: (kind: KindId) => Case[] }> = {
  base: { about: 'the ordinary ticket of each kind', cases: (k) => [baseCase(k)] },
  each: { about: 'every class and every boundary value, one parameter at a time', cases: eachCases },
  pairs: { about: 'every pair of classes', cases: pairCases },
  variants: { about: 'every variant of every kind', cases: variantCases },
  invalid: { about: 'every invalid class, one at a time: none of these may be drawn', cases: invalidCases },
}

export const SUITE_IDS = Object.keys(SUITES) as SuiteId[]

interface Row {
  group: string
  title: string
  note: string
  c: Case
}

function rows(suite: SuiteId): Row[] {
  const out: Row[] = []
  for (const kind of CATALOGUE_KINDS) {
    const cases = SUITES[suite].cases(kind)
    for (const c of cases) {
      if (suite === 'each' || suite === 'invalid') {
        const p = CATALOGUE[kind].parameters.find((x) => x.id === c.subject!.parameter)!
        out.push({ group: `${kind}/${p.id}`, title: `${kind} · ${p.id} — ${p.about}`, note: c.title.replace(`${p.id} = `, ''), c })
      } else if (suite === 'pairs') {
        out.push({ group: kind, title: `${kind} · every pair of classes · ${cases.length} tickets`, note: c.title, c })
      } else if (suite === 'variants') {
        const n = Object.keys(KINDS[kind].features).length
        out.push({ group: kind, title: `${kind} · every variant · 2^${n} = ${cases.length}`, note: c.title, c })
      } else {
        out.push({ group: 'base', title: 'the ordinary ticket of each kind', note: `${kind}: ${c.choices.map(describeChoice).join(' · ')}`, c })
      }
    }
  }
  return out
}

const cache = new Map<SuiteId, Row[]>()
const rowsOf = (suite: SuiteId) => {
  if (!cache.has(suite)) cache.set(suite, rows(suite))
  return cache.get(suite)!
}

export const PAGE_SIZE = 24

export const allCases = (suite: SuiteId): Case[] => rowsOf(suite).map((r) => r.c)
export const pageCount = (suite: SuiteId) => Math.max(1, Math.ceil(rowsOf(suite).length / PAGE_SIZE))

export interface SuitePage extends ScheduleResponse {
  /** the cases behind the records of this page, in order */
  cases: Case[]
}

/** One page of a suite as a schedule: the records, grouped and annotated by what they test. */
export function suitePage(suite: SuiteId, page: number): SuitePage {
  const all = rowsOf(suite)
  const count = pageCount(suite)
  const index = ((page % count) + count) % count
  const slice = all.slice(index * PAGE_SIZE, (index + 1) * PAGE_SIZE)

  const groups: ScheduleGroup[] = []
  for (const r of slice) {
    let g = groups[groups.length - 1]
    if (!g || g.id !== r.group) {
      g = { id: r.group, title: r.title, shiftIds: [], notes: {} }
      groups.push(g)
    }
    g.shiftIds.push(r.c.id)
    g.notes![r.c.id] = r.note
  }
  return { shifts: slice.map((r) => r.c.record), groups, page: { index, count, total: all.length }, cases: slice.map((r) => r.c) }
}

export type { Case, Choice, SuiteId } from './case'
