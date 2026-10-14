import type { ModelOf, SlotsOf } from '../core/ticket/kind'
import type { Layout } from '../design/layout'
import type { TicketView } from '../ui/ticket/view'
import { BreakThin } from './break/view/Thin'
import { BreakWide } from './break/view/Wide'
import type { KINDS, KindId } from './registry'
import { RoleThin } from './role/view/Thin'
import { RoleWide } from './role/view/Wide'
import { ScreeningThin } from './screening/view/Thin'
import { ScreeningWide } from './screening/view/Wide'
import { VenueThin } from './venue/view/Thin'
import { VenueWide } from './venue/view/Wide'

/**
 * THE VIEWS — the React component of every kind for every ticket shape.
 * The type below makes the compiler insist on one entry per kind in
 * registry.ts, with the right model and slots.
 */
type Views = { [K in KindId]: Record<Layout, TicketView<ModelOf<(typeof KINDS)[K]>, keyof SlotsOf<(typeof KINDS)[K]> & string>> }

export const VIEWS: Views = {
  break: { thin: BreakThin, wide: BreakWide },
  venue: { thin: VenueThin, wide: VenueWide },
  role: { thin: RoleThin, wide: RoleWide },
  screening: { thin: ScreeningThin, wide: ScreeningWide },
}
