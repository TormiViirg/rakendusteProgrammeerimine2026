import { createSimulatedBackend } from '../adapters/backend-simulated/backend'
import { createConsoleProblems } from '../adapters/console/problems'
import { ruleHyphenator } from '../adapters/hyphenation/rules'
import { createI18nextLookups } from '../adapters/i18next/lookup'
import { leafletMap } from '../adapters/leaflet/map'
import type { ScheduleSource } from '../core/ports'
import { assertKinds } from '../core/ticket/compile'
import { LANGS } from '../locales/languages'
import { FIXTURE_CONTENT, FIXTURE_HALLS, FIXTURE_ROWS, FIXTURE_VENUES } from '../testing/fixtures'
import { suiteOf, testSource } from '../testing/source'
import { KINDS } from '../tickets/registry'
import { VIEWS } from '../tickets/views'
import type { UiPorts } from '../ui/ports'
import type { SchedulePorts } from '../ui/schedule/useSchedule'

/**
 * THE COMPOSITION ROOT — the one place that knows which adapter fills which
 * port. Everything else depends on the ports only.
 *
 *   port               adapter here                       to change it
 *   ───────────────    ───────────────────────────────    ─────────────────────────────
 *   schedule, content  adapters/backend-simulated         write one that calls your API
 *   catalog            adapters/backend-simulated         "
 *   lookup             adapters/i18next + src/locales     load the tables from the backend
 *   hyphenator         adapters/hyphenation (rules)       a dictionary-based library
 *   map                adapters/leaflet                   another map, or none
 *   problems           adapters/console                   your monitoring
 *
 * The demo also serves the test suites (src/testing) as schedules, and gives
 * the simulated backend and the lookup the fixture rows they refer to. A
 * production build leaves both out.
 */
export function compose() {
  // a wrong ticket definition should stop the app before it draws anything
  assertKinds(KINDS)

  const backend = createSimulatedBackend({ content: FIXTURE_CONTENT, venues: FIXTURE_VENUES, halls: FIXTURE_HALLS })
  const lookups = createI18nextLookups()
  lookups.addRows('et', FIXTURE_ROWS)

  const schedule: ScheduleSource = {
    fetchSchedule: (query) => (suiteOf(query.view) ? testSource.fetchSchedule(query) : backend.fetchSchedule(query)),
  }

  const data: SchedulePorts = { schedule, content: backend, catalog: backend.catalog, lookup: lookups.lookup, problems: createConsoleProblems() }
  const ui: UiPorts = { hyphenator: ruleHyphenator, map: leafletMap }

  return { data, ui, kinds: KINDS, views: VIEWS, languages: LANGS, setLatency: backend.setLatency }
}
