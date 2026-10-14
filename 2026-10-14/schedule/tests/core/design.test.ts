import { describe, expect, it } from 'vitest'
import { resolveDesign } from '../../src/core/design/resolveDesign'
import { merge } from '../../src/core/design/merge'
import type { DesignContext } from '../../src/design/scales'
import { BASE } from '../../src/design/tokens'
import { SCREENS } from '../../src/testing/screens'

const ctx = (over: Partial<DesignContext>): DesignContext => ({ width: 393, height: 873, kinds: ['venue'], count: 1, longestText: 10, ...over })
const scaleAt = (width: number, height: number) => resolveDesign(ctx({ width, height }), { ratio: true }).scale.id

describe('scales — which screen gets which tickets', () => {
  // classes: phone · phone on its side · one, two, three columns of wide tickets; boundaries on both sides of each change
  it.each([
    [320, 568, 'phone'],
    [599, 960, 'phone'],
    [600, 960, 'wide-1'],
    [844, 390, 'phone-landscape'],
    [1099, 500, 'phone-landscape'],
    [1099, 501, 'wide-1'],
    [1100, 500, 'wide-2'],
    [1099, 1400, 'wide-1'],
    [1100, 800, 'wide-2'],
    [2199, 1200, 'wide-2'],
    [2200, 1200, 'wide-3'],
    [500, 400, 'phone-landscape'],
  ])('%d × %d → %s', (w, h, scale) => {
    expect(scaleAt(w, h)).toBe(scale)
  })

  it('every screen of the test catalogue selects the scale it claims to stand for', () => {
    for (const s of SCREENS) expect(scaleAt(s.width, s.height), s.id).toBe(s.scale)
  })

  it('thin tickets are never placed side by side', () => {
    for (let w = 200; w < 3000; w += 37) {
      const d = resolveDesign(ctx({ width: w, height: w * 2 }), { ratio: true })
      if (d.layout === 'thin') expect(d.columns).toBe(1)
    }
  })

  it('zoom: the page fills the width, capped at 1.25 on wide layouts', () => {
    expect(resolveDesign(ctx({ width: 393 }), { ratio: true }).u).toBeCloseTo(1)
    expect(resolveDesign(ctx({ width: 1440, height: 900 }), { ratio: true }).u).toBeCloseTo(1)
    expect(resolveDesign(ctx({ width: 2199, height: 1200 }), { ratio: true }).u).toBe(1.25)
  })
})

describe('modifiers — page-wide adjustments', () => {
  const ids = (over: Partial<DesignContext>) => resolveDesign(ctx(over), { ratio: true }).modifiers.map((m) => m.id)

  it('dense: from 9 tickets', () => {
    expect(ids({ count: 8 })).not.toContain('dense')
    expect(ids({ count: 9 })).toContain('dense')
  })
  it('long-text: a headline longer than 40 characters', () => {
    expect(ids({ longestText: 40 })).not.toContain('long-text')
    expect(ids({ longestText: 41 })).toContain('long-text')
  })
  it('mixed: tickets with and without a film together', () => {
    expect(ids({ kinds: ['screening'] })).not.toContain('mixed')
    expect(ids({ kinds: ['venue', 'role', 'break'] })).not.toContain('mixed')
    expect(ids({ kinds: ['screening', 'break'] })).toContain('mixed')
  })
  it('can be switched off', () => {
    expect(resolveDesign(ctx({ count: 99 }), { ratio: true, modifiers: false }).modifiers).toEqual([])
  })
})

describe('merge', () => {
  it('lays partial tokens over the tree without changing either', () => {
    const out = merge(BASE, { thin: { holo: { strip: 22 } } })
    expect(out.thin.holo).toEqual({ band: 42, strip: 22 })
    expect(BASE.thin.holo.strip).toBe(12)
    expect(out.wide).toBe(BASE.wide)
  })
})
