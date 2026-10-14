export interface LocalParts {
  /** "2026-10-11" */
  dateKey: string
  /** "11.10.2026" */
  date: string
  /** "21:30" */
  time: string
  /** 0 = Sunday */
  weekday: number
  /** minutes since an arbitrary epoch — only for comparing two local times */
  ordinal: number
}

/** seconds (and fractions) are accepted and ignored; a time-zone suffix is not — these are local times */
const PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/

/**
 * Parses a local date-time, "YYYY-MM-DDTHH:mm" (optionally with seconds), without involving the browser's time zone.
 * Returns null for anything else, including dates that do not exist (31.02.).
 */
export function parseLocal(s: unknown): LocalParts | null {
  if (typeof s !== 'string') return null
  const m = PATTERN.exec(s)
  if (!m) return null
  const [y, mo, d, h, mi] = m.slice(1).map(Number)
  if (h > 23 || mi > 59) return null
  // Date.UTC only to validate the calendar date and get its weekday
  const utc = new Date(Date.UTC(y, mo - 1, d, h, mi))
  if (utc.getUTCFullYear() !== y || utc.getUTCMonth() !== mo - 1 || utc.getUTCDate() !== d) return null
  const [, yy, mm, dd, hh, mn] = m
  return { dateKey: `${yy}-${mm}-${dd}`, date: `${dd}.${mm}.${yy}`, time: `${hh}:${mn}`, weekday: utc.getUTCDay(), ordinal: utc.getTime() / 60000 }
}
