import type { TextFieldId } from '../../design/fields'
import { MAX_LIFT, NO_GRANT, type Grant, type GrantKind } from './grant'

/**
 * The space allocator: hands a ticket's spare room to the texts that need it.
 *
 * The outline is fixed, so a ticket with absent parts (no subtitles, a day
 * shift without the weekday line …) has room left over. What to do with it is
 * the ticket's BUDGET (tickets/<kind>/layouts.ts):
 *
 *   1. lift     long texts that start at a smaller size try one step larger
 *   2. lines    texts that were shrunk or cut get one more line at a time
 *   3. steps    the `grow` fields are enlarged one step at a time
 *
 * Nothing can be computed up front — whether a grant fits depends on fonts and
 * line breaks — so every grant is a TRIAL. This is the state machine:
 *
 *                        ┌───────────────────────────────────────────────┐
 *                        ▼                                               │ kept
 *   start ──▶ SETTLED ──pick──▶ TRYING(grant) ──observe──▶ fits? ────yes─┘
 *                │ nothing                                   │ no
 *                │ left to try                               ▼
 *                ▼                                  REVERTING (grant undone and blocked)
 *              DONE                                          │ observe
 *                                                            └──────────▶ SETTLED
 *
 * `step` is the transition function. It is pure: it sees the ticket only
 * through an OBSERVATION of the current layout. ui/fit/SpaceBudget.tsx feeds it
 * the DOM after every layout pass; the unit tests feed it a model.
 *
 * It always ends: a kept grant counts towards a cap, a failed one is blocked.
 * And it ends SOON: every state is one layout pass in the browser, and React
 * refuses more than 50 nested passes, so the machine stops picking new grants
 * after MAX_PASSES and settles on what it has.
 */

/** Who gets a ticket's spare room. Field order is priority order. */
export interface Budget {
  /** fields that are given back size and lines when they were shrunk or cut */
  restore: TextFieldId[]
  /** fields that are then set larger than their design size */
  grow: { field: TextFieldId; steps: number }[]
  /** extra lines one field may receive */
  maxExtraLines: number
}

export const NO_BUDGET: Budget = { restore: [], grow: [], maxExtraLines: 0 }

export type Grants = Readonly<Record<string, Grant>>

export interface Trial {
  field: TextFieldId
  kind: GrantKind
}

interface Common {
  grants: Grants
  blocked: readonly string[]
  /** observations made so far */
  passes: number
}

export type AllocatorState =
  /** the layout on screen is valid; the next grant has not been chosen yet */
  | ({ phase: 'settled' } & Common)
  /** `trial` is included in `grants`; the next observation judges it */
  | ({ phase: 'trying'; trial: Trial } & Common)
  /** a failed grant was taken out; the next observation shows the layout without it */
  | ({ phase: 'reverting' } & Common)
  /** nothing left to try */
  | ({ phase: 'done' } & Common)

export const START: AllocatorState = { phase: 'settled', grants: {}, blocked: [], passes: 0 }

/**
 * No new grant is tried after this many observations. With the revert a last
 * failed trial may need, and the final pass, a ticket takes at most
 * MAX_PASSES + 2 layout passes — safely below React's limit of 50.
 */
export const MAX_PASSES = 40

/** What the allocator needs to know about one text field as currently laid out. */
export interface FieldObservation {
  /** set smaller than intended */
  shrunk: boolean
  /** cut with "…" */
  cut: boolean
  /** starts below its field size because the text is long: a lift would change something */
  belowTier: boolean
}

export interface Observation {
  /** some content reaches past the room the ticket body gives it */
  overflows: boolean
  /** undefined: the ticket has no such field */
  field(id: TextFieldId): FieldObservation | undefined
}

const key = (t: Trial) => `${t.field}:${t.kind}`
const grantOf = (grants: Grants, field: string): Grant => grants[field] ?? NO_GRANT
const change = (grants: Grants, t: Trial, by: number): Grants => {
  const g = grantOf(grants, t.field)
  return { ...grants, [t.field]: { ...g, [t.kind]: g[t.kind] + by } }
}
const wanting = (f: FieldObservation | undefined) => Boolean(f && (f.cut || f.shrunk))

/** The next grant worth trying on a valid layout, in budget order; null when there is none. */
export function pickNext(budget: Budget, grants: Grants, blocked: readonly string[], obs: Observation): Trial | null {
  const open = (t: Trial) => !blocked.includes(key(t))

  // 1. give a long text back the size it started below
  for (const field of budget.restore) {
    const g = grantOf(grants, field)
    const t: Trial = { field, kind: 'lift' }
    if (obs.field(field)?.belowTier && open(t) && g.lift < MAX_LIFT && g.lines === 0) return t
  }
  // 2. one more line for what is still shrunk or cut
  for (const field of budget.restore) {
    const t: Trial = { field, kind: 'lines' }
    if (wanting(obs.field(field)) && open(t) && grantOf(grants, field).lines < budget.maxExtraLines) return t
  }
  // 3. enlarge
  for (const { field, steps } of budget.grow) {
    const f = obs.field(field)
    const t: Trial = { field, kind: 'steps' }
    if (f && !wanting(f) && open(t) && grantOf(grants, field).steps < steps) return t
  }
  return null
}

/** A trial fails if it pushes content out, or if an enlarged text had to shrink or be cut again. */
export function trialFailed(trial: Trial, obs: Observation): boolean {
  return obs.overflows || (trial.kind === 'steps' && wanting(obs.field(trial.field)))
}

export function step(budget: Budget, state: AllocatorState, obs: Observation): AllocatorState {
  if (state.phase === 'done') return state

  const passes = state.passes + 1

  // a failed trial is always undone, whatever the pass count: the layout must end valid
  if (state.phase === 'trying' && trialFailed(state.trial, obs)) {
    return { phase: 'reverting', grants: change(state.grants, state.trial, -1), blocked: [...state.blocked, key(state.trial)], passes }
  }

  // settled, a kept trial, or the layout after a revert: all are valid layouts to continue from
  const { grants, blocked } = state
  const next = passes > MAX_PASSES ? null : pickNext(budget, grants, blocked, obs)
  return next ? { phase: 'trying', grants: change(grants, next, +1), blocked, trial: next, passes } : { phase: 'done', grants, blocked, passes }
}
