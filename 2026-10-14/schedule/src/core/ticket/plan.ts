import type { Layout } from '../../design/layout'
import type { DeepPartial, Tokens } from '../../design/tokens'
import type { Budget } from '../fit/allocator'
import { variantName, type Features } from './feature'
import type { AnyKind } from './kind'
import { applyRules } from './rule'
import { resolveSlots } from './slot'

/**
 * The PLAN for drawing one ticket in one shape — the last pipeline stage.
 * It is a function of the kind, the variant and the shape alone, so equal
 * variants always get equal plans.
 */
export interface TicketPlan {
  kind: string
  layout: Layout
  features: Features
  /** "night+rating" */
  variant: string
  /** optional parts: present or not */
  slots: Record<string, boolean>
  /** token changes for this ticket */
  overrides: DeepPartial<Tokens>
  /** ids of the variant rules behind `overrides` */
  rules: string[]
  /** who gets the spare room */
  budget: Budget
}

export function planTicket(kind: AnyKind, features: Features, layout: Layout): TicketPlan {
  const { rules, budget } = kind.layouts[layout]
  const { overrides, applied } = applyRules(rules, features)
  return {
    kind: kind.id,
    layout,
    features,
    variant: variantName(features),
    slots: resolveSlots(kind.slots, features, layout),
    overrides,
    rules: applied,
    budget,
  }
}
