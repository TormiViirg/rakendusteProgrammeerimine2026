import type { ComponentType } from 'react'
import type { Captions } from '../../core/schedule/captions'
import type { TicketModel } from '../../core/ticket/kind'
import type { Layout } from '../../design/layout'

/** What every ticket view receives. The view draws; it decides nothing about presence. */
export interface TicketViewProps<M extends TicketModel = TicketModel, S extends string = string> {
  model: M
  /** which optional parts to draw (core/ticket/slot.ts) */
  slots: Readonly<Record<S, boolean>>
  captions: Captions
}

export type TicketView<M extends TicketModel = TicketModel, S extends string = string> = ComponentType<TicketViewProps<M, S>>

/** kind id → ticket shape → view */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ViewRegistry = Readonly<Record<string, Record<Layout, TicketView<any, any>>>>
