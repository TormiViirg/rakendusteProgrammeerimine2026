import { compactTimes } from './times'

/**
 * Wide ROLE template — a shift without a film: compact times, then four
 * columns: the role in the left two, the location in the right two.
 */
export const role = {
  bodyPadTop: 10.8,
  bodyPadBottom: 10,
  times: { ...compactTimes },
  padX: 25,
  colGap: 24,
  /** room kept above the row for the weekday line */
  rowMarginTop: 14,
  titleFs: 46,
  titleLh: 52,
  venueFs: 32,
  venueLh: 38,
  hallMarginTop: 4,
  hallFs: 28,
  hallLh: 34,
  mapW: 22,
  mapH: 24.4,
  mapGap: 8,
}
