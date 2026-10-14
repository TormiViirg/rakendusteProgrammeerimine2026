import type { Features } from './feature'
import type { TicketModel } from './kind'

/**
 * A ticket as the pipeline hands it to the UI: the model, and the variant it
 * belongs to. `kind` picks the definition in the registry.
 */
export interface Ticket<M extends TicketModel = TicketModel> {
  id: string
  kind: string
  model: M
  features: Features
  headline: string
}
