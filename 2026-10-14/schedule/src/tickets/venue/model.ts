import type { Place } from '../../core/shift/place'
import type { TicketModel } from '../../core/ticket/kind'

export interface VenueModel extends TicketModel {
  place: Place
}
