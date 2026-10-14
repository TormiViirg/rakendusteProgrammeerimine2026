import { defineKind } from '../../core/ticket/kind'
import { buildScreening } from './build'
import { screeningFeatures, screeningSlots } from './features'
import { screeningThin, screeningWide } from './layouts'
import { screeningChecks, type ScreeningRecord } from './record'

/** SCREENING — a shift with a film: audience, cinema and hall, film, programme, subtitles, runtime, code. */
export const screeningKind = defineKind({
  id: 'screening',
  about: 'a shift at a film screening',
  checks: screeningChecks,
  content: (r: ScreeningRecord) => ({ films: [r.filmId], programmes: r.programmeIds }),
  build: buildScreening,
  headline: (m) => m.film,
  features: screeningFeatures,
  slots: screeningSlots,
  layouts: { thin: screeningThin, wide: screeningWide },
})
