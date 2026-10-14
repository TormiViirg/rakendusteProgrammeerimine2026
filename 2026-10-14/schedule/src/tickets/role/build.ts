import { minutesMeasure, validMinutes } from '../../core/shift/measure'
import { buildPlace } from '../../core/shift/place'
import { buildTime } from '../../core/shift/time'
import type { BuildContext } from '../../core/ticket/kind'
import type { RoleModel } from './model'
import type { RoleRecord } from './record'

export function buildRole(r: RoleRecord, ctx: BuildContext): RoleModel {
  const { time, night } = buildTime(ctx.lookup, r)
  const bc = validMinutes(r.bcMin)
  return {
    id: r.id,
    time,
    night,
    barcode: r.barcode ?? r.id,
    toneRole: r.roleId,
    role: ctx.known('roleId', r.roleId, ctx.lookup.row('role', r.roleId)),
    place: buildPlace(ctx, r.venueId, r.hallId),
    bc: bc === undefined ? undefined : minutesMeasure(ctx.lookup, bc),
  }
}
