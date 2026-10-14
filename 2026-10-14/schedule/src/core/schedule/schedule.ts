import { parseLocal } from '../shift/datetime'
import type { ScheduleResponse } from '../shift/records'
import type { ContentIds, KindRegistry } from '../ticket/kind'
import { makeTicket, shiftIdOf, type PipelineContext } from '../ticket/pipeline'
import type { Problem } from '../ticket/problem'
import type { Ticket } from '../ticket/ticket'

/** One day heading and the tickets under it. */
export interface DayGroup {
  id: string
  /** one-line heading: "Pühapäev - 11.10.2026" */
  label: string
  /** the two parts, for layouts that set them separately */
  weekday?: string
  date?: string
  tickets: Ticket[]
  /** a line shown above a ticket, by ticket id */
  notes?: Record<string, string>
}

export interface Schedule {
  days: DayGroup[]
  problems: Problem[]
  /** records that could not be shown: they have an error, or repeat an id already shown */
  notShown: number
}

/** A list of a response that may be anything: its entries if it is a list, otherwise nothing. */
function listOf(res: unknown, key: 'shifts' | 'groups'): unknown[] {
  const value = typeof res === 'object' && res !== null ? (res as Record<string, unknown>)[key] : undefined
  return Array.isArray(value) ? value : []
}

const cap = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1)

/**
 * Runs EVERY record through the pipeline, then groups the tickets: into the
 * explicit groups of the response where it has any, and by the calendar day a
 * shift starts on otherwise (also for tickets no explicit group lists).
 *
 * A shift id is shown once: a second record with the same id is reported and
 * left out, and a group that lists an id twice gets it once.
 */
export function buildSchedule(res: ScheduleResponse, ctx: PipelineContext): Schedule {
  const problems: Problem[] = []
  let notShown = 0
  const tickets = new Map<string, { ticket: Ticket; start: string }>()

  for (const raw of listOf(res, 'shifts')) {
    const id = shiftIdOf(raw)
    if (id && tickets.has(id)) {
      problems.push({ shiftId: id, field: 'id', code: 'duplicate-id', severity: 'error' })
      notShown++
      continue
    }
    const made = makeTicket(raw, ctx)
    problems.push(...made.problems)
    if (made.ticket) tickets.set(id, { ticket: made.ticket, start: String((raw as { start?: unknown }).start ?? '') })
    else notShown++
  }

  // Explicit groups. They are data like everything else: a group that is not a group is skipped,
  // and group ids are made unique — they become the keys of the page's sections.
  const days: DayGroup[] = []
  const placed = new Set<string>()
  const taken = new Set<string>()
  const unique = (wanted: string) => {
    let id = wanted
    for (let n = 2; taken.has(id); n++) id = `${wanted}#${n}`
    taken.add(id)
    return id
  }
  listOf(res, 'groups').forEach((g, i) => {
    if (typeof g !== 'object' || g === null) return
    const group = g as { id?: unknown; title?: unknown; shiftIds?: unknown; notes?: unknown }
    const ids = Array.isArray(group.shiftIds) ? group.shiftIds.filter((x): x is string => typeof x === 'string') : []
    const own = [...new Set(ids)].filter((id) => tickets.has(id) && !placed.has(id))
    own.forEach((id) => placed.add(id))
    const notes: Record<string, string> = {}
    if (typeof group.notes === 'object' && group.notes !== null) for (const [id, text] of Object.entries(group.notes)) if (typeof text === 'string') notes[id] = text
    days.push({
      id: unique(`group:${typeof group.id === 'string' && group.id ? group.id : i}`),
      label: typeof group.title === 'string' ? group.title : '',
      notes,
      tickets: own.map((id) => tickets.get(id)!.ticket),
    })
  })

  // everything else: by the day it starts on, in time order
  const byDay = new Map<string, DayGroup>()
  const rest = [...tickets].filter(([id]) => !placed.has(id)).map(([, t]) => t)
  for (const { ticket, start } of rest.sort((a, b) => a.start.localeCompare(b.start))) {
    const d = parseLocal(start)
    if (!d) continue // cannot happen for a ticket: every kind checks `start`
    if (!byDay.has(d.dateKey)) {
      const weekday = cap(ctx.lookup.row('weekday', String(d.weekday)) ?? '')
      byDay.set(d.dateKey, { id: unique(`day:${d.dateKey}`), label: ctx.lookup.pattern('dayHeader', { weekday, date: d.date }), weekday, date: d.date, tickets: [] })
    }
    byDay.get(d.dateKey)!.tickets.push(ticket)
  }
  return { days: [...days, ...byDay.values()], problems, notShown }
}

/** What the page-wide scale and modifier selection needs to know about the tickets. */
export function scheduleInfo(days: readonly DayGroup[]): { kinds: string[]; count: number; longestText: number } {
  const tickets = days.flatMap((d) => d.tickets)
  return {
    kinds: [...new Set(tickets.map((t) => t.kind))],
    count: tickets.length,
    longestText: tickets.reduce((m, t) => Math.max(m, t.headline.length), 0),
  }
}

const texts = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : [])

/** The ids of the changing content a schedule needs, per collection, as its kinds declare them. */
export function contentIds(res: ScheduleResponse, kinds: KindRegistry): ContentIds {
  const out: Record<string, Set<string>> = {}
  for (const r of listOf(res, 'shifts')) {
    const kindId = typeof r === 'object' && r !== null ? (r as { kind?: unknown }).kind : undefined
    const kind = typeof kindId === 'string' && Object.hasOwn(kinds, kindId) ? kinds[kindId] : undefined
    if (!kind?.content) continue
    let ids: ContentIds = {}
    try {
      ids = kind.content(r) ?? {}
    } catch {
      // a malformed record: the checks will report it
    }
    for (const [collection, list] of Object.entries(ids)) for (const id of texts(list)) (out[collection] ??= new Set()).add(id)
  }
  return Object.fromEntries(Object.entries(out).map(([c, ids]) => [c, [...ids].sort()]))
}

/** Does a schedule need any changing content at all? */
export const needsContent = (ids: ContentIds) => Object.values(ids).some((list) => list.length > 0)

/** A stable name for a set of content ids: the same ids always give the same key. */
export const contentKey = (ids: ContentIds) =>
  Object.keys(ids)
    .sort()
    .map((c) => `${c}=${ids[c].join(',')}`)
    .join(';')
