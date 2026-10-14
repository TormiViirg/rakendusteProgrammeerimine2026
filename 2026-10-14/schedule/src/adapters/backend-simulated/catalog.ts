import type { HallFacts, VenueFacts } from '../../core/ports'

/**
 * SIMULATED — the non-translated columns of the venue and hall tables.
 * Names, addresses and entry instructions are text and live in src/locales
 * under the same ids.
 *
 * PLACEHOLDER coordinates: approximate, verify before going live.
 */
export const VENUES: Record<string, VenueFacts> = {
  artis: { lat: 59.43362, lng: 24.75135 },
  'coca-cola-plaza': { lat: 59.43905, lng: 24.75702 },
  soprus: { lat: 59.43503, lng: 24.74474 },
  'nordic-forum': { lat: 59.43742, lng: 24.75482 },
  alexela: { lat: 59.43371, lng: 24.752 },
}

export const HALLS: Record<string, HallFacts> = {
  'artis-8': { venueId: 'artis', number: 8 },
  'artis-1': { venueId: 'artis', number: 1 },
  'ccp-11': { venueId: 'coca-cola-plaza', nameKey: 'scape' },
  'ccp-3': { venueId: 'coca-cola-plaza', number: 3 },
  'soprus-big': { venueId: 'soprus', nameKey: 'big' },
  'nordic-conf': { venueId: 'nordic-forum', nameKey: 'conference' },
}
