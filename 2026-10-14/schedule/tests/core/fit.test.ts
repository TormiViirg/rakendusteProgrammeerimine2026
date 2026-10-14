import { describe, expect, it } from 'vitest'
import { fitText, type FitProbe } from '../../src/core/fit/fitText'
import { fitFloor } from '../../src/core/fit/floor'
import { NO_GRANT } from '../../src/core/fit/grant'
import { intendedSize, textSize, type FitSpec } from '../../src/core/fit/textSize'
import { FILM_TIERS, FIT, HERO_TIERS } from '../../src/design/fit'
import { BASE } from '../../src/design/tokens'

describe('fitFloor — the smallest size a text may shrink to', () => {
  // classes: how many whole steps a quarter of the size rounds to; boundaries: where the rounding flips
  it.each([
    [36, 28, '27 rounds to the nearest step: two steps'],
    [32, 24, 'exactly two steps'],
    [24, 20, 'halfway (18) rounds to the LARGER size'],
    [20, 16, '15 rounds to 16'],
    [16, 12, 'exactly one step'],
    [12, 8, '9 rounds to 8'],
    [8, 8, 'halfway (6) rounds to the larger size: no step at all'],
    [64, 48, 'exactly four steps'],
  ])('%d → %d (%s)', (fs, floor) => {
    expect(fitFloor(fs)).toBe(floor)
  })

  it('never loses more than the allowed share plus half a step, and always lands on the step grid', () => {
    for (let fs = 4; fs <= 80; fs++) {
      const floor = fitFloor(fs)
      expect((fs - floor) % FIT.step).toBe(0)
      expect(fs - floor).toBeLessThanOrEqual(fs * FIT.maxLoss + FIT.step / 2)
    }
  })
})

describe('textSize — where a text starts', () => {
  const chars = (n: number) => 'x'.repeat(n)

  it('headline tiers: boundaries on both sides of each change', () => {
    const [full, oneStep] = HERO_TIERS
    const at = (n: number) => textSize(BASE, 'thinRoleTitle', chars(n)).start
    expect(at(1)).toBe(36)
    expect(at(full.upToChars)).toBe(36)
    expect(at(full.upToChars + 1)).toBe(32)
    expect(at(oneStep.upToChars)).toBe(32)
    expect(at(oneStep.upToChars + 1)).toBe(28)
    expect(at(500)).toBe(28)
  })

  it('film title tiers', () => {
    const edge = FILM_TIERS[0].upToChars
    expect(textSize(BASE, 'thinScreeningFilm', chars(edge)).start).toBe(20)
    expect(textSize(BASE, 'thinScreeningFilm', chars(edge + 1)).start).toBe(16)
  })

  it('a tier never starts below the floor', () => {
    for (const n of [1, 15, 31, 200]) {
      const s = textSize(BASE, 'thinHeadlineTitle', chars(n))
      expect(s.start).toBeGreaterThanOrEqual(s.min)
    }
  })

  it('grants: a lift gives tier steps back, a line lifts the tier entirely, steps enlarge', () => {
    const long = chars(40)
    expect(textSize(BASE, 'thinRoleTitle', long, { ...NO_GRANT, lift: 1 }).start).toBe(32)
    expect(textSize(BASE, 'thinRoleTitle', long, { ...NO_GRANT, lift: 2 }).start).toBe(36)
    expect(textSize(BASE, 'thinRoleTitle', long, { ...NO_GRANT, lift: 9 }).start).toBe(36)
    const line = textSize(BASE, 'thinRoleTitle', long, { ...NO_GRANT, lines: 1 })
    expect([line.start, line.maxLines]).toEqual([36, 2])
    expect(textSize(BASE, 'thinScreeningFilm', 'short', { ...NO_GRANT, steps: 1 }).start).toBe(24)
  })
})

/**
 * A model of text for the probe: every character is 0.5 em wide; the text is
 * `words`; a word longer than the line overflows unless it may break.
 */
function modelProbe(words: number[], width: number): FitProbe & { calls: [number, boolean][] } {
  const calls: [number, boolean][] = []
  return {
    calls,
    at(size, broken) {
      calls.push([size, broken])
      const perLine = Math.floor(width / (size * 0.5))
      let lines = 1
      let used = 0
      let overflowsWidth = false
      for (const w of words) {
        if (w > perLine) {
          if (!broken) overflowsWidth = true
          // a broken word fills the rest of this line and continues
          const rest = w - (perLine - used)
          lines += Math.ceil(rest / perLine)
          used = rest % perLine
          continue
        }
        if (used + w + (used ? 1 : 0) > perLine) {
          lines++
          used = w
        } else used += w + (used ? 1 : 0)
      }
      return { lines, overflowsWidth }
    },
  }
}

const spec = (over: Partial<FitSpec> = {}): FitSpec => ({ start: 36, baseFs: 36, lh: 42, min: 28, maxLines: 1, step: 4, preferLines: 1, preferMin: 36, tierSteps: 0, ...over })

describe('intendedSize — what counts as "shrunk"', () => {
  it('is the field size, plus every granted step: an enlarged text that falls back is shrunk again', () => {
    const spec = { start: 24, baseFs: 24, lh: 28, min: 20, maxLines: 1, step: 4, preferLines: 1, preferMin: 24, tierSteps: 0 }
    expect(intendedSize(spec)).toBe(24)
    expect(intendedSize(spec, { ...NO_GRANT, steps: 1 })).toBe(28)
    expect(intendedSize(spec, { ...NO_GRANT, steps: 2, lines: 3, lift: 1 })).toBe(32)
  })
})

describe('fitText — whole → broken → smaller → cut', () => {
  it('WHOLE: a text that fits is left alone, measured once', () => {
    const probe = modelProbe([9], 357)
    expect(fitText(spec(), probe)).toEqual({ size: 36, broken: false, cut: false })
    expect(probe.calls).toEqual([[36, false]])
  })

  it('SMALLER: one step at a time, stopping at the first size that fits', () => {
    // 21 characters need 378 at 36, 336 at 32
    expect(fitText(spec(), modelProbe([21], 357))).toEqual({ size: 32, broken: false, cut: false })
  })

  it('boundary: fits exactly at the floor → not cut; one character more → cut at the floor', () => {
    // at the floor (28) a line of 357 holds 25 characters
    expect(fitText(spec(), modelProbe([25], 357))).toEqual({ size: 28, broken: false, cut: false })
    expect(fitText(spec(), modelProbe([26], 357))).toEqual({ size: 28, broken: false, cut: true })
  })

  it('BROKEN: only where more than one line is allowed', () => {
    const oneLine = fitText(spec(), modelProbe([30], 357))
    expect(oneLine.broken).toBe(false)
    const twoLines = fitText(spec({ maxLines: 2, preferLines: 2 }), modelProbe([30], 357))
    expect(twoLines).toEqual({ size: 36, broken: true, cut: false })
  })

  it('a text that fits whole on its lines is not broken', () => {
    expect(fitText(spec({ maxLines: 2, preferLines: 2 }), modelProbe([12, 12], 357)).broken).toBe(false)
  })

  it('prefers fewer lines down to preferMin, then uses the full budget at that size', () => {
    // two words of 14: one line needs 29 characters → 522 at 36, 406 at 28; two lines fit at any size
    const s = spec({ maxLines: 2, preferLines: 1, preferMin: 28 })
    const out = fitText(s, modelProbe([14, 14], 357))
    expect(out).toEqual({ size: 28, broken: true, cut: false })
    // without the preference it stays large on two lines
    expect(fitText(spec({ maxLines: 2, preferLines: 2 }), modelProbe([14, 14], 357)).size).toBe(36)
  })

  it('never goes below the floor and never probes below it', () => {
    const probe = modelProbe([200], 357)
    const out = fitText(spec({ maxLines: 2, preferLines: 2 }), probe)
    expect(out.size).toBe(28)
    expect(out.cut).toBe(true)
    expect(Math.min(...probe.calls.map(([size]) => size))).toBe(28)
  })
})
