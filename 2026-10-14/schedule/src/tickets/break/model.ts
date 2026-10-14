import type { TicketModel } from '../../core/ticket/kind'

export interface BreakModel extends TicketModel {
  /** "Puhke paus" */
  title: string
  /** "Tehke midagi lapsikut :)" */
  note?: string
}
