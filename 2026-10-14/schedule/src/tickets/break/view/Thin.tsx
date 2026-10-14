import { ThinHeadlineTicket } from '../../../ui/templates/thin/HeadlineTicket'
import type { TicketViewProps } from '../../../ui/ticket/view'
import type { BreakSlot } from '../features'
import type { BreakModel } from '../model'

/** Break on a phone: the headline template with one time row and the treasure map (a break has no location). */
export function BreakThin({ model, slots, captions }: TicketViewProps<BreakModel, BreakSlot>) {
  return (
    <ThinHeadlineTicket
      captions={captions}
      time={model.time}
      barcode={model.barcode}
      title={model.title}
      titleSlot="title"
      caption={slots.caption ? model.note : undefined}
      single
      icon="treasure"
      weekdays={slots.weekdays}
      paw={slots.paw}
    />
  )
}
