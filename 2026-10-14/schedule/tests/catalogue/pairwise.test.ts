import { describe, expect, it } from 'vitest'
import { allPairs, uncoveredPairs } from '../../src/testing/suites/pairwise'

describe('allPairs — the covering array behind the `pairs` suite', () => {
  const zeros = (n: number) => Array(n).fill(0)

  it.each([
    [[2, 2]],
    [[3, 3, 3]],
    [[2, 3, 4, 5]],
    [[7, 6, 5, 4, 3, 2, 2, 2]],
    [[10, 8, 8, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 3]],
  ])('covers every pair of %j', (sizes) => {
    const rows = allPairs(sizes, zeros(sizes.length))
    expect(uncoveredPairs(sizes, rows)).toBe(0)
    for (const r of rows) r.forEach((v, i) => expect(v).toBeLessThan(sizes[i]))
  })

  it('needs at least the product of the two largest parameters, and stays far below the full product', () => {
    const sizes = [7, 6, 5, 4, 3, 2, 2, 2]
    const rows = allPairs(sizes, zeros(sizes.length))
    expect(rows.length).toBeGreaterThanOrEqual(7 * 6)
    expect(rows.length).toBeLessThan(7 * 6 * 2)
    expect(sizes.reduce((a, b) => a * b)).toBeGreaterThan(rows.length * 100)
  })

  it('edge cases: no parameters, one parameter, a parameter with one value', () => {
    expect(allPairs([], [])).toEqual([])
    expect(allPairs([3], [0])).toEqual([[0], [1], [2]])
    expect(uncoveredPairs([1, 4], allPairs([1, 4], [0, 0]))).toBe(0)
  })

  it('is deterministic', () => {
    const sizes = [4, 4, 3, 3, 2]
    expect(allPairs(sizes, zeros(5))).toEqual(allPairs(sizes, zeros(5)))
  })

  it('uses the preferred value where nothing else decides', () => {
    // the second parameter is covered early; later rows should fall back to its preferred value
    const rows = allPairs([6, 2, 2], [0, 1, 1])
    expect(rows.filter((r) => r[1] === 1).length).toBeGreaterThanOrEqual(rows.filter((r) => r[1] === 0).length)
  })
})
