import { num } from './leaf'

/**
 * Line budget of every text field (design/fields.ts): how many lines the text
 * may take before it is shrunk and cut.
 *
 * The outline and the strip never change size, so these budgets are what keeps
 * the content inside: the defaults add up to the mockup heights. More lines are
 * handed out per ticket by its space budget (tickets/<kind>/layouts.ts) when
 * the ticket has room to spare.
 */
export const lines = {
  // thin · shared stub
  thinStripVenue: num(1),
  thinStripHall: num(1),
  thinStripLabel: num(1),
  thinStripSmallLabel: num(2),
  thinFootItem: num(1),
  thinFootCode: num(1),
  thinFootAddress: num(1),
  // thin · role template
  thinRoleTimesLabel: num(1),
  thinRoleTitle: num(1),
  // thin · headline template
  thinHeadlineTimesLabel: num(1),
  thinHeadlineTitle: num(2),
  thinHeadlineCaption: num(1),
  // thin · screening template
  thinScreeningTimesLabel: num(1),
  thinScreeningCaption: num(1),
  thinScreeningFilmCaption: num(1),
  thinScreeningAudience: num(2),
  thinScreeningVenue: num(1),
  thinScreeningHall: num(1),
  thinScreeningRole: num(1),
  thinScreeningFilm: num(1),
  thinScreeningProgramme: num(1),
  thinScreeningSubsLabel: num(1),
  thinScreeningSubs: num(2),

  // wide · shared stub
  wideStripLabel: num(1),
  wideFootItem: num(1),
  wideFootCode: num(1),
  wideFootAudience: num(1),
  wideFootAddress: num(1),
  wideFootCaption: num(1),
  // wide · screening template
  wideScreeningTimesLabel: num(1),
  wideScreeningFilmLabel: num(1),
  wideScreeningFilm: num(1),
  wideScreeningProgramme: num(1),
  wideScreeningSubsLabel: num(1),
  wideScreeningSubs: num(2),
  wideScreeningVenue: num(2),
  wideScreeningHall: num(1),
  wideScreeningHallSmall: num(1),
  wideScreeningRole: num(1),
  // wide · headline template
  wideHeadlineTimesLabel: num(1),
  wideHeadlineTitle: num(1),
  wideHeadlineTitleLarge: num(1),
  // wide · role template
  wideRoleTimesLabel: num(1),
  wideRoleTitle: num(2),
  wideRoleVenue: num(2),
  wideRoleHall: num(1),
}
