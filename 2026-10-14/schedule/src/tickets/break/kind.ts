import { defineKind } from '../../core/ticket/kind'
import { buildBreak } from './build'
import { breakFeatures, breakSlots } from './features'
import { breakThin, breakWide } from './layouts'
import { breakChecks } from './record'

/** BREAK — a pause between shifts: how long, what kind, and an optional note. No location. */
export const breakKind = defineKind({
  id: 'break',
  about: 'a pause between shifts; the one ticket without a location',
  checks: breakChecks,
  build: buildBreak,
  headline: (m) => m.title,
  features: breakFeatures,
  slots: breakSlots,
  layouts: { thin: breakThin, wide: breakWide },
})
