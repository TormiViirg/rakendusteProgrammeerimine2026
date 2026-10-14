import { useMemo } from 'react'
import type { Captions } from '../../core/schedule/captions'
import type { KindRegistry } from '../../core/ticket/kind'
import { planTicket } from '../../core/ticket/plan'
import type { Ticket } from '../../core/ticket/ticket'
import { useDesign } from '../design/context'
import { TicketScope } from '../ticket/TicketScope'
import type { ViewRegistry } from '../ticket/view'

interface Props {
  ticket: Ticket
  captions: Captions
  kinds: KindRegistry
  views: ViewRegistry
}

/**
 * Draws one ticket. The same four lines for every kind: look the kind up, plan
 * the ticket for the current shape, and hand the plan's slots to the kind's
 * view for that shape. Nothing here knows what kinds exist.
 */
export function TicketCard({ ticket, captions, kinds, views }: Props) {
  const { design } = useDesign()
  const layout = design.layout
  const kind = kinds[ticket.kind]
  const plan = useMemo(() => planTicket(kind, ticket.features, layout), [kind, ticket.features, layout])
  const View = views[ticket.kind][layout]
  return (
    <TicketScope plan={plan} model={ticket.model}>
      <View model={ticket.model} slots={plan.slots} captions={captions} />
    </TicketScope>
  )
}
