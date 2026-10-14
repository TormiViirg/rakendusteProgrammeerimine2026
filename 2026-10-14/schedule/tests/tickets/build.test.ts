import { describe, expect, it } from 'vitest'
import type { Catalog } from '../../src/core/ports'
import { buildSchedule, scheduleInfo } from '../../src/core/schedule/schedule'
import { measureString } from '../../src/core/shift/measure'
import { makeTicket, type PipelineContext } from '../../src/core/ticket/pipeline'
import { problemKey } from '../../src/core/ticket/problem'
import { en } from '../../src/locales/en'
import { et } from '../../src/locales/et'
import { ru } from '../../src/locales/ru'
import { KINDS } from '../../src/tickets/registry'
import { lookup } from '../helpers/world'

/**
 * What a model carries beyond the texts the catalogue's slots read: units,
 * the location sheet's data, the language of a title, the page headline.
 * Expected values are the locale files' own rows, named here by hand.
 */
const catalog: Catalog = {
  venue: (id) => (id === 'artis' ? { lat: 59.4, lng: 24.7 } : undefined),
  hall: (id) => ({ 'artis-8': { venueId: 'artis', number: 8 }, 'ccp-11': { venueId: 'coca-cola-plaza', nameKey: 'scape' }, free: { number: 2 } })[id],
}
const content = {
  lang: 'ru',
  items: {
    films: { f: { text: 'Stalker', lang: 'en' } },
    programmes: { p: { text: 'Classics', lang: 'en' } },
  },
}
const ctx = (lang: string): PipelineContext => ({ kinds: KINDS, lookup: lookup(lang), catalog, content })
const times = { arrival: '2026-11-18T17:40', start: '2026-11-18T18:00', end: '2026-11-18T20:10' }
const screening = { id: 's', kind: 'screening', ...times, venueId: 'artis', hallId: 'artis-8', roleId: 'admin', filmId: 'f', programmeIds: ['p'], durationMin: 108, gapMin: 20, bcMin: 30, qaMin: 15, audienceId: 'free', sessionCode: '020121' }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const model = (record: object, lang = 'et'): any => makeTicket(record, ctx(lang)).ticket!.model

describe('measures carry their unit, in the page\'s language', () => {
  it.each([
    ['et', et],
    ['en', en],
    ['ru', ru],
  ] as const)('%s', (lang, locale) => {
    const m = model(screening, lang)
    for (const part of ['duration', 'gap', 'bc', 'qa']) expect(m[part].unit, part).toBe(locale.lut.unit.min)
    expect(measureString(m.duration)).toBe(`108 ${locale.lut.unit.min}`)
    expect(locale.lut.unit.min.length).toBeGreaterThan(0)
  })
})

describe('the place', () => {
  it('name, address and entry text each come from their own table; coordinates from the catalog, the right way round', () => {
    const { place } = model(screening)
    expect(place).toMatchObject({ venueId: 'artis', name: et.lut.venue.artis, address: et.lut.venueAddress.artis, entry: et.lut.venueEntry.artis, lat: 59.4, lng: 24.7 })
    expect(new Set([place.name, place.address, place.entry]).size).toBe(3)
  })

  it('a named hall is the row its nameKey points at — not a row under the hall\'s own id', () => {
    expect(model({ ...screening, venueId: 'coca-cola-plaza', hallId: 'ccp-11' }).place.hall).toBe(et.lut.hall.scape)
    expect(et.lut.hall.scape).toBeTruthy()
  })

  it('a hall of another cinema is shown as sent, and reported', () => {
    const made = makeTicket({ ...screening, venueId: 'soprus' }, ctx('et'))
    expect(made.ticket).toBeDefined()
    expect(made.problems.map(problemKey)).toEqual(['hallId:inconsistent'])
    expect(made.problems[0].severity).toBe('warning')
    // a hall the catalog ties to no cinema fits every cinema
    expect(makeTicket({ ...screening, venueId: 'soprus', hallId: 'free' }, ctx('et')).problems).toEqual([])
  })

  it('a cinema shift shows no hall: one sent along is ignored, whatever it is', () => {
    for (const hallId of ['artis-8', 'no-such-hall', 42, '', null]) {
      const made = makeTicket({ id: 'v', kind: 'venue', ...times, venueId: 'artis', hallId }, ctx('et'))
      expect(made.problems, String(hallId)).toEqual([])
      expect((made.ticket!.model as unknown as { place: { hall?: string } }).place.hall, String(hallId)).toBeUndefined()
    }
  })
})

describe('the film title', () => {
  it('keeps the language it was delivered in (hyphenation and screen readers follow it)', () => {
    const m = model(screening, 'ru')
    expect([m.film, m.filmLang]).toEqual(['Stalker', 'en'])
  })
})

describe('the headline — the text whose length sets the page-wide "long text" adjustment', () => {
  it('is the film on a screening, the role on a role shift, the cinema on a cinema shift, the title on a break', () => {
    const headline = (record: object) => makeTicket(record, ctx('et')).ticket!.headline
    expect(headline({ ...screening, filmPrefixId: 'press' })).toBe(`${et.lut.filmPrefix.press} / Stalker`)
    expect(headline({ id: 'r', kind: 'role', ...times, venueId: 'artis', roleId: 'photographer' })).toBe(et.lut.role.photographer)
    expect(headline({ id: 'v', kind: 'venue', ...times, venueId: 'artis' })).toBe(et.lut.venue.artis)
    expect(headline({ id: 'b', kind: 'break', start: times.start, end: times.end, breakId: 'rest' })).toBe(et.lut.break.rest)
  })

  it('the schedule reports the longest one, the kinds on the page and how many tickets there are', () => {
    const s = buildSchedule({ shifts: [screening, { id: 'v', kind: 'venue', ...times, venueId: 'artis' }, { id: 'v2', kind: 'venue', ...times, venueId: 'soprus' }] }, ctx('et'))
    expect(scheduleInfo(s.days)).toEqual({ kinds: ['screening', 'venue'], count: 3, longestText: Math.max('Stalker'.length, et.lut.venue.artis.length, et.lut.venue.soprus.length) })
  })
})
