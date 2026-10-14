import type { KindLayout } from '../../core/ticket/kind'
import type { VenueFeature } from './features'

/** Phone: the thin headline template. */
export const venueThin: KindLayout<VenueFeature> = {
  rules: [],
  budget: { restore: ['thinHeadlineTitle'], grow: [], maxExtraLines: 2 },
}

/** Everything else: the wide headline template. */
export const venueWide: KindLayout<VenueFeature> = {
  rules: [
    {
      id: 'day',
      about: 'no weekday line by day, so the cinema sits higher: more room between cinema and barcode, less between cinema and times',
      when: { night: false },
      set: { wide: { headline: { bodyPadBottom: 34 } } },
    },
    {
      id: 'night',
      about: 'past midnight the time block is one step smaller (40 → 36), which gives the weekday line and the cinema more air',
      when: { night: true },
      set: { wide: { headline: { times: { fs: 36, valueFs: 34, lh: 49, dayFs: 28, dayLh: 32 } } } },
    },
  ],
  budget: { restore: ['wideHeadlineTitle'], grow: [], maxExtraLines: 1 },
}
