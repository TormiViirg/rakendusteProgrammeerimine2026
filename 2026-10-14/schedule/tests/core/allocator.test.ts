import { describe, expect, it } from 'vitest'
import { MAX_PASSES, START, pickNext, step, type AllocatorState, type Budget, type Grants, type Observation } from '../../src/core/fit/allocator'
import { KINDS } from '../../src/tickets/registry'
import { MAX_LIFT, NO_GRANT } from '../../src/core/fit/grant'
import type { TextFieldId } from '../../src/design/fields'

/**
 * A model ticket body: a fixed room, and fields whose height and state depend
 * on what they have been granted. The allocator only ever sees it through an
 * Observation — exactly as it sees the DOM.
 */
interface ModelField {
  /** lines of text it needs to be whole at its design size */
  needs: number
  /** lines it gets without a grant */
  lines: number
  /** steps below its design size it starts at (a "long text" tier) */
  tier?: number
  lineHeight: number
}

function model(room: number, fields: Partial<Record<TextFieldId, ModelField>>) {
  const g = (grants: Grants, id: string) => grants[id] ?? NO_GRANT
  return (grants: Grants): Observation => {
    let height = 0
    const state: Record<string, { shrunk: boolean; cut: boolean; belowTier: boolean }> = {}
    for (const [id, f] of Object.entries(fields)) {
      const grant = g(grants, id)
      const allowed = f.lines + grant.lines
      const tier = grant.lines > 0 ? 0 : Math.max(0, (f.tier ?? 0) - grant.lift)
      // every step larger makes the text need one more line
      const needs = f.needs + grant.steps - tier
      const cut = needs > allowed
      height += Math.min(needs, allowed) * f.lineHeight * (1 + 0.2 * (grant.steps - tier))
      state[id] = { cut, shrunk: tier > 0 || (grant.steps > 0 && cut), belowTier: tier > 0 }
    }
    return { overflows: height > room, field: (id) => state[id] }
  }
}

/** Runs the machine to its end, as the React adapter does: observe, step, lay out again. */
function settle(budget: Budget, observe: (g: Grants) => Observation) {
  let state: AllocatorState = START
  const phases: string[] = []
  for (let i = 0; i < 200 && state.phase !== 'done'; i++) {
    state = step(budget, state, observe(state.grants))
    phases.push(state.phase === 'trying' ? `try ${state.trial.field}:${state.trial.kind}` : state.phase)
  }
  return { state, phases }
}

const A = 'thinScreeningProgramme' as const
const B = 'thinScreeningFilm' as const

describe('the space allocator', () => {
  it('nothing wanting, nothing to grow: done at once, no grants', () => {
    const { state, phases } = settle({ restore: [A], grow: [], maxExtraLines: 3 }, model(100, { [A]: { needs: 1, lines: 1, lineHeight: 16 } }))
    expect(phases).toEqual(['done'])
    expect(state.grants).toEqual({})
  })

  it('a cut text gets lines one at a time until it is whole', () => {
    const { state } = settle({ restore: [A], grow: [], maxExtraLines: 3 }, model(100, { [A]: { needs: 3, lines: 1, lineHeight: 16 } }))
    expect(state.grants[A].lines).toBe(2)
  })

  it('boundary: exactly enough room → granted; one unit less → reverted and blocked', () => {
    const fields = { [A]: { needs: 2, lines: 1, lineHeight: 16 } }
    expect(settle({ restore: [A], grow: [], maxExtraLines: 3 }, model(32, fields)).state.grants[A].lines).toBe(1)
    const tight = settle({ restore: [A], grow: [], maxExtraLines: 3 }, model(31, fields))
    expect(tight.state.grants[A].lines).toBe(0)
    expect(tight.state.blocked).toContain(`${A}:lines`)
    expect(tight.phases).toEqual([`try ${A}:lines`, 'reverting', 'done'])
  })

  it('never grants more lines than maxExtraLines', () => {
    const { state } = settle({ restore: [A], grow: [], maxExtraLines: 2 }, model(1000, { [A]: { needs: 9, lines: 1, lineHeight: 16 } }))
    expect(state.grants[A].lines).toBe(2)
  })

  it('restore comes before grow, and fields are served in budget order', () => {
    const budget: Budget = { restore: [A, B], grow: [{ field: B, steps: 1 }], maxExtraLines: 3 }
    const { phases } = settle(budget, model(1000, { [A]: { needs: 2, lines: 1, lineHeight: 16 }, [B]: { needs: 2, lines: 1, lineHeight: 24 } }))
    expect(phases.slice(0, 2)).toEqual([`try ${A}:lines`, `try ${B}:lines`])
    expect(phases.indexOf(`try ${B}:steps`)).toBeGreaterThan(phases.indexOf(`try ${B}:lines`))
  })

  it('lift: a long text that starts smaller is given its size back before any line', () => {
    const { state, phases } = settle({ restore: [A], grow: [], maxExtraLines: 3 }, model(1000, { [A]: { needs: 1, lines: 1, tier: 2, lineHeight: 16 } }))
    expect(phases[0]).toBe(`try ${A}:lift`)
    expect(state.grants[A]).toEqual({ ...NO_GRANT, lift: 2 })
    expect(state.grants[A].lift).toBeLessThanOrEqual(MAX_LIFT)
  })

  it('grow: an enlarged text that has to be cut again is put back', () => {
    // the field fills its one line: a step larger needs two → cut → the trial fails
    const { state } = settle({ restore: [], grow: [{ field: B, steps: 1 }], maxExtraLines: 0 }, model(1000, { [B]: { needs: 1, lines: 1, lineHeight: 24 } }))
    expect(state.grants[B].steps).toBe(0)
    expect(state.blocked).toContain(`${B}:steps`)
  })

  it('a field the ticket does not have is skipped', () => {
    const { state, phases } = settle({ restore: [A, B], grow: [{ field: B, steps: 1 }], maxExtraLines: 3 }, model(100, { [A]: { needs: 1, lines: 1, lineHeight: 16 } }))
    expect(phases).toEqual(['done'])
    expect(state.grants).toEqual({})
  })

  it('always ends, and the layout it ends on does not overflow', () => {
    const budget: Budget = { restore: [A, B], grow: [{ field: A, steps: 1 }, { field: B, steps: 1 }], maxExtraLines: 3 }
    for (let room = 0; room <= 200; room += 7) {
      for (const needs of [1, 2, 5]) {
        const observe = model(room, { [A]: { needs, lines: 1, tier: 1, lineHeight: 16 }, [B]: { needs: 2, lines: 1, lineHeight: 24 } })
        const { state } = settle(budget, observe)
        expect(state.phase).toBe('done')
        // whatever it granted fits — unless the body overflowed before anything was granted
        if (!observe({}).overflows) expect(observe(state.grants).overflows).toBe(false)
      }
    }
  })

  it('stays below React\'s limit of nested layout passes, even when every trial of the largest real budget fails', () => {
    for (const kind of Object.values(KINDS)) {
      for (const { budget } of Object.values(kind.layouts)) {
        // the worst case: every field always wants more, and nothing ever fits
        const greedy: Observation = { overflows: true, field: () => ({ cut: true, shrunk: true, belowTier: true }) }
        const hungry: Observation = { overflows: false, field: () => ({ cut: true, shrunk: true, belowTier: true }) }
        for (const obs of [greedy, hungry]) {
          let state: AllocatorState = START
          let passes = 0
          while (state.phase !== 'done') {
            state = step(budget, state, obs)
            passes++
            expect(passes).toBeLessThanOrEqual(MAX_PASSES + 2)
          }
          expect(passes).toBeLessThan(50)
        }
      }
    }
  })

  it('a lift is only tried before any extra line: once a text has more lines, its size is settled', () => {
    // the field starts a tier down and is cut; the lift fails (no room), so lines are granted instead
    const observe: Observation & { grants?: Grants } = { overflows: false, field: () => ({ cut: true, shrunk: true, belowTier: true }) }
    let state: AllocatorState = START
    const tried: string[] = []
    let grants: Grants = {}
    for (let i = 0; i < 30 && state.phase !== 'done'; i++) {
      // a lift always overflows here; a line never does
      const lifting = state.phase === 'trying' && state.trial.kind === 'lift'
      state = step({ restore: [A], grow: [], maxExtraLines: 2 }, state, { ...observe, overflows: lifting })
      if (state.phase === 'trying') tried.push(state.trial.kind)
      grants = state.grants
    }
    expect(tried).toEqual(['lift', 'lines', 'lines'])
    expect(grants[A]).toMatchObject({ lift: 0, lines: 2 })
  })

  it('a lift, once kept, is tried again up to MAX_LIFT and never after a line was granted', () => {
    const { phases } = settle({ restore: [A], grow: [], maxExtraLines: 2 }, model(1000, { [A]: { needs: 3, lines: 1, tier: 1, lineHeight: 16 } }))
    const firstLine = phases.indexOf(`try ${A}:lines`)
    expect(firstLine).toBeGreaterThan(0)
    expect(phases.slice(firstLine).filter((p) => p.endsWith(':lift'))).toEqual([])
  })

  it('pickNext: with a line already granted, a lift is not offered even if the text still reports a lower tier', () => {
    const obs: Observation = { overflows: false, field: () => ({ cut: false, shrunk: false, belowTier: true }) }
    const budget: Budget = { restore: [A], grow: [], maxExtraLines: 3 }
    expect(pickNext(budget, {}, [], obs)).toEqual({ field: A, kind: 'lift' })
    expect(pickNext(budget, { [A]: { ...NO_GRANT, lines: 1 } }, [], obs)).toBeNull()
    expect(pickNext(budget, { [A]: { ...NO_GRANT, lift: MAX_LIFT } }, [], obs)).toBeNull()
  })

  it('a text that is still shrunk or cut is not enlarged', () => {
    // cut, and no extra lines allowed: nothing can restore it — and growing it would only cut more
    const cut: Observation = { overflows: false, field: () => ({ cut: true, shrunk: false, belowTier: false }) }
    expect(step({ restore: [], grow: [{ field: B, steps: 2 }], maxExtraLines: 0 }, START, cut).phase).toBe('done')
    const shrunk: Observation = { overflows: false, field: () => ({ cut: false, shrunk: true, belowTier: false }) }
    expect(step({ restore: [], grow: [{ field: B, steps: 2 }], maxExtraLines: 0 }, START, shrunk).phase).toBe('done')
    const whole: Observation = { overflows: false, field: () => ({ cut: false, shrunk: false, belowTier: false }) }
    expect(step({ restore: [], grow: [{ field: B, steps: 2 }], maxExtraLines: 0 }, START, whole)).toMatchObject({ phase: 'trying', trial: { field: B, kind: 'steps' } })
  })

  it('done is final', () => {
    const done: AllocatorState = { phase: 'done', grants: {}, blocked: [], passes: 3 }
    expect(step({ restore: [A], grow: [], maxExtraLines: 3 }, done, model(0, { [A]: { needs: 5, lines: 1, lineHeight: 16 } })({}))).toBe(done)
  })
})
