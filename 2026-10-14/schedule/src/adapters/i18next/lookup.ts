import i18next, { type i18n as I18n } from 'i18next'
import type { Lookup, Patterns } from '../../core/ports'
import { CATEGORY_CAPTIONS, type CaptionKey } from '../../core/schedule/captions'
import { en } from '../../locales/en'
import { et } from '../../locales/et'
import { FALLBACK, isLang, type Lang } from '../../locales/languages'
import { ru } from '../../locales/ru'

/**
 * ADAPTER — the Lookup port on top of i18next and the bundled locale files
 * (src/locales): `ui` (fixed captions and patterns) goes through i18next;
 * `lut` (the lookup tables) is kept here as plain maps. To load the tables
 * from the backend instead, add them with `addRows` once fetched; nothing
 * outside this file changes.
 *
 * Lookup-table ROWS never pass through i18next's key syntax or its object
 * merging: ids come from the backend, and an id such as "constructor", "a.b"
 * or "ns:x" must find its row or nothing.
 */

const PATTERN_KEYS: Record<keyof Patterns, string> = {
  dayHeader: 'ui:dayHeader',
  filmWithPrefix: 'ui:filmWithPrefix',
  hallNumbered: 'ui:hallNumbered',
  notShown: 'ui:notShown',
}

type Tables = Record<string, Record<string, string>>

export interface I18nextLookups {
  /** the Lookup port for one language */
  lookup(lang: string): Lookup
  /** merge extra lookup-table rows into one language (test fixtures, tables fetched later) */
  addRows(lang: Lang, rows: Tables): void
}

export function createI18nextLookups(): I18nextLookups {
  const i18n: I18n = i18next.createInstance()
  void i18n.init({
    resources: { et: { ui: et.ui }, en: { ui: en.ui }, ru: { ui: ru.ui } },
    lng: 'et',
    fallbackLng: { ...FALLBACK, default: ['et'] },
    ns: ['ui'],
    defaultNS: 'ui',
    interpolation: { escapeValue: false }, // React escapes
    returnNull: false,
    initAsync: false,
  })

  // language → table → id → text
  const store = new Map<Lang, Map<string, Map<string, string>>>()
  const add = (lang: Lang, tables: Tables) => {
    const ofLang = store.get(lang) ?? new Map<string, Map<string, string>>()
    store.set(lang, ofLang)
    for (const [table, rows] of Object.entries(tables)) {
      const ofTable = ofLang.get(table) ?? new Map<string, string>()
      ofLang.set(table, ofTable)
      for (const [id, text] of Object.entries(rows)) if (typeof text === 'string' && text !== '') ofTable.set(id, text)
    }
  }
  add('et', et.lut)
  add('en', en.lut)
  add('ru', ru.lut)

  const row = (chain: Lang[], table: string, id: string): string | undefined => {
    for (const l of chain) {
      const text = store.get(l)?.get(table)?.get(id)
      if (text !== undefined) return text
    }
    return undefined
  }

  const cache = new Map<string, Lookup>()
  const make = (asked: string): Lookup => {
    const lang: Lang = isLang(asked) ? asked : 'et'
    const t = i18n.getFixedT(lang)
    const chain = [lang, ...FALLBACK[lang]]
    return {
      lang: asked,
      caption: (key: CaptionKey) => {
        const category = CATEGORY_CAPTIONS[key]
        return category ? (row(chain, 'category', category) ?? key) : t(`ui:${key}`)
      },
      row: (table, id) => row(chain, table, id),
      pattern: (key, values) => t(PATTERN_KEYS[key], values as Record<string, unknown>),
    }
  }

  return {
    lookup(lang) {
      if (!cache.has(lang)) cache.set(lang, make(lang))
      return cache.get(lang)!
    },
    addRows(lang, rows) {
      add(lang, rows)
    },
  }
}
