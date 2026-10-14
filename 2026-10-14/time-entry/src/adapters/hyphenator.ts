/**
 * ADAPTER — the Hyphenator port, with rules per language.
 * (Shared with the shift-ticket project; keep the two copies in step.)
 *
 * Inserts soft hyphens (U+00AD) where a word may break, so long words wrap at
 * the end of a syllable with a hyphen instead of being shrunk or cut
 * mid-syllable. <Fit> applies it to every text that may take more than one line.
 *
 * Languages are entries of HYPHENATORS. Estonian, Russian and Finnish have
 * regular syllable rules and are implemented here. English spelling does not,
 * so English is left to the browser's dictionary (CSS `hyphens: auto`) and the
 * text is returned unchanged.
 *
 * To use a dictionary-based library instead, implement the Hyphenator port in
 * src/ports with it and pass that in main.tsx.
 */
import type { Hyphenator } from '../ports';

export const SHY = '\u00ad';

/** at least this many letters stay on each side of a break */
export const MIN_PART = 3

type Rule = (word: string) => number[] // break positions: index of the first letter of each new syllable

interface Language {
  /** letters that count as vowels */
  vowels: string
  /** letters that never start a line (they belong to the letter before) */
  clingsLeft?: string
  /** consonant pairs that stay together at the start of a syllable (foreign clusters) */
  keepTogether?: string[]
}

/**
 * Shared rule for languages with open, regular syllables:
 *   - a syllable has one vowel group (long vowels and diphthongs stay together)
 *   - a single consonant between vowels starts the next syllable:   ki-no
 *   - of several consonants only the last one does:                 seans-si, kont-rol-li-ja
 *   - at least three letters stay on each side of a break
 */
function openSyllables(lang: Language): Rule {
  const isVowel = (c: string) => lang.vowels.includes(c)
  return (word) => {
    const w = word.toLowerCase()
    const breaks: number[] = []
    let i = 0
    // skip to the end of the first vowel group
    while (i < w.length && !isVowel(w[i])) i++
    while (i < w.length) {
      while (i < w.length && isVowel(w[i])) i++
      const consStart = i
      while (i < w.length && !isVowel(w[i])) i++
      if (i >= w.length) break // trailing consonants belong to the last syllable
      const consEnd = i // w[consEnd] is a vowel
      if (consEnd === consStart) continue // vowel hiatus: left unbroken
      let at = consEnd - 1
      // three or more consonants ending in a cluster like "pr" / "tr": usually a compound (võistlus-programm)
      if (lang.keepTogether && at - 2 >= consStart && lang.keepTogether.includes(w.slice(at - 1, at + 1))) at--
      // letters like ь / ъ / й stay with the consonant before them
      while (at > consStart && lang.clingsLeft?.includes(w[at])) at++
      if (at >= consEnd) continue
      // never leave fewer than three letters on either side
      if (at >= MIN_PART && w.length - at >= MIN_PART) breaks.push(at)
    }
    return breaks
  }
}

const HYPHENATORS: Record<string, Rule> = {
  // Estonian: täishäälikud a e i o u õ ä ö ü; välte and compound boundaries are not detected
  et: openSyllables({ vowels: 'aeiouõäöü', keepTogether: ['pr', 'tr', 'kr', 'br', 'dr', 'gr', 'fr', 'pl', 'kl'] }),
  // Russian: split before the last consonant; ь, ъ and й never start a part
  ru: openSyllables({ vowels: 'аеёиоуыэюя', clingsLeft: 'ьъй', keepTogether: ['пр', 'тр', 'кр', 'бр', 'др', 'гр', 'фр'] }),
  // Finnish follows the same pattern as Estonian
  fi: openSyllables({ vowels: 'aeiouyäö' }),
}

/** Languages hyphenated here; others fall back to the browser (CSS hyphens: auto). */
const knows = (lang: string | undefined) => Boolean(lang && Object.hasOwn(HYPHENATORS, lang.slice(0, 2)))

/**
 * Single words the rules get wrong. Written with "-" at every allowed break.
 * (Compounds are better handled by a stem in COMPOUND_STEMS below.)
 */
const EXCEPTIONS: Record<string, Record<string, string>> = {
  et: {
    väravaadmin: 'vä-ra-va-ad-min',
  },
}

/**
 * Compounds: the syllable rule cannot see where one word ends and the next
 * begins inside a compound, and gets "filmi|programm" wrong ("mip-rog").
 * These word stems mark such a seam: a long word is first split before a stem
 * it contains, then each part is hyphenated on its own.
 * Festival vocabulary; add stems as they turn up.
 */
const COMPOUND_STEMS: Record<string, string[]> = {
  et: ['programm', 'festival', 'linastus', 'võistlus', 'korraldaja', 'teenindaja', 'koordinaator', 'keskus', 'film', 'saal', 'maja', 'admin'],
}

const WORD = /\p{L}+/gu
/** shorter words are never broken: "Kino Sõp-rus" reads worse than a smaller "Kino Sõprus" */
export const MIN_WORD = 9

/** Positions inside `word` where a compound stem starts, leaving at least MIN_PART letters on each side. */
function seams(word: string, stems: string[] | undefined): number[] {
  if (!stems) return []
  const w = word.toLowerCase()
  const out = new Set<number>()
  for (const stem of stems) {
    for (let at = w.indexOf(stem, MIN_PART); at !== -1; at = w.indexOf(stem, at + 1)) {
      if (w.length - at >= MIN_PART) out.add(at)
    }
  }
  return [...out].sort((a, b) => a - b)
}

const insert = (word: string, breaks: number[]) => {
  let res = ''
  let last = 0
  for (const b of breaks) {
    res += word.slice(last, b) + SHY
    last = b
  }
  return res + word.slice(last)
}

const cache = new Map<string, string>()

function hyphenate(text: string, lang: string | undefined): string {
  const code = lang?.slice(0, 2) ?? ''
  const rule = Object.hasOwn(HYPHENATORS, code) ? HYPHENATORS[code] : undefined
  if (!rule || text.includes(SHY)) return text
  const key = `${code}|${text}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const out = text.replace(WORD, (word) => {
    if (word.length < MIN_WORD) return word
    // words are data: "constructor" must not find Object's own
    const exceptions = EXCEPTIONS[code]
    const lower = word.toLowerCase()
    const fixed = exceptions && Object.hasOwn(exceptions, lower) ? exceptions[lower] : undefined
    if (fixed) {
      // keep the word's own capitalisation: copy letters, insert breaks
      let i = 0
      return [...fixed].map((c) => (c === '-' ? SHY : word[i++])).join('')
    }
    // compound seams first, then syllables inside each part
    const cuts = [0, ...seams(word, COMPOUND_STEMS[code]), word.length]
    const breaks: number[] = []
    for (let k = 0; k + 1 < cuts.length; k++) {
      const [from, to] = [cuts[k], cuts[k + 1]]
      if (from > 0) breaks.push(from)
      breaks.push(...rule(word.slice(from, to)).map((b) => from + b))
    }
    return breaks.length ? insert(word, breaks) : word
  })
  cache.set(key, out)
  return out
}

/** Removes soft hyphens again (for labels read by screen readers, tooltips, copy). */
export const unhyphenate = (text: string) => text.replaceAll(SHY, '')

export const ruleHyphenator: Hyphenator = { hyphenate, knows }
