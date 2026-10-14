/**
 * SCREENS — the equivalence classes of screen size, cut where the layout
 * changes (design/scales.ts), with the boundary widths on both sides of every
 * change. The browser checks render the suites on these.
 *
 *   class              scale             ticket   columns
 *   phone              phone             thin     1      upright, or narrower than 480 whatever its shape
 *   phone on its side  phone-landscape   wide     1
 *   tablet             wide-1            wide     1
 *   desktop            wide-2            wide     2
 *   very wide          wide-3            wide     3
 */
export interface Screen {
  id: string
  width: number
  height: number
  /** the scale (design/scales.ts) this screen must select */
  scale: string
  /** representative of its class, or the edge it sits on */
  about: string
  /** part of the quick run; the others run with --all */
  core: boolean
}

export const SCREENS: Screen[] = [
  { id: 'phone', width: 393, height: 873, scale: 'phone', about: 'the phone mockups', core: true },
  { id: 'phone-min', width: 320, height: 568, scale: 'phone', about: 'the narrowest phone still in use: the smallest type', core: true },
  { id: 'phone-max', width: 599, height: 960, scale: 'phone', about: 'last width that gets thin tickets: the largest zoom', core: false },
  { id: 'narrow-square', width: 479, height: 479, scale: 'phone', about: 'a small square window: the widest screen that gets thin tickets whatever its shape', core: false },
  { id: 'landscape-min', width: 480, height: 320, scale: 'phone-landscape', about: 'the narrowest screen that gets a wide ticket: the smallest type of all', core: false },
  { id: 'landscape', width: 844, height: 390, scale: 'phone-landscape', about: 'a phone on its side', core: false },
  { id: 'landscape-max', width: 1099, height: 500, scale: 'phone-landscape', about: 'the tallest and widest screen that still counts as a phone on its side', core: false },
  { id: 'square', width: 599, height: 599, scale: 'wide-1', about: 'as wide as tall, just under 600: not upright, so no longer a phone', core: false },
  { id: 'landscape-over', width: 844, height: 501, scale: 'wide-1', about: 'one pixel too tall to count as a phone on its side', core: false },
  { id: 'tablet-min', width: 600, height: 960, scale: 'wide-1', about: 'first width that gets wide tickets: the smallest zoom of a wide ticket', core: true },
  { id: 'tablet', width: 768, height: 1024, scale: 'wide-1', about: 'a tablet', core: false },
  { id: 'tablet-max', width: 1099, height: 1400, scale: 'wide-1', about: 'last width with one column', core: false },
  { id: 'desktop-min', width: 1100, height: 800, scale: 'wide-2', about: 'first width with two columns: the smallest two-column tickets', core: false },
  { id: 'desktop', width: 1440, height: 900, scale: 'wide-2', about: 'the desktop mockups', core: true },
  { id: 'desktop-max', width: 2199, height: 1200, scale: 'wide-2', about: 'last width with two columns', core: false },
  { id: 'wide-min', width: 2200, height: 1200, scale: 'wide-3', about: 'first width with three columns', core: false },
  { id: 'wide', width: 2560, height: 1080, scale: 'wide-3', about: 'an ultrawide monitor', core: false },
]
