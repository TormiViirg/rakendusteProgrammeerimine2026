import { em, num } from '../leaf'

/**
 * Compact time block of wide tickets (27pt). The screening and the role template
 * each start from it and can be changed independently (wide.screening.times /
 * wide.role.times).
 */
export const compactTimes = {
  fs: 27,
  lh: 40.5,
  labelX: 25,
  valueX: 241,
  valueFs: 27,
  /** the end time is set smaller and bold */
  endFs: 23,
  /** hyphen between start and end: its size and side margins */
  dashFs: 23,
  dashMargin: 6,
  /** 1 = start time as typed (A); the 4x mockup stretches it horizontally to 1.29 (B) */
  startStretch: num(1),
  dayFs: 15,
  dayLh: 16,
  dayShift: -3,
  dayGap: em(0.9),
}
