import { SHIFT_CHECKS, optionalId, required, type Check } from '../../core/shift/checks'
import type { ShiftRecordBase } from '../../core/shift/records'

/** A pause between shifts — the one ticket without a location. */
export interface BreakRecord extends ShiftRecordBase {
  kind: 'break'
  /** row of the `break` lookup table: what kind of pause */
  breakId: string
  /** row of the `breakNote` lookup table: a line under the barcode */
  noteId?: string
}

export const breakChecks: Check[] = [...SHIFT_CHECKS, required('breakId'), optionalId('noteId')]
