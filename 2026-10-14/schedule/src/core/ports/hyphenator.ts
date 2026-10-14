/**
 * PORT — syllable breaks. Returns the text with soft hyphens (U+00AD) where a
 * word may break; a language without rules is returned unchanged.
 * adapters/hyphenation implements it with rules per language.
 */
export interface Hyphenator {
  hyphenate(text: string, lang: string | undefined): string
  /** false: leave it to the browser's dictionary (CSS `hyphens: auto`) */
  knows(lang: string | undefined): boolean
}
