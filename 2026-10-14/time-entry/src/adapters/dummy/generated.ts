/**
 * Generated boundary / equivalence combinations.
 *
 * Four dimensions, every combination (4 × 4 × 3 × 4 = 192 scenarios), each a
 * complete backend answer for the week of 2–8 November 2026, anchored on
 * Thursday the 5th. The matrix page (?matrix) lists them with links.
 *
 *   span    day         10:00–18:00, daytime only
 *           night       18:00–02:00, crosses midnight
 *           midnight    16:00–24:00, ends exactly at midnight (no night section)
 *           b2b         08:00→08:00 twice, back to back, 48 h (Thu + Fri)
 *   teams   one         ticket seller only
 *           apart       + Black Carpet window that does not touch it (one column, a gap between)
 *           gap         + Black Carpet window starting 15 minutes after it ends (a sub-hour gap inside one row)
 *           overlap     + Black Carpet window overlapping it (merged into one open area)
 *   time    open        now is days before the grace point
 *           locked      now is past the harshest grace point, before the shift
 *           past        now is after the shift ended
 *   filled  empty       nothing chosen
 *           partial     one confirmed hour in the middle
 *           leader      a team lead added one hour and removed another
 *           new         the admin extended the window after the volunteer's last visit
 */
import type { ScheduleDto } from './dto';
import { POSITIONS } from './positions';

export const SPANS = ['day', 'night', 'midnight', 'b2b'] as const;
export const TEAMS = ['one', 'apart', 'gap', 'overlap'] as const;
export const TIMES = ['open', 'locked', 'past'] as const;
export const FILLS = ['empty', 'partial', 'leader', 'new'] as const;

export type Combination = {
  span: (typeof SPANS)[number];
  teams: (typeof TEAMS)[number];
  time: (typeof TIMES)[number];
  filled: (typeof FILLS)[number];
};

export const generatedId = (c: Combination) => `gen-${c.span}-${c.teams}-${c.time}-${c.filled}`;

const EET = 2;
const THU = '2026-11-05';
const FRI = '2026-11-06';
const utc = (day: string, clock: string): string => {
  const [h, m] = clock.split(':').map(Number);
  const [y, mo, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - EET, m)).toISOString();
};
const shift = (iso: string, hours: number) => new Date(Date.parse(iso) + hours * 3_600_000).toISOString();

type Win = ScheduleDto['windows'][number];
type Av = ScheduleDto['availability'][number];
const win = (teamId: string, day: string, from: string, to: string): Win => ({ id: `${teamId}-${day}`, teamId, day, startUtc: utc(day, from), endUtc: utc(day, to) });
const av = (day: string, from: string, to: string, kind: Av['kind'], teamId?: string): Av => ({ day, startUtc: utc(day, from), endUtc: utc(day, to), kind, teamId });

/** The ticket-seller windows per span, and where a second team's window goes. */
const SHAPES: Record<Combination['span'], { ticket: Win[]; apart: Win; gap: Win; overlap: Win; middle: [string, string, string]; last: [string, string, string] }> = {
  day: { ticket: [win('ticket', THU, '10:00', '18:00')], apart: win('carpet', THU, '19:00', '23:00'), gap: win('carpet', THU, '18:15', '22:00'), overlap: win('carpet', THU, '15:00', '21:00'), middle: [THU, '13:00', '14:00'], last: [THU, '16:00', '18:00'] },
  night: { ticket: [win('ticket', THU, '18:00', '26:00')], apart: win('carpet', THU, '10:00', '14:00'), gap: win('carpet', THU, '14:00', '17:45'), overlap: win('carpet', THU, '22:00', '28:00'), middle: [THU, '23:00', '24:00'], last: [THU, '24:00', '26:00'] },
  midnight: { ticket: [win('ticket', THU, '16:00', '24:00')], apart: win('carpet', THU, '08:00', '12:00'), gap: win('carpet', THU, '09:00', '15:45'), overlap: win('carpet', THU, '20:00', '23:00'), middle: [THU, '19:00', '20:00'], last: [THU, '22:00', '24:00'] },
  b2b: { ticket: [win('ticket', THU, '08:00', '32:00'), win('ticket', FRI, '08:00', '32:00')], apart: win('carpet', '2026-11-07', '10:00', '14:00'), gap: win('carpet', '2026-11-07', '08:15', '12:00'), overlap: win('carpet', THU, '20:00', '30:00'), middle: [THU, '20:00', '21:00'], last: [FRI, '30:00', '32:00'] },
};

export function generate(c: Combination): ScheduleDto {
  const shape = SHAPES[c.span];
  const teams = c.teams === 'one' ? [POSITIONS.ticket] : [POSITIONS.ticket, POSITIONS.carpet];
  const windows: Win[] = [...shape.ticket];
  if (c.teams === 'apart') windows.push(shape.apart);
  if (c.teams === 'gap') windows.push(shape.gap);
  if (c.teams === 'overlap') windows.push(shape.overlap);
  if (c.filled === 'new') {
    const [day, from, to] = shape.last;
    const target = windows.find((w) => w.day === day && w.teamId === 'ticket')!;
    target.addedSinceSeen = [[utc(day, from), utc(day, to)]];
  }
  const availability: Av[] = [];
  if (c.filled === 'partial') availability.push(av(...shape.middle, 'confirmed'));
  if (c.filled === 'leader') {
    const first = windows[0];
    availability.push({ day: first.day, startUtc: first.startUtc, endUtc: shift(first.startUtc, 1), kind: 'leaderAdded', teamId: first.teamId });
    availability.push({ day: first.day, startUtc: shift(first.startUtc, 2), endUtc: shift(first.startUtc, 3), kind: 'leaderRemoved', teamId: first.teamId });
  }
  const earliest = windows.reduce((m, w) => (w.startUtc < m ? w.startUtc : m), windows[0].startUtc);
  const latest = windows.reduce((m, w) => (w.endUtc > m ? w.endUtc : m), windows[0].endUtc);
  const grace = Math.max(...teams.map((t) => t.graceHours));
  const now = c.time === 'open' ? shift(earliest, -24 * 5) : c.time === 'locked' ? shift(earliest, -grace + 1) : shift(latest, 1);
  return {
    period: { startUtc: utc('2026-10-28', '00:00'), endUtc: utc('2026-11-25', '00:00'), timeZone: 'Europe/Tallinn' },
    teams,
    windows,
    availability,
    comments: {},
    targets: { dayHours: 6, weekHours: 24, monthHours: 60, periodHours: 80 },
    cohortQuantiles: [{ p: 0.5, hours: 24 }, { p: 0.8, hours: 40 }, { p: 1, hours: 120 }],
    stepMinutes: 5,
    contact: { email: 'vabatahtlikud@poff.ee', phone: '+372 5550 0000', emailUntilHours: 24, callWithinHours: 6 },
    suggestedNowUtc: now,
    suggestedDay: THU,
  };
}

export const COMBINATIONS: Combination[] = SPANS.flatMap((span) =>
  TEAMS.flatMap((teams) => TIMES.flatMap((time) => FILLS.map((filled) => ({ span, teams, time, filled })))),
);

export const GENERATED: Record<string, ScheduleDto> = Object.fromEntries(COMBINATIONS.map((c) => [generatedId(c), generate(c)]));
