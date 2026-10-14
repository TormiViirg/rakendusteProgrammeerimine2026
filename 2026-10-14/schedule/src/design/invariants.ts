/**
 * What may never differ from one ticket to the next.
 *
 * "Under no circumstances allow the stripe to change size from one ticket to
 * the next, nor the height or width of the ticket outline depending on the
 * contents within."
 *
 * Variant rules (tickets/<kind>/layouts.ts) apply to single tickets, so they
 * may not set any token under these paths. core/ticket/compile.ts rejects a
 * rule that tries; the unit tests run that check for every kind.
 * (Scales and modifiers apply to the whole page and may set them.)
 */
export const PROTECTED_TOKEN_PATHS = [
  'thin.frame',
  'thin.strip.tallH',
  'thin.strip.infoH',
  'thin.strip.stubInset',
  'thin.foot.h',
  'wide.frame',
  'wide.strip.h',
  'wide.strip.inset',
  'wide.foot.h',
  // the gutters and the gap between tickets set the ticket width
  'page.gutter',
  'page.cardGap',
] as const

/**
 * What a variant rule MAY set. A rule belongs to one ticket shape and takes
 * effect inside one ticket, so it may change that shape's tokens, the colours
 * and fonts, and the line budgets of that shape's fields — not the other
 * shape's tokens and not the page around the tickets (page, tip, overlay).
 */
export const RULE_ROOTS = { thin: ['thin', 'color', 'font', 'lines'], wide: ['wide', 'color', 'font', 'lines'] } as const
