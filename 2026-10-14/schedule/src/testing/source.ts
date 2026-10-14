import type { ScheduleSource } from '../core/ports'
import { SCREENS } from './screens'
import { SUITES, SUITE_IDS, pageCount, suitePage, type Case, type SuiteId } from './suites'

/**
 * ADAPTER — serves the test suites through the ScheduleSource port, as the
 * views "test-base", "test-each", "test-pairs", "test-variants", "test-invalid".
 * The app treats them like any other schedule.
 */
const PREFIX = 'test-'

export const TEST_VIEWS = Object.fromEntries(SUITE_IDS.map((id) => [`${PREFIX}${id}`, SUITES[id].about])) as Record<`test-${SuiteId}`, string>

export const suiteOf = (view: string): SuiteId | undefined => {
  const id = view.startsWith(PREFIX) ? view.slice(PREFIX.length) : ''
  return (SUITE_IDS as string[]).includes(id) ? (id as SuiteId) : undefined
}

export const testSource: ScheduleSource = {
  fetchSchedule({ view, page = 0 }) {
    const suite = suiteOf(view)
    return Promise.resolve(suite ? suitePage(suite, page) : { shifts: [] })
  },
}

/** The cases behind one page — what the browser checks compare the page against. */
export const casesOf = (view: string, page: number): Case[] => {
  const suite = suiteOf(view)
  return suite ? suitePage(suite, page).cases : []
}

/** What scripts/check-layout.mjs needs to know before it starts: which pages and which screens exist. */
export const testPlan = () => ({
  suites: Object.fromEntries(SUITE_IDS.map((id) => [id, { view: `${PREFIX}${id}`, pages: pageCount(id), about: SUITES[id].about }])),
  screens: SCREENS,
})
