import { breakKind } from './break/kind'
import { roleKind } from './role/kind'
import { screeningKind } from './screening/kind'
import { venueKind } from './venue/kind'

/**
 * THE TICKET KINDS. One line per kind; the definition is the folder of the
 * same name. The React views are listed next door, in views.ts — TypeScript
 * will not compile until every kind here has a view for every ticket shape.
 */
export const KINDS = {
  break: breakKind,
  venue: venueKind,
  role: roleKind,
  screening: screeningKind,
} as const

export type KindId = keyof typeof KINDS

/** The record of every kind — what a backend may send. */
export type { BreakRecord } from './break/record'
export type { RoleRecord } from './role/record'
export type { ScreeningRecord } from './screening/record'
export type { VenueRecord } from './venue/record'
