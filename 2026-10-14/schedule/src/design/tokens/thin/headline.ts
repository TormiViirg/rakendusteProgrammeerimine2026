import { em } from '../leaf'
import type { TimesTokens } from '../times'

/**
 * Thin HEADLINE template: times and one large underlined title with an icon.
 * Used by the cinema ticket ("Kino Artis") and the break ticket ("Puhke paus").
 */
export const headline = {
  bodyPadTop: 17.46,
  bodyPadBottom: 8,
  times: {
    fs: 24,
    lh: 37,
    gap: 8,
    dayFs: 20,
    dayLh: 22,
    dayShift: 0.8,
    dayNudge: 1,
    dayGap: em(0),
    marginL: 16.8,
    marginR: 9,
  } as TimesTokens,
  rowMinH: 93.6,
  rowMarginTop: -1.46,
  pawColMin: 94,
  /** right of the title: room for the map icon beside a wrapped title, clear of the notch */
  mapColMin: 35,
  pawLeft: 29.67,
  pawBottom: 7.9,
  pawW: 58,
  titlePadTop: 24,
  titleFs: 36,
  titleLh: 44,
  /** 0 = centred on the card */
  titleNudge: 0,
  underThick: 1.67,
  underOffset: 3,
  mapLeft: -5,
  mapTop: 11.4,
  mapW: 18.3,
  mapH: 20,
  /** wrapped title: the icon sits beside the last line */
  mapLeftWrapped: 1.5,
  mapBottomWrapped: 9,
}
