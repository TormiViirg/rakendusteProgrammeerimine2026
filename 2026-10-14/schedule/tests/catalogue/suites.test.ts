import { describe, expect, it } from 'vitest'
import { isError, problemKey, type Problem } from '../../src/core/ticket/problem'
import { LAYOUTS } from '../../src/design/layout'
import { LANGS } from '../../src/locales/languages'
import { CATALOGUE, CATALOGUE_KINDS, allPoints } from '../../src/testing/catalogue'
import { failsExpectation, knownSlot } from '../../src/testing/readers'
import { SUITES, SUITE_IDS, allCases } from '../../src/testing/suites'
import { variantCases } from '../../src/testing/suites/variants'
import { KINDS } from '../../src/tickets/registry'
import { captions, plan, run } from '../helpers/world'

/**
 * Every case of every suite goes through the real pipeline, and the catalogue
 * is the oracle: a class says whether its values are valid, which problem must
 * be reported for which field, and what the ticket must show — in every
 * language, with expected texts the catalogue read from the locale files itself.
 */
describe('the catalogue is well-formed', () => {
  for (const kind of CATALOGUE_KINDS) {
    const { parameters } = CATALOGUE[kind]
    it(`${kind}: ids are unique, every base class exists and is valid`, () => {
      expect(new Set(parameters.map((p) => p.id)).size).toBe(parameters.length)
      for (const p of parameters) {
        expect(new Set(p.classes.map((c) => c.id)).size, `classes of ${p.id}`).toBe(p.classes.length)
        const base = p.classes.find((c) => c.id === p.base)
        expect(base?.validity, `base class of ${p.id}`).toBe('valid')
        for (const c of p.classes) {
          expect(new Set(c.points.map((x) => x.id)).size, `points of ${p.id}/${c.id}`).toBe(c.points.length)
          expect(c.about.length, `${p.id}/${c.id} says what it represents`).toBeGreaterThan(5)
        }
      }
    })

    it(`${kind}: no two points of a parameter are the same value`, () => {
      for (const p of parameters) {
        const seen = new Map<string, string>()
        for (const c of p.classes)
          for (const point of c.points) {
            const key = JSON.stringify(point.patch, (_k, v) => (v === undefined ? '__absent__' : v))
            // "absent" may stand for different things in different kinds, but within one parameter of one kind a value has one class
            expect(seen.get(key), `${p.id}: ${c.id}·${point.id} repeats ${seen.get(key)}`).toBeUndefined()
            seen.set(key, `${c.id}·${point.id}`)
          }
      }
    })
  }

  it('counts', () => {
    const points = CATALOGUE_KINDS.reduce((n, k) => n + allPoints(k).length, 0)
    expect(points).toBeGreaterThan(200)
  })
})

/** A field may be found faulty by more than one check: the oracle compares the set of "field:code". */
const keysOf = (problems: Problem[]) => [...new Set(problems.map(problemKey))].sort()

describe.each(SUITE_IDS)('suite %s', (suite) => {
  const cases = allCases(suite)

  it('has cases with unique ids', () => {
    expect(cases.length).toBeGreaterThan(0)
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length)
  })

  it.each(LANGS)('%s: every case behaves as its classes say', async (lang) => {
    const results = await run(cases.map((c) => c.record), lang)
    const texts = captions(lang)
    const wrong: string[] = []
    let checked = 0
    cases.forEach((c, i) => {
      const { ticket, problems } = results[i]
      const where = `${c.id} [${c.title}]`

      // validity: an invalid record is not drawn, anything else is
      if (c.validity === 'invalid') {
        if (ticket) wrong.push(`${where}: was drawn, but is invalid`)
        if (!problems.some(isError)) wrong.push(`${where}: no error reported`)
      } else {
        if (!ticket) wrong.push(`${where}: not drawn — ${keysOf(problems)}`)
        if (problems.some(isError)) wrong.push(`${where}: reported an error`)
      }
      if (c.validity === 'valid' && problems.length > 0) wrong.push(`${where}: valid, but reported ${keysOf(problems)}`)
      // problems: exactly the fields and defects the chosen values name
      if (JSON.stringify(keysOf(problems)) !== JSON.stringify(c.problems)) wrong.push(`${where}: problems [${keysOf(problems)}], expected [${c.problems}]`)
      // what the ticket shows, in both shapes
      if (ticket) {
        for (const layout of LAYOUTS) {
          const p = plan(c.kind, ticket.features, layout)
          for (const e of c.expect) {
            checked++
            const failure = failsExpectation(e, ticket.model, p, texts, lang)
            if (failure) wrong.push(`${where} (${layout}): ${failure}`)
          }
        }
      }
    })
    expect(wrong).toEqual([])
    // the oracle is not vacuous: drawn tickets are looked at
    if (suite !== 'invalid') expect(checked).toBeGreaterThan(cases.length)
  })

  it(`is what it claims: ${SUITES[suite].about}`, () => {
    expect(SUITES[suite].about.length).toBeGreaterThan(10)
  })
})

describe('the oracle', () => {
  it('every parameter of every kind has a class that says what the ticket must show', () => {
    for (const kind of CATALOGUE_KINDS)
      for (const p of CATALOGUE[kind].parameters) {
        const texts = p.classes.flatMap((c) => (c.validity === 'invalid' ? [] : c.points.flatMap((point) => c.expect(point)))).filter((e) => 'is' in e || 'has' in e)
        expect(texts.length, `${kind}/${p.id} expects a text somewhere`).toBeGreaterThan(0)
      }
  })

  it('every expected slot can be read from a model', () => {
    for (const kind of CATALOGUE_KINDS)
      for (const p of CATALOGUE[kind].parameters)
        for (const c of p.classes)
          for (const point of c.points)
            for (const e of c.expect(point)) if ('slot' in e) expect(knownSlot(e.slot) || Object.hasOwn(KINDS[kind].slots, e.slot), `${kind}/${p.id}/${c.id}: slot "${e.slot}"`).toBe(true)
  })

  it('expected texts exist in every language', () => {
    for (const kind of CATALOGUE_KINDS)
      for (const p of CATALOGUE[kind].parameters)
        for (const c of p.classes)
          for (const point of c.points)
            for (const e of c.expect(point)) {
              const text = 'is' in e ? e.is : 'has' in e ? e.has : undefined
              if (text) for (const lang of LANGS) expect(typeof text[lang], `${kind}/${p.id}/${c.id}/${point.id} in ${lang}`).toBe('string')
            }
  })

  it('degraded and invalid values name their problems; valid ones name none', () => {
    for (const kind of CATALOGUE_KINDS)
      for (const p of CATALOGUE[kind].parameters)
        for (const c of p.classes)
          for (const point of c.points) expect(point.problems.length > 0, `${kind}/${p.id}/${c.id}/${point.id}`).toBe(c.validity !== 'valid')
  })
})

describe('coverage', () => {
  it('each + base + invalid visit every point of the catalogue', () => {
    for (const kind of CATALOGUE_KINDS) {
      const visited = new Set<string>()
      for (const suite of ['base', 'each', 'invalid'] as const)
        for (const c of SUITES[suite].cases(kind)) for (const ch of c.choices) visited.add(`${ch.parameter}/${ch.cls}/${ch.point}`)
      const all = allPoints(kind).map((x) => `${x.parameter.id}/${x.cls.id}/${x.point.id}`)
      expect(all.filter((x) => !visited.has(x)), kind).toEqual([])
    }
  })

  it('variants: every record produces exactly the variant it was built for, and all 2ⁿ are there', async () => {
    for (const kind of CATALOGUE_KINDS) {
      const cases = variantCases(kind)
      expect(cases.length).toBe(2 ** Object.keys(KINDS[kind].features).length)
      const results = await run(cases.map((c) => c.record))
      cases.forEach((c, i) => expect(results[i].ticket?.features, `${kind} ${c.title}`).toEqual(c.features))
    }
  })
})
