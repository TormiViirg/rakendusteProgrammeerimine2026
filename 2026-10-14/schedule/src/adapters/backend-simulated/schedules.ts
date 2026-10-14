import type { BreakRecord, RoleRecord, ScreeningRecord, VenueRecord } from '../../tickets/registry'

type ShiftRecord = BreakRecord | RoleRecord | ScreeningRecord | VenueRecord

/** A schedule as the simulated backend stores it: typed records, so a typo here fails the build. */
export interface MockSchedule {
  shifts: ShiftRecord[]
}

/**
 * SIMULATED — the content of the reference mockups, as backend records.
 * (The mockups print "Pühapäev - 09.10.2026", a date that is not a Sunday;
 * these use the nearest real Sunday so weekdays can be derived from dates.)
 */
const SUN = '2026-10-11'
const MON = '2026-10-12'
const TUE = '2026-10-13'

/** Phone mockup "Üldine graafik". */
export const generalMock: MockSchedule = {
  shifts: [
    { id: 'g1', kind: 'role', arrival: `${SUN}T21:00`, start: `${SUN}T21:30`, end: `${MON}T00:50`, roleId: 'photographer', venueId: 'artis', hallId: 'artis-8', bcMin: 59 },
    { id: 'g2', kind: 'venue', arrival: `${SUN}T21:00`, start: `${SUN}T21:30`, end: `${MON}T00:50`, venueId: 'artis' },
  ],
}

const screening = (id: string, day: string, next: string, over: Partial<ScreeningRecord> = {}): ScreeningRecord => ({
  id,
  kind: 'screening',
  arrival: `${day}T21:00`,
  start: `${day}T21:30`,
  end: `${next}T00:50`,
  roleId: 'screening-manager',
  venueId: 'artis',
  hallId: 'artis-8',
  filmId: 'garin',
  filmPrefixId: 'press',
  audienceId: 'preregistered',
  ageRating: 18,
  programmeIds: ['debut', 'ooc', 'films'],
  subtitleIds: ['et', 'en', 'ru', 'sv', 'pa', 'zh', 'ja', 'uk', 'sgn'],
  durationMin: 108,
  gapMin: 108,
  bcMin: null,
  qaMin: 59,
  sessionCode: '020121',
  ...over,
})

/** Phone mockup "Piletimüüjate graafik". */
export const screeningMock: MockSchedule = {
  shifts: [
    screening('s1', SUN, MON),
    screening('s2', SUN, MON),
    screening('s3', MON, TUE, { arrival: `${MON}T11:00` }),
    screening('s4', MON, TUE),
  ],
}

// The subtitle list of the desktop mockups repeats itself to fill two lines.
const LONG_SUBS = ['et', 'en', 'ru', 'sv', 'pa', 'et', 'en', 'ru', 'sv', 'pa', 'zh', 'ja', 'uk', 'sgn', 'zh', 'ja']

/** Desktop mockup, 1440 × 1024: three screening tickets. The accent colour now follows the role. */
export const desktopMock: MockSchedule = {
  shifts: [
    screening('d1', SUN, SUN, {
      arrival: `${SUN}T10:00`, start: `${SUN}T10:30`, end: `${SUN}T11:45`, roleId: 'admin', filmPrefixId: undefined,
      programmeIds: ['shorts'], subtitleIds: LONG_SUBS, audienceId: 'free',
    }),
    screening('d2', SUN, SUN, {
      arrival: `${SUN}T12:00`, start: `${SUN}T12:30`, end: `${SUN}T16:45`, roleId: 'projectionist', filmPrefixId: undefined,
      programmeIds: ['shorts'], subtitleIds: LONG_SUBS, audienceId: 'public',
    }),
    screening('d3', SUN, MON, { end: `${MON}T01:45`, programmeIds: ['georgia'], subtitleIds: LONG_SUBS }),
  ],
}

/** Desktop mockups of the non-screening tickets: venue (a night shift, so weekdays and wolf prints appear), break, and a derived role ticket. */
export const desktopGeneralMock: MockSchedule = {
  shifts: [
    { id: 'w1', kind: 'venue', arrival: `${SUN}T12:00`, start: `${SUN}T12:30`, end: `${MON}T16:45`, venueId: 'artis' },
    { id: 'w2', kind: 'break', start: `${SUN}T12:30`, end: `${SUN}T13:00`, breakId: 'rest', noteId: 'playful' },
    { id: 'w3', kind: 'role', arrival: `${SUN}T21:00`, start: `${SUN}T21:30`, end: `${MON}T00:50`, roleId: 'photographer', venueId: 'artis', hallId: 'artis-8', bcMin: 59 },
    { id: 'w4', kind: 'venue', arrival: `${SUN}T09:00`, start: `${SUN}T09:30`, end: `${SUN}T13:00`, venueId: 'soprus' },
  ],
}

/**
 * One ticket per position, so every role colour shows, with a spread of what
 * a ticket may carry (subtitles or not, BC / Q&A or not, day and night).
 */
export const mixedMock: MockSchedule = {
  shifts: [
    screening('m1', SUN, SUN, { arrival: `${SUN}T10:00`, start: `${SUN}T10:30`, end: `${SUN}T12:40`, roleId: 'screening-manager', subtitleIds: LONG_SUBS }),
    screening('m2', SUN, SUN, { arrival: `${SUN}T10:10`, start: `${SUN}T10:30`, end: `${SUN}T12:40`, roleId: 'projectionist', subtitleIds: undefined, filmPrefixId: undefined }),
    screening('m3', SUN, SUN, { arrival: `${SUN}T10:20`, start: `${SUN}T10:30`, end: `${SUN}T12:40`, roleId: 'viewer', programmeIds: ['shorts'], subtitleIds: ['et', 'en'] }),
    screening('m4', SUN, SUN, { arrival: `${SUN}T10:25`, start: `${SUN}T10:30`, end: `${SUN}T12:40`, roleId: 'admin', audienceId: 'free', bcMin: null, qaMin: null }),
    screening('m5', SUN, SUN, { arrival: `${SUN}T14:00`, start: `${SUN}T14:30`, end: `${SUN}T16:20`, venueId: 'soprus', hallId: 'soprus-big', roleId: 'ticket-seller', audienceId: 'school', ageRating: 6 }),
    screening('m6', SUN, SUN, { arrival: `${SUN}T14:10`, start: `${SUN}T14:30`, end: `${SUN}T16:20`, venueId: 'soprus', hallId: 'soprus-big', roleId: 'checker', audienceId: 'school', ageRating: 6, subtitleIds: ['et'] }),
    // night shifts
    screening('m7', SUN, MON, { end: `${MON}T01:45`, venueId: 'coca-cola-plaza', hallId: 'ccp-11', roleId: 'gate', programmeIds: ['georgia'], subtitleIds: LONG_SUBS }),
    screening('m8', SUN, MON, { arrival: `${SUN}T20:45`, end: `${MON}T01:45`, venueId: 'coca-cola-plaza', hallId: 'ccp-11', roleId: 'gate-admin', programmeIds: ['georgia'], subtitleIds: LONG_SUBS }),
    // shifts without a film
    { id: 'm9', kind: 'role', arrival: `${SUN}T18:00`, start: `${SUN}T18:30`, end: `${SUN}T21:00`, roleId: 'black-carpet', venueId: 'alexela', bcMin: 30 },
    { id: 'm10', kind: 'role', arrival: `${SUN}T21:00`, start: `${SUN}T21:30`, end: `${MON}T00:50`, roleId: 'photographer', venueId: 'artis', hallId: 'artis-8', bcMin: 59 },
    { id: 'm11', kind: 'break', start: `${SUN}T12:45`, end: `${SUN}T13:15`, breakId: 'rest', noteId: 'playful' },
    screening('m14', MON, MON, { arrival: `${MON}T17:30`, start: `${MON}T18:00`, end: `${MON}T20:10`, venueId: 'soprus', hallId: 'soprus-big', roleId: 'screening-manager', ageRating: 16 }),
    { id: 'm12', kind: 'venue', arrival: `${MON}T21:00`, start: `${MON}T21:30`, end: `${TUE}T00:50`, venueId: 'soprus' },
    { id: 'm13', kind: 'venue', arrival: `${MON}T09:00`, start: `${MON}T09:30`, end: `${MON}T13:00`, venueId: 'artis' },
  ],
}
