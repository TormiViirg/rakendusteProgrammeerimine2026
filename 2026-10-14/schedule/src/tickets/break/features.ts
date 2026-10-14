import type { FeatureDefs } from '../../core/ticket/feature'
import { when, type SlotRules } from '../../core/ticket/slot'
import type { BreakModel } from './model'

export type BreakFeature = 'night' | 'note'

export const breakFeatures: FeatureDefs<BreakModel, BreakFeature> = {
  night: { about: 'the pause runs past midnight', of: (m) => m.night },
  note: { about: 'it has a note under the barcode', of: (m) => Boolean(m.note) },
}

export type BreakSlot = 'weekdays' | 'paw' | 'caption'

export const breakSlots: SlotRules<BreakFeature, BreakSlot> = {
  weekdays: when({ night: true }),
  paw: when({ night: true }),
  caption: when({ note: true }),
}
