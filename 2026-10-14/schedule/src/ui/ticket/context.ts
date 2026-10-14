import { createContext, useContext } from 'react'
import type { TicketModel } from '../../core/ticket/kind'
import type { TicketPlan } from '../../core/ticket/plan'

/** The ticket being drawn: its plan (variant, slots, budget) and its model. Set by <TicketScope>. */
export interface TicketState {
  plan: TicketPlan
  model: TicketModel
}

export const TicketContext = createContext<TicketState | null>(null)

export function useTicket(): TicketState {
  const t = useContext(TicketContext)
  if (!t) throw new Error('useTicket: no <TicketScope> above this component')
  return t
}
