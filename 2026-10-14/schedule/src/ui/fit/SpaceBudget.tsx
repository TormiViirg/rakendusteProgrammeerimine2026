import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { START, step, type AllocatorState, type Observation } from '../../core/fit/allocator'
import { useDesign } from '../design/context'
import { useTicket } from '../ticket/context'
import { GrantContext } from './grants'

interface Props {
  className?: string
  children: ReactNode
}

/**
 * Wraps a ticket body and runs the space allocator on it (core/fit/allocator.ts
 * — the state machine and the rules are there). This component is only its
 * eyes and hands: after every layout pass it OBSERVES the DOM, asks the machine
 * for the next state, and re-renders with that state's grants.
 *
 * The budget comes from the ticket's plan (tickets/<kind>/layouts.ts).
 */
export function SpaceBudget({ className, children }: Props) {
  const { layoutKey } = useDesign()
  const { plan, model } = useTicket()
  const budget = plan.budget
  const ref = useRef<HTMLDivElement>(null)
  // a fresh run whenever the content, the layout or the budget changes
  const run = useMemo(() => ({}), [layoutKey, model, budget]) // eslint-disable-line react-hooks/exhaustive-deps
  const [stored, setStored] = useState<{ run: object; state: AllocatorState }>({ run, state: START })
  const state = stored.run === run ? stored.state : START

  // Deliberately without a dependency list: the machine advances one state per layout pass
  // until it reports `done`, which is what ends the chain (see the proof of termination in allocator.ts).
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || state.phase === 'done') return
    const next = step(budget, state, observe(root))
    setStored({ run, state: next })
  })

  return (
    <div ref={ref} className={className} data-allocator={state.phase}>
      <GrantContext.Provider value={state.grants}>{children}</GrantContext.Provider>
    </div>
  )
}

/** How far content may reach into the body's bottom whitespace before it counts as overflow, in design points. */
const OVERFLOW_TOLERANCE_PT = 1

/** The ticket body as the allocator sees it. */
function observe(root: HTMLElement): Observation {
  const body = (root.closest('.tk__body') as HTMLElement | null) ?? root
  // Overflow = content past the wrapper's own content box (its bottom padding is
  // whitespace that must stay), or anything scrolling the fixed ticket body.
  const box = root.getBoundingClientRect()
  const floor = box.bottom - parseFloat(getComputedStyle(root).paddingBottom)
  let lowest = 0
  for (const child of root.children) lowest = Math.max(lowest, child.getBoundingClientRect().bottom)
  // The tolerance is in design points, not pixels: a grant that fits at one zoom must fit at
  // every zoom, or the same ticket would look different on two screens of the same class.
  const u = parseFloat(getComputedStyle(root).getPropertyValue('--u')) || 1
  const tolerance = Math.max(0.5, OVERFLOW_TOLERANCE_PT * u)
  return {
    overflows: lowest > floor + tolerance || body.scrollHeight > body.clientHeight + 1 + tolerance,
    field(id) {
      const el = root.querySelector<HTMLElement>(`[data-field="${id}"]`)
      return el ? { shrunk: el.dataset.shrunk === '1', cut: el.dataset.fit === 'clamp', belowTier: el.dataset.tiered === '1' } : undefined
    },
  }
}
