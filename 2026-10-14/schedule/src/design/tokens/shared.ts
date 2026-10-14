import { num } from './leaf'

/** Colours, fonts and the overlays that look the same on every ticket shape. All colours are oklch. */

export const color = {
  ink: 'oklch(0 0 0)',
  paper: 'oklch(1 0 0)',
  gray: 'oklch(0.4997 0 0)',
  dark: 'oklch(0.3012 0 0)',
  rule: 'oklch(0.8015 0 0)',
  mute: 'oklch(0.6993 0 0)',
  holoFallback: 'oklch(0.7411 0.0075 268.53)',
}

export const font = {
  text: "'Fira Sans Extra Condensed', 'Fira Sans Condensed', 'Arial Narrow', sans-serif",
  mono: "'Fira Mono', ui-monospace, 'SF Mono', Menlo, monospace",
}

/** Popover that shows the full text of something cut with "…" (ui/fit/TruncationTip). */
export const tip = {
  fs: 16,
  lh: 20,
  padX: 10,
  padY: 8,
  maxW: 300,
  stroke: 1,
  gap: 6,
  /** the animated three dots on cut lists */
  dot: 2.5,
  dotGap: 2,
}

/**
 * Location sheet (ui/place/PlaceOverlay): a folded map brochure the size of a
 * ticket. Its lengths are in brochure points — 1 = width / 357 — so the same
 * layout serves the phone and the desktop size.
 */
export const overlay = {
  /** share of the viewport the brochure may take */
  maxViewport: num(0.94),
  /** backdrop */
  blurPx: '6px',
  tint: 'oklch(1 0 0 / 0.6)',
  stroke: 1,
  padX: 20,
  /** top / bottom inset inside the zigzag edge, as a share of the height */
  insetTop: num(0.1),
  insetBottom: num(0.105),
  closeSize: 28,
  titleFs: 28,
  titleLh: 32,
  hallFs: 20,
  labelFs: 12,
  textFs: 14,
  textLh: 18,
  gap: 8,
  pin: 18,
  zoom: num(16),
}
