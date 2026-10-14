import { WideHeadlineTicket } from '../../../ui/templates/wide/HeadlineTicket'
import type { TicketViewProps } from '../../../ui/ticket/view'
import type { BreakSlot } from '../features'
import type { BreakModel } from '../model'

/** Break on wide screens: the headline template with one time row, the large title and the treasure map. */
export function BreakWide({ model, slots, captions }: TicketViewProps<BreakModel, BreakSlot>) {
  return (
    <WideHeadlineTicket
      captions={captions}
      time={model.time}
      barcode={model.barcode}
      title={model.title}
      titleSlot="title"
      caption={slots.caption ? model.note : undefined}
      single
      large
      icon="treasure"
      weekdays={slots.weekdays}
      paw={slots.paw}
    />
  )
}
