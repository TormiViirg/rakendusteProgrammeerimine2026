import { describe, expect, it } from 'vitest'
import { describe as describeModel, enumerate, impliedBy, matches, overlap, variantName } from '../../src/core/ticket/feature'
import { applyRules } from '../../src/core/ticket/rule'
import { footerAddress, when } from '../../src/core/ticket/slot'

describe('the feature model', () => {
  it('describe reads every feature off the model', () => {
    const defs = { night: { about: '', of: (m: { n: boolean }) => m.n }, note: { about: '', of: () => false } }
    expect(describeModel(defs, { n: true })).toEqual({ night: true, note: false })
  })

  it('enumerate lists all 2ⁿ variants, each once', () => {
    expect(enumerate([])).toEqual([{}])
    const all = enumerate(['a', 'b', 'c'])
    expect(all.length).toBe(8)
    expect(new Set(all.map((v) => JSON.stringify(v))).size).toBe(8)
    expect(all[0]).toEqual({ a: false, b: false, c: false })
    expect(all[7]).toEqual({ a: true, b: true, c: true })
  })

  it('conditions are conjunctions; what they do not mention may be either', () => {
    const v = { night: true, bc: false }
    expect(matches({}, v)).toBe(true)
    expect(matches({ night: true }, v)).toBe(true)
    expect(matches({ night: true, bc: true }, v)).toBe(false)
  })

  it('overlap: can two conditions hold together?  impliedBy: is one the more general?', () => {
    expect(overlap({ night: true }, { bc: true })).toBe(true)
    expect(overlap({ night: true }, { night: false })).toBe(false)
    expect(impliedBy({ night: true }, { night: true, bc: true })).toBe(true)
    expect(impliedBy({ night: true, bc: true }, { night: true })).toBe(false)
    expect(impliedBy({}, { night: true })).toBe(true)
  })

  it('names a variant by what is on', () => {
    expect(variantName({ night: false, bc: false })).toBe('plain')
    expect(variantName({ night: true, bc: false, qa: true })).toBe('night+qa')
  })
})

describe('variant rules', () => {
  const rules = [
    { id: 'night', about: '', when: { night: true }, set: { thin: { holo: { strip: 20 } } } },
    { id: 'night-bc', about: '', when: { night: true, bc: true }, set: { thin: { holo: { strip: 30, band: 50 } } } },
  ]
  it('all that match apply, in order; a later rule wins', () => {
    expect(applyRules(rules, { night: false, bc: true })).toEqual({ overrides: {}, applied: [] })
    expect(applyRules(rules, { night: true, bc: false })).toEqual({ overrides: { thin: { holo: { strip: 20 } } }, applied: ['night'] })
    expect(applyRules(rules, { night: true, bc: true })).toEqual({ overrides: { thin: { holo: { strip: 30, band: 50 } } }, applied: ['night', 'night-bc'] })
  })
})

describe('slots', () => {
  it('when: a condition, optionally for one ticket shape only', () => {
    const paw = when<'night'>({ night: true }, { only: 'wide' })
    expect([paw({ night: true }, 'wide'), paw({ night: true }, 'thin'), paw({ night: false }, 'wide')]).toEqual([true, false, false])
    expect(when({})({}, 'thin')).toBe(true)
  })

  describe('footerAddress — the address joins the footer while it has room', () => {
    // wide screening footer: BC · Q&A · audience · code; room for the address up to two filled columns
    const rule = footerAddress<'address' | 'bc' | 'qa'>('address', {
      thin: { optional: ['bc', 'qa'], always: 1, max: 1 },
      wide: { optional: ['bc', 'qa'], always: 2, max: 2 },
    })
    it.each([
      [false, false, true, '2 columns filled: the boundary — shown'],
      [true, false, false, '3 columns filled: one too many'],
      [false, true, false, '3 columns filled'],
      [true, true, false, '4 columns filled'],
    ])('wide · bc %s · qa %s → %s (%s)', (bc, qa, shown) => {
      expect(rule({ address: true, bc, qa }, 'wide')).toBe(shown)
    })
    it('never without an address', () => {
      expect(rule({ address: false, bc: false, qa: false }, 'wide')).toBe(false)
    })
    it('the phone footer is narrower: only when the code is its one column', () => {
      expect(rule({ address: true, bc: false, qa: false }, 'thin')).toBe(true)
      expect(rule({ address: true, bc: true, qa: false }, 'thin')).toBe(false)
    })
  })
})
