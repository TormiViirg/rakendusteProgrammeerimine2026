import { TEXT_FIELDS, type TextFieldId } from '../../design/fields'
import { FIT } from '../../design/fit'
import type { Tokens } from '../../design/tokens'
import { fitFloor } from './floor'
import { NO_GRANT, type Grant } from './grant'

/** Everything fitText needs to know about one text in one field. */
export interface FitSpec {
  /** size to start at, pt */
  start: number
  /** the field's own size and line height, pt */
  baseFs: number
  lh: number
  /** the floor: smaller than this the text is cut instead */
  min: number
  maxLines: number
  step: number
  /** try to stay within this many lines, shrinking down to preferMin, before using maxLines */
  preferLines: number
  preferMin: number
  /** steps the text starts below its field size because it is long (0: none, or all given back) */
  tierSteps: number
}

/**
 * Where a text starts and how far it may go, from the field definition
 * (design/fields.ts), the tokens in force and what the allocator granted.
 */
export function textSize(tokens: Tokens, field: TextFieldId, text: string, grant: Grant = NO_GRANT): FitSpec {
  const f = TEXT_FIELDS[field]
  const [fs, lh] = f.size(tokens)
  const tier = f.tiers?.find((t) => text.length <= t.upToChars)
  const min = fitFloor(fs)
  const maxLines = tokens.lines[field].n + grant.lines
  // a granted line lifts the "start smaller for long text" tier; granted steps enlarge beyond the field size
  const tierDown = grant.lines > 0 ? 0 : Math.max(0, (tier?.stepsDown ?? 0) - grant.lift)
  const start = Math.max(min, fs - tierDown * FIT.step) + grant.steps * FIT.step
  return {
    start,
    tierSteps: tierDown,
    lh,
    baseFs: fs,
    min,
    maxLines,
    step: FIT.step,
    preferLines: Math.min(maxLines, f.prefer?.lines ?? maxLines),
    preferMin: f.prefer ? Math.max(min, fs - f.prefer.steps * FIT.step) : start,
  }
}

/** The size the text is meant to have: smaller than this counts as "shrunk". */
export const intendedSize = (spec: FitSpec, grant: Grant = NO_GRANT) => spec.baseFs + grant.steps * spec.step
