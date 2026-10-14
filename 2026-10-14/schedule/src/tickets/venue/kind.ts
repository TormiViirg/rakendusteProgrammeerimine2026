import { defineKind } from '../../core/ticket/kind'
import { buildVenue } from './build'
import { venueFeatures, venueSlots } from './features'
import { venueThin, venueWide } from './layouts'
import { venueChecks } from './record'

/** VENUE — a shift for a whole cinema: only the times and the location. */
export const venueKind = defineKind({
  id: 'venue',
  about: 'a shift at a cinema: only when and where',
  checks: venueChecks,
  build: buildVenue,
  headline: (m) => m.place.name,
  features: venueFeatures,
  slots: venueSlots,
  layouts: { thin: venueThin, wide: venueWide },
})
