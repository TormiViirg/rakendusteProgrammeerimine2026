import { describe, expect, it } from 'vitest'
import { assertKinds, compileKinds } from '../../src/core/ticket/compile'
import { enumerate } from '../../src/core/ticket/feature'
import type { AnyKind, KindRegistry } from '../../src/core/ticket/kind'
import { planTicket } from '../../src/core/ticket/plan'
import { PROTECTED_TOKEN_PATHS } from '../../src/design/invariants'
import { LAYOUTS } from '../../src/design/layout'
import { num } from '../../src/design/tokens/leaf'
import { leaves } from '../../src/core/design/merge'
import { KINDS } from '../../src/tickets/registry'
import { VIEWS } from '../../src/tickets/views'

describe('the ticket definitions', () => {
  it('compile without errors or warnings', () => {
    expect(compileKinds(KINDS)).toEqual([])
    expect(() => assertKinds(KINDS)).not.toThrow()
  })

  it('every kind has a view for every ticket shape', () => {
    for (const id of Object.keys(KINDS)) for (const layout of LAYOUTS) expect(typeof VIEWS[id as keyof typeof VIEWS][layout], `${id} ${layout}`).toBe('function')
  })

  it('no variant of any kind touches the outline or the strip', () => {
    for (const kind of Object.values(KINDS) as AnyKind[])
      for (const layout of LAYOUTS)
        for (const v of enumerate(Object.keys(kind.features))) {
          const paths = leaves(planTicket(kind, v, layout).overrides).map(([p]) => p)
          for (const p of paths) expect(PROTECTED_TOKEN_PATHS.some((g) => p === g || p.startsWith(`${g}.`)), `${kind.id} ${layout} ${p}`).toBe(false)
        }
  })
})

/** The compiler must catch what it says it catches: one deliberately wrong definition per check. */
describe('the compiler rejects', () => {
  const base = KINDS.venue as AnyKind
  const withRules = (rules: AnyKind['layouts']['wide']['rules']): KindRegistry => ({ venue: { ...base, layouts: { ...base.layouts, wide: { ...base.layouts.wide, rules } } } })
  const messages = (kinds: KindRegistry) => compileKinds(kinds).filter((d) => d.level === 'error').map((d) => d.message)

  it('a rule that changes the outline', () => {
    expect(messages(withRules([{ id: 'x', about: '', when: {}, set: { wide: { frame: { height: 400 } } } }]))[0]).toMatch(/protected/)
  })
  it('a rule that changes the strip height', () => {
    expect(messages(withRules([{ id: 'x', about: '', when: {}, set: { wide: { strip: { h: 50 } } } }]))[0]).toMatch(/protected/)
  })
  it('a rule that sets a token that does not exist', () => {
    expect(messages(withRules([{ id: 'x', about: '', when: {}, set: { wide: { headline: { nope: 1 } } } as never }]))[0]).toMatch(/not a token/)
  })
  it('a rule that sets a token to the wrong kind of value', () => {
    expect(messages(withRules([{ id: 'x', about: '', when: {}, set: { wide: { headline: { titleFs: '46px' } } } as never }]))[0]).toMatch(/to a CSS value, but the token is a length in points/)
  })
  it('a condition on a feature the kind does not have', () => {
    expect(messages(withRules([{ id: 'x', about: '', when: { subtitles: true }, set: {} }]))[0]).toMatch(/not a feature/)
  })
  it('two rule ids that are the same', () => {
    expect(messages(withRules([{ id: 'x', about: '', when: {}, set: {} }, { id: 'x', about: '', when: {}, set: {} }]))[0]).toMatch(/twice/)
  })
  it('two rules whose order would silently decide', () => {
    const clash = withRules([
      { id: 'night', about: '', when: { night: true }, set: { wide: { headline: { titleFs: 40 } } } },
      { id: 'address', about: '', when: { address: true }, set: { wide: { headline: { titleFs: 50 } } } },
    ])
    expect(messages(clash)[0]).toMatch(/can both apply/)
  })
  it('… but accepts the same clash when the later rule is the more specific one', () => {
    const fine = withRules([
      { id: 'night', about: '', when: { night: true }, set: { wide: { headline: { titleFs: 40 } } } },
      { id: 'night-address', about: '', when: { night: true, address: true }, set: { wide: { headline: { titleFs: 50 } } } },
    ])
    expect(messages(fine)).toEqual([])
  })
  it('a budget that names a field of the other ticket shape, or no field at all', () => {
    const wrong: KindRegistry = { venue: { ...base, layouts: { ...base.layouts, wide: { rules: [], budget: { restore: ['thinHeadlineTitle', 'nope' as never], grow: [], maxExtraLines: 1 } } } } }
    expect(messages(wrong)).toEqual([expect.stringMatching(/other ticket shape/), expect.stringMatching(/not a text field/)])
  })
  it('two rules with the very same condition that disagree', () => {
    const twins = withRules([
      { id: 'a', about: '', when: { night: true }, set: { wide: { headline: { titleFs: 40 } } } },
      { id: 'b', about: '', when: { night: true }, set: { wide: { headline: { titleFs: 50 } } } },
    ])
    expect(messages(twins)[0]).toMatch(/can both apply/)
  })
  it('a wide rule that reaches into the thin ticket or the page', () => {
    expect(messages(withRules([{ id: 'x', about: '', when: {}, set: { thin: { headline: { titleFs: 30 } } } }]))[0]).toMatch(/a wide rule can only reach/)
    expect(messages(withRules([{ id: 'x', about: '', when: {}, set: { page: { headerH: 10 } } as never }])).join()).toMatch(/can only reach|protected|not a token/)
  })
  it('a rule that changes the line budget of a field of the other ticket shape', () => {
    expect(messages(withRules([{ id: 'x', about: '', when: {}, set: { lines: { thinScreeningProgramme: num(3) } } }]))[0]).toMatch(/other ticket shape/)
  })
  it('a slot that reads a feature the kind does not have, or does not answer yes or no', () => {
    const typo: KindRegistry = { venue: { ...base, slots: { ...base.slots, paw: (f: Record<string, boolean>) => f.nihgt } } }
    expect(messages(typo)[0]).toMatch(/nihgt/)
    const vague: KindRegistry = { venue: { ...base, slots: { ...base.slots, paw: () => undefined as never } } }
    expect(messages(vague)[0]).toMatch(/not true or false/)
  })
  it('a budget whose `grow` names a field of the other ticket shape, or no field at all', () => {
    const grow = (field: string): KindRegistry => ({ venue: { ...base, layouts: { ...base.layouts, wide: { rules: [], budget: { restore: [], grow: [{ field: field as never, steps: 1 }], maxExtraLines: 1 } } } } })
    expect(messages(grow('thinHeadlineTitle'))).toEqual([expect.stringMatching(/other ticket shape/)])
    expect(messages(grow('nope'))).toEqual([expect.stringMatching(/not a text field/)])
    expect(messages(grow('wideHeadlineTitle'))).toEqual([])
  })
  it('a kind registered under another name', () => {
    expect(messages({ cinema: base })[0]).toMatch(/registered as/)
  })
  it('warns about a feature nothing depends on', () => {
    const idle: KindRegistry = { venue: { ...base, features: { ...base.features, idle: { about: '', of: () => false } } } }
    expect(compileKinds(idle)).toEqual([expect.objectContaining({ level: 'warning', where: 'venue / feature idle' })])
  })
})
