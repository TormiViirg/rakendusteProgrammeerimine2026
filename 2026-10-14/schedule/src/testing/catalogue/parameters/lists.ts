import { contentText, joined, rowText, uiText } from '../../fixtures/expected'
import { absent, field, is, present, type FieldClass } from '../define'
import type { Expectation, Parameter } from '../types'

/**
 * LISTS — several values shown joined. What matters is how many there are:
 * none (the part disappears), one (no separator), two (the first separator),
 * as many as fit, and more than fit (cut, with the animated dots) — and
 * whether it is a list of ids at all.
 */

type Ids = unknown

const notAList = (problemFor: string): FieldClass<Ids>[] => [
  { id: 'not-a-list', about: `one ${problemFor} sent bare, not in a list`, validity: 'invalid', problem: 'missing', value: 'et', expect: () => [] },
  {
    id: 'not-ids',
    about: 'a list whose entries are not ids',
    validity: 'invalid',
    problem: 'missing',
    value: [1, 2],
    edges: [
      { id: 'one-bad-entry', about: 'a single entry that is not an id spoils the list', value: ['et', null] },
      { id: 'empty-entry', about: 'an empty text among the ids', value: ['et', ''] },
    ],
    expect: () => [],
  },
]

const SUBTITLES_MOCKUP = ['et', 'en', 'ru', 'sv', 'pa', 'zh', 'ja', 'uk', 'sgn']
const SUBTITLES_ALL = ['et', 'en', 'ru', 'sv', 'fi', 'lv', 'lt', 'de', 'fr', 'es', 'zh', 'ja', 'uk', 'pa', 'sgn', 'ad']

const subtitleLine = (ids: Ids): Expectation[] => [
  present('subtitles'),
  is(
    'subtitleList',
    joined(
      (ids as string[]).map((id) => rowText('subtitle', id)),
      uiText('listSeparator'),
    ),
  ),
]

/** Subtitle languages (lookup ids). Optional: without any, the whole row is gone and its room is handed out. */
export const subtitles: Parameter = field<Ids>('subtitleIds', {
  id: 'subtitles',
  about: 'subtitle languages (list of lookup ids, optional)',
  base: 'several',
  expect: subtitleLine,
  classes: [
    {
      id: 'none',
      about: 'no subtitles: the row is not shown',
      value: [],
      edges: [
        { id: 'field-absent', about: 'the field is left out altogether', value: undefined },
        { id: 'null', about: 'explicitly empty', value: null },
      ],
      expect: () => [absent('subtitles')],
    },
    { id: 'one', about: 'a single language: no separator', value: ['et'], edges: [{ id: 'two', about: 'the first separator', value: ['et', 'en'] }] },
    { id: 'several', about: "the mockup's nine: fills the two lines on the phone", value: SUBTITLES_MOCKUP },
    { id: 'more-than-fit', about: 'more than the lines hold: cut, with the animated dots', value: [...SUBTITLES_ALL, ...SUBTITLES_ALL.slice(0, 8)] },
    {
      id: 'unknown-language',
      about: 'a language code without a row: shown as the raw code, with a warning',
      validity: 'degraded',
      problem: 'unknown-id',
      value: ['et', 'xx'],
      edges: [{ id: 'object-members', about: 'codes that are names every object has', value: ['constructor', '__proto__', 'et'] }],
    },
    ...notAList('language'),
  ],
})

const programmeLine = (ids: Ids): Expectation[] => [
  is(
    'programme',
    joined(
      (ids as string[]).map((id) => contentText('programmes', id)),
      uiText('programmeSeparator'),
    ),
  ),
]

/** Programmes (categories) of the film — changing content, fetched per language. At least one. */
export const programmes: Parameter = field<Ids>('programmeIds', {
  id: 'programmes',
  about: 'programmes the film belongs to (list of content ids, at least one)',
  base: 'several',
  expect: programmeLine,
  classes: [
    {
      id: 'one',
      about: 'a single programme: no separator',
      value: ['tc-prog-shorts'],
      edges: [
        { id: 'one-long', about: 'a single programme with a very long name, in English only', value: ['tc-prog-english-only'] },
        { id: 'one-unbreakable', about: 'a single programme that is one long word', value: ['tc-prog-word'] },
        { id: 'two', about: 'the first separator', value: ['tc-prog-debut', 'tc-prog-ooc'] },
      ],
    },
    { id: 'several', about: "the mockup's three: one line on the phone", value: ['tc-prog-debut', 'tc-prog-ooc', 'tc-prog-films'] },
    {
      id: 'more-than-fit',
      about: 'more than the line holds: more lines if the ticket has room, then cut with the animated dots',
      value: ['tc-prog-main', 'tc-prog-baltic', 'tc-prog-intl', 'tc-prog-shorts', 'tc-prog-films', 'tc-prog-long'],
    },
    {
      id: 'unknown-programme',
      about: 'an id the content store does not know: shown as the raw id, with a warning',
      validity: 'degraded',
      problem: 'unknown-id',
      value: ['tc-prog-debut', 'no-such-programme'],
      edges: [{ id: 'object-members', about: 'ids that are names every object has', value: ['constructor', '__proto__', 'tc-prog-debut'] }],
    },
    { id: 'none', about: 'no programme: a film always belongs to at least one', validity: 'invalid', problem: 'empty-list', value: [], expect: () => [] },
    { id: 'absent', about: 'the field is left out', validity: 'invalid', problem: 'missing', value: undefined, edges: [{ id: 'null', about: 'explicitly empty', value: null }], expect: () => [] },
    ...notAList('programme'),
  ],
})
