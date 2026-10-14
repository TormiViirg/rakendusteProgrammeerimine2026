import { LOCATED_CHECKS, optionalId, optionalMinutes, required, type Check } from '../../core/shift/checks'
import type { LocatedRecord } from '../../core/shift/records'

/** A shift with a position but without a film: when, where, as what. */
export interface RoleRecord extends LocatedRecord {
  kind: 'role'
  /** row of the `role` lookup table; also picks the accent colour */
  roleId: string
  /** minutes before the start to be at the Black Carpet. No valid value → not shown. */
  bcMin?: number | null
}

export const roleChecks: Check[] = [...LOCATED_CHECKS, optionalId('hallId'), required('roleId'), optionalMinutes('bcMin')]
