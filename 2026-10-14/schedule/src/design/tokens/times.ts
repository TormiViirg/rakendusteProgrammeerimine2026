import type { Leaf } from './leaf'

/** Shape of the "Kohaloleku aeg / Vahetuse kestus" block on thin tickets; each template has its own values. */
export interface TimesTokens {
  fs: number
  lh: number
  /** minimum gap between label and time */
  gap: number
  dayFs: number
  dayLh: number
  /** vertical / horizontal fine-tuning of the weekday line */
  dayShift: number
  dayNudge: number
  /** gap around the "-" between the two weekdays */
  dayGap: Leaf
  marginL: number
  marginR: number
}
