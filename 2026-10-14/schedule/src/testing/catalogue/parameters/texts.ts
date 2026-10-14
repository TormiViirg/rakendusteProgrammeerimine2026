import { FILM_TIERS, HERO_TIERS, type SizeTier } from '../../../design/fit'
import { ROLE_TONES } from '../../../design/tones'
import { color } from '../../../design/tokens/shared'
import { contentText, hasRow, patternText, rowText } from '../../fixtures/expected'
import { FILM_EDGES, HERO_EDGES, tierOf } from '../../fixtures/texts'
import { absent, field, has, is, isWhenDrawn, present, type Edge, type FieldClass } from '../define'
import type { Expectation, Parameter } from '../types'

/**
 * TEXTS — values that arrive as an id and are shown as text.
 *
 * What cuts text into classes is how the tickets treat it:
 *   • LENGTH, where a field starts smaller for longer text (the tiers in
 *     design/fit.ts) — the boundaries are the character counts on both sides
 *     of each tier change, read from the tiers themselves;
 *   • SHAPE — a phrase wraps at spaces, a single long word can only break at
 *     syllables or be cut;
 *   • whether the id is KNOWN, and whether it is an id at all.
 *
 * Every class expects the ticket to show the text of the row — as the
 * catalogue reads it from the locale files and fixtures (fixtures/expected.ts).
 */

type Id = unknown

/** An id without a row: the raw id is shown, with a warning. */
const unknown = (what: string): FieldClass<Id> => ({
  id: 'unknown',
  about: `an id the ${what} table has no row for: the raw id is shown, with a warning`,
  validity: 'degraded',
  problem: 'unknown-id',
  value: 'no-such-row',
  edges: [
    // ids are data: these must be looked up as plain keys, and found missing
    { id: 'object-member', about: 'the name of something every object has', value: 'constructor' },
    { id: 'prototype', about: 'the key that reaches an object\'s prototype', value: '__proto__' },
    { id: 'path-like', about: 'looks like a path into the tables', value: 'venue.artis' },
  ],
})

/** Not an id: the shift cannot be drawn. */
const notAnId = (what: string): FieldClass<Id> => ({
  id: 'absent',
  about: `no ${what} given, or not as text`,
  validity: 'invalid',
  problem: 'missing',
  value: undefined,
  edges: [
    { id: 'null', about: 'explicitly empty', value: null },
    { id: 'empty', about: 'an empty text', value: '' },
    { id: 'blank', about: 'only spaces', value: '   ' },
    { id: 'number', about: 'a number where an id belongs', value: 42 },
  ],
  expect: () => [],
})

/** For an optional id: given, but not as text. */
const wrongType = (what: string): FieldClass<Id> => ({
  id: 'wrong-type',
  about: `the ${what} is given, but not as text`,
  validity: 'invalid',
  problem: 'missing',
  value: 42,
  edges: [{ id: 'empty', about: 'an empty text is not "none"', value: '' }],
  expect: () => [],
})

const unbreakable = (id: string): FieldClass<Id> => ({ id: 'unbreakable', about: 'one very long word: it can break at syllables only, or be cut', value: id })

/**
 * Classes by length for a text that is set as a 36 pt headline somewhere
 * (role, cinema, break): one class per tier, edges at the tier changes.
 * Throws if a value is not as long as its class says — the catalogue checks itself.
 */
function byTier(table: string, tiers: SizeTier[], edges: number[], prefix: string, real: Record<number, { id: string; edges?: Edge<Id>[] }>): FieldClass<Id>[] {
  const lengthOf = (id: string) => {
    if (!hasRow(table, id)) throw new Error(`catalogue: no text for ${table} "${id}"`)
    return rowText(table, id).et.length
  }
  const names = ['full-size', 'one-step-smaller', 'two-steps-smaller']
  return tiers.map((tier, i) => {
    const from = i === 0 ? 1 : tiers[i - 1].upToChars + 1
    const to = tier.upToChars
    const range = Number.isFinite(to) ? `${from}–${to} characters` : `${from} characters and more`
    const lengths = edges.filter((n) => n >= from && n <= to)
    const spec: FieldClass<Id> = {
      id: names[tier.stepsDown] ?? `tier-${tier.stepsDown}`,
      about: tier.stepsDown === 0 ? `${range}: starts at full size` : `${range}: starts ${tier.stepsDown} step${tier.stepsDown > 1 ? 's' : ''} smaller`,
      value: real[tier.stepsDown].id,
      edges: [
        ...lengths.map((n) => ({ id: `${n}-characters`, about: n === from ? 'the shortest text of the class' : 'the longest text of the class', value: `${prefix}-${n}` })),
        ...(real[tier.stepsDown].edges ?? []),
      ],
    }
    for (const id of [spec.value, ...spec.edges!.map((e) => e.value)] as string[]) {
      const n = lengthOf(id)
      if (tierOf(tiers, n) !== tier.stepsDown) throw new Error(`catalogue: ${table} "${id}" has ${n} characters, which is not in class "${spec.id}" (${range})`)
    }
    return spec
  })
}

const shows = (slot: string, table: string) => (id: Id): Expectation[] => [is(slot, rowText(table, String(id)))]

const address = (id: Id): Expectation[] => (hasRow('venueAddress', String(id)) ? [isWhenDrawn('address', rowText('venueAddress', String(id))), isWhenDrawn('caption', rowText('venueAddress', String(id)))] : [absent('address'), absent('caption')])

/** The cinema. Its address feeds the footer and the caption, so "no address" is a class of its own. */
export const venue: Parameter = field<Id>('venueId', {
  id: 'venue',
  about: 'the cinema (lookup id)',
  base: 'full-size',
  // the address is in the footer of some tickets and under the barcode of others, and other inputs
  // may leave no room for it: wherever it is drawn, it is this cinema's
  expect: (id) => [...shows('venue', 'venue')(id), present('locate'), ...address(id)],
  classes: [
    ...byTier('venue', HERO_TIERS, HERO_EDGES, 'tc-venue', {
      0: { id: 'artis', edges: [{ id: 'one-character', about: 'the shortest possible name', value: 'tc-venue-1' }] },
      1: { id: 'coca-cola-plaza' },
      2: { id: 'nordic-forum', edges: [{ id: 'long-phrase', about: 'a whole sentence of a name, with a long address', value: 'tc-venue-long' }] },
    }),
    unbreakable('tc-venue-word'),
    {
      id: 'no-address',
      about: 'a cinema known by name only: no address, no entry text, no coordinates',
      value: 'tc-venue-bare',
      edges: [{ id: 'long-name', about: 'the same with a long name', value: 'tc-venue-bare-long' }],
      expect: (id) => [...shows('venue', 'venue')(id), present('locate'), absent('address'), absent('caption')],
    },
    unknown('venue'),
    notAnId('cinema'),
  ],
})

/** The accent colour a role must give its ticket — read from the table directly. */
const toneFor = (id: Id): string => (typeof id === 'string' && Object.hasOwn(ROLE_TONES, id) ? ROLE_TONES[id] : color.ink)

/** The position. It also picks the ticket's accent colour. */
export const role: Parameter = field<Id>('roleId', {
  id: 'role',
  about: 'the position (lookup id); also picks the accent colour',
  base: 'toned',
  expect: (id) => [...shows('role', 'role')(id), { tone: toneFor(id) }],
  classes: [
    {
      id: 'toned',
      about: 'a position with its own accent colour',
      value: 'screening-manager',
      edges: Object.keys(ROLE_TONES)
        .filter((id) => id !== 'screening-manager')
        .map((id) => ({ id, about: 'every colour of the table is drawn once', value: id })),
    },
    ...byTier('role', HERO_TIERS, HERO_EDGES, 'tc-role', {
      0: { id: 'photographer', edges: [{ id: 'one-character', about: 'the shortest possible name', value: 'tc-role-1' }] },
      1: { id: 'info-desk' },
      2: { id: 'guest-coordinator-assistant', edges: [{ id: 'long-phrase', about: 'a whole sentence of a title', value: 'tc-role-long' }] },
    }).map((c) => ({ ...c, about: `no colour of its own (black) · ${c.about}` })),
    unbreakable('tc-role-word'),
    unknown('role'),
    notAnId('position'),
  ],
})

const hallNumber = (n: number) => (): Expectation[] => [is('hall', patternText('hallNumbered', { n }))]

/** The hall. Numbered halls are composed ("Saal 8"); named ones are lookup rows. */
export const hall: Parameter = field<Id>('hallId', {
  id: 'hall',
  about: 'the hall (lookup id)',
  base: 'numbered',
  expect: shows('hall', 'hall'),
  classes: [
    {
      id: 'numbered',
      about: 'a numbered hall: "Saal 8"',
      value: 'tc-hall-8',
      expect: hallNumber(8),
    },
    { id: 'numbered-smallest', about: 'hall number 1: one digit', value: 'tc-hall-1', expect: hallNumber(1) },
    { id: 'numbered-widest', about: 'a three-digit hall number', value: 'tc-hall-999', expect: hallNumber(999) },
    {
      id: 'named',
      about: 'a hall with a name: a row of the hall table, under the key the hall names',
      value: 'tc-hall-named',
      edges: [{ id: 'short', about: 'a short name', value: 'tc-hall-short' }],
      expect: (id) => [is('hall', rowText('hall', id === 'tc-hall-named' ? 'tc-hallname-scape' : String(id)))],
    },
    { id: 'long-phrase', about: 'a name with a description', value: 'tc-hall-long' },
    unbreakable('tc-hall-word'),
    unknown('hall'),
    {
      id: 'other-cinema',
      about: 'a hall that belongs to another cinema than the shift\'s: shown as sent, with a warning',
      validity: 'degraded',
      problem: 'inconsistent',
      value: 'tc-hall-elsewhere',
      expect: hallNumber(3),
    },
    // which of the next three exist depends on the kind: a film needs a hall, a role shift may have none
    { id: 'none', about: 'no hall: the shift is for the whole cinema', value: undefined, edges: [{ id: 'null', about: 'explicitly empty', value: null }], expect: () => [absent('hall')] },
    wrongType('hall'),
    notAnId('hall'),
  ],
})

/** Who the screening is for. */
export const audience: Parameter = field<Id>('audienceId', {
  id: 'audience',
  about: 'audience type (lookup id)',
  base: 'typical',
  expect: shows('audience', 'audience'),
  classes: [
    { id: 'short', about: 'one or two words', value: 'free', edges: [{ id: 'one-word', about: 'a single word', value: 'school' }] },
    { id: 'typical', about: 'fits its two lines on the phone', value: 'preregistered' },
    { id: 'long-phrase', about: 'a sentence: wraps, shrinks, then is cut', value: 'invited', edges: [{ id: 'longest', about: 'far more than fits', value: 'tc-audience-long' }] },
    unbreakable('tc-audience-word'),
    unknown('audience'),
    notAnId('audience'),
  ],
})

/** What kind of pause — the break ticket's headline. */
export const breakTitle: Parameter = field<Id>('breakId', {
  id: 'breakTitle',
  about: 'kind of pause (lookup id)',
  base: 'full-size',
  expect: shows('title', 'break'),
  classes: [
    ...byTier('break', HERO_TIERS, HERO_EDGES, 'tc-break', {
      0: { id: 'rest', edges: [{ id: 'one-character', about: 'the shortest possible name', value: 'tc-break-1' }] },
      1: { id: 'tc-break-mid' },
      2: { id: 'tc-break-long' },
    }),
    unbreakable('tc-break-word'),
    unknown('break'),
    notAnId('kind of pause'),
  ],
})

/** The optional line under a break's barcode. */
export const breakNote: Parameter = field<Id>('noteId', {
  id: 'note',
  about: 'note under the barcode (optional lookup id)',
  base: 'typical',
  expect: shows('caption', 'breakNote'),
  classes: [
    { id: 'none', about: 'no note', value: undefined, edges: [{ id: 'null', about: 'explicitly empty', value: null }], expect: () => [absent('caption')] },
    { id: 'typical', about: 'a short line', value: 'playful' },
    { id: 'long-phrase', about: 'more than the line holds', value: 'tc-note-long' },
    unbreakable('tc-note-word'),
    unknown('note'),
    wrongType('note'),
  ],
})

/** "Press / " — the part of the film line the prefix accounts for, in each language. */
const prefixPart = (id: Id) => patternText('filmWithPrefix', { prefix: rowText('filmPrefix', String(id)), title: '' })

/** The optional marker before the film title: "Press / …". It counts towards the title's length. */
export const prefix: Parameter = field<Id>('filmPrefixId', {
  id: 'prefix',
  about: 'marker before the film title (optional lookup id)',
  base: 'none',
  expect: (id) => [has('film', prefixPart(id))],
  classes: [
    { id: 'none', about: 'no marker', value: undefined, edges: [{ id: 'null', about: 'explicitly empty', value: null }], expect: () => [] },
    { id: 'short', about: 'one word', value: 'press', edges: [{ id: 'longer-word', about: 'the longest of the real ones', value: 'premiere' }] },
    { id: 'long-phrase', about: 'a marker as long as a title', value: 'tc-prefix-long' },
    unknown('prefix'),
    wrongType('prefix'),
  ],
})

function filmClass(tier: number, spec: FieldClass<Id>): FieldClass<Id> {
  for (const id of [spec.value, ...(spec.edges ?? []).map((e) => e.value)] as string[]) {
    const n = contentText('films', id).et.length
    if (tierOf(FILM_TIERS, n) !== tier) throw new Error(`catalogue: film "${id}" has ${n} characters in Estonian, which is not in class "${spec.id}"`)
  }
  return spec
}

const [FILM_FULL_MAX, FILM_SMALL_MIN] = FILM_EDGES

/** The film title — changing content, fetched per language. */
export const film: Parameter = field<Id>('filmId', {
  id: 'film',
  about: 'the film (id into the content store)',
  base: 'full-size',
  // "contains": the prefix parameter owns the start of the line
  expect: (id) => [has('film', contentText('films', String(id)))],
  classes: [
    filmClass(0, {
      id: 'full-size',
      about: `1–${FILM_FULL_MAX} characters: starts at full size on the phone`,
      value: 'tc-film-typical',
      edges: [
        { id: 'one-character', about: 'the shortest possible title', value: 'tc-film-1' },
        { id: `${FILM_FULL_MAX}-characters`, about: 'the longest title of the class', value: `tc-film-${FILM_FULL_MAX}` },
      ],
    }),
    filmClass(1, {
      id: 'one-step-smaller',
      about: `${FILM_SMALL_MIN} characters and more: starts one step smaller on the phone`,
      value: 'tc-film-two-lines',
      edges: [
        { id: `${FILM_SMALL_MIN}-characters`, about: 'the shortest title of the class', value: `tc-film-${FILM_SMALL_MIN}` },
        { id: 'long-phrase', about: 'far more than fits', value: 'tc-film-long' },
      ],
    }),
    unbreakable('tc-film-word'),
    { id: 'no-spaces', about: 'a URL-like title: no spaces and no syllables to break at', value: 'tc-film-url' },
    {
      id: 'other-language',
      about: 'not translated into Estonian: shown in a fallback language',
      value: 'tc-film-untranslated',
      edges: [{ id: 'other-script', about: 'only in a language outside the interface languages and the fonts', value: 'tc-film-other-script' }],
    },
    { ...unknown('content'), about: 'an id the content store does not know: the raw id is shown, with a warning' },
    notAnId('film'),
  ],
})
