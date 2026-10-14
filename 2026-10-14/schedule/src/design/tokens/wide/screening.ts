import { compactTimes } from './times'

/** Wide SCREENING template: times, film and programme on the left; cinema, hall, role on the right; subtitles below. */
export const screening = {
  bodyPadTop: 10.8,
  /** whitespace the mockup keeps between two subtitle lines and the strip */
  bodyPadBottom: 4.4,
  /** times + film block; keeps the subtitles row in place when the programme takes two lines */
  topMinH: 183.75,
  rightColW: 210,
  times: { ...compactTimes },
  /** right-aligned edge of the "Film:" / "Subtiitrid:" captions, and where their content starts */
  labelRight: 94.3,
  contentX: 116,
  contentW: 329,
  filmMarginTop: 11.2,
  /** the film row sits lower when the weekday line is shown above it */
  filmNightShift: 5,
  filmLabelFs: 32,
  filmFs: 32,
  filmLh: 40,
  filmPadBottom: 3.5,
  ruleH: 1,
  ruleColor: 'oklch(0.8853 0 0)',
  progMarginTop: 3.5,
  progFs: 24,
  progLh: 28,
  subsLabelFs: 20,
  subsFs: 20,
  subsLh: 24,
  subsPadRight: 24,
  /** room for the age badge above the venue; may shrink to rightPadTopMin when the venue takes two rows */
  rightPadTop: 51,
  rightPadTopMin: 36,
  /** hall when the venue takes two rows */
  hallSmallFs: 24,
  hallSmallLh: 28,
  venueFs: 32,
  venueLh: 40,
  hallMarginTop: 3.5,
  hallFs: 32,
  hallLh: 40,
  roleMarginTop: 5.4,
  roleFs: 24,
  roleLh: 28,
  rightPadX: 8,
  /** room kept free on both sides of the venue name: the help icon hangs off its end, the paw sits before it */
  venueInset: 27,
  /** help icon, relative to the end / top of the venue name */
  helpLeft: 2.5,
  helpRise: 13.3,
  /** extra side inset of the role, which may reach down into the notch zone */
  rolePadX: 8,
  ratingBox: 86,
  /** (box − box / √2) / 2 */
  ratingInset: 12.6,
  ratingRight: 24.25,
  ratingTop: 0.5,
  ratingStroke: 1,
  ratingFs: 34,
  helpSize: 24,
  /** night-shift paw between the times and the venue */
  pawLeft: 441,
  pawTop: 50,
  pawW: 58,
}
