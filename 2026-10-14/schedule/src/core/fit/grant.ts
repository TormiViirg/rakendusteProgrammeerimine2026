import { MAX_TIER_STEPS } from '../../design/fit'

/**
 * What the space allocator has granted one text field on one ticket
 * (core/fit/allocator.ts hands these out; core/fit/textSize.ts applies them).
 */
export interface Grant {
  /** extra lines on top of the field's line budget */
  lines: number
  /** steps above the field size */
  steps: number
  /** steps of the "start smaller for long text" tier given back */
  lift: number
}

export type GrantKind = keyof Grant

export const NO_GRANT: Grant = { lines: 0, steps: 0, lift: 0 }

/** A lift beyond the deepest tier changes nothing, so it is not tried. */
export const MAX_LIFT = MAX_TIER_STEPS
