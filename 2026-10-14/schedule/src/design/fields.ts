import { FILM_TIERS, HERO_TIERS, ONE_LINE, type LinePreference, type SizeTier } from './fit'
import type { Layout } from './layout'
import type { Tokens } from './tokens'
import type { lines } from './tokens/lines'

/**
 * Every dynamic text on a ticket is a FIELD: it names where its size comes
 * from and how it behaves when the text is long. How many lines it may take is
 * the token `lines.<field>` (tokens/lines.ts).
 *
 * Naming: <shape><Template or shared part><What>. A field belongs to one
 * template or to the shared stub, never to a ticket kind — two kinds that use
 * the same template share its fields.
 *
 * Views use them as `<Fit field="thinScreeningFilm" text={…} />`.
 */
export interface TextField {
  /** [font size, line height] in pt */
  size: (t: Tokens) => [number, number]
  tiers?: SizeTier[]
  prefer?: LinePreference
}

export type TextFieldId = keyof typeof lines

/** Fields of the thin (phone) ticket. */
const THIN = {
  // ── thin · shared stub ─────────────────────────────────────────────────────
  thinStripVenue: { size: (t) => [t.thin.strip.blockFs, t.thin.strip.blockLh] },
  thinStripHall: { size: (t) => [t.thin.strip.blockFs, t.thin.strip.blockLh] },
  thinStripLabel: { size: (t) => [t.thin.strip.cellFs, t.thin.strip.cellLh] },
  thinStripSmallLabel: { size: (t) => [t.thin.strip.smallFs, t.thin.strip.smallLh] },
  thinFootItem: { size: (t) => [t.thin.foot.fs, t.thin.foot.lh] },
  // the screening code: always the same length, but a longer one must still stay inside the footer
  thinFootCode: { size: (t) => [t.thin.foot.fs, t.thin.foot.lh] },
  thinFootAddress: { size: (t) => [t.thin.foot.addressFs, t.thin.foot.lh] },

  // ── thin · role template ───────────────────────────────────────────────────
  thinRoleTimesLabel: { size: (t) => [t.thin.role.times.fs, t.thin.role.times.lh] },
  thinRoleTitle: { size: (t) => [t.thin.role.titleFs, t.thin.role.titleLh], tiers: HERO_TIERS },

  // ── thin · headline template ───────────────────────────────────────────────
  thinHeadlineTimesLabel: { size: (t) => [t.thin.headline.times.fs, t.thin.headline.times.lh] },
  thinHeadlineTitle: { size: (t) => [t.thin.headline.titleFs, t.thin.headline.titleLh], tiers: HERO_TIERS },
  thinHeadlineCaption: { size: (t) => [t.thin.foot.fs, t.thin.foot.lh] },

  // ── thin · screening template ──────────────────────────────────────────────
  thinScreeningTimesLabel: { size: (t) => [t.thin.screening.times.fs, t.thin.screening.times.lh] },
  thinScreeningCaption: { size: (t) => [t.thin.screening.captionFs, t.thin.screening.captionLh] },
  thinScreeningFilmCaption: { size: (t) => [t.thin.screening.filmCaptionFs, t.thin.screening.filmCaptionLh] },
  thinScreeningAudience: { size: (t) => [t.thin.screening.audienceFs, t.thin.screening.audienceLh] },
  thinScreeningVenue: { size: (t) => [t.thin.screening.venueFs, t.thin.screening.venueLh] },
  thinScreeningHall: { size: (t) => [t.thin.screening.hallFs, t.thin.screening.hallLh] },
  thinScreeningRole: { size: (t) => [t.thin.screening.roleFs, t.thin.screening.roleLh] },
  thinScreeningFilm: { size: (t) => [t.thin.screening.filmFs, t.thin.screening.filmLh], tiers: FILM_TIERS },
  thinScreeningProgramme: { size: (t) => [t.thin.screening.progFs, t.thin.screening.progLh] },
  thinScreeningSubsLabel: { size: (t) => [t.thin.screening.subsFs, t.thin.screening.subsLh] },
  thinScreeningSubs: { size: (t) => [t.thin.screening.subsFs, t.thin.screening.subsLh] },
} satisfies Record<string, TextField>

/** Fields of the wide ticket. */
const WIDE = {
  // ── wide · shared stub ─────────────────────────────────────────────────────
  wideStripLabel: { size: (t) => [t.wide.strip.fs, t.wide.strip.h] },
  wideFootItem: { size: (t) => [t.wide.foot.fs, t.wide.foot.h] },
  wideFootCode: { size: (t) => [t.wide.foot.numFs, t.wide.foot.h] },
  wideFootAudience: { size: (t) => [t.wide.foot.fs, t.wide.foot.h] },
  wideFootAddress: { size: (t) => [t.wide.foot.addressFs, t.wide.foot.h] },
  wideFootCaption: { size: (t) => [t.wide.foot.addressFs, t.wide.foot.h] },

  // ── wide · screening template ──────────────────────────────────────────────
  wideScreeningTimesLabel: { size: (t) => [t.wide.screening.times.fs, t.wide.screening.times.lh] },
  wideScreeningFilmLabel: { size: (t) => [t.wide.screening.filmLabelFs, t.wide.screening.filmLh] },
  wideScreeningFilm: { size: (t) => [t.wide.screening.filmFs, t.wide.screening.filmLh], prefer: ONE_LINE },
  wideScreeningProgramme: { size: (t) => [t.wide.screening.progFs, t.wide.screening.progLh] },
  wideScreeningSubsLabel: { size: (t) => [t.wide.screening.subsLabelFs, t.wide.screening.subsLh] },
  wideScreeningSubs: { size: (t) => [t.wide.screening.subsFs, t.wide.screening.subsLh] },
  // one row if a single step smaller is enough; otherwise it keeps that size and takes the second row
  wideScreeningVenue: { size: (t) => [t.wide.screening.venueFs, t.wide.screening.venueLh], prefer: { lines: 1, steps: 1 } },
  wideScreeningHall: { size: (t) => [t.wide.screening.hallFs, t.wide.screening.hallLh] },
  // the hall when the cinema name takes two rows
  wideScreeningHallSmall: { size: (t) => [t.wide.screening.hallSmallFs, t.wide.screening.hallSmallLh] },
  wideScreeningRole: { size: (t) => [t.wide.screening.roleFs, t.wide.screening.roleLh] },

  // ── wide · headline template ───────────────────────────────────────────────
  wideHeadlineTimesLabel: { size: (t) => [t.wide.headline.times.fs, t.wide.headline.times.lh] },
  wideHeadlineTitle: { size: (t) => [t.wide.headline.titleFs, t.wide.headline.titleLh], prefer: ONE_LINE },
  wideHeadlineTitleLarge: { size: (t) => [t.wide.headline.largeTitleFs, t.wide.headline.largeTitleLh], prefer: { lines: 1, steps: 4 } },

  // ── wide · role template ───────────────────────────────────────────────────
  wideRoleTimesLabel: { size: (t) => [t.wide.role.times.fs, t.wide.role.times.lh] },
  wideRoleTitle: { size: (t) => [t.wide.role.titleFs, t.wide.role.titleLh] },
  wideRoleVenue: { size: (t) => [t.wide.role.venueFs, t.wide.role.venueLh] },
  wideRoleHall: { size: (t) => [t.wide.role.hallFs, t.wide.role.hallLh] },
} satisfies Record<string, TextField>

/** Every field. The type makes sure each has a line budget in tokens/lines.ts, and the other way round. */
export const TEXT_FIELDS: Record<TextFieldId, TextField> = { ...THIN, ...WIDE }

export const TEXT_FIELD_IDS = Object.keys(TEXT_FIELDS) as TextFieldId[]

/** Which ticket shape a field belongs to — by where it is declared above, not by its name. */
export const fieldLayout = (id: string): Layout | undefined => (Object.hasOwn(THIN, id) ? 'thin' : Object.hasOwn(WIDE, id) ? 'wide' : undefined)
