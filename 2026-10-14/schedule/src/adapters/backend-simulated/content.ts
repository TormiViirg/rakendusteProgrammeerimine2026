/**
 * SIMULATED — frequently changing, translated content: film titles and
 * programme names. In production this is the CMS / festival database, queried
 * per language. Not every row is translated into every language — the API
 * falls back.
 */
export type Translations = Partial<Record<string, string>>

export const FILMS: Record<string, Translations> = {
  garin: {
    et: 'Insener Garini Hüperboloid',
    en: 'The Hyperboloid of Engineer Garin',
    ru: 'Гиперболоид инженера Гарина',
  },
  strangelove: {
    et: 'Kuidas ma õppisin muretsemise lõpetama ja pommi armastama: režissööriversioon',
    en: 'How I Learned to Stop Worrying and Love the Bomb: Director’s Cut',
  },
  o: { et: 'Ö' },
  rashomon: { ja: '羅生門' },
  stalker: { ru: 'Сталкер', en: 'Stalker' },
}

export const PROGRAMMES: Record<string, Translations> = {
  debut: { et: 'Debüütfilmide võistlusprogramm', en: 'First Feature Competition', ru: 'Конкурс дебютных фильмов' },
  ooc: { et: 'Väljaspool võistlust', en: 'Out of Competition', ru: 'Вне конкурса' },
  films: { et: 'Filmiprogramm', en: 'Film Programme', ru: 'Кинопрограмма' },
  main: { et: 'Põhivõistlusprogramm', en: 'Official Selection – Competition' },
  baltic: { et: 'Balti filmide võistlusprogramm', en: 'Baltic Film Competition', ru: 'Конкурс балтийских фильмов' },
  intl: { et: 'Rahvusvaheline esilinastus', en: 'International Premiere' },
  special: { et: 'Erilinastus', en: 'Special Screening', ru: 'Специальный показ' },
  shorts: { et: 'Shorts filmiprogramm', en: 'Shorts film programme', ru: 'Программа короткометражек' },
  georgia: { en: 'Flowers Are Not Silent. Independent Voices from Georgia: A Spotlight on Georgian Cinema - Film Program' },
  classics: { et: 'Klassika', en: 'Classics', ru: 'Классика' },
}
