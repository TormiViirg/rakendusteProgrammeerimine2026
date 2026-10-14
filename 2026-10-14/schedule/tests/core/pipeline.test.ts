import { describe, expect, it } from 'vitest'
import { buildSchedule, contentIds } from '../../src/core/schedule/schedule'
import { CONTENT_PENDING, type AnyKind, type KindRegistry } from '../../src/core/ticket/kind'
import { makeTicket, type PipelineContext } from '../../src/core/ticket/pipeline'
import { isError, problemKey } from '../../src/core/ticket/problem'
import { KINDS } from '../../src/tickets/registry'
import { lookup } from '../helpers/world'

/**
 * The pipeline against input no catalogue class describes: things that are not
 * records at all, definitions that throw, content that has not arrived or
 * arrived without what was asked for. One bad record must never take the
 * schedule down.
 */
const ctx: PipelineContext = { kinds: KINDS, lookup: lookup('et'), catalog: { venue: () => undefined, hall: () => undefined }, content: null }
const venue = (id: unknown, start = '2026-10-11T08:00', end = '2026-10-11T09:00') => ({ id, kind: 'venue', arrival: start, start, end, venueId: 'artis' })
const screening = {
  id: 's1',
  kind: 'screening',
  arrival: '2026-10-11T08:00',
  start: '2026-10-11T08:30',
  end: '2026-10-11T10:00',
  venueId: 'artis',
  hallId: 'h',
  roleId: 'admin',
  filmId: 'f1',
  programmeIds: ['p1', 'p2'],
  durationMin: 90,
  gapMin: 20,
  audienceId: 'free',
  sessionCode: '020121',
}

describe('makeTicket — whatever arrives, a ticket or problems, never an exception', () => {
  it.each([
    [null, 'null'],
    [undefined, 'nothing'],
    [42, 'a number'],
    ['venue', 'a text'],
    [[venue('a')], 'a list'],
    [true, 'a flag'],
  ] as [unknown, string][])('%s (%s) is malformed', (raw) => {
    const { ticket, problems } = makeTicket(raw, ctx)
    expect(ticket).toBeUndefined()
    expect(problems.map((p) => [p.code, p.severity])).toEqual([['malformed', 'error']])
  })

  it.each([
    [{}, ['id:malformed', 'kind:unknown-kind']],
    [{ id: 'a' }, ['kind:unknown-kind']],
    [{ id: 'a', kind: 7 }, ['kind:unknown-kind']],
    [{ id: 'a', kind: 'concert' }, ['kind:unknown-kind']],
    // names every object has are not kinds
    [{ id: 'a', kind: 'constructor' }, ['kind:unknown-kind']],
    [{ id: 'a', kind: '__proto__' }, ['kind:unknown-kind']],
    [{ id: 'a', kind: 'toString' }, ['kind:unknown-kind']],
  ] as [unknown, string[]][])('%j → %j', (raw, expected) => {
    const { ticket, problems } = makeTicket(raw, ctx)
    expect(ticket).toBeUndefined()
    expect(problems.map(problemKey)).toEqual(expected)
  })

  it.each([[undefined], [null], [''], ['   '], [7], [{}]])('a record whose id is %j is not shown', (id) => {
    const { ticket, problems } = makeTicket(venue(id), ctx)
    expect(ticket).toBeUndefined()
    expect(problems.map(problemKey)).toContain('id:malformed')
  })

  it('a definition that throws — in a check, in build, in a feature — costs that record only', () => {
    const boom = () => {
      throw new Error('boom')
    }
    const base = KINDS.venue as AnyKind
    const broken: Record<string, AnyKind> = {
      check: { ...base, checks: [boom] },
      build: { ...base, build: boom },
      feature: { ...base, features: { ...base.features, night: { about: '', of: boom } } },
      headline: { ...base, headline: boom },
    }
    for (const [where, kind] of Object.entries(broken)) {
      const kinds: KindRegistry = { venue: kind }
      const made = makeTicket(venue('a'), { ...ctx, kinds })
      expect(made.ticket, where).toBeUndefined()
      expect(made.problems.map((p) => [p.code, p.severity, p.detail]), where).toEqual([['failed', 'error', 'boom']])
      // … and the schedule goes on
      const s = buildSchedule({ shifts: [venue('a')] }, { ...ctx, kinds })
      expect([s.days.length, s.notShown], where).toEqual([0, 1])
    }
  })
})

describe('changing content', () => {
  it('the kinds say what a schedule needs; malformed records are skipped', () => {
    const ids = contentIds({ shifts: [screening, { ...screening, id: 's2', filmId: 'f2', programmeIds: ['p2', 7, ''] }, { kind: 'screening' }, null, 5, venue('v')] }, KINDS)
    expect(ids).toEqual({ films: ['f1', 'f2'], programmes: ['p1', 'p2'] })
  })

  it('still loading: the placeholder, and no warning', () => {
    const { ticket, problems } = makeTicket(screening, ctx)
    expect((ticket!.model as unknown as { film?: string }).film).toBe(CONTENT_PENDING)
    expect(problems.filter((p) => p.code === 'unknown-id' && p.field !== 'hallId')).toEqual([])
  })

  it.each([
    [{}, 'no collections at all'],
    [{ films: {}, programmes: {} }, 'empty collections'],
    [{ films: { f1: { text: 7 } }, programmes: { p1: null } }, 'entries that are not texts'],
  ] as [Record<string, Record<string, never>>, string][])('loaded, but without what was asked for (%j — %s): the raw ids, each reported', (items) => {
    const { ticket, problems } = makeTicket(screening, { ...ctx, content: { lang: 'et', items } })
    const model = ticket?.model as unknown as { film: string; programme: string[] }
    expect(model.film).toBe('f1')
    expect(model.programme).toEqual(['p1', 'p2'])
    expect(problems.some(isError)).toBe(false)
    expect(problems.map(problemKey).filter((k) => k.startsWith('film') || k.startsWith('programme'))).toEqual(['filmId:unknown-id', 'programmeIds:unknown-id', 'programmeIds:unknown-id'])
  })

  it.each([
    [{ lang: 'et' }, 'no items'],
    [{ lang: 'et', items: null }, 'items is null'],
    [{ lang: 'et', items: 'none' }, 'items is a text'],
    [{ lang: 'et', items: { films: null, programmes: 7 } }, 'collections that are not collections'],
    [{ lang: 'et', items: { films: { f1: 'Stalker' }, programmes: { p1: ['x'] } } }, 'entries of the wrong shape'],
    [{}, 'an empty answer'],
  ] as [unknown, string][])('an answer of the wrong shape (%j — %s) costs no ticket: raw ids, each reported', (answer) => {
    const { ticket, problems } = makeTicket(screening, { ...ctx, content: answer as never })
    expect(ticket).toBeDefined()
    expect((ticket!.model as unknown as { film: string }).film).toBe('f1')
    expect(problems.some(isError)).toBe(false)
    expect(problems.map(problemKey)).toContain('filmId:unknown-id')
  })

  it('a title without a language still shows', () => {
    const { ticket } = makeTicket(screening, { ...ctx, content: { lang: 'et', items: { films: { f1: { text: 'Stalker' } } } } as never })
    expect(ticket!.model).toMatchObject({ film: 'Stalker', filmLang: undefined })
  })

  it('ids are data: a film called "constructor" is looked up as a plain key', () => {
    const { ticket } = makeTicket({ ...screening, filmId: 'constructor' }, { ...ctx, content: { lang: 'et', items: { films: {}, programmes: {} } } })
    expect((ticket!.model as unknown as { film: string }).film).toBe('constructor')
  })
})

describe('buildSchedule — groups, repeats and rubbish', () => {
  const a = venue('a', '2026-10-11T08:00', '2026-10-11T09:00')
  const b = venue('b', '2026-10-12T08:00', '2026-10-12T09:00')
  const c = venue('c', '2026-10-11T12:00', '2026-10-11T13:00')
  const ids = (s: ReturnType<typeof buildSchedule>) => s.days.map((d) => [d.id, d.tickets.map((t) => t.id)])

  it('explicit groups come first, in their order; what no group lists still appears, by day', () => {
    const s = buildSchedule({ shifts: [a, b, c], groups: [{ id: 'g', title: 'Homme', shiftIds: ['b'] }] }, ctx)
    expect(ids(s)).toEqual([['group:g', ['b']], ['day:2026-10-11', ['a', 'c']]])
    expect(s.notShown).toBe(0)
  })

  it('a ticket is shown once: listed twice in a group, or in two groups, it stays where it came first', () => {
    const s = buildSchedule({ shifts: [a, b], groups: [{ id: 'g1', title: '1', shiftIds: ['a', 'a', 'nope'] }, { id: 'g2', title: '2', shiftIds: ['a', 'b'] }] }, ctx)
    expect(ids(s)).toEqual([['group:g1', ['a']], ['group:g2', ['b']]])
  })

  it('records in groups are checked like any other: a faulty one is left out and counted', () => {
    const bad = venue('bad', '2026-10-11T09:00', '2026-10-11T08:00')
    const s = buildSchedule({ shifts: [a, bad], groups: [{ id: 'g', title: 'G', shiftIds: ['a', 'bad'] }] }, ctx)
    expect(ids(s)).toEqual([['group:g', ['a']]])
    expect(s.notShown).toBe(1)
    expect(s.problems.map((p) => `${p.shiftId}/${problemKey(p)}`)).toEqual(['bad/end:time-order'])
  })

  it('the same id twice: the first is shown, the second reported and counted', () => {
    const s = buildSchedule({ shifts: [a, { ...b, id: 'a' }, b] }, ctx)
    expect(ids(s)).toEqual([['day:2026-10-11', ['a']], ['day:2026-10-12', ['b']]])
    expect(s.notShown).toBe(1)
    expect(s.problems.map((p) => `${p.shiftId}/${problemKey(p)}`)).toEqual(['a/id:duplicate-id'])
  })

  it('rubbish among the records is counted and reported; the rest is shown', () => {
    const s = buildSchedule({ shifts: [null, 7, 'x', [], {}, a] }, ctx)
    expect(ids(s)).toEqual([['day:2026-10-11', ['a']]])
    expect(s.notShown).toBe(5)
    expect(s.problems.every(isError)).toBe(true)
  })

  it.each([
    [[null], 'null'],
    [[7, 'x', []], 'not objects'],
    [[{}], 'an empty object'],
    [[{ id: 'g', shiftIds: 5 }], 'shiftIds is a number'],
    [[{ id: 'g', shiftIds: 'a' }], 'shiftIds is a text'],
    [[{ id: 'g', shiftIds: [null, 7, {}, 'a'] }], 'ids that are not ids'],
    [[{ id: 7, title: {}, shiftIds: ['a'], notes: 'x' }], 'id, title and notes of the wrong type'],
    ['groups', 'not a list'],
    [null, 'null'],
  ] as [unknown, string][])('groups that are not groups (%j — %s) cost no ticket', (groups) => {
    const s = buildSchedule({ shifts: [a, b], groups } as never, ctx)
    expect(s.days.flatMap((d) => d.tickets.map((t) => t.id)).sort()).toEqual(['a', 'b'])
    expect(s.notShown).toBe(0)
    for (const d of s.days) expect(typeof d.label).toBe('string')
  })

  it('section ids are unique, whatever the groups are called', () => {
    const s = buildSchedule({ shifts: [a, b, c], groups: [{ id: 'g', title: '1', shiftIds: ['a'] }, { id: 'g', title: '2', shiftIds: ['b'] }, { id: 'day:2026-10-11', title: '3', shiftIds: [] }, { id: '2026-10-11', title: '4', shiftIds: [] }] }, ctx)
    const sections = s.days.map((d) => d.id)
    expect(new Set(sections).size).toBe(sections.length)
    expect(s.days.flatMap((d) => d.tickets.map((t) => t.id)).sort()).toEqual(['a', 'b', 'c'])
  })

  it('a response that is not a response is an empty schedule', () => {
    for (const res of [null, undefined, 7, 'x', []] as never[]) {
      expect(buildSchedule(res, ctx)).toMatchObject({ days: [], notShown: 0 })
      expect(contentIds(res, KINDS)).toEqual({})
    }
  })

  it('a response without a list of shifts is an empty schedule', () => {
    for (const shifts of [undefined, null, 'none', {}] as never[]) expect(buildSchedule({ shifts }, ctx)).toMatchObject({ days: [], notShown: 0 })
  })
})
