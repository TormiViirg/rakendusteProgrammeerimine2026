#!/usr/bin/env node
/**
 * Renders the test suites in a headless browser and checks every ticket.
 *
 *   npm run build && npm run preview &      # serves http://localhost:4173
 *   npm run check:layout                    # the core screens × et, en, ru × every suite
 *   npm run check:layout -- --all           # every screen class and boundary width
 *   npm run check:layout -- --screen phone --lang et --suite each
 *
 * What the suites contain, which screens exist and what each case expects all
 * come from the app itself (src/testing): this script has no test data of its
 * own. It finds things by the data attributes the components set — data-slot,
 * data-check, data-part, data-field — never by a stylesheet's class names.
 *
 * Checks, per ticket:
 *   LAYOUT      outside    text or an icon leaves the ticket outline
 *               notch      text sits in a notch (it would be clipped)
 *               overflow   a fitted text overflows its box without being cut with "…"
 *               overlap    two texts, or a text and an icon / the age badge, overlap
 *               clipped    text runs past the fixed body, strip or footer it lives in
 *               hidden     a part has text but none of it is drawn
 *               size       outlines or strips of the same shape differ on one page
 *   STRUCTURE   slots      an optional part is drawn although the ticket's plan says
 *                          absent, or the other way round
 *               opens      a text cut with "…" cannot be opened (no full text, not focusable)
 *   CATALOGUE   expect     the ticket does not show what its input classes say it must — the exact text,
 *                          in the page's language, as the catalogue read it from the locale files
 *               problems   the problems reported for a record (field and defect) are not the ones its values name
 *               drawn      an invalid record was drawn, or a valid one was not
 *               base       the ordinary ticket on the phone — the mockup's own content — has cut or shrunk text (Estonian only)
 * and per page: the scale the screen selected, horizontal page overflow, script errors.
 *
 * A failure is reported with the input classes of its ticket; at the end the
 * classes are ranked by how many failing tickets they are on.
 *
 * CHROME_PATH can point at a Chromium binary; BASE_URL at another server.
 */
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const args = process.argv.slice(2)
const opt = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined)
const ALL = args.includes('--all')
const ONLY = { screen: opt('screen'), lang: opt('lang'), suite: opt('suite') }
const LANGS = ['et', 'en', 'ru'].filter((l) => !ONLY.lang || l === ONLY.lang)
const MAX_LINES = Number(opt('max') ?? 80)

/** Runs in the page. Returns what is wrong with it, and some counts. */
function inspect({ lang }) {
  const TOL = 1.5
  const SAME = 0.25
  const test = window.__poffTest ?? { cases: [], problems: [] }
  const out = []
  const textRects = (el) => {
    const r = document.createRange()
    r.selectNodeContents(el)
    return [...r.getClientRects()].filter((b) => b.width > 0.5 && b.height > 0.5)
  }
  const contentBox = (el) => {
    const b = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    const l = parseFloat(cs.paddingLeft)
    const r = parseFloat(cs.paddingRight)
    return { left: b.left + l, right: b.right - r, top: b.top, bottom: b.bottom, width: b.width - l - r, height: b.height }
  }
  const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > TOL && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > TOL
  // glyphs do not fill their line box: compare a slightly shrunk box so tight leading is not reported
  const inkOf = (b) => ({ left: b.left, right: b.right, top: b.top + b.height * 0.2, bottom: b.bottom - b.height * 0.2 })

  // sizes of things that must be identical on every ticket; a value is a list of numbers in CSS px
  const sizes = new Map()
  const note = (kind, numbers, id) => {
    const seen = sizes.get(kind) ?? []
    // the same size: every number within SAME px (columns start at fractional positions, so boxes round differently)
    const same = seen.find((s) => s.numbers.every((n, i) => Math.abs(n - numbers[i]) <= SAME))
    if (!same) seen.push({ numbers, id })
    sizes.set(kind, seen)
  }

  const cards = new Map()
  document.querySelectorAll('[data-check="ticket"]').forEach((card) => {
    const id = card.dataset.id
    cards.set(id, card)
    const c = card.getBoundingClientRect()
    const [nTop, nBot, depth, sides] = (card.dataset.notch ?? '0 0 0 1').split(' ').map(Number)
    const report = (check, what) => out.push({ check, id, what })
    const shape = card.dataset.layout

    // ── LAYOUT ──
    // the outline and the strip must be identical on every ticket of a shape
    note(`${shape} outline`, [c.width, c.height], id)
    card.querySelectorAll('[data-part="strip"]').forEach((st) => {
      const r = st.getBoundingClientRect()
      note(`strip ${st.dataset.strip}`, [r.width, r.height, r.top - c.top, r.left - c.left], id)
    })

    const items = []
    card.querySelectorAll('[data-check="text"]').forEach((el) => {
      // text cut with … still has its hidden lines in the Range: use the visible box instead
      const rects = el.dataset.fit === 'clamp' ? [contentBox(el)] : textRects(el.querySelector('[data-fit-text]') ?? el)
      const name = (el.textContent ?? '').trim().slice(0, 28)
      if (rects.length) items.push({ el, rects, name })
      // a part that has text but draws none of it would otherwise escape every check below
      else if (name) report('hidden', name)
    })
    card.querySelectorAll('[data-check="icon"]').forEach((el) => {
      items.push({ el, rects: [el.getBoundingClientRect()], name: `<${el.dataset.slot ?? 'icon'}>`, icon: true })
    })

    for (const it of items) {
      for (const b of it.rects) {
        if (b.left < c.left - TOL || b.right > c.right + TOL || b.top < c.top - TOL || b.bottom > c.bottom + TOL) {
          report('outside', it.name)
          break
        }
        const y0 = c.top + nTop
        const y1 = c.top + nBot
        const ink = inkOf(b)
        const inY = ink.bottom > y0 + TOL && ink.top < y1 - TOL
        if (!it.icon && inY && (b.right > c.right - depth + TOL || (sides === 2 && b.left < c.left + depth - TOL))) {
          report('notch', it.name)
          break
        }
      }
      if (it.el.matches('[data-field]') && !it.el.dataset.fit && it.el.scrollWidth > it.el.clientWidth + 1) report('overflow', it.name)
      // fixed boxes: nothing may run past the body, the strip or the footer it sits in
      const box = it.el.closest?.('[data-part]')
      if (box && !it.icon) {
        const bb = box.getBoundingClientRect()
        if (it.rects.some((b) => inkOf(b).bottom > bb.bottom + TOL || inkOf(b).top < bb.top - TOL)) report('clipped', it.name)
      }
    }

    // age badge: a square turned 45° — a rect overlaps it if its nearest point to the centre is inside
    const badge = card.querySelector('[data-check="badge"]')
    if (badge) {
      const b = badge.getBoundingClientRect()
      const cx = b.left + b.width / 2
      const cy = b.top + b.height / 2
      const half = b.width / 2
      for (const it of items) {
        for (const r of it.rects.map(inkOf)) {
          const px = Math.min(Math.max(cx, r.left), r.right)
          const py = Math.min(Math.max(cy, r.top), r.bottom)
          if (Math.abs(px - cx) + Math.abs(py - cy) < half - TOL - 1) {
            report('overlap', `${it.name} × age badge`)
            break
          }
        }
      }
    }
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]
        const b = items[j]
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue
        if (a.icon && b.icon) continue
        if (a.rects.some((x) => b.rects.some((y) => hit(a.icon ? x : inkOf(x), b.icon ? y : inkOf(y))))) report('overlap', `${a.name} × ${b.name}`)
      }
    }

    // ── STRUCTURE ──
    const planned = new Set((card.dataset.slots ?? '').split(' ').filter(Boolean))
    for (const slot of (card.dataset.optional ?? '').split(' ').filter(Boolean)) {
      const drawn = card.querySelector(`[data-slot="${slot}"]`) !== null
      if (drawn !== planned.has(slot)) report('slots', `"${slot}" is ${drawn ? 'drawn' : 'not drawn'} but the plan says ${planned.has(slot) ? 'present' : 'absent'}`)
    }
    card.querySelectorAll('[data-field][data-fit="clamp"]').forEach((el) => {
      if (!el.dataset.full || el.getAttribute('tabindex') !== '0') report('opens', `"${(el.textContent ?? '').trim().slice(0, 24)}" cannot be opened`)
    })
  })

  for (const [kind, seen] of sizes) {
    const text = (s) => `${s.numbers.map((n) => n.toFixed(2)).join(' ')} (${s.id})`
    if (seen.length > 1) out.push({ check: 'size', id: seen[1].id, what: `${kind} [width height top left]: ${seen.map(text).join(' vs ').slice(0, 200)}` })
  }

  // ── CATALOGUE ──
  const reported = new Map()
  for (const p of test.problems) reported.set(p.shiftId, [...(reported.get(p.shiftId) ?? []), `${p.field ?? ''}:${p.code}`])
  // What a part shows. What is PRINTED counts: the text in the DOM, without the soft hyphens and the
  // line breaks of the layout. Two exceptions, each still tied to the print:
  //   • a caption wraps the value ("BC: 59 min") — the bare value is data-value, and it must be in the print;
  //   • the text is cut with "…" — the whole text is data-full (what the popover opens), and the print is the same text clipped by CSS.
  const printed = (el) => (el.querySelector('[data-fit-text]') ?? el).textContent.replaceAll('\u00AD', '').replace(/\s+/g, ' ').trim()
  const shown = (el) => {
    const print = printed(el)
    if (el.dataset.value !== undefined) return print.includes(el.dataset.value) ? el.dataset.value : `${el.dataset.value} (but prints "${print}")`
    if (el.dataset.full !== undefined) return print === el.dataset.full.replaceAll('\u00AD', '').replace(/\s+/g, ' ').trim() ? print : `${el.dataset.full} (but prints "${print}")`
    return print
  }
  let expectations = 0
  let invalid = 0
  for (const c of test.cases) {
    const card = cards.get(c.id)
    const report = (check, what) => out.push({ check, id: c.id, what })
    if (c.validity === 'invalid') {
      invalid++
      if (card) report('drawn', 'an invalid record was drawn')
    } else if (!card) report('drawn', 'a valid record was not drawn')

    const found = [...new Set(reported.get(c.id) ?? [])].sort().join(', ')
    const named = [...c.problems].sort().join(', ')
    if (found !== named) report('problems', `reported [${found}], expected [${named}]`)

    if (!card) continue
    for (const e of c.expect) {
      if ('tone' in e) {
        const tone = getComputedStyle(card).getPropertyValue('--tone').trim()
        if (tone !== e.tone) report('expect', `accent colour is ${tone}, expected ${e.tone}`)
        continue
      }
      expectations++
      const els = [...card.querySelectorAll(`[data-slot="${e.slot}"]`)]
      if ('present' in e) {
        if (els.length > 0 !== e.present) report('expect', `"${e.slot}" is ${els.length ? 'present' : 'absent'}, expected ${e.present ? 'present' : 'absent'}`)
        continue
      }
      const exact = 'is' in e
      const wanted = (exact ? e.is : e.has)[lang]
      if (wanted === undefined) report('expect', `"${e.slot}": the catalogue has no expected text for "${lang}"`)
      else if (!els.length) {
        if (!e.whenDrawn) report('expect', `"${e.slot}" is absent, expected "${wanted}"`)
      }
      else
        for (const el of els) {
          const value = shown(el)
          const want = wanted.replace(/\s+/g, ' ').trim()
          if (exact ? value !== want : !value.includes(want)) report('expect', `"${e.slot}" shows "${value}", expected ${exact ? '' : 'to contain '}"${wanted}"`)
        }
    }
    // The ordinary ticket on the phone is the mockup's own content: nothing is cut or set smaller.
    // (A wide ticket is drawn at many zooms; there its long programme line may shrink or be cut.)
    if (c.suite === 'base' && lang === 'et' && card.dataset.layout === 'thin') {
      card.querySelectorAll('[data-field][data-fit="clamp"], [data-field][data-shrunk="1"]').forEach((el) => report('base', `${el.dataset.field} is ${el.dataset.fit ? 'cut' : 'shrunk'}: "${(el.textContent ?? '').trim().slice(0, 24)}"`))
    }
  }
  if (invalid > 0) {
    const notice = document.querySelector('[data-notice]')?.textContent ?? ''
    if (!notice.includes(String(invalid))) out.push({ check: 'drawn', id: 'page', what: `${invalid} records are invalid but the notice says "${notice}"` })
  }

  const sc = document.querySelector('[data-scale]')
  const fits = [...document.querySelectorAll('[data-field]')]
  return {
    violations: out,
    cards: cards.size,
    cases: test.cases.length,
    expectations,
    pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
    widest: [...document.querySelectorAll('[data-scale] *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 3).map((e) => `${e.tagName}.${e.className.baseVal ?? e.className}`),
    scale: sc?.dataset.scale,
    cut: fits.filter((f) => f.dataset.fit).length,
    fits: fits.length,
    // how every text of every ticket ended up: size, lines, cut — compared between screens of one class
    fitted: Object.fromEntries([...cards].map(([id, card]) => [id, [...card.querySelectorAll('[data-field]')].map((f) => `${f.dataset.field}:${f.dataset.fitSize}/${f.dataset.used}${f.dataset.fit ? '…' : ''}`).join(' ')])),
    caseInfo: Object.fromEntries(test.cases.map((c) => [c.id, { title: c.title, suite: c.suite, subject: c.subject, choices: c.choices }])),
  }
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })

// what is there to check? ask the app
const probe = await browser.newPage()
await probe.goto(`${BASE}/?view=test-base&panel=0&latency=0`)
await probe.waitForFunction(() => window.__poffTest?.ready)
const plan = await probe.evaluate(() => window.__poffTest.plan)
await probe.close()

const screens = plan.screens.filter((s) => (ONLY.screen ? s.id === ONLY.screen : ALL || s.core))
const suites = Object.entries(plan.suites).filter(([id]) => !ONLY.suite || id === ONLY.suite)
if (!screens.length || !suites.length || !LANGS.length) {
  console.error('nothing to check: unknown --screen, --suite or --lang')
  process.exit(2)
}

const CHECKS = ['outside', 'notch', 'overflow', 'overlap', 'clipped', 'hidden', 'size', 'slots', 'opens', 'expect', 'problems', 'drawn', 'base', 'page']
const summary = new Map()
const byClass = new Map()
let failures = 0
// scale|lang|suite|case → fitting → the screens that produced it
const fittings = new Map()
let printed = 0
let tickets = 0
let cases = 0
let expectations = 0
let loads = 0

for (const screen of screens) {
  for (const lang of LANGS) {
    for (const [suite, { view, pages }] of suites) {
      const key = `${screen.id.padEnd(14)} ${lang}  ${suite.padEnd(8)}`
      const row = summary.get(key) ?? { tickets: 0, cases: 0, cut: 0, fits: 0, ...Object.fromEntries(CHECKS.map((c) => [c, 0])) }
      for (let p = 0; p < pages; p++) {
        const page = await browser.newPage({ viewport: { width: screen.width, height: screen.height } })
        const errors = []
        page.on('pageerror', (e) => errors.push(String(e)))
        await page.goto(`${BASE}/?view=${view}&page=${p}&lang=${lang}&panel=0&latency=0`)
        await page.waitForFunction(() => window.__poffTest?.ready)
        // settled: fonts in, every ticket's allocator done, and nothing has changed for a moment
        await page.evaluate(() => document.fonts.ready)
        await page.waitForFunction(() => document.fonts.status === 'loaded' && !document.querySelector('[data-allocator]:not([data-allocator="done"])'))
        await page.waitForTimeout(350)
        const res = await page.evaluate(inspect, { lang })
        await page.close()
        loads++
        tickets += res.cards
        cases += res.cases
        expectations += res.expectations
        row.tickets += res.cards
        row.cases += res.cases
        row.cut += res.cut
        row.fits += res.fits

        for (const [id, fit] of Object.entries(res.fitted)) {
          const key = `${screen.scale} ${lang} ${id}`
          const seen = fittings.get(key) ?? new Map()
          seen.set(fit, [...(seen.get(fit) ?? []), screen.id])
          fittings.set(key, seen)
        }
        const where = `${screen.id} ${lang} ${view} p${p}`
        const fail = (check, id, what) => {
          row[check]++
          failures++
          const info = res.caseInfo[id]
          // in the one-at-a-time suites the varied class is the suspect; elsewhere every class of the ticket is
          const suspects = info ? (info.subject ? [info.subject] : info.choices) : []
          for (const s of suspects) {
            const name = `${s.parameter} = ${s.cls}${s.point === 'typical' ? '' : ` · ${s.point}`}`
            byClass.set(name, (byClass.get(name) ?? 0) + 1)
          }
          if (printed++ < MAX_LINES) console.log(`  ${where}: ${check.padEnd(8)} ${id}${info ? ` [${info.title.slice(0, 70)}]` : ''} — ${what}`)
        }
        for (const v of res.violations) fail(v.check, v.id, v.what)
        if (res.scale !== screen.scale) fail('page', 'page', `selected scale "${res.scale}", this screen should get "${screen.scale}"`)
        if (res.pageOverflow > 1) fail('page', 'page', `page overflows by ${res.pageOverflow}px: ${res.widest.join(', ')}`)
        for (const e of errors) fail('page', 'page', `script error: ${e}`)
      }
      summary.set(key, row)
    }
  }
}
await browser.close()

console.log(`\n${loads} page loads · ${cases} cases · ${tickets} tickets drawn · ${expectations} expectations checked · ${screens.length} screens × ${LANGS.length} languages × ${suites.length} suites\n`)
console.log(`${'screen'.padEnd(14)} lang suite     cases drawn   cut texts  ${CHECKS.map((c) => c.padStart(8)).join(' ')}`)
for (const [key, r] of summary) {
  console.log(`${key} ${String(r.cases).padStart(5)} ${String(r.tickets).padStart(5)}  ${`${r.cut}/${r.fits}`.padStart(10)}  ${CHECKS.map((c) => String(r[c] || '·').padStart(8)).join(' ')}`)
}
if (failures) {
  if (printed > MAX_LINES) console.log(`\n(${printed - MAX_LINES} more lines not shown; --max N shows more)`)
  console.log('\nfailing tickets by input class:')
  for (const [name, n] of [...byClass].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${String(n).padStart(5)}  ${name}`)
}
// Not a failure, but worth knowing: screens of one class draw the same ticket at different zooms, and
// a text that just fits at one zoom may need a smaller size or another line at the next.
const compared = [...fittings.values()].filter((seen) => [...seen.values()].flat().length > 1)
if (compared.length) {
  const differing = [...fittings].filter(([, seen]) => seen.size > 1)
  console.log(`\nsame ticket on screens of the same class: ${compared.length} compared, ${differing.length} fitted differently at some zoom (${((100 * differing.length) / compared.length).toFixed(1)} %)`)
  for (const [key, seen] of differing.slice(0, 5)) console.log(`  ${key}: ${[...seen.values()].map((s) => s.join('+')).join('  vs  ')}`)
}
if (cases === 0) {
  console.error('\nno cases were checked')
  process.exit(2)
}
console.log(failures ? `\n${failures} problem(s)` : '\nno problems')
process.exit(failures ? 1 : 0)
