/**
 * Thin ticket (phones in portrait): outline and holographic band.
 * Design points = mockup px @3x ÷ 3.
 *
 * PROTECTED: the outline never changes size with its content — variant rules may
 * not set anything in `frame` (design/invariants.ts).
 */

/** Ticket outline. 326 = 27 × 12 + 2: the card height always lands on the perforation grid. */
export const frame = {
  width: 357,
  stroke: 1,
  pitch: 12,
  tick: 2,
  /** fixed: the outline never changes size with its content. 326 = 27 × 12 + 2 */
  height: 326,
  notchDepth: 13,
  notchFromBottom: 128.67,
  notchEndFromBottom: 20.33,
  bevel: 6.67,
}

/** Holographic band at the top: tall on role / headline tickets, a strip on screening tickets. */
export const holo = { band: 42, strip: 12 }
