/**
 * The token tree — every number, colour and font of the tickets.
 *
 *   BASE
 *   ├─ color, font, page, tip, overlay      the same on every ticket shape
 *   ├─ lines                                line budget of every text field
 *   ├─ thin                                 phone ticket, 357 × 326 pt
 *   │   ├─ frame, holo, strip, foot         outline and stub (shared by all thin tickets)
 *   │   └─ role, headline, screening        one entry per body template
 *   └─ wide                                 landscape ticket, 678 × 365 pt
 *       ├─ frame, holo, strip, foot, page
 *       └─ role, headline, screening
 *
 * Each subtree lives in its own file next to this one. The stylesheets
 * (ui/styles) contain layout only and read these values as CSS custom
 * properties: `thin.role.titleFs` → `var(--t-thin-role-titleFs)`
 * (core/design/cssVars.ts). `npm run check` fails if a stylesheet uses a
 * variable that is not a token.
 *
 * Layering, lowest to highest priority (core/design/resolveDesign.ts, core/ticket/plan.ts):
 *   BASE → MEASURED (ratio mode B) → active SCALE → matching MODIFIERS → the ticket's variant rules
 */
import { lines } from './lines'
import { page } from './page'
import { color, font, overlay, tip } from './shared'
import { frame as thinFrame, holo as thinHolo } from './thin/frame'
import { headline as thinHeadline } from './thin/headline'
import { role as thinRole } from './thin/role'
import { screening as thinScreening } from './thin/screening'
import { foot as thinFoot, strip as thinStrip } from './thin/stub'
import { frame as wideFrame, holo as wideHolo } from './wide/frame'
import { headline as wideHeadline } from './wide/headline'
import { page as widePage } from './wide/page'
import { role as wideRole } from './wide/role'
import { screening as wideScreening } from './wide/screening'
import { foot as wideFoot, strip as wideStrip } from './wide/stub'

export const BASE = {
  color,
  font,
  page,
  tip,
  overlay,
  lines,
  thin: {
    frame: thinFrame,
    holo: thinHolo,
    strip: thinStrip,
    foot: thinFoot,
    role: thinRole,
    headline: thinHeadline,
    screening: thinScreening,
  },
  wide: {
    frame: wideFrame,
    page: widePage,
    holo: wideHolo,
    strip: wideStrip,
    foot: wideFoot,
    role: wideRole,
    headline: wideHeadline,
    screening: wideScreening,
  },
}

export type Tokens = typeof BASE
export type { DeepPartial, Leaf } from './leaf'
export { em, num } from './leaf'
