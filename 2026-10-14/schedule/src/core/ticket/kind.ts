import type { Layout } from '../../design/layout'
import type { Budget } from '../fit/allocator'
import type { Catalog, Lookup } from '../ports'
import type { Check } from '../shift/checks'
import type { ContentResponse } from '../shift/records'
import type { ShiftTime } from '../shift/time'
import type { FeatureDefs } from './feature'
import type { ProblemCode } from './problem'
import type { VariantRule } from './rule'
import type { SlotRules } from './slot'

/**
 * A TICKET KIND — everything that makes one type of ticket what it is, in one
 * definition. The engine (pipeline.ts, plan.ts, compile.ts) is the same for
 * every kind and knows none of them by name.
 *
 * A definition answers, in this order:
 *
 *   checks     is a record of this kind well-formed?
 *   content    which film titles and programme names does it need from the backend?
 *   build      what does it say? (record + lookups → display-ready model)
 *   features   along which yes/no axes do tickets of this kind differ?
 *   slots      which optional parts are present for a given variant?
 *   layouts    per ticket shape: which token changes apply to which variants,
 *              and who gets the spare room?
 *
 * To add a kind: copy a folder in src/tickets, fill in the definition, give it
 * a view per shape, and add it to tickets/registry.ts and tickets/views.ts.
 * docs/ARCHITECTURE.md walks through it.
 */
export interface TicketKind<Id extends string, R, M extends TicketModel, F extends string, S extends string> {
  id: Id
  /** one line for the docs: what this ticket is for */
  about: string
  checks: readonly Check[]
  /** ids of the changing content (film titles, programme names) a record needs; fetched per language */
  content?: (record: R) => ContentIds
  build: (record: R, ctx: BuildContext) => M
  /** the text whose length feeds the page-wide `long-text` modifier */
  headline: (model: M) => string
  features: FeatureDefs<M, F>
  slots: SlotRules<F, S>
  layouts: Record<Layout, KindLayout<F>>
}

/** What a kind says about one ticket shape. */
export interface KindLayout<F extends string> {
  /** token changes by variant, applied in order */
  rules: readonly VariantRule<F>[]
  /** who gets the ticket's spare room */
  budget: Budget
}

/** What every model has, whatever the kind. */
export interface TicketModel {
  id: string
  time: ShiftTime
  /** the shift ends on a later date than it starts */
  night: boolean
  /** seed for the decorative barcode */
  barcode: string
  /** role id; picks the accent colour (design/tones.ts) */
  toneRole?: string
}

/** Ids into the content store, per collection: { films: ['garin'], programmes: ['debut', 'ooc'] }. */
export type ContentIds = Record<string, string[]>

/** Shown in place of changing content while it is still on its way. */
export const CONTENT_PENDING = '…'

/** What `build` may use: the ports, and a way to note what it had to work around. */
export interface BuildContext {
  lookup: Lookup
  catalog: Catalog
  /** null while the content for the current language is still loading */
  content: ContentResponse | null
  /** note a warning about a field */
  warn(field: string, code: ProblemCode, detail?: unknown): void
  /** `text`, or — when the lookup had no row — the raw id, with an `unknown-id` warning */
  known(field: string, id: string, text: string | undefined): string
  /**
   * A text from the content store. While the content is loading: CONTENT_PENDING.
   * Loaded but without this id: the raw id, with an `unknown-id` warning.
   */
  contentText(field: string, collection: string, id: string): { text: string; lang?: string }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyKind = TicketKind<string, any, any, string, string>

/** The registry: every kind by id. */
export type KindRegistry = Readonly<Record<string, AnyKind>>

/* eslint-disable @typescript-eslint/no-explicit-any -- `any` only to look inside a definition's type */
export type ModelOf<K> = K extends TicketKind<string, any, infer M, any, any> ? M : never
export type SlotsOf<K> = K extends TicketKind<string, any, any, any, infer S> ? Record<S, boolean> : never
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Identity function that checks a definition and keeps its exact types. */
export const defineKind = <Id extends string, R, M extends TicketModel, F extends string, S extends string>(kind: TicketKind<Id, R, M, F, S>) => kind
