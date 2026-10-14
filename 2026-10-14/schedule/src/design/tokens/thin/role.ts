import { em } from '../leaf'
import type { TimesTokens } from '../times'

/** Thin ROLE template: times, large role name ("Fotograaf"); cinema and hall sit in the strip. */
export const role = {
  bodyPadTop: 16.3,
  bodyPadBottom: 12,
  times: {
    fs: 20,
    lh: 32,
    gap: 8,
    dayFs: 15,
    dayLh: 18,
    dayShift: 0.5,
    dayNudge: 2,
    dayGap: em(0.97),
    marginL: 20.33,
    marginR: 13,
  } as TimesTokens,
  titleMarginTop: 26,
  titlePadX: 14,
  titleFs: 36,
  titleLh: 42,
  underPadX: 20,
  underPadBottom: 3.73,
  underRule: 1,
}
