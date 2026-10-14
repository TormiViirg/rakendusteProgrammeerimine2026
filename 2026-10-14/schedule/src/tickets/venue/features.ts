import type { FeatureDefs } from '../../core/ticket/feature'
import { when, type SlotRules } from '../../core/ticket/slot'
import type { VenueModel } from './model'

export type VenueFeature = 'night' | 'address'

export const venueFeatures: FeatureDefs<VenueModel, VenueFeature> = {
  night: { about: 'the shift runs past midnight', of: (m) => m.night },
  address: { about: 'the cinema has a written-out address', of: (m) => Boolean(m.place.address) },
}

export type VenueSlot = 'weekdays' | 'paw' | 'caption' | 'locate'

export const venueSlots: SlotRules<VenueFeature, VenueSlot> = {
  weekdays: when({ night: true }),
  paw: when({ night: true }),
  /** the address, under the barcode */
  caption: when({ address: true }),
  /** the cinema name opens the location sheet */
  locate: when({}),
}
