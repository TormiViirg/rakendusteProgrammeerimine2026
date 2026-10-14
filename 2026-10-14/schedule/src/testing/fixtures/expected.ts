import { en } from '../../locales/en'
import { et } from '../../locales/et'
import { FALLBACK, LANGS, type Lang } from '../../locales/languages'
import { ru } from '../../locales/ru'
import type { Localized } from '../catalogue/types'
import { FIXTURE_CONTENT, FIXTURE_ROWS } from './index'

/**
 * THE ORACLE'S OWN READING of the locale files and the fixtures: what text a
 * lookup id, a pattern or a content id must be shown as, in each language.
 *
 * It deliberately shares no code with the lookup adapter or the pipeline —
 * a few lines of its own — so an expectation built here can disagree with them.
 */
const LOCALES: Record<Lang, { ui: Record<string, string>; lut: Record<string, Record<string, string>> }> = { et, en, ru }

const perLang = (text: (lang: Lang) => string): Localized => Object.fromEntries(LANGS.map((l) => [l, text(l)]))

/** The row of a lookup table, with the language fallbacks; the raw id where no language has it. */
export function rowText(table: string, id: string): Localized {
  return perLang((lang) => {
    for (const l of [lang, ...FALLBACK[lang]]) {
      const rows = { ...LOCALES[l].lut[table], ...(l === 'et' ? FIXTURE_ROWS[table] : undefined) }
      if (Object.hasOwn(rows, id)) return rows[id]
    }
    return id
  })
}

export const hasRow = (table: string, id: string) => LANGS.some((l) => Object.hasOwn({ ...LOCALES[l].lut[table], ...(l === 'et' ? FIXTURE_ROWS[table] : undefined) }, id))

/** A caption or separator of the `ui` namespace. */
export const uiText = (key: string): Localized => perLang((lang) => LOCALES[lang].ui[key])

/** A `ui` pattern with its {{placeholders}} filled; a placeholder may itself differ per language. */
export function patternText(key: string, values: Record<string, Localized | string | number>): Localized {
  return perLang((lang) => LOCALES[lang].ui[key].replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const v = values[name]
    return typeof v === 'object' ? v[lang] : String(v)
  }))
}

/** A text of the content store: the language asked for, its fallbacks, then whatever exists; the raw id if unknown. */
export function contentText(collection: string, id: string): Localized {
  const items = FIXTURE_CONTENT[collection] ?? {}
  const item = Object.hasOwn(items, id) ? items[id] : undefined
  return perLang((lang) => {
    if (!item) return id
    for (const l of [lang, ...FALLBACK[lang], ...Object.keys(item)]) if (item[l]) return item[l]
    return id
  })
}

/** Several localized texts joined by a localized separator. */
export const joined = (parts: Localized[], separator: Localized): Localized => perLang((lang) => parts.map((p) => p[lang]).join(separator[lang]))
