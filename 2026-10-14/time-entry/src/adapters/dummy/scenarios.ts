/**
 * Dummy data. Each scenario is a complete backend answer and doubles as a
 * named test fixture (see tests/BOUNDARIES.md for what each one is for).
 * The generated boundary combinations live in generated.ts.
 *
 * Times are written as Tallinn wall-clock and converted to UTC here, the way
 * the admin screens will have done before the data reaches this app.
 * The whole dummy period lies in winter time (EET, UTC+2).
 */
import type { ScheduleDto } from './dto';
import { GENERATED } from './generated';
import { POSITIONS } from './positions';

const EET = 2;
const pad = (n: number) => String(n).padStart(2, '0');

/** utc('2026-11-03', '25:30') → the instant 01:30 on the 4th, Tallinn time. */
export function utc(day: string, clock: string): string {
  const [h, m] = clock.split(':').map(Number);
  const [y, mo, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - EET, m)).toISOString();
}
export const day = (n: number, month = 11) => `2026-${pad(month)}-${pad(n)}`;

type Window = ScheduleDto['windows'][number];
type Availability = ScheduleDto['availability'][number];

export const win = (teamId: string, d: string, from: string, to: string, extra: Partial<Window> = {}): Window => ({
  id: `${teamId}-${d}`,
  teamId,
  day: d,
  startUtc: utc(d, from),
  endUtc: utc(d, to),
  ...extra,
});
export const av = (d: string, from: string, to: string, kind: Availability['kind'] = 'confirmed', teamId?: string): Availability => ({
  day: d,
  startUtc: utc(d, from),
  endUtc: utc(d, to),
  kind,
  teamId,
});

/** The demo volunteer sells tickets and works the Black Carpet. */
const TEAMS = [POSITIONS.ticket, POSITIONS.carpet];

export const BASE = {
  period: { startUtc: utc(day(28, 10), '00:00'), endUtc: utc(day(25), '00:00'), timeZone: 'Europe/Tallinn' },
  comments: {},
  targets: { dayHours: 6, weekHours: 24, monthHours: 60, periodHours: 80 },
  cohortQuantiles: [
    { p: 0.25, hours: 12 },
    { p: 0.5, hours: 24 },
    { p: 0.8, hours: 40 },
    { p: 0.95, hours: 70 },
    { p: 1, hours: 120 },
  ],
  stepMinutes: 5,
  contact: { email: 'vabatahtlikud@poff.ee', phone: '+372 5550 0000', emailUntilHours: 24, callWithinHours: 6 },
  suggestedNowUtc: utc(day(3), '10:00'),
} satisfies Partial<ScheduleDto>;

/** The week drawn in the mock-ups: Mon 2 – Sun 8 November. */
function mockWeek(): Window[] {
  return [
    win('ticket', day(2), '09:30', '26:00'),
    win('ticket', day(3), '09:30', '18:00'),
    win('carpet', day(3), '20:30', '26:30'),
    win('ticket', day(4), '12:00', '26:00'),
    win('ticket', day(5), '09:30', '21:00', { addedSinceSeen: [[utc(day(5), '19:00'), utc(day(5), '21:00')]] }),
    win('ticket', day(6), '09:30', '21:00'),
    // Saturday the 7th: nobody entered a window → crossed out for the whole day.
    win('carpet', day(8), '16:00', '25:00'),
  ];
}

/** The rest of the period, generated: festival days with a few gaps. */
function otherWeeks(): Window[] {
  const out: Window[] = [];
  const days: string[] = [day(28, 10), day(29, 10), day(30, 10), day(31, 10), day(1)];
  for (let d = 9; d <= 24; d++) days.push(day(d));
  days.forEach((d, i) => {
    const weekday = (new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7;
    if (i % 7 === 4) return; // a day off now and then (1 Nov, 15 Nov, 22 Nov)
    out.push(win('ticket', d, weekday === 5 ? '10:00' : '09:30', weekday >= 4 ? '26:00' : '23:00'));
    if (weekday === 1 || weekday === 4) out.push(win('carpet', d, '17:00', '25:00'));
  });
  return out;
}

const demo: ScheduleDto = {
  ...BASE,
  teams: TEAMS,
  windows: [...mockWeek(), ...otherWeeks()],
  availability: [
    av(day(30, 10), '09:30', '15:00'),
    av(day(31, 10), '12:00', '20:00'),
    av(day(2), '09:30', '13:00'),
    av(day(2), '14:00', '18:00'),
    av(day(2), '20:00', '21:00'),
    av(day(2), '21:00', '22:00', 'leaderAdded', 'ticket'),
    av(day(2), '24:00', '25:00'),
    av(day(2), '25:00', '26:00', 'leaderRemoved', 'ticket'),
    av(day(3), '09:30', '16:00'),
    av(day(3), '20:35', '25:30'),
    av(day(3), '25:30', '26:30', 'leaderAdded', 'carpet'),
    av(day(4), '14:00', '21:00'),
    av(day(4), '23:00', '26:00'),
    av(day(5), '09:30', '15:00', 'draft'),
  ],
  comments: { [day(4)]: 'Jõuan kohale otse koolist.' },
};

const fresh: ScheduleDto = { ...demo, availability: [], comments: {} };

/**
 * B2B-48H: two windows back to back, together covering 48 hours.
 * Thursday 08:00 → Friday 08:00 and Friday 08:00 → Saturday 08:00.
 */
const backToBack: ScheduleDto = {
  ...BASE,
  teams: [POSITIONS.ticket],
  windows: [win('ticket', day(5), '08:00', '32:00'), win('ticket', day(6), '08:00', '32:00')],
  availability: [av(day(5), '30:00', '32:00', 'draft')],
  suggestedNowUtc: utc(day(2), '10:00'),
  suggestedDay: day(5),
};

/** SINGLE: one team, one short window, nothing after midnight. */
const single: ScheduleDto = {
  ...BASE,
  teams: [POSITIONS.ticket],
  windows: [win('ticket', day(3), '10:00', '14:00')],
  availability: [],
  suggestedNowUtc: utc(day(1), '10:00'),
  suggestedDay: day(3),
};

/** OVERLAP: two teams whose windows overlap on the same day → one merged open area 09:00–01:00. */
const overlap: ScheduleDto = {
  ...BASE,
  teams: TEAMS,
  windows: [win('ticket', day(5), '09:00', '17:00'), win('carpet', day(5), '15:00', '25:00')],
  availability: [av(day(5), '09:00', '12:00', 'draft'), av(day(5), '16:00', '18:00', 'leaderAdded', 'carpet')],
  suggestedNowUtc: utc(day(2), '10:00'),
  suggestedDay: day(5),
};

export const SCENARIOS: Record<string, ScheduleDto> = { demo, fresh, backToBack, single, overlap, ...GENERATED };
export type ScenarioName = keyof typeof SCENARIOS;
