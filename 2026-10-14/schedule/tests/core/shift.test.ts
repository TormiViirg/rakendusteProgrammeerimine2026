import { describe, expect, it } from 'vitest'
import { parseLocal } from '../../src/core/shift/datetime'
import { isAbsentMinutes, validMinutes } from '../../src/core/shift/measure'
import { isNightShift } from '../../src/core/shift/night'
import { buildSchedule } from '../../src/core/schedule/schedule'
import { KINDS } from '../../src/tickets/registry'
import { validRating } from '../../src/tickets/screening/record'
import { lookup } from '../helpers/world'

describe('parseLocal — local date-times', () => {
  it.each([
    ['2026-11-18T18:00', 'ordinary'],
    ['2026-11-18T00:00', 'first minute of a date'],
    ['2026-11-18T23:59', 'last minute of a date'],
    ['2026-12-31T23:59', 'last minute of a year'],
    ['2028-02-29T12:00', 'leap day in a leap year'],
    ['2026-11-18T18:00:00', 'with seconds'],
    ['2026-11-18T18:00:59.999', 'with fractions of a second'],
  ])('accepts %s (%s)', (s) => {
    expect(parseLocal(s)).not.toBeNull()
  })

  it.each([
    ['2026-02-29T12:00', '29 February in a year that is not a leap year'],
    ['2026-02-30T12:00', 'a date that never exists'],
    ['2026-13-01T12:00', 'month 13'],
    ['2026-00-10T12:00', 'month 0'],
    ['2026-11-00T12:00', 'day 0'],
    ['2026-11-31T12:00', '31 November'],
    ['2026-11-18T24:00', 'hour 24'],
    ['2026-11-18T18:60', 'minute 60'],
    ['2026-11-18T18:00Z', 'UTC suffix'],
    ['2026-11-18T18:00+02:00', 'offset'],
    ['2026-11-18 18:00', 'space instead of T'],
    ['18:00', 'time only'],
    ['2026-11-18', 'date only'],
    ['', 'empty'],
    [null, 'null'],
    [1800, 'a number'],
  ] as [unknown, string][])('rejects %s (%s)', (s) => {
    expect(parseLocal(s)).toBeNull()
  })

  it('reads date, time and weekday without the machine\'s time zone', () => {
    expect(parseLocal('2026-10-11T21:30')).toMatchObject({ dateKey: '2026-10-11', date: '11.10.2026', time: '21:30', weekday: 0 })
    expect(parseLocal('2026-10-17T00:00')?.weekday).toBe(6)
  })
})

describe('isNightShift — the midnight boundary', () => {
  it.each([
    ['2026-11-18T21:30', '2026-11-18T23:59', false, 'last minute of the same date'],
    ['2026-11-18T21:30', '2026-11-19T00:00', true, 'first minute of the next date'],
    ['2026-11-18T00:00', '2026-11-18T08:00', false, 'starts at midnight, same date'],
    ['2026-11-18T23:59', '2026-11-19T00:00', true, 'one minute, across midnight'],
    ['2026-12-31T22:00', '2027-01-01T02:00', true, 'across the year'],
    ['2026-11-18T21:30', '2026-11-20T02:00', true, 'two midnights'],
  ])('%s → %s: %s (%s)', (start, end, night) => {
    expect(isNightShift(start, end)).toBe(night)
  })
})

describe('optional minutes (BC, Q&A) and the age rating', () => {
  it('minutes: valid from 1; 0, null and undefined are "absent"; the rest is invalid', () => {
    expect([1, 59, 999, 1440].map(validMinutes)).toEqual([1, 59, 999, 1440])
    expect([0, -1, 0.5, 59.5, NaN, Infinity, '59', null, undefined].map(validMinutes)).toEqual(Array(9).fill(undefined))
    expect([undefined, null, 0].every(isAbsentMinutes)).toBe(true)
    expect([1, -1, '0', NaN].some(isAbsentMinutes)).toBe(false)
  })

  it('rating: 1–99', () => {
    expect([1, 9, 10, 99].map(validRating)).toEqual([1, 9, 10, 99])
    expect([0, -1, 100, 12.5, '16', null, undefined].map(validRating)).toEqual(Array(7).fill(undefined))
  })
})

describe('buildSchedule — grouping by day', () => {
  const ctx = { kinds: KINDS, lookup: lookup('et'), catalog: { venue: () => undefined, hall: () => undefined }, content: null }
  const venue = (id: string, start: string, end: string) => ({ id, kind: 'venue', arrival: start, start, end, venueId: 'artis' })

  it('no shifts: no days, nothing missing', () => {
    expect(buildSchedule({ shifts: [] }, ctx)).toMatchObject({ days: [], notShown: 0 })
  })

  it('groups by the date a shift STARTS on, in time order, with a heading per day', () => {
    const s = buildSchedule({ shifts: [venue('b', '2026-10-12T09:00', '2026-10-12T10:00'), venue('n', '2026-10-11T23:00', '2026-10-12T02:00'), venue('a', '2026-10-11T08:00', '2026-10-11T09:00')] }, ctx)
    expect(s.days.map((d) => [d.label, d.tickets.map((t) => t.id)])).toEqual([
      ['Pühapäev - 11.10.2026', ['a', 'n']],
      ['Esmaspäev - 12.10.2026', ['b']],
    ])
  })

  it('a record with an error is left out and counted; a warning is not', () => {
    const s = buildSchedule({ shifts: [venue('ok', '2026-10-11T08:00', '2026-10-11T09:00'), venue('bad', '2026-10-11T09:00', '2026-10-11T08:00'), { ...venue('raw', '2026-10-11T10:00', '2026-10-11T11:00'), venueId: 'nowhere' }, { id: 'x', kind: 'concert' }] }, ctx)
    expect(s.days[0].tickets.map((t) => t.id)).toEqual(['ok', 'raw'])
    expect(s.notShown).toBe(2)
    expect(s.problems.map((p) => [p.shiftId, p.code, p.severity])).toEqual([
      ['bad', 'time-order', 'error'],
      ['raw', 'unknown-id', 'warning'],
      ['x', 'unknown-kind', 'error'],
    ])
  })
})
