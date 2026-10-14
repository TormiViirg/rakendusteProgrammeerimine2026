/**
 * How the hall is set under the cinema name on the wide screening ticket.
 *
 * A long cinema name takes a second row instead of being cut, so the "?"
 * stays. To pay for that row the hall is set smaller, and in regular weight if
 * it still does not fit:
 *
 *   NORMAL ──cinema name takes 2 rows──▶ SMALL ──hall is cut even so──▶ SMALL_LIGHT
 *
 * It only ever moves to the right for one text (the view starts over when the
 * cinema, the hall or the layout changes).
 */
export type HallStyle = 'normal' | 'small' | 'small-light'

export function nextHallStyle(current: HallStyle, seen: { venueRows?: number; hallCut?: boolean }): HallStyle {
  if (current === 'normal') return (seen.venueRows ?? 1) > 1 ? 'small' : 'normal'
  if (current === 'small') return seen.hallCut ? 'small-light' : 'small'
  return current
}
