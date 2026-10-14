import type { BuildContext } from '../ticket/kind'

/** A cinema as the tickets and the location sheet show it. */
export interface Place {
  venueId: string
  name: string
  hall?: string
  /** written-out address */
  address?: string
  /** how to get into the building */
  entry?: string
  lat?: number
  lng?: number
}

/**
 * "Saal 8" for a numbered hall, the lookup row for a named one, the raw id for an unknown one.
 * A hall of another cinema is shown as sent, with a warning: the record contradicts itself and
 * the ticket cannot know which half is right.
 */
function hallName(ctx: BuildContext, venueId: string, hallId: string): string {
  const hall = ctx.catalog.hall(hallId)
  if (!hall) return ctx.known('hallId', hallId, ctx.lookup.row('hall', hallId))
  if (hall.venueId !== undefined && hall.venueId !== venueId) ctx.warn('hallId', 'inconsistent', { hallId, itsVenue: hall.venueId, venueId })
  if (hall.number !== undefined) return ctx.lookup.pattern('hallNumbered', { n: hall.number })
  return ctx.known('hallId', hallId, ctx.lookup.row('hall', hall.nameKey ?? hallId))
}

export function buildPlace(ctx: BuildContext, venueId: string, hallId: string | undefined): Place {
  const venue = ctx.catalog.venue(venueId)
  return {
    venueId,
    name: ctx.known('venueId', venueId, ctx.lookup.row('venue', venueId)),
    hall: hallId ? hallName(ctx, venueId, hallId) : undefined,
    address: ctx.lookup.row('venueAddress', venueId),
    entry: ctx.lookup.row('venueEntry', venueId),
    lat: venue?.lat,
    lng: venue?.lng,
  }
}
