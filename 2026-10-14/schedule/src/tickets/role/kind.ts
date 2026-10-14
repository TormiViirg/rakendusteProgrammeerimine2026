import { defineKind } from '../../core/ticket/kind'
import { buildRole } from './build'
import { roleFeatures, roleSlots } from './features'
import { roleThin, roleWide } from './layouts'
import { roleChecks } from './record'

/** ROLE — a shift with a position but without a film: times, role, location. */
export const roleKind = defineKind({
  id: 'role',
  about: 'a shift in a position, without a film: when, where and as what',
  checks: roleChecks,
  build: buildRole,
  headline: (m) => m.role,
  features: roleFeatures,
  slots: roleSlots,
  layouts: { thin: roleThin, wide: roleWide },
})
