/**
 * Design scale.
 *
 * Phone: the mock-ups are 1179 px wide at @3x → 393 units. One unit `u` is
 * the screen width ÷ 393 (capped so a tablet in portrait does not blow up).
 *
 * Desktop: the mock-ups sit on a 12-column grid – 32 u margins, 96 u columns,
 * 20 u gutters (@4x: 128 / 384 / 80 px). The time column and every day column
 * are two grid columns wide, so a page with N day columns is 2·(N + 1) grid
 * columns. The unit is derived from that: u = width ÷ (margins + columns +
 * gutters), which is why margins, gutters and every size derived from them
 * shrink together when more days are squeezed in, and grow when fewer are.
 */
export const MOBILE = { designWidth: 393, maxWidth: 520, breakpoint: 760 };

export const GRID = {
  margin: 32,
  column: 96,
  gutter: 20,
  /**
   * The text decides how narrow a column may get: the smallest running text
   * in a column is 12 u, and it must stay legible – at least `minTextPx`.
   * Every other size keeps its ratio to the column, so nothing else can
   * overflow before the text becomes unreadable.
   */
  smallestText: 12,
  minTextPx: 9,
  get minUnit() {
    return this.minTextPx / this.smallestText;
  },
  header: 74,
  nav: 56,
  row: 46,
  nightRow: 52,
  gapRow: 40,
};

export interface Layout {
  mode: 'mobile' | 'desktop';
  /** px per design unit */
  u: number;
  /** Day columns on a desktop screen. */
  fit: number;
  /** px between the day columns (also the time column's gap) */
  gutterPx: number;
  marginPx: number;
}

/** Width of the 12-column mock-up in units when `items` two-column blocks (time column + days) are placed. */
export const designWidthFor = (items: number): number => 2 * GRID.margin + items * 2 * GRID.column + (items * 2 - 1) * GRID.gutter;
export const unitFor = (width: number, dayColumns: number): number => width / designWidthFor(dayColumns + 1);

export function layoutFor(width: number, weekLength = 7): Layout {
  if (width < MOBILE.breakpoint) {
    const u = Math.min(width, MOBILE.maxWidth) / MOBILE.designWidth;
    return { mode: 'mobile', u, fit: 1, gutterPx: 0, marginPx: 0 };
  }
  let fit = weekLength;
  while (fit > 1 && unitFor(width, fit) < GRID.minUnit) fit--;
  const u = unitFor(width, fit);
  return { mode: 'desktop', u, fit, gutterPx: GRID.gutter * u, marginPx: GRID.margin * u };
}
