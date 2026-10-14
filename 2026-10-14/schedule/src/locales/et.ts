/**
 * Estonian — the source language.
 *
 * `ui`  : fixed captions that ship with the frontend.
 * `lut` : values with a limited set of options. These mirror lookup tables in
 *         the database (one row per id, one column per language); records only
 *         carry the id. Kept in the bundle because they rarely change.
 *
 * Frequently changing content (film titles, programmes) is NOT here — see
 * adapters/backend-simulated/content.ts.
 */
export const et = {
  ui: {
    myShifts: 'Minu vahetused:',
    arrival: 'Kohaloleku aeg:',
    shift: 'Vahetuse kestus:',
    breakDuration: 'Pausi kestus:',
    audience: 'Publik:',
    film: 'Film:',
    subtitles: 'Subtiitrid:',
    duration: 'Kestab:',
    // soft hyphen marks where the two-line caption may break
    gap: 'Seansside vahe­line aeg',
    // the same caption on one line, with its colon (wide tickets)
    gapLine: 'Seansside vaheline aeg:',
    map: 'Ava kaart',
    help: 'Lisainfo',
    place: 'Asukoht',
    hallLabel: 'Saal:',
    addressLabel: 'Aadress:',
    entryLabel: 'Sissepääs:',
    close: 'Sulge',
    showAll: 'Näita kogu teksti',
    mapUnavailable: 'Kaarti ei saanud laadida',
    loading: 'Laen vahetusi…',
    empty: 'Vahetusi ei ole.',
    dayHeader: '{{weekday}} - {{date}}',
    filmWithPrefix: '{{prefix}} / {{title}}',
    hallNumbered: 'Saal {{n}}',
    listSeparator: ', ',
    programmeSeparator: ' - ',
    notShown: '{{count}} vahetust ei saanud kuvada',
    loadFailed: 'Vahetusi ei saanud laadida',
  },
  lut: {
    category: { bc: 'BC:', qa: 'Q&A:', sessionCode: 'Seansi kood:' },
    unit: { min: 'min' },
    weekday: {
      '0': 'pühapäev',
      '1': 'esmaspäev',
      '2': 'teisipäev',
      '3': 'kolmapäev',
      '4': 'neljapäev',
      '5': 'reede',
      '6': 'laupäev',
    },
    venue: {
      artis: 'Kino Artis',
      'coca-cola-plaza': 'Apollo Kino Coca-Cola Plaza',
      soprus: 'Kino Sõprus',
      'nordic-forum': 'Nordic Hotel Forum konverentsikeskus',
      'alexela': 'Alexela kontserdimaja',
    },
    /** cinema addresses, written out */
    venueAddress: {
      artis: 'Estonia pst 9, 10143 Tallinn',
      'coca-cola-plaza': 'Hobujaama 5, 10151 Tallinn',
      soprus: 'Vana-Posti 8, 10146 Tallinn',
      'nordic-forum': 'Viru väljak 3, 10111 Tallinn',
      alexela: 'Estonia pst 9, 10143 Tallinn',
    },
    /** how to get into the building — EXAMPLE texts, replace with the real instructions */
    venueEntry: {
      artis: 'Sissepääs Solarise keskuse peauksest, liftiga 2. korrusele. Vabatahtlike kogunemine kino kassa ees.',
      'coca-cola-plaza': 'Sissepääs Hobujaama tänava poolsest peauksest. Vabatahtlike laud on fuajees vasakul.',
      soprus: 'Sissepääs Vana-Posti tänavalt sammaste vahelt. Uks avatakse 45 minutit enne esimest seanssi.',
      'nordic-forum': 'Sissepääs Narva maantee poolsest küljest, konverentsikeskus on 2. korrusel.',
      alexela: 'Sissepääs Solarise keskuse kaudu, kontserdimaja uksed on 3. korrusel.',
    },
    hall: {
      scape: 'Saal 11 (Scape)',
      big: 'Suur saal',
      conference: 'Konverentsisaal',
    },
    role: {
      photographer: 'Fotograaf',
      'screening-manager': 'Seansikorraldaja',
      'ticket-checker': 'Piletikontrolör-saaliteenindaja',
      'hall-guard': 'Saalivalvur',
      'guest-coordinator-assistant': 'Külaliste vastuvõtu koordinaatori assistent',
      'info-desk': 'Infoleti teenindaja',
      'ticket-seller': 'Piletimüüja',
      driver: 'Autojuht',
      checker: 'Kontrollija',
      viewer: 'Vaataja',
      'black-carpet': 'Black Carpet',
      gate: 'Värav',
      admin: 'Admin',
      'gate-admin': 'Väravaadmin',
      projectionist: 'Projektsionist',
    },
    audience: {
      preregistered: 'Eelregistreerimisega (kaelakaardiga)',
      public: 'Piletiga',
      invited: 'Kutsetega erilinastus koostööpartneritele ja žüriile',
      press: 'Press ja filmitööstus',
      school: 'Koolilinastus',
      free: 'Tasuta seanss',
    },
    subtitle: {
      et: 'eesti',
      en: 'inglise',
      ru: 'vene',
      sv: 'rootsi',
      pa: 'punjabi',
      zh: 'mandariini',
      ja: 'jaapani',
      uk: 'ukraina',
      sgn: 'viipekeel',
      fi: 'soome',
      lv: 'läti',
      lt: 'leedu',
      de: 'saksa',
      fr: 'prantsuse',
      es: 'hispaania',
      ad: 'kirjeldustõlge',
    },
    break: { rest: 'Puhke paus', lunch: 'Lõunapaus' },
    breakNote: { playful: 'Tehke midagi lapsikut :)', eat: 'Söök on vabatahtlike toas' },
    filmPrefix: { press: 'Press', industry: 'Industry', premiere: 'Esilinastus' },
  },
}

export type Resources = typeof et
