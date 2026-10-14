import { useCallback, useEffect, useState } from 'react'
import type { Design } from '../core/design/resolveDesign'
import { DesignProvider } from '../ui/design/DesignProvider'
import { UiPortsProvider } from '../ui/ports'
import { Schedule } from '../ui/schedule/Schedule'
import { useSchedule } from '../ui/schedule/useSchedule'
import { TEST_VIEWS, casesOf, testPlan } from '../testing/source'
import { compose } from './compose'

/**
 * Demo shell: switches for the preview. Not part of the component library —
 * a real page needs only compose(), useSchedule, <DesignProvider> and <Schedule>.
 */

const app = compose()

/** The schedules the demo can show: the mockups (simulated backend) and the test suites (src/testing). */
const VIEW_LABELS = {
  general: 'General',
  screening: 'Screenings',
  desktop: 'Desktop',
  'desktop-general': 'Desktop general',
  mixed: 'Mixed',
  'test-base': 'Test · base',
  'test-each': 'Test · each class',
  'test-pairs': 'Test · pairs',
  'test-variants': 'Test · variants',
  'test-invalid': 'Test · invalid',
} as const satisfies Record<string, string> & Record<keyof typeof TEST_VIEWS, string>
type View = keyof typeof VIEW_LABELS
const VIEW_IDS = Object.keys(VIEW_LABELS) as View[]

/** Simulated screens for the scale selector in ticket.ts. `null` = the real window. */
const SCREEN_LIST: { id: string; label: string; size: { width: number; height: number } | null }[] = [
  { id: 'auto', label: 'This screen', size: null },
  { id: '320', label: '320', size: { width: 320, height: 568 } },
  { id: '393', label: '393', size: { width: 393, height: 873 } },
  { id: '430', label: '430', size: { width: 430, height: 932 } },
  { id: 'land', label: 'Landscape', size: { width: 844, height: 390 } },
  { id: 'tablet', label: 'Tablet', size: { width: 768, height: 1024 } },
  { id: 'desktop', label: 'Desktop', size: { width: 1280, height: 800 } },
  { id: 'wide', label: 'Ultrawide', size: { width: 2560, height: 1080 } },
]

const query = new URLSearchParams(location.search)
function param<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const v = query.get(key) as T | null
  return v && allowed.includes(v) ? v : fallback
}
app.setLatency(Number(query.get('latency') ?? 250))

export default function App() {
  const [view, setView] = useState<View>(() => param('view', VIEW_IDS, 'general'))
  const [ratio, setRatio] = useState(() => param('ratio', ['on', 'off'] as const, 'on') === 'on')
  const [mods, setMods] = useState(() => param('mods', ['on', 'off'] as const, 'on') === 'on')
  const [screen, setScreen] = useState(() => param('screen', SCREEN_LIST.map((x) => x.id), 'auto'))
  const [lang, setLang] = useState<string>(() => param('lang', app.languages, 'et'))
  const [page, setPage] = useState(() => Math.max(0, Number(query.get('page') ?? 0) || 0))
  const [design, setDesign] = useState<Design | null>(null)
  const panel = param('panel', ['1', '0'] as const, '1') === '1'

  useEffect(() => {
    const q = new URLSearchParams({ view, ratio: ratio ? 'on' : 'off', mods: mods ? 'on' : 'off', screen, lang })
    if (page) q.set('page', String(page))
    if (!panel) q.set('panel', '0')
    if (query.has('latency')) q.set('latency', query.get('latency')!)
    try {
      history.replaceState(null, '', `?${q}`)
    } catch {
      /* sandboxed previews may forbid URL changes — the state still lives in React */
    }
  }, [view, ratio, mods, screen, lang, panel, page])

  const { captions, days, info, pending, stale, paging, notice, problems } = useSchedule(app.data, app.kinds, { view, page }, lang)
  // read by scripts/check-layout.mjs: what this page is supposed to show
  useEffect(() => {
    ;(window as unknown as { __poffTest?: unknown }).__poffTest = { plan: testPlan(), paging, cases: casesOf(view, page), problems, ready: !pending }
  }, [view, page, paging, problems, pending])
  const viewport = SCREEN_LIST.find((x) => x.id === screen)?.size ?? null
  const onDesign = useCallback((d: Design) => setDesign(d), [])

  return (
    <div className="demo">
      <div className="demo__stage" style={viewport ? { width: viewport.width } : undefined} data-simulated={Boolean(viewport)}>
        <UiPortsProvider value={app.ui}>
          <DesignProvider ratio={ratio} modifiers={mods} tickets={info} viewport={viewport ?? undefined} lang={lang} onDesign={onDesign}>
            <Schedule
              days={days}
              captions={captions}
              kinds={app.kinds}
              views={app.views}
              lang={lang}
              languages={app.languages}
              onLang={setLang}
              dateRule={view === 'general'}
              pending={pending}
              stale={stale}
              notice={notice}
              problems={app.data.problems}
            />
          </DesignProvider>
        </UiPortsProvider>
      </div>
      {panel && (
        <aside className="demo__panel" aria-label="Preview options">
          <div className="seg" role="group" aria-label="View">
            {VIEW_IDS.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => {
                  setView(v)
                  setPage(0)
                }}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Screen">
            {SCREEN_LIST.map((s) => (
              <button key={s.id} type="button" aria-pressed={screen === s.id} onClick={() => setScreen(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Ratio A/B">
            <button type="button" aria-pressed={ratio} onClick={() => setRatio(true)}>
              A · ratio
            </button>
            <button type="button" aria-pressed={!ratio} onClick={() => setRatio(false)}>
              B · measured
            </button>
          </div>
          <div className="seg" role="group" aria-label="Modifiers">
            <button type="button" aria-pressed={mods} onClick={() => setMods(true)}>
              Modifiers on
            </button>
            <button type="button" aria-pressed={!mods} onClick={() => setMods(false)}>
              off
            </button>
          </div>
          {paging && paging.count > 1 && (
            <div className="seg" role="group" aria-label="Page">
              <button type="button" onClick={() => setPage((p) => (p - 1 + paging.count) % paging.count)}>
                ‹
              </button>
              <button type="button" aria-pressed="true">
                page {paging.index + 1} / {paging.count.toLocaleString('en')}
              </button>
              <button type="button" onClick={() => setPage((p) => (p + 1) % paging.count)}>
                ›
              </button>
            </div>
          )}
          {design && (
            <p className="demo__readout">
              scale <b>{design.scale.id}</b> · {design.layout} tickets · {design.columns} col · 1pt = {design.u.toFixed(2)}px · modifiers{' '}
              <b>{design.modifiers.map((m) => m.id).join(', ') || 'none'}</b>
            </p>
          )}
        </aside>
      )}
    </div>
  )
}
