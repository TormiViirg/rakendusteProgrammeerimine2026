import { minutesMeasure, validMinutes } from '../../core/shift/measure'
import { buildPlace } from '../../core/shift/place'
import { buildTime } from '../../core/shift/time'
import type { BuildContext } from '../../core/ticket/kind'
import type { ScreeningModel } from './model'
import { GAP_DISPLAY_MAX, validRating, type ScreeningRecord } from './record'

export function buildScreening(r: ScreeningRecord, ctx: BuildContext): ScreeningModel {
  const { lookup } = ctx
  const { time, night } = buildTime(lookup, r)
  const place = buildPlace(ctx, r.venueId, r.hallId)

  const film = ctx.contentText('filmId', 'films', r.filmId)
  const title = film.text
  const prefix = r.filmPrefixId ? ctx.known('filmPrefixId', r.filmPrefixId, lookup.row('filmPrefix', r.filmPrefixId)) : undefined

  const rating = validRating(r.ageRating)
  const bc = validMinutes(r.bcMin)
  const qa = validMinutes(r.qaMin)

  return {
    id: r.id,
    time,
    night,
    barcode: r.barcode ?? r.sessionCode,
    toneRole: r.roleId,
    rating: rating === undefined ? undefined : `+${rating}`,
    audience: ctx.known('audienceId', r.audienceId, lookup.row('audience', r.audienceId)),
    place: { ...place, hall: place.hall ?? r.hallId },
    role: ctx.known('roleId', r.roleId, lookup.row('role', r.roleId)),
    film: prefix ? lookup.pattern('filmWithPrefix', { prefix, title }) : title,
    filmLang: film.lang,
    programme: r.programmeIds.map((id) => ctx.contentText('programmeIds', 'programmes', id).text),
    subtitles: (r.subtitleIds ?? []).map((id) => ctx.known('subtitleIds', id, lookup.row('subtitle', id))),
    duration: minutesMeasure(lookup, r.durationMin),
    gap: minutesMeasure(lookup, Math.min(GAP_DISPLAY_MAX, r.gapMin)),
    bc: bc === undefined ? undefined : minutesMeasure(lookup, bc),
    qa: qa === undefined ? undefined : minutesMeasure(lookup, qa),
    sessionCode: r.sessionCode,
  }
}
