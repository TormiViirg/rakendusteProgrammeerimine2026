import { useOpenPlace } from '../../../ui/place/openPlace'
import { WideHeadlineTicket } from '../../../ui/templates/wide/HeadlineTicket'
import type { TicketViewProps } from '../../../ui/ticket/view'
import type { VenueSlot } from '../features'
import type { VenueModel } from '../model'

/** Cinema shift on wide screens: the headline template; the cinema name opens the location sheet. */
export function VenueWide({ model, slots, captions }: TicketViewProps<VenueModel, VenueSlot>) {
  const openPlace = useOpenPlace()
  const { place } = model
  return (
    <WideHeadlineTicket
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
