import { describe, expect, it } from 'vitest'
import { MIN_PART, MIN_WORD, SHY, ruleHyphenator, unhyphenate } from '../../src/adapters/hyphenation/rules'

const { hyphenate, knows } = ruleHyphenator
const parts = (text: string, lang = 'et') => hyphenate(text, lang).split(SHY)

describe('the rule-based hyphenator', () => {
  it('which languages have rules', () => {
    expect(['et', 'ru', 'fi', 'et-EE'].map(knows)).toEqual([true, true, true, true])
    expect(['en', 'de', '', undefined].map(knows)).toEqual([false, false, false, false])
  })

  it('a language without rules is returned unchanged (the browser hyphenates it)', () => {
    expect(hyphenate('internationalisation', 'en')).toBe('internationalisation')
    expect(hyphenate('Seansikorraldaja', undefined)).toBe('Seansikorraldaja')
  })

  describe('word length — shorter words are never broken', () => {
    // classes: below MIN_WORD (left whole) · MIN_WORD and longer (may break); boundary on both sides
    const word = (n: number) => 'kalakalakalakalakala'.slice(0, n)
    it(`${MIN_WORD - 1} letters: whole`, () => {
      expect(parts(word(MIN_WORD - 1))).toHaveLength(1)
    })
    it(`${MIN_WORD} letters: may break`, () => {
      expect(parts(word(MIN_WORD)).length).toBeGreaterThan(1)
    })
    it('"Kino Sõprus" stays whole', () => {
      expect(hyphenate('Kino Sõprus', 'et')).toBe('Kino Sõprus')
    })
  })

  it(`never leaves fewer than ${MIN_PART} letters at either end of a word`, () => {
    for (const w of ['Filmifestival', 'Rahvusvaheline', 'konverentsikeskus', 'Audiovisuaalkultuuri', 'Гиперболоид', 'инженера', 'короткометражек']) {
      const p = parts(w, /[а-я]/i.test(w) ? 'ru' : 'et')
      expect(p[0].length, w).toBeGreaterThanOrEqual(MIN_PART)
      expect(p[p.length - 1].length, w).toBeGreaterThanOrEqual(MIN_PART)
    }
  })

  it('Estonian: a single consonant starts the next syllable; of several only the last', () => {
    expect(parts('Rahvusvaheline').join('-')).toBe('Rah-vus-va-he-line')
    expect(parts('Projektsionist').join('-')).toBe('Pro-jekt-sio-nist')
  })

  it('Estonian compounds are split at the seam first: never "Filmip-rogramm"', () => {
    expect(parts('Filmiprogramm').join('-')).toBe('Filmi-prog-ramm')
    expect(parts('eriprogramm').join('-')).toBe('eri-prog-ramm')
    expect(parts('Seansikorraldaja').join('-')).toBe('Seansi-kor-ral-daja')
    expect(parts('konverentsikeskus').join('-')).toBe('kon-ve-rentsi-kes-kus')
    // a stem at the very start of a word is not a seam
    expect(parts('Filmifestivalide')[0]).toBe('Filmi')
    expect(parts('administraator')[0]).toBe('admi')
  })

  it('Estonian exceptions fix single words the rule would split wrongly, and keep the capitals', () => {
    expect(parts('Väravaadmin').join('-')).toBe('Vä-ra-va-ad-min')
  })

  it('Russian: ь, ъ and й never start a part', () => {
    for (const w of ['Специальный', 'короткометражек', 'подъездной', 'больший']) {
      for (const p of parts(w, 'ru').slice(1)) expect('ьъй'.includes(p[0].toLowerCase()), `${w}: ${p}`).toBe(false)
    }
  })

  it('only letters are touched: numbers, punctuation and spaces stay where they are', () => {
    const text = 'Estonia pst 9, 10143 Tallinn — rahvusvaheline filmifestival!'
    expect(unhyphenate(hyphenate(text, 'et'))).toBe(text)
  })

  it('words are data: names every object has are hyphenated like any other word', () => {
    for (const word of ['constructor', 'toString', 'hasOwnProperty', 'valueOf', '__proto__', 'prototype'])
      for (const lang of ['et', 'ru', 'fi', 'en', 'constructor', '__proto__']) expect(unhyphenate(ruleHyphenator.hyphenate(word, lang)), `${word} in ${lang}`).toBe(word)
    expect(ruleHyphenator.knows('constructor')).toBe(false)
  })

  it('text that already has soft hyphens is left alone', () => {
    const marked = `Seansside vahe${SHY}line aeg`
    expect(hyphenate(marked, 'et')).toBe(marked)
  })

  it('is stable: hyphenating twice changes nothing more', () => {
    const once = hyphenate('Rahvusvaheliste külaliste transpordi korraldus', 'et')
    expect(hyphenate(once, 'et')).toBe(once)
  })
})
