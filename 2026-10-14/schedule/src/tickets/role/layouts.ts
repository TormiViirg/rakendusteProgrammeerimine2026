import type { KindLayout } from '../../core/ticket/kind'
import type { RoleFeature } from './features'

/** Phone: the thin role template — large role name, cinema and hall in the strip. */
export const roleThin: KindLayout<RoleFeature> = {
  rules: [],
  budget: { restore: ['thinRoleTitle'], grow: [], maxExtraLines: 2 },
}

/** Everything else: the wide role template — role in the left two columns, location in the right two. */
export const roleWide: KindLayout<RoleFeature> = {
  rules: [],
  budget: { restore: ['wideRoleTitle', 'wideRoleVenue'], grow: [], maxExtraLines: 1 },
}
