import type { FitSpec } from './textSize'

/**
 * Makes one text fit its field. A small state machine per text:
 *
 *        fits                      fits                    fits
 *   ┌──────────┐   does not   ┌────────────┐   does not ┌──────────┐  at the floor,
 *   │   WHOLE   │ ───────────▶│   BROKEN    │──────────▶│  SMALLER  │  still too long
 *   │ start size│  fit whole  │ words may   │   fit      │ one step  │ ──────────────▶  CUT with "…"
 *   └──────────┘              │ break at    │            │ at a time │
 *                             │ syllables   │            └──────────┘
 *                             └────────────┘
 *
 * BROKEN is only entered where more than one line is allowed. SMALLER first
 * tries to stay within the preferred number of lines (down to `preferMin`),
 * then uses the full line budget (down to `min`).
 *
 * The function is pure: it sees the text only through a PROBE that lays it out
 * at a size and reports what happened (ui/fit/Fit.tsx implements it on the
 * DOM; the unit tests use a model of text width).
 */

export interface Measurement {
  /** lines the text takes at this size */
  lines: number
  /** an unbreakable part is wider than the field */
  overflowsWidth: boolean
}

export interface FitProbe {
  /** lay the text out at `size` pt, with or without syllable breaks, and measure it */
  at(size: number, broken: boolean): Measurement
}

export interface FitOutcome {
  /** final size in pt */
  size: number
  /** words may break at syllable ends */
  broken: boolean
  /** does not fit even at the floor: cut to the line budget with "…" */
  cut: boolean
}

const fitsIn = (m: Measurement, lines: number) => !m.overflowsWidth && m.lines <= lines

export function fitText(spec: FitSpec, probe: FitProbe): FitOutcome {
  const { step, min, maxLines, preferLines, preferMin } = spec
  let size = spec.start

  // WHOLE
  let m = probe.at(size, false)

  // BROKEN — only where there is more than one line to break onto
  const broken = maxLines > 1 && !fitsIn(m, preferLines)
  if (broken) m = probe.at(size, true)

  // SMALLER, within the preferred number of lines …
  while (!fitsIn(m, preferLines) && size - step >= preferMin - 0.01) {
    size -= step
    m = probe.at(size, broken)
  }
  // … then within the full line budget
  while (!fitsIn(m, maxLines) && size > min) {
    size = Math.max(min, size - step)
    m = probe.at(size, broken)
  }

  return { size, broken, cut: !fitsIn(m, maxLines) }
}
