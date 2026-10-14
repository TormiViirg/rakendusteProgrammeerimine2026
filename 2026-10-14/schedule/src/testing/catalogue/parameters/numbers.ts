import type { ProblemCode } from '../../../core/ticket/problem'
import { AGE_RATING, GAP_DISPLAY_MAX, SESSION_CODE_LENGTH } from '../../../tickets/screening/record'
import { absent, field, is, type FieldClass } from '../define'
import type { Parameter, Validity } from '../types'

/**
 * NUMBERS — minutes, the age rating, the screening code.
 *
 * Two things cut numbers into classes here: VALIDITY (the smallest and largest
 * value that means something) and WIDTH (how many digits have to fit: the
 * strip and the footer are fixed, so 9 → 10 and 99 → 100 are boundaries of
 * their own).
 */

const digits = (id: string, about: string, value: number, min: number, max?: number): FieldClass<unknown> => ({
  id,
  about,
  value,
  edges: [
    { id: 'min', about: `the smallest ${id.replace('-', ' ')} value`, value: min },
    ...(max === undefined ? [] : [{ id: 'max', about: `the largest ${id.replace('-', ' ')} value`, value: max }]),
  ],
})

/** Values that are not a usable number, each a class of its own: they fail for different reasons. */
const notNumbers = (validity: Exclude<Validity, 'valid'>, negative: ProblemCode): FieldClass<unknown>[] => [
  { id: 'negative', about: 'below zero', validity, problem: negative, value: -5, edges: [{ id: 'max', about: 'the largest negative whole number', value: -1 }] },
  { id: 'fraction', about: 'not a whole number', validity, problem: 'bad-number', value: 12.5, edges: [{ id: 'just-above', about: 'the smallest step off a whole number that still prints differently', value: 1.5 }] },
  { id: 'text', about: 'digits sent as text', validity, problem: 'bad-number', value: '45' },
  { id: 'wrong-type', about: 'not a number at all', validity, problem: 'bad-number', value: true, edges: [{ id: 'list', about: 'a list holding the number', value: [108] }] },
]

const notDrawn = (c: FieldClass<unknown>): FieldClass<unknown> => ({ ...c, expect: () => [] })

/** Runtime of the film in minutes. Required; at least one minute. */
export const duration: Parameter = field<unknown>('durationMin', {
  id: 'duration',
  about: 'runtime of the film, minutes',
  base: 'three-digit',
  expect: (v) => [is('duration', String(v))],
  classes: [
    digits('one-digit', '1–9 minutes', 5, 1, 9),
    digits('two-digit', '10–99 minutes', 45, 10, 99),
    digits('three-digit', '100–999 minutes: what the strip is designed for', 108, 100, 999),
    digits('four-digit', '1000 minutes and more: longer than any film, and it must still stay inside the strip', 1234, 1000),
    notDrawn({ id: 'zero', about: 'a film of no length: just below the smallest valid value', validity: 'invalid', problem: 'bad-number', value: 0 }),
    ...notNumbers('invalid', 'bad-number').map(notDrawn),
    notDrawn({ id: 'absent', about: 'no runtime given', validity: 'invalid', problem: 'missing', value: undefined, edges: [{ id: 'null', about: 'explicitly empty', value: null }] }),
  ],
})

/** Minutes to the next screening. Required; 0 is a valid value; shown with at most three digits. */
export const gap: Parameter = field<unknown>('gapMin', {
  id: 'gap',
  about: 'time between screenings, minutes',
  base: 'three-digit',
  expect: (v) => [is('gap', String(Math.min(GAP_DISPLAY_MAX, v as number)))],
  classes: [
    { id: 'zero', about: 'the next screening starts right away: the smallest valid value', value: 0 },
    digits('one-digit', '1–9 minutes', 5, 1, 9),
    digits('two-digit', '10–99 minutes', 45, 10, 99),
    digits('three-digit', `100–${GAP_DISPLAY_MAX} minutes: the widest value shown as given`, 108, 100, GAP_DISPLAY_MAX),
    {
      id: 'over-cap',
      about: `more than ${GAP_DISPLAY_MAX}: shown as ${GAP_DISPLAY_MAX}`,
      value: 5000,
      edges: [{ id: 'min', about: 'the first value that is capped', value: GAP_DISPLAY_MAX + 1 }],
    },
    ...notNumbers('invalid', 'bad-number').map(notDrawn),
    notDrawn({ id: 'absent', about: 'no value given', validity: 'invalid', problem: 'missing', value: undefined, edges: [{ id: 'null', about: 'explicitly empty', value: null }] }),
  ],
})

/** BC / Q&A: optional minutes. Shown only with a valid value — a whole number of at least one minute. */
function optionalMinutes(id: 'bc' | 'qa', fieldName: string, about: string): Parameter {
  return field<unknown>(fieldName, {
    id,
    about,
    base: 'absent',
    expect: (v) => [is(id, String(v))],
    classes: [
      {
        id: 'absent',
        about: 'not given: the item is not shown at all',
        value: undefined,
        edges: [
          { id: 'null', about: 'explicitly empty', value: null },
          { id: 'zero', about: '0 minutes means there is none: the largest value that is not shown', value: 0 },
        ],
        expect: () => [absent(id)],
      },
      digits('one-digit', '1–9 minutes', 5, 1, 9),
      digits('two-digit', '10–99 minutes', 59, 10, 99),
      digits('three-digit', '100–999 minutes', 240, 100, 999),
      digits('four-digit', '1000 minutes and more: must still stay inside the footer', 1440, 1000),
      ...notNumbers('degraded', 'bad-number').map((c): FieldClass<unknown> => ({ ...c, about: `${c.about}: left out, with a warning`, expect: () => [absent(id)] })),
    ],
  })
}

export const bc = optionalMinutes('bc', 'bcMin', 'Black Carpet time, minutes (optional)')
export const qa = optionalMinutes('qa', 'qaMin', 'Q&A time, minutes (optional)')

/** Age rating: optional; a whole number that fits the badge. */
export const rating: Parameter = field<unknown>('ageRating', {
  id: 'rating',
  about: 'minimum age (optional)',
  base: 'two-digit',
  expect: (v) => [is('rating', `+${v}`)],
  classes: [
    {
      id: 'absent',
      about: 'no age limit: no badge',
      value: undefined,
      edges: [
        { id: 'null', about: 'explicitly empty', value: null },
        { id: 'zero', about: '0 means no limit: the largest value without a badge', value: 0 },
      ],
      expect: () => [absent('rating')],
    },
    digits('one-digit', `${AGE_RATING.min}–9: a single digit in the badge`, 6, AGE_RATING.min, 9),
    digits('two-digit', `10–${AGE_RATING.max}: the widest rating the badge holds`, 16, 10, AGE_RATING.max),
    {
      id: 'three-digit',
      about: 'a whole number too wide for the badge: no badge, with a warning',
      validity: 'degraded',
      problem: 'out-of-range',
      value: 120,
      edges: [{ id: 'min', about: 'the first value that is too wide', value: AGE_RATING.max + 1 }],
      expect: () => [absent('rating')],
    },
    // a negative whole number is "out of range"; the others are not whole numbers at all
    ...notNumbers('degraded', 'out-of-range').map((c): FieldClass<unknown> => ({ ...c, about: `${c.about}: no badge, with a warning`, expect: () => [absent('rating')] })),
  ],
})

/** The screening code: always the same length. */
export const code: Parameter = field<unknown>('sessionCode', {
  id: 'code',
  about: `screening code, always ${SESSION_CODE_LENGTH} characters`,
  base: 'standard',
  expect: (v) => [is('code', String(v))],
  classes: [
    {
      id: 'standard',
      about: `exactly ${SESSION_CODE_LENGTH} characters`,
      value: '020121',
      edges: [
        { id: 'all-zeros', about: 'the narrowest digits', value: '0'.repeat(SESSION_CODE_LENGTH) },
        { id: 'letters', about: 'letters are wider than digits', value: 'WM8QGX'.slice(0, SESSION_CODE_LENGTH) },
      ],
    },
    {
      id: 'too-short',
      about: 'fewer characters: shown, with a warning',
      validity: 'degraded',
      problem: 'wrong-length',
      value: '0201',
      edges: [
        { id: 'max', about: 'one character short', value: '02012'.slice(0, SESSION_CODE_LENGTH - 1) },
        { id: 'min', about: 'a single character', value: '7' },
      ],
    },
    {
      id: 'too-long',
      about: 'more characters: shown, with a warning',
      validity: 'degraded',
      problem: 'wrong-length',
      value: '020121-2026-A',
      edges: [{ id: 'min', about: 'one character too many', value: '0201210'.slice(0, SESSION_CODE_LENGTH + 1) }],
    },
    notDrawn({
      id: 'absent',
      about: 'no code: a screening always has one',
      validity: 'invalid',
      problem: 'missing',
      value: undefined,
      edges: [
        { id: 'empty', about: 'an empty text', value: '' },
        { id: 'blank', about: 'only spaces', value: '   ' },
        { id: 'number', about: 'the code sent as a number: its leading zeros are already lost', value: 20121 },
      ],
    }),
  ],
})
