import { useOpenPlace } from '../../../ui/place/openPlace'
import { ThinHeadlineTicket } from '../../../ui/templates/thin/HeadlineTicket'
import type { TicketViewProps } from '../../../ui/ticket/view'
import type { VenueSlot } from '../features'
import type { VenueModel } from '../model'

/** Cinema shift on a phone: the headline template; the cinema name opens the location sheet. */
export function VenueThin({ model, slots, captions }: TicketViewProps<VenueModel, VenueSlot>) {
  const openPlace = useOpenPlace()
  const { place } = model
  return (
    <ThinHeadlineTicket
      captions={captions}
      time={model.time}
      barcode={model.barcode}
      title={place.name}
      titleSlot="venue"
      caption={slots.caption ? place.address : undefined}
      icon="map"
      onOpen={slots.locate ? () => openPlace(place) : undefined}
      openLabel={`${place.name} – ${captions.map}`}
      weekdays={slots.weekdays}
      paw={slots.paw}
    />
  )
}
