import type { Layout } from './layout'
import type { DeepPartial, Tokens } from './tokens'

/**
 * Scales — which ticket shape, how many columns and which page chrome a
 * screen gets. The first scale whose `when` holds wins, so order matters.
 */

/** What the selectors know about the screen and the tickets on it. */
export interface DesignContext {
  /** available width / viewport height in CSS px */
  width: number
  height: number
  /** ids of the ticket kinds currently displayed */
  kinds: string[]
  /** number of tickets currently displayed */
  count: number
  /** character count of the longest headline (tickets/<kind> → headline) */
  longestText: number
}

export const aspect = (c: DesignContext) => (c.height > 0 ? c.width / c.height : 0)

export interface Scale {
  id: string
  when: (c: DesignContext) => boolean
  /**
   * fit:   the artboard (columns × ticket + gutters) is stretched to the width, so
   *        mockup proportions hold; `maxU` caps the zoom.
   * fixed: one point is `u` CSS px and the page is centred.
   */
  unit: { mode: 'fit'; maxU?: number } | { mode: 'fixed'; u: number }
  layout: Layout
  columns: number
  overrides: DeepPartial<Tokens>
}

/** Page chrome for wide tickets: no "Minu vahetused" row, large weekday + date heading with a rule. */
const WIDE_PAGE: DeepPartial<Tokens>['page'] = {
  gutter: 32,
  cardGap: 20,
  dayGap: 8,
  menuH: 104,
  titleRowH: 0,
  dayH: 96,
  dayRuleTop: 79,
  dayRuleH: 1,
  dayRuleColor: 'oklch(0.3012 0 0)',
}

/** Below this width an upright screen gets thin tickets. */
export const THIN_BELOW = 600

/** Below this width every screen gets thin tickets: a wide ticket would be set at under half its size. */
export const WIDE_FROM = 480

export const SCALES: Scale[] = [
  {
    // The phone mockups: one thin ticket, 393pt artboard stretched to the width.
    // Upright phones — and anything too narrow for a wide ticket to be legible, whatever its shape.
    id: 'phone',
    when: (c) => c.width < THIN_BELOW && (aspect(c) < 1 || c.width < WIDE_FROM),
    layout: 'thin',
    unit: { mode: 'fit' },
    columns: 1,
    overrides: {},
  },
  {
    // Phone on its side: one wide ticket, compact sticky block.
    id: 'phone-landscape',
    when: (c) => c.height > 0 && c.height <= 500 && c.width < 1100,
    layout: 'wide',
    unit: { mode: 'fit' },
    columns: 1,
    overrides: {
      page: { ...WIDE_PAGE, menuH: 40, dayH: 52, dayRuleTop: 46, bottomPad: 16 },
      wide: { page: { weekdayFs: 26, dateFs: 24, dayLh: 32, dayPadTop: 8 } },
    },
  },
  {
    // Tablets and narrow windows: one wide ticket.
    id: 'wide-1',
    when: (c) => c.width < 1100,
    layout: 'wide',
    unit: { mode: 'fit', maxU: 1.25 },
    columns: 1,
    overrides: { page: WIDE_PAGE },
  },
  {
    // The desktop mockups: two wide tickets, 1440pt artboard.
    id: 'wide-2',
    when: (c) => c.width < 2200,
    layout: 'wide',
    unit: { mode: 'fit', maxU: 1.25 },
    columns: 2,
    overrides: { page: WIDE_PAGE },
  },
  {
    id: 'wide-3',
    when: () => true,
    layout: 'wide',
    unit: { mode: 'fit', maxU: 1.25 },
    columns: 3,
    overrides: { page: WIDE_PAGE },
  },
]
