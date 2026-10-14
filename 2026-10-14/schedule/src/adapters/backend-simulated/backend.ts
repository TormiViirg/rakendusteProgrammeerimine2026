import type { Catalog, ContentSource, HallFacts, ScheduleSource, VenueFacts } from '../../core/ports'
import type { LocalizedText, ScheduleResponse } from '../../core/shift/records'
import { FALLBACK, isLang } from '../../locales/languages'
import { HALLS, VENUES } from './catalog'
import { FILMS, PROGRAMMES, type Translations } from './content'
import { desktopGeneralMock, desktopMock, generalMock, mixedMock, screeningMock, type MockSchedule } from './schedules'

/**
 * ADAPTER — a backend that lives in the bundle. It implements the three data
 * ports (schedule, content, catalog) from the files next to it, with a
 * simulated network delay.
 *
 * To go live, write an adapter with the same three members that calls the real
 * API, and hand that to app/compose.ts instead. Nothing else changes.
 */

/** The mockup schedules it serves, by `view`. */
export const MOCK_VIEWS = {
  general: generalMock,
  screening: screeningMock,
  desktop: desktopMock,
  'desktop-general': desktopGeneralMock,
  mixed: mixedMock,
} satisfies Record<string, MockSchedule>

export type MockView = keyof typeof MOCK_VIEWS

/** Rows added on top of the built-in ones (the test fixtures use this). */
export interface BackendExtras {
  /** by collection: { films: { id: { et: '…' } } } */
  content?: Record<string, Record<string, Translations>>
  venues?: Record<string, VenueFacts>
  halls?: Record<string, HallFacts>
}

export interface SimulatedBackend extends ScheduleSource, ContentSource {
  catalog: Catalog
  /** simulated network delay in ms */
  setLatency(ms: number): void
}

/** Picks the requested language, then its fallbacks, then whatever exists. */
function localize(tr: Translations | undefined, lang: string): LocalizedText | undefined {
  if (!tr) return undefined
  for (const l of [lang, ...(isLang(lang) ? FALLBACK[lang] : []), ...Object.keys(tr)]) {
    const text = tr[l]
    if (text) return { text, lang: l }
  }
  return undefined
}

export function createSimulatedBackend(extras: BackendExtras = {}): SimulatedBackend {
  const venues = { ...VENUES, ...extras.venues }
  const halls = { ...HALLS, ...extras.halls }
  let latency = 250
  const wait = <T,>(value: T) => new Promise<T>((r) => setTimeout(() => r(value), latency))

  const collections: Record<string, Record<string, Translations>> = { films: FILMS, programmes: PROGRAMMES }
  for (const [name, rows] of Object.entries(extras.content ?? {})) collections[name] = { ...(Object.hasOwn(collections, name) ? collections[name] : undefined), ...rows }
  // an id (or a whole collection) this backend does not know is simply not in the answer:
  // the pipeline shows the raw id and reports it
  const pick = (table: Record<string, Translations> | undefined, wanted: string[], lang: string) => {
    const out: Record<string, LocalizedText> = {}
    for (const id of new Set(wanted)) {
      const text = table && Object.hasOwn(table, id) ? localize(table[id], lang) : undefined
      if (text) out[id] = text
    }
    return out
  }

  return {
    setLatency: (ms) => {
      latency = ms
    },
    fetchSchedule({ view }): Promise<ScheduleResponse> {
      const mock = Object.hasOwn(MOCK_VIEWS, view) ? MOCK_VIEWS[view as MockView] : undefined
      return wait({ shifts: structuredClone(mock?.shifts ?? []) })
    },
    fetchContent: (lang, ids) =>
      wait({ lang, items: Object.fromEntries(Object.entries(ids).map(([c, wanted]) => [c, pick(Object.hasOwn(collections, c) ? collections[c] : undefined, wanted, lang)])) }),
    catalog: {
      venue: (id) => (Object.hasOwn(venues, id) ? venues[id] : undefined),
      hall: (id) => (Object.hasOwn(halls, id) ? halls[id] : undefined),
    },
  }
}
