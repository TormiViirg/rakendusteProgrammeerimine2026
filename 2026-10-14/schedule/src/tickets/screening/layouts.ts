import type { KindLayout } from '../../core/ticket/kind'
import type { ScreeningFeature } from './features'

/** Phone: the thin screening template. */
export const screeningThin: KindLayout<ScreeningFeature> = {
  rules: [
    {
      id: 'no-subtitles',
      about: 'without subtitles there is room: the holo strip takes the desktop band\'s proportions (678 : 42 → 357 : 22)',
      when: { subtitles: false },
      set: { thin: { holo: { strip: 22 } } },
    },
  ],
  // the programme is restored and enlarged first, then the film title
  budget: {
    restore: ['thinScreeningProgramme', 'thinScreeningFilm', 'thinScreeningSubs', 'thinScreeningAudience', 'thinScreeningVenue', 'thinScreeningRole'],
    grow: [
      { field: 'thinScreeningProgramme', steps: 1 },
      { field: 'thinScreeningFilm', steps: 1 },
    ],
    maxExtraLines: 3,
  },
}

/** Everything else: the wide screening template. */
export const screeningWide: KindLayout<ScreeningFeature> = {
  rules: [],
  // keep the programme at full size and length as long as possible, then the title
  budget: {
    restore: ['wideScreeningProgramme', 'wideScreeningFilm', 'wideScreeningSubs', 'wideScreeningRole'],
    grow: [{ field: 'wideScreeningFilm', steps: 1 }],
    maxExtraLines: 3,
  },
}
