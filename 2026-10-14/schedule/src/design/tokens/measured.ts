import type { Tokens } from './index'
import { num, type DeepPartial } from './leaf'

/**
 * Ratio mode B: the raw measurement where the mockup did not land on a clean
 * number. Ratio mode A (the default) uses BASE alone.
 */
const stretchedStart = { startStretch: num(1.29), dashMargin: 1.1 }

export const MEASURED: DeepPartial<Tokens> = {
  page: { langFs: 17.5 },
  thin: {
    role: { titleFs: 35.7, times: { dayFs: 15.4 } },
    headline: { titleNudge: -2, times: { dayFs: 19.6 } },
  },
  wide: {
    screening: { times: stretchedStart },
    role: { times: stretchedStart },
  },
}
