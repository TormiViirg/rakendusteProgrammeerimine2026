/**
 * How long text is made to fit (the algorithm is core/fit/fitText.ts).
 *
 * A text that does not fit its line budget is set smaller in whole steps.
 * It may lose `maxLoss` of its size, rounded to the nearest whole step below the
 * field size; after that it is cut with "…".
 *   36 pt → 36 − 9 = 27 → nearest whole step → 28 pt (two steps)
 *   12 pt → 12 − 3 = 9  → nearest whole step →  8 pt (one step: a third, by rounding)
 */
export const FIT = {
  /** pt removed per step */
  step: 4,
  /** share of its size a text may lose, before rounding to whole steps */
  maxLoss: 0.25,
}

/**
 * "Start smaller when the text is long": up to `upToChars` characters the text
 * starts `stepsDown` steps below the field size. The first tier that matches wins.
 */
export interface SizeTier {
  upToChars: number
  stepsDown: number
}

/** 36 pt headlines on thin tickets: 36 up to 14 characters, 32 up to 30, then 28. */
export const HERO_TIERS: SizeTier[] = [
  { upToChars: 14, stepsDown: 0 },
  { upToChars: 30, stepsDown: 1 },
  { upToChars: Infinity, stepsDown: 2 },
]

/** Film title on thin tickets: 20 pt up to 44 characters, then 16. */
export const FILM_TIERS: SizeTier[] = [
  { upToChars: 44, stepsDown: 0 },
  { upToChars: Infinity, stepsDown: 1 },
]

/** The deepest tier above: how many steps a long text can be given back. */
export const MAX_TIER_STEPS = Math.max(...[...HERO_TIERS, ...FILM_TIERS].map((t) => t.stepsDown))

/**
 * "Prefer fewer lines": shrink up to `steps` steps trying to stay within
 * `lines`; only if that fails does the text use its full line budget — at the
 * size it has reached by then, so a text that wraps is never larger than one
 * that just fitted.
 */
export interface LinePreference {
  lines: number
  steps: number
}

/** Wide headlines: stay on one line down to two steps smaller (32 → 24), then use the second line. */
export const ONE_LINE: LinePreference = { lines: 1, steps: 2 }
