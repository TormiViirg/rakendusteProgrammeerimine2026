import type { KindLayout } from '../../core/ticket/kind'
import type { BreakFeature } from './features'

/** Phone: the thin headline template. */
export const breakThin: KindLayout<BreakFeature> = {
  rules: [],
  budget: { restore: ['thinHeadlineTitle'], grow: [], maxExtraLines: 2 },
}

/** Everything else: the wide headline template with one time row and the large title. */
export const breakWide: KindLayout<BreakFeature> = {
  rules: [
    {
      id: 'night',
      about: 'past midnight the time block is one step smaller (40 → 36), which gives the weekday line and the title more air',
      when: { night: true },
      set: { wide: { headline: { times: { fs: 36, valueFs: 34, lh: 49, dayFs: 28, dayLh: 32 } } } },
    },
  ],
  budget: { restore: ['wideHeadlineTitleLarge'], grow: [], maxExtraLines: 1 },
}
