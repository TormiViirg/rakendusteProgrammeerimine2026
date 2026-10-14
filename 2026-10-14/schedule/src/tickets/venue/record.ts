import { LOCATED_CHECKS, type Check } from '../../core/shift/checks'
import type { LocatedRecord } from '../../core/shift/records'

/** A shift for a whole cinema: only where and when. (A hall, if sent, is not shown.) */
export interface VenueRecord extends LocatedRecord {
  kind: 'venue'
}

export const venueChecks: Check[] = [...LOCATED_CHECKS]
