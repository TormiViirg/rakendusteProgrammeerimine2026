import type { Lookup } from '../ports'

/**
 * THE FIXED CAPTIONS printed on the tickets and the page — the one list.
 * `CaptionKey` and `Captions` follow from it, and the unit tests check that
 * every locale file has every key (tests/adapters/lookup.test.ts).
 *
 * A view that needs a new caption: add the key here and the text to the three
 * files in src/locales.
 */
export const CAPTION_KEYS = [
  'myShifts',
  'arrival',
  'shift',
  'breakDuration',
  'audience',
  'film',
  'subtitles',
  'duration',
  /** two-line form; may contain a soft hyphen where it may break */
  'gap',
  /** one-line form with its colon */
  'gapLine',
  'bc',
  'qa',
  'sessionCode',
  'map',
  'help',
  'loading',
  'loadFailed',
  'empty',
  'listSeparator',
  'programmeSeparator',
  'place',
  'hallLabel',
  'addressLabel',
  'entryLabel',
  'close',
  'showAll',
  'mapUnavailable',
] as const

export type CaptionKey = (typeof CAPTION_KEYS)[number]

/** The captions, resolved once per language and handed to the views. */
export type Captions = Readonly<Record<CaptionKey, string>>

/** Captions that are rows of the `category` lookup table rather than `ui` texts. */
export const CATEGORY_CAPTIONS: Partial<Record<CaptionKey, string>> = { bc: 'bc', qa: 'qa', sessionCode: 'sessionCode' }

export function buildCaptions(lookup: Lookup): Captions {
  const out = {} as Record<CaptionKey, string>
  for (const key of CAPTION_KEYS) out[key] = lookup.caption(key)
  return out
}
