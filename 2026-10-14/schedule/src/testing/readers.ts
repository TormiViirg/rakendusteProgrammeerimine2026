import type { Captions } from '../core/schedule/captions'
import type { TicketModel } from '../core/ticket/kind'
import type { TicketPlan } from '../core/ticket/plan'
import { toneOf } from '../design/tones'
import type { Expectation } from './catalogue/types'

/**
 * Reads a built ticket the way the browser checks read the DOM: by slot.
 * With it the catalogue's expectations can be checked without a browser, on
 * the model the pipeline produced — the unit tests do that for every value,
 * in every language.
 *
 * One reader per slot name. A slot the catalogue expects something of but
 * nothing here can read is an error, never a silent pass.
 */
type Loose = Record<string, unknown>
type Reader = (model: Loose, captions: Captions) => string | undefined

const text = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)
const measure = (v: unknown): string | undefined => (v && typeof v === 'object' && 'value' in v ? text((v as Loose).value) : undefined)
const part = (v: unknown): Loose => (v && typeof v === 'object' ? (v as Loose) : {})
const list = (v: unknown, separator: string): string | undefined => (Array.isArray(v) ? v.join(separator) : undefined)

const READERS: Record<string, Reader> = {
  arrival: (m) => text(part(m.time).arrival),
  start: (m) => text(part(m.time).start),
  end: (m) => text(part(m.time).end),
  weekdays: (m) => {
    const { startDay, endDay } = part(m.time)
    return text(startDay) === undefined ? undefined : `${startDay}-${endDay}`
  },
  venue: (m) => text(part(m.place).name),
  hall: (m) => text(part(m.place).hall),
  address: (m) => text(part(m.place).address),
  role: (m) => text(m.role),
  audience: (m) => text(m.audience),
  title: (m) => text(m.title),
  caption: (m) => text(m.note) ?? text(part(m.place).address),
  film: (m) => text(m.film),
  programme: (m, c) => list(m.programme, c.programmeSeparator),
  subtitleList: (m, c) => list(m.subtitles, c.listSeparator),
  duration: (m) => measure(m.duration),
  gap: (m) => measure(m.gap),
  bc: (m) => measure(m.bc),
  qa: (m) => measure(m.qa),
  rating: (m) => text(m.rating),
  code: (m) => text(m.sessionCode),
}

/** Slots the plan decides and that show no text of their own. */
const PLAN_ONLY = ['paw', 'locate', 'subtitles']

export const knownSlot = (slot: string) => Object.hasOwn(READERS, slot) || PLAN_ONLY.includes(slot)

/** The text a slot shows; undefined when the model has nothing for it. */
export function slotValue(model: TicketModel, slot: string, captions: Captions): string | undefined {
  return Object.hasOwn(READERS, slot) ? READERS[slot](model as unknown as Loose, captions) : undefined
}

/** Is the slot drawn? The plan decides for optional slots; other slots are drawn when the model has a value. */
export function slotPresent(model: TicketModel, plan: TicketPlan, slot: string, captions: Captions): boolean {
  return Object.hasOwn(plan.slots, slot) ? plan.slots[slot] : slotValue(model, slot, captions) !== undefined
}

/** Returns what is wrong, or null. `lang` picks the expected text. */
export function failsExpectation(e: Expectation, model: TicketModel, plan: TicketPlan, captions: Captions, lang: string): string | null {
  if ('tone' in e) {
    // as the frame does it (ui/ticket/TicketFrame.tsx)
    const tone = toneOf(model.toneRole)
    return tone === e.tone ? null : `tone is ${tone}, expected ${e.tone}`
  }
  if (!knownSlot(e.slot) && !Object.hasOwn(plan.slots, e.slot)) return `nothing can read slot "${e.slot}"`
  const isThere = slotPresent(model, plan, e.slot, captions)
  if ('present' in e) return isThere === e.present ? null : `slot "${e.slot}" is ${isThere ? 'present' : 'absent'}, expected ${e.present ? 'present' : 'absent'}`
  const wanted = ('is' in e ? e.is : e.has)[lang]
  if (wanted === undefined) return `slot "${e.slot}": no expected text for language "${lang}"`
  if (!isThere) return 'whenDrawn' in e && e.whenDrawn ? null : `slot "${e.slot}" is absent, expected "${wanted}"`
  const value = slotValue(model, e.slot, captions)
  if (value === undefined) return `slot "${e.slot}" is drawn but has no text, expected "${wanted}"`
  const ok = 'is' in e ? value === wanted : value.includes(wanted)
  return ok ? null : `slot "${e.slot}" shows "${value}", expected ${'is' in e ? '' : 'to contain '}"${wanted}"`
}
