/**
 * Wide ticket (every screen that is not a phone in portrait): outline and band.
 * Measured from the 1440 × 1024 desktop mockups (5760 px @4x ÷ 4).
 * Card 678 × 365; two per row at 1440: 32 + 678 + 20 + 678 + 32.
 *
 * PROTECTED: variant rules may not set anything in `frame` (design/invariants.ts).
 */
export const frame = {
  width: 678,
  stroke: 1,
  /** ticks every 24pt, counted from the top edge */
  pitch: 24,
  tick: 2,
  /** fixed, like the width */
  height: 365,
  /** notch on BOTH sides, anchored to the bottom like the thin ticket */
  notchDepth: 14.5,
  notchFromBottom: 152.5,
  notchEndFromBottom: 24,
  bevel: 8,
}

export const holo = { band: 42 }
