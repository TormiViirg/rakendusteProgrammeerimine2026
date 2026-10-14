import { em } from '../leaf'

/** Wide HEADLINE template: large times and one large underlined title. Cinema and break tickets. */
export const headline = {
  bodyPadTop: 15.85,
  bodyPadBottom: 14.4,
  times: { fs: 40, lh: 55.5, labelX: 24, valueX: 299, valueFs: 38, dayFs: 32, dayLh: 36, dayShift: 2, dayGap: em(0) },
  titleFs: 46,
  titleLh: 54,
  /** `single` option — one time row, centred in the two-row slot (break) */
  singleValueX: 266,
  /** `large` option — a larger title (break) */
  largeTitleMarginTop: 10.7,
  /** extra room above the large title when the weekday line is shown */
  largeNightGap: 30,
  largeTitleFs: 64,
  largeTitleLh: 72,
  largeUnderThick: 3,
  titlePadX: 40,
  /** night shifts: keeps the title clear of the wolf prints */
  titlePadXNight: 200,
  underThick: 2,
  underOffset: 5,
  mapW: 32,
  mapH: 35,
  mapLeft: 3,
  mapTop: -18.6,
  /** wrapped title: the icon sits beside the last line */
  mapBottomWrapped: 6,
  /** paws are sized by height so they keep their distance from the text rows */
  pawH: 76,
  paw1Right: 26,
  paw1Top: 53,
  paw2Left: 133,
  paw2Bottom: 124,
  paw3Left: 26,
  paw3Bottom: 84,
}
