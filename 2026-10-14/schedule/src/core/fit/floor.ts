import { FIT } from '../../design/fit'

/**
 * The smallest size a text of size `fs` may shrink to: FIT.maxLoss off, rounded
 * to the nearest whole step below the field size.
 *
 *   36 → 36 − 9 = 27 → 28 (two steps)        20 → 15 → 16        12 → 9 → 8
 *   exactly halfway rounds to the LARGER size:  24 → 18 → 20
 */
export function fitFloor(fs: number): number {
  const steps = Math.ceil((fs * FIT.maxLoss) / FIT.step - 0.5)
  return fs - Math.max(0, steps) * FIT.step
}
