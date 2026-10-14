import { describe, expect, it } from 'vitest'
import { createSimulatedBackend } from '../../src/adapters/backend-simulated/backend'
import { SHY } from '../../src/adapters/hyphenation/rules'
import { createI18nextLookups } from '../../src/adapters/i18next/lookup'
import { buildCaptions } from '../../src/core/schedule/captions'
import { ROLE_TONES } from '../../src/design/tones'
import { en } from '../../src/locales/en'
import { et } from '../../src/locales/et'
import { LANGS } from '../../src/locales/languages'
import { ru } from '../../src/locales/ru'

const lookups = createI18nextLookups()

describe('the lookup adapter and the locale files', () => {
  it.each(LANGS)('%s: every caption exists (no key is shown raw)', (lang) => {
    const captions = buildCaptions(lookups.lookup(lang))
    for (const [key, text] of Object.entries(captions)) {
      expect(text, key).not.toBe('')
      expect(text, key).not.toBe(key)
      expect(text, key).not.toMatch(/^(ui|lut)[:.]/)
    }
  })

  it.each(LANGS)('%s: the one-line gap caption is the two-line one without its break, plus a colon', (lang) => {
    const c = buildCaptions(lookups.lookup(lang))
    expect(c.gapLine).toBe(`${c.gap.replaceAll(SHY, '')}:`)
  })

  it('the three locale files have the same captions and the same lookup tables', () => {
    const shape = (o: object) => Object.keys(o).sort()
    for (const other of [en, ru]) {
      expect(shape(other.ui)).toEqual(shape(et.ui))
      expect(shape(other.lut)).toEqual(shape(et.lut))
    }
  })

  it('every coloured role has a name in every language', () => {
    for (const lang of LANGS) for (const role of Object.keys(ROLE_TONES)) expect(lookups.lookup(lang).row('role', role), `${lang} ${role}`).toBeTruthy()
  })

  it('a row that does not exist is undefined — the pipeline decides what to show', () => {
    expect(lookups.lookup('et').row('venue', 'no-such-venue')).toBeUndefined()
    expect(lookups.lookup('et').row('no-such-table', 'artis')).toBeUndefined()
  })

  it('ids are data: names every object has, paths and separators are looked up as plain keys', () => {
    const l = lookups.lookup('et')
    for (const id of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'artis.name', 'venue:artis', 'numbered', ''])
      for (const table of ['venue', 'hall', 'role', 'constructor', '__proto__']) expect(l.row(table, id), `${table}/${id}`).toBeUndefined()
    const own = createI18nextLookups()
    own.addRows('et', { venue: { 'a.b': 'Punkt', constructor: 'Ehitaja' } })
    expect(own.lookup('et').row('venue', 'a.b')).toBe('Punkt')
    expect(own.lookup('en').row('venue', 'constructor')).toBe('Ehitaja')
  })

  it('patterns fill their placeholders', () => {
    const l = lookups.lookup('et')
    expect(l.pattern('hallNumbered', { n: 8 })).toBe('Saal 8')
    expect(l.pattern('filmWithPrefix', { prefix: 'Press', title: 'Ö' })).toBe('Press / Ö')
    expect(l.pattern('notShown', { count: 2 })).toContain('2')
  })

  it('a missing row falls back ru → en → et, en → et, et → en (never to Russian) — the order is stated here, not read from the code', () => {
    const own = createI18nextLookups()
    own.addRows('et', { venue: { all: 'kõigis', 'et-en': 'eesti', 'et-only': 'ainult eesti' } })
    own.addRows('en', { venue: { all: 'in all', 'et-en': 'English', 'en-only': 'English only' } })
    own.addRows('ru', { venue: { all: 'во всех', 'ru-only': 'только русский' } })
    const row = (lang: string, id: string) => own.lookup(lang).row('venue', id)
    expect(['all', 'et-en', 'et-only', 'en-only', 'ru-only'].map((id) => row('ru', id))).toEqual(['во всех', 'English', 'ainult eesti', 'English only', 'только русский'])
    expect(['all', 'et-en', 'et-only', 'en-only', 'ru-only'].map((id) => row('en', id))).toEqual(['in all', 'English', 'ainult eesti', 'English only', undefined])
    expect(['all', 'et-en', 'et-only', 'en-only', 'ru-only'].map((id) => row('et', id))).toEqual(['kõigis', 'eesti', 'ainult eesti', 'English only', undefined])
    // a language the interface does not have reads Estonian
    expect(row('de', 'all')).toBe('kõigis')
  })

  it('rows added later are found, and fall back to other languages', () => {
    const own = createI18nextLookups()
    own.addRows('et', { venue: { 'tc-only-et': 'Ainult eesti keeles' } })
    expect(own.lookup('et').row('venue', 'tc-only-et')).toBe('Ainult eesti keeles')
    expect(own.lookup('ru').row('venue', 'tc-only-et')).toBe('Ainult eesti keeles')
  })
})

describe('the simulated backend', () => {
  const backend = createSimulatedBackend()
  backend.setLatency(0)

  it('content: the language asked for, then its fallbacks, then whatever exists; unknown ids and collections are left out', async () => {
    const { items: c } = await backend.fetchContent('ru', { films: ['garin', 'strangelove', 'o', 'rashomon', 'nope', 'constructor'], programmes: ['georgia'], posters: ['garin'] })
    expect(c.films.garin).toEqual({ text: 'Гиперболоид инженера Гарина', lang: 'ru' })
    expect(c.films.strangelove.lang).toBe('en')
    expect(c.films.o.lang).toBe('et')
    expect(c.films.rashomon.lang).toBe('ja')
    expect(Object.keys(c.films).sort()).toEqual(['garin', 'o', 'rashomon', 'strangelove'])
    expect(c.posters).toEqual({})
    expect(c.programmes.georgia.lang).toBe('en')
  })

  it('serves the mockup schedules and an empty one for anything else', async () => {
    expect((await backend.fetchSchedule({ view: 'general' })).shifts.length).toBe(2)
    expect((await backend.fetchSchedule({ view: 'unheard-of' })).shifts).toEqual([])
  })
})
