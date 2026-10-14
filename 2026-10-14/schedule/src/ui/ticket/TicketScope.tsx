import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { cssVars } from '../../core/design/cssVars'
import { merge } from '../../core/design/merge'
import type { TicketModel } from '../../core/ticket/kind'
import type { TicketPlan } from '../../core/ticket/plan'
import { DesignContext, useDesign } from '../design/context'
import { TicketContext } from './context'

/**
 * Puts ONE ticket's plan into effect: the token changes of its variant rules
 * become CSS custom properties on a wrapper and the tokens its components
 * read, so tickets next to each other can differ.
 */
export function TicketScope({ plan, model, children }: { plan: TicketPlan; model: TicketModel; children: ReactNode }) {
  const parent = useDesign()
  const { overrides, rules } = plan

  const design = useMemo(() => {
    if (!rules.length) return parent
    return { ...parent, tokens: merge(parent.tokens, overrides), layoutKey: `${parent.layoutKey}|${rules.join(',')}` }
  }, [parent, overrides, rules])

  const style = useMemo(() => cssVars(overrides) as CSSProperties, [overrides])
  const ticket = useMemo(() => ({ plan, model }), [plan, model])

  return (
    <div className="tk-scope" style={style}>
      <DesignContext.Provider value={design}>
        <TicketContext.Provider value={ticket}>{children}</TicketContext.Provider>
      </DesignContext.Provider>
    </div>
  )
}
