import { describe, expect, it } from 'vitest'
import { fitFloor } from '../../src/core/fit/floor'
import { compileKinds } from '../../src/core/ticket/compile'
import type { AnyKind, KindRegistry } from '../../src/core/ticket/kind'
import { FIT } from '../../src/design/fit'
import { ROLE_TONES, toneOf } from '../../src/design/tones'
import { BASE } from '../../src/design/tokens'
import { KINDS } from '../../src/tickets/registry'
import { AGE_RATING, GAP_DISPLAY_MAX, SESSION_CODE_LENGTH } from '../../src/tickets/screening/record'
import { plan } from '../helpers/world'

/**
 * THE RULES AS THEY WERE STATED — written down here by hand, once, in the
 * festival's terms. Everything else in the tests derives its expectations from
 * the definitions (and so follows them when they change); this file does not.
 * If a number or a rule here has to change, that is a decision, not a refactor.
 */

const on = (kind: string, features: Record<string, boolean>, layout: 'thin' | 'wide') => plan(kind, features, layout)

describe('numbers', () => {
  it('the time between screenings is shown with at most three digits', () => expect(GAP_DISPLAY_MAX).toBe(999))
  it('the screening code always has six characters', () => expect(SESSION_CODE_LENGTH).toBe(6))
  it('an age rating is one or two digits', () => expect(AGE_RATING).toEqual({ min: 1, max: 99 }))
})

describe('shrinking: a quarter off, rounded to whole 4 pt steps, then "…"', () => {
  it('steps are 4 pt and the loss is a quarter', () => expect(FIT).toEqual({ step: 4, maxLoss: 0.25 }))
  // 36 × 0.25 = 9 → 27 → the nearest size on the 4 pt ladder below 36 is 28
  it.each([
    [36, 28],
    [32, 24],
    [24, 20],
    [20, 16],
    [16, 12],
    [12, 8],
  ])('%i pt may shrink to %i pt', (from, to) => expect(fitFloor(from)).toBe(to))
})

describe('the outline and the strip are the same on every ticket', () => {
  it('thin 357 × 326, wide 678 × 365', () => {
    expect([BASE.thin.frame.width, BASE.thin.frame.height]).toEqual([357, 326])
    expect([BASE.wide.frame.width, BASE.wide.frame.height]).toEqual([678, 365])
  })
  it('no kind may change them, whatever its variant', () => {
    for (const path of [{ thin: { frame: { height: 400 } } }, { thin: { strip: { tallH: 99 } } }, { thin: { foot: { h: 40 } } }] as const) {
      const base = KINDS.screening as AnyKind
      const bad: KindRegistry = { screening: { ...base, layouts: { ...base.layouts, thin: { ...base.layouts.thin, rules: [{ id: 'x', about: '', when: {}, set: path }] } } } }
      expect(compileKinds(bad).some((d) => d.level === 'error' && /protected/.test(d.message)), JSON.stringify(path)).toBe(true)
    }
  })
})

describe('night shifts', () => {
  it('weekdays show up only if the shift runs past midnight — on every kind, in both shapes', () => {
    const others: Record<string, Record<string, boolean>> = {
      break: { note: true },
      venue: { address: true },
      role: { hall: true, bc: true, address: true },
      screening: { rating: true, subtitles: true, bc: true, qa: true, address: true },
    }
    for (const [kind, rest] of Object.entries(others))
      for (const layout of ['thin', 'wide'] as const) {
        expect(on(kind, { ...rest, night: true }, layout).slots.weekdays, `${kind} ${layout} night`).toBe(true)
        expect(on(kind, { ...rest, night: false }, layout).slots.weekdays, `${kind} ${layout} day`).toBe(false)
      }
  })

  it('wolf prints only on night shifts — and by day on no ticket at all', () => {
    for (const kind of ['break', 'venue', 'role', 'screening']) for (const layout of ['thin', 'wide'] as const) expect(on(kind, { night: false, note: true, address: true, hall: true, bc: true, rating: true, subtitles: true, qa: true }, layout).slots.paw, `${kind} ${layout}`).toBe(false)
    // at night: where the ticket has room for them
    expect(on('break', { night: true, note: false }, 'thin').slots.paw).toBe(true)
    expect(on('break', { night: true, note: false }, 'wide').slots.paw).toBe(true)
    expect(on('venue', { night: true, address: true }, 'thin').slots.paw).toBe(true)
    expect(on('venue', { night: true, address: true }, 'wide').slots.paw).toBe(true)
    expect(on('role', { night: true, hall: true, bc: true, address: true }, 'wide').slots.paw).toBe(true)
    expect(on('role', { night: true, hall: true, bc: true, address: true }, 'thin').slots.paw).toBe(false)
    expect(on('screening', { night: true, rating: true, subtitles: true, bc: true, qa: true, address: true }, 'wide').slots.paw).toBe(true)
    expect(on('screening', { night: true, rating: true, subtitles: true, bc: true, qa: true, address: true }, 'thin').slots.paw).toBe(false)
  })

  it('wide cinema ticket: past midnight the times are one step smaller; by day there is more room above the barcode', () => {
    const night = on('venue', { night: true, address: true }, 'wide')
    const day = on('venue', { night: false, address: true }, 'wide')
    expect(night.overrides.wide?.headline?.times?.fs).toBe(36)
    expect(BASE.wide.headline.times.fs).toBe(40)
    expect(night.overrides.wide?.headline?.bodyPadBottom).toBeUndefined()
    expect(day.overrides.wide?.headline?.bodyPadBottom).toBe(34)
    expect(day.overrides.wide?.headline?.times).toBeUndefined()
  })
})

describe('BC and Q&A are shown only with a valid value', () => {
  it.each(['thin', 'wide'] as const)('%s', (layout) => {
    const all = { night: false, rating: true, subtitles: true, address: true }
    expect(on('screening', { ...all, bc: true, qa: false }, layout).slots).toMatchObject({ bc: true, qa: false })
    expect(on('screening', { ...all, bc: false, qa: true }, layout).slots).toMatchObject({ bc: false, qa: true })
    expect(on('role', { night: false, hall: true, address: true, bc: false }, layout).slots.bc).toBe(false)
  })
})

describe('the cinema\'s address under the barcode', () => {
  const screening = (bc: boolean, qa: boolean, address = true) => ({ night: false, rating: false, subtitles: true, bc, qa, address })

  it('wide screening ticket: shown when two or fewer of BC · Q&A · audience · code are filled — that is, with neither BC nor Q&A', () => {
    expect(on('screening', screening(false, false), 'wide').slots.address).toBe(true)
    expect(on('screening', screening(true, false), 'wide').slots.address).toBe(false)
    expect(on('screening', screening(false, true), 'wide').slots.address).toBe(false)
    expect(on('screening', screening(true, true), 'wide').slots.address).toBe(false)
  })
  it('phone screening ticket: only when the code is the footer\'s one column', () => {
    expect(on('screening', screening(false, false), 'thin').slots.address).toBe(true)
    expect(on('screening', screening(true, false), 'thin').slots.address).toBe(false)
    expect(on('screening', screening(false, true), 'thin').slots.address).toBe(false)
  })
  it('role ticket: always, next to BC or alone', () => {
    for (const layout of ['thin', 'wide'] as const) for (const bc of [true, false]) expect(on('role', { night: false, hall: true, bc, address: true }, layout).slots.address).toBe(true)
  })
  it('never without an address', () => {
    for (const layout of ['thin', 'wide'] as const) {
      expect(on('screening', screening(false, false, false), layout).slots.address).toBe(false)
      expect(on('role', { night: false, hall: true, bc: false, address: false }, layout).slots.address).toBe(false)
      expect(on('venue', { night: false, address: false }, layout).slots.caption).toBe(false)
    }
  })
})

describe('without subtitles the phone ticket\'s holo strip takes the desktop band\'s proportions', () => {
  it('678 : 42 on 357 pt → 22 pt, only when there are no subtitles', () => {
    const without = on('screening', { night: false, rating: false, subtitles: false, bc: false, qa: false, address: true }, 'thin')
    const withSubs = on('screening', { night: false, rating: false, subtitles: true, bc: false, qa: false, address: true }, 'thin')
    expect(without.overrides.thin?.holo?.strip).toBe(22)
    expect(Math.round((357 * 42) / 678)).toBe(22)
    expect(withSubs.overrides.thin?.holo).toBeUndefined()
  })
})

describe('colour follows the position', () => {
  /** sRGB hex → oklch, by the published formulas (Björn Ottosson) — independent of how the table was made. */
  function oklch(hex: string): [number, number, number] {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360]
  }

  it.each([
    ['admin', '3D6B58'],
    ['ticket-seller', 'CF5663'],
    ['checker', '57A8CD'],
    ['viewer', '5898DA'],
    ['black-carpet', '797979'],
    ['projectionist', '000000'],
    ['screening-manager', '24B195'],
    ['gate', '15657D'],
    ['gate-admin', '03495A'],
  ])('%s is #%s', (role, hex) => {
    const [L, C, H] = oklch(hex)
    const m = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(ROLE_TONES[role])
    expect(m, ROLE_TONES[role]).not.toBeNull()
    const [l, c, h] = m!.slice(1).map(Number)
    expect(Math.abs(l - L)).toBeLessThan(0.002)
    expect(Math.abs(c - C)).toBeLessThan(0.002)
    if (C > 0.01) expect(Math.abs(h - H)).toBeLessThan(0.5)
  })

  it('exactly these nine; every other ticket is black', () => {
    expect(Object.keys(ROLE_TONES)).toHaveLength(9)
    for (const id of [undefined, 'photographer', 'no-such-role', 'constructor', '__proto__']) expect(toneOf(id)).toBe('oklch(0 0 0)')
  })
})
