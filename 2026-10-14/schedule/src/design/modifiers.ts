import type { DesignContext } from './scales'
import type { DeepPartial, Tokens } from './tokens'

/**
 * Modifiers — page-wide adjustments on top of the scale. All that match are
 * applied, in this order. These three are starting points: tune the numbers
 * or empty the overrides.
 *
 * (A change that should apply to ONE ticket because of what it carries is a
 * variant rule of its kind: tickets/<kind>/layouts.ts.)
 */
export interface Modifier {
  id: string
  when: (c: DesignContext) => boolean
  overrides: DeepPartial<Tokens>
}

/** The kinds the `mixed` modifier counts as "without a film". A new kind joins only if it is added here. */
const WITHOUT_FILM = ['role', 'venue', 'break']

export const MODIFIERS: Modifier[] = [
  {
    // Tickets with and without a film in one list: bring the headline ticket's large
    // 24pt time block down to the role ticket's 20pt so the three read as a family.
    id: 'mixed',
    when: (c) => c.kinds.includes('screening') && c.kinds.some((k) => WITHOUT_FILM.includes(k)),
    overrides: { thin: { headline: { times: { fs: 20, lh: 32, dayFs: 16, dayLh: 20 } } } },
  },
  {
    // Many tickets on screen: one perforation pitch between tickets instead of 20pt.
    id: 'dense',
    when: (c) => c.count >= 9,
    overrides: { page: { cardGap: 12, dayGap: 12 } },
  },
  {
    // A very long headline somewhere in the set: start every headline one step
    // down so the tickets stay consistent instead of one shrinking alone.
    id: 'long-text',
    when: (c) => c.longestText > 40,
    overrides: { thin: { role: { titleFs: 32, titleLh: 38 }, headline: { titleFs: 32, titleLh: 40 } } },
  },
]
