import { rowText } from '../../fixtures/expected'
import { absent, is, parameter, type ClassSpec, type Edge } from '../define'
import type { ExpectedProblem, Expectation, Localized, Parameter } from '../types'

/**
 * WHEN — arrival, start and end of the shift.
 *
 * What the tickets distinguish is whether the shift ends on a later date than
 * it starts (a NIGHT shift: weekday line and wolf prints) — so the classes are
 * cut at midnight, and the boundary values sit on both sides of it.
 */

/** The dates used, with their weekdays (0 = Sunday) written down here — not derived by the code under test. */
const D = { date: '2026-11-18', weekday: 3 } // a Wednesday
const N = { date: '2026-11-19', weekday: 4 }
const N2 = { date: '2026-11-20', weekday: 5 }
type Day = typeof D

interface Times {
  arrival?: unknown
  start: unknown
  end: unknown
  /** what the ticket must print (absent for values that are not drawn) */
  shows?: { arrival: string; start: string; end: string; days?: [Day, Day] }
}

const weekdays = (a: Day, b: Day): Localized => {
  const [from, to] = [rowText('weekday', String(a.weekday)), rowText('weekday', String(b.weekday))]
  return Object.fromEntries(Object.keys(from).map((lang) => [lang, `${from[lang]}-${to[lang]}`]))
}

/** A well-formed shift: [day, "HH:MM"] for arrival, start and end. */
function shift(arrival: [Day, string], start: [Day, string], end: [Day, string], suffix = ''): Times {
  const iso = ([day, time]: [Day, string]) => `${day.date}T${time}${suffix}`
  const night = start[0] !== end[0]
  return { arrival: iso(arrival), start: iso(start), end: iso(end), shows: { arrival: arrival[1], start: start[1], end: end[1], days: night ? [start[0], end[0]] : undefined } }
}

const raw = (arrival: unknown, start: unknown, end: unknown): Times => ({ arrival, start, end })

/** What a drawn ticket must show for a well-formed shift. */
function expectTimes(withArrival: boolean) {
  return (v: Times): Expectation[] => {
    if (!v.shows) return []
    const { arrival, start, end, days } = v.shows
    return [...(withArrival ? [is('arrival', arrival)] : []), is('start', start), is('end', end), days ? is('weekdays', weekdays(...days)) : absent('weekdays')]
  }
}

const DAY: ClassSpec<Times> = {
  id: 'day',
  about: 'starts and ends on the same date: no weekday line',
  value: shift([D, '17:40'], [D, '18:00'], [D, '20:10']),
  edges: [
    { id: 'ends-23-59', about: 'the last minute that is still the same date', value: shift([D, '21:00'], [D, '21:30'], [D, '23:59']) },
    { id: 'starts-00-00', about: 'the first minute of a date', value: shift([D, '00:00'], [D, '00:00'], [D, '08:00']) },
    { id: 'one-minute', about: 'the shortest shift', value: shift([D, '17:40'], [D, '18:00'], [D, '18:01']) },
    { id: 'arrival-at-start', about: 'arrival exactly at the start: the latest allowed', value: shift([D, '18:00'], [D, '18:00'], [D, '20:10']) },
    { id: 'arrival-previous-date', about: 'arriving the evening before does not make it a night shift', value: shift([D, '23:40'], [N, '00:10'], [N, '06:00']) },
    { id: 'with-seconds', about: 'seconds are accepted and ignored', value: shift([D, '17:40'], [D, '18:00'], [D, '20:10'], ':59') },
  ],
}

const NIGHT: ClassSpec<Times> = {
  id: 'night',
  about: 'ends on the next date: weekday line (and wolf prints where the ticket has room)',
  value: shift([D, '21:00'], [D, '21:30'], [N, '01:45']),
  edges: [
    { id: 'ends-00-00', about: 'ends exactly at midnight: the first minute that counts as the next date', value: shift([D, '21:00'], [D, '21:30'], [N, '00:00']) },
    { id: 'one-minute-over', about: 'the shortest night shift', value: shift([D, '23:30'], [D, '23:59'], [N, '00:00']) },
    { id: 'ends-23-59-next-date', about: 'the last minute before a second midnight', value: shift([D, '21:00'], [D, '21:30'], [N, '23:59']) },
  ],
}

const MULTI_DAY: ClassSpec<Times> = {
  id: 'multi-day',
  about: 'ends two or more dates later: the weekday line names the first and the last day',
  value: shift([D, '21:00'], [D, '21:30'], [N2, '02:00']),
  edges: [{ id: 'second-midnight', about: 'ends exactly at the second midnight: the shortest shift of the class', value: shift([D, '21:00'], [D, '21:30'], [N2, '00:00']) }],
}

const t = (day: Day, time: string) => `${day.date}T${time}`
const bad = (field: string): ExpectedProblem[] => [{ field, code: 'bad-datetime' }]

const ENDS_BEFORE_START: ClassSpec<Times> = {
  id: 'ends-before-start',
  about: 'the end is not after the start',
  validity: 'invalid',
  problems: [{ field: 'end', code: 'time-order' }],
  value: raw(t(D, '17:40'), t(D, '20:10'), t(D, '18:00')),
  edges: [
    { id: 'zero-length', about: 'start and end are the same minute', value: raw(t(D, '17:40'), t(D, '18:00'), t(D, '18:00')) },
    { id: 'previous-date', about: 'the end is a date earlier', value: raw(t(D, '17:40'), t(N, '18:00'), t(D, '20:10')), problems: [{ field: 'end', code: 'time-order' }] },
  ],
}

const ARRIVAL_AFTER_START: ClassSpec<Times> = {
  id: 'arrival-after-start',
  about: 'the arrival time is later than the start',
  validity: 'invalid',
  problems: [{ field: 'arrival', code: 'arrival-after-start' }],
  value: raw(t(D, '18:30'), t(D, '18:00'), t(D, '20:10')),
  edges: [{ id: 'one-minute-late', about: 'the first minute that is too late', value: raw(t(D, '18:01'), t(D, '18:00'), t(D, '20:10')) }],
}

const MALFORMED: ClassSpec<Times> = {
  id: 'malformed',
  about: 'a time that is not a local date-time',
  validity: 'invalid',
  problems: bad('start'),
  value: raw(t(D, '17:40'), '18:00', t(D, '20:10')),
  edges: [
    { id: 'end', about: 'the same defect in the end time', value: raw(t(D, '17:40'), t(D, '18:00'), '20:10'), problems: bad('end') },
    { id: 'arrival', about: 'the same defect in the arrival time', value: raw('17:40', t(D, '18:00'), t(D, '20:10')), problems: bad('arrival') },
    {
      id: 'nonexistent-date',
      about: 'right shape, but the date does not exist — in all three times',
      value: raw('2026-02-30T17:40', '2026-02-30T18:00', '2026-02-30T20:10'),
      problems: [...bad('start'), ...bad('end'), ...bad('arrival')],
    },
    { id: 'not-a-leap-year', about: '29 February in a year that has none', value: raw(t(D, '17:40'), '2026-02-29T18:00', '2026-03-01T20:10') },
    { id: 'hour-24', about: 'one past the last hour', value: raw(t(D, '17:40'), `${D.date}T24:00`, t(N, '02:00')) },
    { id: 'minute-60', about: 'one past the last minute', value: raw(t(D, '17:40'), `${D.date}T18:60`, t(D, '20:10')) },
    { id: 'with-offset', about: 'a time-zone suffix: these are local times, converting would be a guess', value: raw(t(D, '17:40'), `${D.date}T18:00+02:00`, t(D, '20:10')) },
    { id: 'utc', about: 'a UTC marker', value: raw(t(D, '17:40'), `${D.date}T18:00Z`, t(D, '20:10')) },
    { id: 'not-text', about: 'a number instead of text', value: raw(t(D, '17:40'), 1800, t(D, '20:10')) },
  ],
}

const ABSENT: ClassSpec<Times> = {
  id: 'absent',
  about: 'a time is not given at all',
  validity: 'invalid',
  problems: [{ field: 'start', code: 'missing' }],
  value: raw(t(D, '17:40'), undefined, t(D, '20:10')),
  edges: [
    { id: 'end', about: 'no end time', value: raw(t(D, '17:40'), t(D, '18:00'), undefined), problems: [{ field: 'end', code: 'missing' }] },
    { id: 'arrival', about: 'no arrival time', value: raw(undefined, t(D, '18:00'), t(D, '20:10')), problems: [{ field: 'arrival', code: 'missing' }] },
  ],
}

/** Breaks have no arrival time: the classes, edges and problems that are about arrival do not exist for them. */
const ARRIVAL_ONLY = ['arrival-at-start', 'arrival-previous-date', 'arrival']

export function timesParameter(opts: { arrival: boolean }): Parameter {
  const strip = (v: Times): Times => (opts.arrival ? v : { start: v.start, end: v.end, shows: v.shows })
  const mine = (ps?: ExpectedProblem[]) => (opts.arrival ? ps : ps?.filter((p) => p.field !== 'arrival'))
  const classes = [DAY, NIGHT, MULTI_DAY, ENDS_BEFORE_START, ...(opts.arrival ? [ARRIVAL_AFTER_START] : []), MALFORMED, ABSENT].map(
    (c): ClassSpec<Times> => ({
      ...c,
      value: strip(c.value),
      problems: mine(c.problems),
      edges: c.edges?.filter((e) => opts.arrival || !ARRIVAL_ONLY.includes(e.id)).map((e): Edge<Times> => ({ ...e, value: strip(e.value), problems: mine(e.problems) })),
    }),
  )
  return parameter<Times>({
    id: 'times',
    about: opts.arrival ? 'arrival, start and end of the shift' : 'start and end of the pause',
    base: 'day',
    patch: ({ shows: _shows, ...fields }) => fields,
    expect: expectTimes(opts.arrival),
    classes,
  })
}
