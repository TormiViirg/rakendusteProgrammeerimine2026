import { useEffect, useMemo, useState } from 'react'
import type { Catalog, ContentSource, Lookup, ProblemSink, ScheduleQuery, ScheduleSource } from '../../core/ports'
import { buildCaptions } from '../../core/schedule/captions'
import { buildSchedule, contentIds, contentKey, needsContent, scheduleInfo } from '../../core/schedule/schedule'
import type { ContentResponse, ScheduleResponse } from '../../core/shift/records'
import type { KindRegistry } from '../../core/ticket/kind'

/** The ports the schedule is loaded and built through (app/compose.ts fills them). */
export interface SchedulePorts {
  schedule: ScheduleSource
  content: ContentSource
  catalog: Catalog
  /** lookup tables and captions in a language */
  lookup: (lang: string) => Lookup
  problems?: ProblemSink
}

/**
 * Loads the shift records for a query and the changing content (film titles,
 * programmes) in the target language, and runs both through the pipeline into
 * display-ready day groups.
 *
 * The two requests are independent: switching language re-fetches only the
 * content, and the previous language stays on screen (`stale`) until the new
 * one arrives. Content is only ever used for the records it was fetched for.
 */
export function useSchedule(ports: SchedulePorts, kinds: KindRegistry, query: ScheduleQuery, lang: string) {
  const { view, page = 0 } = query
  const key = `${view}/${page}`
  const [schedule, setSchedule] = useState<{ key: string; data: ScheduleResponse } | null>(null)
  const [loaded, setLoaded] = useState<{ ids: string; data: ContentResponse } | null>(null)
  const [failed, setFailed] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    ports.schedule.fetchSchedule({ view, page }).then(
      (data) => live && (setSchedule({ key, data }), setFailed(null)),
      () => live && setFailed(key),
    )
    return () => {
      live = false
    }
  }, [ports.schedule, view, page, key])

  const current = schedule?.key === key ? schedule.data : null
  const needed = useMemo(() => (current ? contentIds(current, kinds) : null), [current, kinds])
  const idsKey = needed ? contentKey(needed) : ''

  useEffect(() => {
    if (!needed || !needsContent(needed)) return
    let live = true
    ports.content.fetchContent(lang, needed).then(
      (data) => live && (setLoaded({ ids: idsKey, data }), setFailed(null)),
      () => live && setFailed(key),
    )
    return () => {
      live = false
    }
  }, [ports.content, needed, idsKey, lang, key])

  // content for other records (the previous view or page) is not this schedule's content
  const content = loaded && needed && loaded.ids === idsKey ? loaded.data : null

  const result = useMemo(() => {
    const lookup = ports.lookup(lang)
    const captions = buildCaptions(lookup)
    const built = current ? buildSchedule(current, { kinds, lookup, catalog: ports.catalog, content }) : { days: [], problems: [], notShown: 0 }
    const waiting = Boolean(needed && needsContent(needed) && !content)
    const error = failed === key
    return {
      captions,
      days: built.days,
      problems: built.problems,
      /** shifts left out because their record has an error */
      notShown: built.notShown,
      /** a line for the page: loading failed, or how many shifts are missing */
      notice: error ? captions.loadFailed : built.notShown > 0 ? lookup.pattern('notShown', { count: built.notShown }) : undefined,
      info: scheduleInfo(built.days),
      paging: current?.page,
      /** nothing to show yet */
      pending: !error && (!current || waiting),
      /** a request failed */
      error,
      /** showing the previous language's content while the new one loads */
      stale: Boolean(content && content.lang !== lang),
    }
  }, [ports, kinds, lang, current, content, needed, failed, key])

  const { problems } = result
  useEffect(() => {
    if (problems.length) ports.problems?.report(problems)
  }, [ports.problems, problems])

  return result
}
