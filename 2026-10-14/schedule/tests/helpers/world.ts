import { createSimulatedBackend } from '../../src/adapters/backend-simulated/backend'
import { createI18nextLookups } from '../../src/adapters/i18next/lookup'
import { buildCaptions } from '../../src/core/schedule/captions'
import { contentIds } from '../../src/core/schedule/schedule'
import type { RawRecord } from '../../src/core/shift/records'
import { planTicket } from '../../src/core/ticket/plan'
import { makeTicket, type PipelineContext } from '../../src/core/ticket/pipeline'
import type { Layout } from '../../src/design/layout'
import { FIXTURE_CONTENT, FIXTURE_HALLS, FIXTURE_ROWS, FIXTURE_VENUES } from '../../src/testing/fixtures'
import { KINDS } from '../../src/tickets/registry'

/**
 * The same wiring as app/compose.ts, without a browser: the real lookup
 * adapter and the simulated backend, with the test fixtures added.
 */
const backend = createSimulatedBackend({ content: FIXTURE_CONTENT, venues: FIXTURE_VENUES, halls: FIXTURE_HALLS })
backend.setLatency(0)
const lookups = createI18nextLookups()
lookups.addRows('et', FIXTURE_ROWS)

export const lookup = lookups.lookup

export const captions = (lang: string) => buildCaptions(lookups.lookup(lang))

/** Runs records through the pipeline in `lang`, with the content they need fetched first. */
export async function run(records: RawRecord[], lang = 'et') {
  const content = await backend.fetchContent(lang, contentIds({ shifts: records }, KINDS))
  const ctx: PipelineContext = { kinds: KINDS, lookup: lookups.lookup(lang), catalog: backend.catalog, content }
  return records.map((r) => makeTicket(r, ctx))
}

export const plan = (kind: string, features: Record<string, boolean>, layout: Layout) => planTicket(KINDS[kind as keyof typeof KINDS], features, layout)
