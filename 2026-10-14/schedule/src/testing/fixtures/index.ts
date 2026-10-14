import type { HallFacts, VenueFacts } from '../../core/ports'
import { FILM_EDGES, HERO_EDGES, PHRASES, exact } from './texts'

/**
 * FIXTURES — the rows behind the test ids ("tc-…") the catalogue uses: lookup
 * rows, film titles, programme names, venue and hall facts. The catalogue is
 * self-contained: it never relies on the demo backend's data.
 *
 * Lookup rows are Estonian only, so the other languages also exercise the
 * fallback path. app/compose.ts adds everything here to the simulated backend
 * and the lookup adapter; the unit tests read it directly.
 */

const byLength = (prefix: string, source: string, lengths: number[]) => Object.fromEntries(lengths.map((n) => [`${prefix}-${n}`, exact(n, source)]))

const ADDRESS = 'Peetri 11, 10415 Tallinn'

export const FIXTURE_ROWS: Record<string, Record<string, string>> = {
  venue: {
    'tc-venue-1': 'A',
    ...byLength('tc-venue', PHRASES.venue, HERO_EDGES),
    'tc-venue-long': PHRASES.venue,
    'tc-venue-word': 'Rahvusvahelistefilmifestivalidekorraldustoimkonnakeskus',
    // cinemas the tables know by name only: no address, no entry text, no coordinates
    'tc-venue-bare': 'Kino Helios',
    'tc-venue-bare-long': 'Vabaõhukino Noblessneri sadamakail',
  },
  venueAddress: {
    'tc-venue-1': ADDRESS,
    ...Object.fromEntries(HERO_EDGES.map((n) => [`tc-venue-${n}`, ADDRESS])),
    'tc-venue-long': 'Peetri tänav 11a-27, Noblessneri sadamalinnak, Põhja-Tallinna linnaosa, 10415 Tallinn, Harju maakond, Eesti Vabariik',
    'tc-venue-word': 'Staapli3,Tallinn,10415,sissepääshoovipooltläbiteisekorrusegaleriijatrepikoja',
  },
  venueEntry: {
    'tc-venue-long':
      'Sissepääs sadama poolt läbi vana laevatehase värava; järgige festivali silte kuni teise hooneni, sealt trepist üles kolmandale korrusele ja läbi galerii vabatahtlike ruumi, mille uksel on hundikäpa märk.',
  },
  hall: {
    'tc-hallname-scape': 'Saal 11 (Scape)',
    // a decoy: the row under the hall's own id must NOT be the one shown
    'tc-hall-named': 'vale rida',
    'tc-hall-short': 'Suur saal',
    'tc-hall-long': 'Suur kinosaal koos rõdu ja lisatoolidega (sissepääs 2. korruselt)',
    'tc-hall-word': 'Kammersaalilisaruumikompleks',
  },
  role: {
    'tc-role-1': 'A',
    ...byLength('tc-role', PHRASES.role, HERO_EDGES),
    'tc-role-long': PHRASES.role,
    'tc-role-word': 'Filmikoopiatelogistikakoordinaatoriabiline',
  },
  audience: {
    'tc-audience-long': 'Ainult eelregistreerunud akrediteeritud ajakirjanikele, filmitööstuse esindajatele, žürii liikmetele ja festivali koostööpartnerite kutsutud külalistele',
    'tc-audience-word': 'Eelregistreerimiskohustusegaerilinastus',
  },
  break: {
    'tc-break-1': 'A',
    'tc-break-mid': 'Pikk taastumispaus',
    ...byLength('tc-break', PHRASES.break, HERO_EDGES),
    'tc-break-long': PHRASES.break,
    'tc-break-word': 'Öövahetusejärgnetaastumispausike',
  },
  breakNote: {
    'tc-note-long': 'Palun ärge lahkuge hoonest: järgmine vahetus algab kohe pärast pausi ja sissepääs suletakse täpselt õigel ajal',
    'tc-note-word': 'Vabatahtliketoaskohvijateepakutaksetasuta',
  },
  filmPrefix: {
    'tc-prefix-long': 'Rahvusvaheline esilinastus pressile ja filmitööstusele',
  },
}

type Translations = Record<string, string>

/** Changing content, by collection: film titles and programme names in the languages they exist in. */
export const FIXTURE_CONTENT: Record<string, Record<string, Translations>> = {
  films: {
    'tc-film-1': { et: 'Ö' },
    'tc-film-typical': { et: 'Insener Garini Hüperboloid', en: 'The Hyperboloid of Engineer Garin', ru: 'Гиперболоид инженера Гарина' },
    ...Object.fromEntries(FILM_EDGES.map((n) => [`tc-film-${n}`, { et: exact(n, PHRASES.film) }])),
    // translated into two of the three languages
    'tc-film-two-lines': {
      et: 'Kuidas ma õppisin muretsemise lõpetama ja pommi armastama: režissööriversioon',
      en: 'How I Learned to Stop Worrying and Love the Bomb: Director’s Cut',
    },
    'tc-film-long': { et: PHRASES.film },
    'tc-film-word': { et: 'Sünnipäevanädalalõpupeopärastlõunaväsimatusetus' },
    'tc-film-url': { en: 'https://poff.ee/films/2026/competition/first-feature/untitled_project_final_v7_FINAL' },
    // not in Estonian at all
    'tc-film-untranslated': { ru: 'Сталкер', en: 'Stalker' },
    // only in a language outside the interface languages and the fonts
    'tc-film-other-script': { ja: '羅生門' },
  },
  programmes: {
    'tc-prog-debut': { et: 'Debüütfilmide võistlusprogramm', en: 'First Feature Competition', ru: 'Конкурс дебютных фильмов' },
    'tc-prog-ooc': { et: 'Väljaspool võistlust', en: 'Out of Competition', ru: 'Вне конкурса' },
    'tc-prog-films': { et: 'Filmiprogramm', en: 'Film Programme', ru: 'Кинопрограмма' },
    'tc-prog-shorts': { et: 'Shorts filmiprogramm', en: 'Shorts film programme', ru: 'Программа короткометражек' },
    'tc-prog-main': { et: 'Põhivõistlusprogramm', en: 'Official Selection – Competition' },
    'tc-prog-baltic': { et: 'Balti filmide võistlusprogramm', en: 'Baltic Film Competition', ru: 'Конкурс балтийских фильмов' },
    'tc-prog-intl': { et: 'Rahvusvaheline esilinastus', en: 'International Premiere' },
    'tc-prog-english-only': { en: 'Flowers Are Not Silent. Independent Voices from Georgia: A Spotlight on Georgian Cinema - Film Program' },
    'tc-prog-long': { et: 'Kriitikute valik: rahvusvaheliste filmikriitikute ühenduse eriprogramm noortele režissööridele' },
    'tc-prog-word': { et: 'Lühifilmidevõistlusprogrammieriseanss' },
  },
}

const NOBLESSNER = { lat: 59.4524, lng: 24.7309 }

export const FIXTURE_VENUES: Record<string, VenueFacts> = {
  'tc-venue-1': NOBLESSNER,
  ...Object.fromEntries(HERO_EDGES.map((n) => [`tc-venue-${n}`, NOBLESSNER])),
  'tc-venue-long': NOBLESSNER,
  'tc-venue-word': NOBLESSNER,
  'tc-venue-bare': {},
  'tc-venue-bare-long': {},
}

/** Halls by number (the pattern "Saal {{n}}") and by name (a row of the `hall` table). */
export const FIXTURE_HALLS: Record<string, HallFacts> = {
  // test halls belong to no cinema in particular, so every hall class can meet every cinema class
  'tc-hall-8': { number: 8 },
  'tc-hall-1': { number: 1 },
  'tc-hall-999': { number: 999 },
  // the name is a row under another key than the hall's id, as in the real tables
  'tc-hall-named': { nameKey: 'tc-hallname-scape' },
  'tc-hall-short': { nameKey: 'tc-hall-short' },
  'tc-hall-long': { nameKey: 'tc-hall-long' },
  'tc-hall-word': { nameKey: 'tc-hall-word' },
  // a hall of a cinema no test shift is ever at
  'tc-hall-elsewhere': { venueId: 'tc-venue-elsewhere', number: 3 },
}
