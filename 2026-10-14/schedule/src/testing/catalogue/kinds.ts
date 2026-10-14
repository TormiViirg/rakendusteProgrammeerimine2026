import type { RawRecord } from '../../core/shift/records'
import type { KindId } from '../../tickets/registry'
import { narrowed } from './define'
import { programmes, subtitles } from './parameters/lists'
import { bc, code, duration, gap, qa, rating } from './parameters/numbers'
import { audience, breakNote, breakTitle, film, hall, prefix, role, venue } from './parameters/texts'
import { timesParameter } from './parameters/times'
import type { ParameterList } from './types'

/**
 * Which parameters each ticket kind has, and — for the variant tests — which
 * class switches each feature on and off.
 */
export interface KindCatalogue {
  /** fields no parameter sets */
  fixed: RawRecord
  parameters: ParameterList
  /** feature → [parameter, class that turns it on, class that turns it off] */
  witnesses: Record<string, { parameter: string; on: string; off: string }>
}

const located = timesParameter({ arrival: true })

export const KIND_CATALOGUE: Record<KindId, KindCatalogue> = {
  break: {
    fixed: { kind: 'break' },
    parameters: [timesParameter({ arrival: false }), breakTitle, breakNote],
    witnesses: {
      night: { parameter: 'times', on: 'night', off: 'day' },
      note: { parameter: 'note', on: 'typical', off: 'none' },
    },
  },

  venue: {
    fixed: { kind: 'venue' },
    parameters: [located, venue],
    witnesses: {
      night: { parameter: 'times', on: 'night', off: 'day' },
      address: { parameter: 'venue', on: 'full-size', off: 'no-address' },
    },
  },

  role: {
    fixed: { kind: 'role' },
    parameters: [
      located,
      // on its own the role is the headline: the ordinary case is a plain, uncoloured one
      narrowed(role, { base: 'full-size' }),
      venue,
      // a role shift may have no hall
      narrowed(hall, { without: ['absent'] }),
      // the mockup's role ticket carries a BC time
      narrowed(bc, { base: 'two-digit' }),
    ],
    witnesses: {
      night: { parameter: 'times', on: 'night', off: 'day' },
      hall: { parameter: 'hall', on: 'numbered', off: 'none' },
      bc: { parameter: 'bc', on: 'two-digit', off: 'absent' },
      address: { parameter: 'venue', on: 'full-size', off: 'no-address' },
    },
  },

  screening: {
    fixed: { kind: 'screening' },
    parameters: [
      located,
      role,
      venue,
      // a film always has a hall
      narrowed(hall, { without: ['none', 'wrong-type'] }),
      audience,
      prefix,
      film,
      programmes,
      subtitles,
      duration,
      gap,
      bc,
      narrowed(qa, { base: 'two-digit' }),
      rating,
      code,
    ],
    witnesses: {
      night: { parameter: 'times', on: 'night', off: 'day' },
      rating: { parameter: 'rating', on: 'two-digit', off: 'absent' },
      subtitles: { parameter: 'subtitles', on: 'several', off: 'none' },
      bc: { parameter: 'bc', on: 'two-digit', off: 'absent' },
      qa: { parameter: 'qa', on: 'two-digit', off: 'absent' },
      address: { parameter: 'venue', on: 'full-size', off: 'no-address' },
    },
  },
}
