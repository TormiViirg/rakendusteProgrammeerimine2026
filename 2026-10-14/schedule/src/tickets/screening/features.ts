import type { FeatureDefs } from '../../core/ticket/feature'
import { footerAddress, when, type SlotRules } from '../../core/ticket/slot'
import type { ScreeningModel } from './model'

export type ScreeningFeature = 'night' | 'rating' | 'subtitles' | 'bc' | 'qa' | 'address'

export const screeningFeatures: FeatureDefs<ScreeningModel, ScreeningFeature> = {
  night: { about: 'the shift runs past midnight', of: (m) => m.night },
  rating: { about: 'the film has an age rating', of: (m) => Boolean(m.rating) },
  subtitles: { about: 'the film has subtitles', of: (m) => m.subtitles.length > 0 },
  bc: { about: 'it has a valid Black Carpet time', of: (m) => Boolean(m.bc) },
  qa: { about: 'it has a valid Q&A time', of: (m) => Boolean(m.qa) },
  address: { about: 'the cinema has a written-out address', of: (m) => Boolean(m.place.address) },
}

export type ScreeningSlot = 'weekdays' | 'paw' | 'rating' | 'subtitles' | 'bc' | 'qa' | 'address' | 'locate'

export const screeningSlots: SlotRules<ScreeningFeature, ScreeningSlot> = {
  weekdays: when({ night: true }),
  /** the phone ticket has no room for a wolf print */
  paw: when({ night: true }, { only: 'wide' }),
  rating: when({ rating: true }),
  subtitles: when({ subtitles: true }),
  bc: when({ bc: true }),
  qa: when({ qa: true }),
  /**
   * Footer row. Wide: BC · Q&A · audience · code — the address joins when two or
   * fewer are filled. Phone: BC · Q&A · code — the address needs the whole left
   * half, so it waits until the code is the only column.
   */
  address: footerAddress('address', {
    thin: { optional: ['bc', 'qa'], always: 1, max: 1 },
    wide: { optional: ['bc', 'qa'], always: 2, max: 2 },
  }),
  /** the "?" next to the cinema */
  locate: when({}),
}
