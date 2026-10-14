import { buildPlace } from '../../core/shift/place'
import { buildTime } from '../../core/shift/time'
import type { BuildContext } from '../../core/ticket/kind'
import type { VenueModel } from './model'
import type { VenueRecord } from './record'

export function buildVenue(r: VenueRecord, ctx: BuildContext): VenueModel {
  const { time, night } = buildTime(ctx.lookup, r)
  return { id: r.id, time, night, barcode: r.barcode ?? r.id, place: buildPlace(ctx, r.venueId, undefined) }
}
