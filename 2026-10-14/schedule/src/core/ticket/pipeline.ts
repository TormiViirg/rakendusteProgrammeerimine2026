import { show } from '../shift/checks'
import type { RawRecord } from '../shift/records'
import { describe } from './feature'
import { CONTENT_PENDING, type BuildContext, type KindRegistry } from './kind'
import { isError, type Finding, type Problem } from './problem'
import type { Ticket } from './ticket'

/**
 * The PIPELINE — a record becomes a ticket in three stages, the same for every kind:
 *
 *   record ──check──▶ well-formed record ──build──▶ model ──describe──▶ ticket (model + variant)
 *              │                              │
 *              └─ problems (errors stop here) └─ warnings (raw ids shown, bad optional values left out)
 *
 * The fourth stage, planning (plan.ts), depends on the ticket shape and runs
 * when the ticket is drawn.
 *
 * Whatever arrives — `null`, a number, a record whose definition throws — the
 * result is a ticket or a list of problems, never an exception: one bad record
 * must not take the schedule down.
 */
export interface PipelineContext extends Pick<BuildContext, 'lookup' | 'catalog' | 'content'> {
  kinds: KindRegistry
}

export interface PipelineResult {
  /** absent when the record has an error */
  ticket?: Ticket
  problems: Problem[]
}

/** `value[key]` if `value` is an object that has `key` itself; otherwise undefined. */
const own = (value: unknown, key: string): unknown => (typeof value === 'object' && value !== null && Object.hasOwn(value, key) ? (value as Record<string, unknown>)[key] : undefined)

const isRecord = (v: unknown): v is RawRecord => typeof v === 'object' && v !== null && !Array.isArray(v)

/** The shift id of anything that might be a record; '' when it has none. */
export const shiftIdOf = (raw: unknown): string => (isRecord(raw) && typeof raw.id === 'string' ? raw.id.trim() : '')

export function makeTicket(raw: unknown, ctx: PipelineContext): PipelineResult {
  const shiftId = shiftIdOf(raw)
  const kindId = isRecord(raw) && typeof raw.kind === 'string' ? raw.kind : undefined
  const problems: Problem[] = []
  const note = (f: Finding) => problems.push({ shiftId, kind: kindId, ...f })

  if (!isRecord(raw)) {
    note({ code: 'malformed', severity: 'error', detail: show(raw) })
    return { problems }
  }
  if (!shiftId) note({ field: 'id', code: 'malformed', severity: 'error', detail: show(raw.id) })
  const kind = kindId !== undefined && Object.hasOwn(ctx.kinds, kindId) ? ctx.kinds[kindId] : undefined
  if (!kind) {
    note({ field: 'kind', code: 'unknown-kind', severity: 'error', detail: show(raw.kind) })
    return { problems }
  }

  try {
    // 1 · check
    for (const check of kind.checks) {
      const found = check(raw)
      if (found) for (const f of Array.isArray(found) ? found : [found]) note(f)
    }
    if (problems.some(isError)) return { problems }

    // 2 · build
    const known: BuildContext['known'] = (field, id, text) => {
      if (typeof text === 'string') return text
      note({ field, code: 'unknown-id', severity: 'warning', detail: show(id) })
      return id
    }
    const build: BuildContext = {
      lookup: ctx.lookup,
      catalog: ctx.catalog,
      content: ctx.content,
      warn: (field, code, detail) => note({ field, code, severity: 'warning', detail: show(detail) }),
      known,
      contentText: (field, collection, id) => {
        if (!ctx.content) return { text: CONTENT_PENDING }
        // the answer is data too: any part of it may be missing or of the wrong shape
        const item = own(own(own(ctx.content, 'items'), collection), id)
        const text = own(item, 'text')
        const lang = own(item, 'lang')
        return typeof text === 'string' ? { text, lang: typeof lang === 'string' ? lang : undefined } : { text: known(field, id, undefined) }
      },
    }
    const model = kind.build(raw, build)

    // 3 · describe
    return { ticket: { id: shiftId, kind: kind.id, model, features: describe(kind.features, model), headline: kind.headline(model) }, problems }
  } catch (e) {
    // a check or a build step that throws is a defect in the kind's definition; the record is not shown
    note({ code: 'failed', severity: 'error', detail: e instanceof Error ? e.message : String(e) })
    return { problems }
  }
}
