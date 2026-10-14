import type { Measure } from '../../core/shift/measure'
import type { Place } from '../../core/shift/place'
import type { TicketModel } from '../../core/ticket/kind'

export interface RoleModel extends TicketModel {
  /** "Fotograaf" */
  role: string
  place: Place
  /** only with a valid value */
  bc?: Measure
}
