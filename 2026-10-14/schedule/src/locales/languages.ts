/** The interface languages, and which to try, in order, when a text is missing in the one asked for. */
export const LANGS = ['et', 'en', 'ru'] as const
export type Lang = (typeof LANGS)[number]

export const FALLBACK: Record<Lang, Lang[]> = { et: ['en'], en: ['et'], ru: ['en', 'et'] }

export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v)
