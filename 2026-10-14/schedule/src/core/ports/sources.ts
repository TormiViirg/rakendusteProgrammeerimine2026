import type { ContentResponse, ScheduleResponse } from '../shift/records'
import type { ContentIds } from '../ticket/kind'

/**
 * PORTS — where the data comes from. adapters/backend-simulated implements
 * both for the demo; a real deployment implements them with two requests:
 *
 *   GET /api/my-shifts?view=…&page=…                 → ScheduleResponse
 *   GET /api/content?lang=ru&films=a,b&programmes=c  → ContentResponse
 */
export interface ScheduleQuery {
  /** which schedule (the demo: a mockup or a test suite) */
  view: string
  /** paged responses only */
  page?: number
}

export interface ScheduleSource {
  fetchSchedule(query: ScheduleQuery): Promise<ScheduleResponse>
}

/** Frequently changing, translated content — film titles and programme names. */
export interface ContentSource {
  /** `ids`: the ids wanted, per collection */
  fetchContent(lang: string, ids: ContentIds): Promise<ContentResponse>
}
