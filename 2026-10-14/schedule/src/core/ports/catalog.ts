/**
 * PORT — the non-translated columns of the lookup tables (coordinates, hall
 * numbers). Their names and addresses are text and come through the Lookup port
 * under the same ids.
 */
export interface VenueFacts {
  /** WGS84 */
  lat?: number
  lng?: number
}

export interface HallFacts {
  /** the cinema the hall is in; a shift that names this hall with another cinema is reported */
  venueId?: string
  /** numbered halls use the pattern "Saal {{n}}" … */
  number?: number
  /** … named ones a row in the `hall` lookup table */
  nameKey?: string
}

export interface Catalog {
  venue(id: string): VenueFacts | undefined
  hall(id: string): HallFacts | undefined
}
