/**
 * All-pairs selection (a covering array of strength 2).
 *
 * Given parameters with a few values each, returns rows such that every value
 * of every parameter appears together with every value of every other
 * parameter in at least one row. Far fewer rows than the full product — and
 * most layout faults need only two things to coincide.
 *
 * Greedy and deterministic: the same input always gives the same rows.
 * `prefer[i]` is the value of parameter i to use when nothing else decides
 * (its base class), so rows stay close to the ordinary ticket.
 */
export function allPairs(sizes: readonly number[], prefer: readonly number[]): number[][] {
  const n = sizes.length
  if (n === 0) return []
  if (n === 1) return Array.from({ length: sizes[0] }, (_, v) => [v])

  const key = (i: number, vi: number, j: number, vj: number) => `${i}:${vi}|${j}:${vj}`
  const open = new Set<string>()
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let vi = 0; vi < sizes[i]; vi++) for (let vj = 0; vj < sizes[j]; vj++) open.add(key(i, vi, j, vj))

  const pair = (a: number, va: number, b: number, vb: number) => (a < b ? key(a, va, b, vb) : key(b, vb, a, va))
  const rows: number[][] = []

  while (open.size > 0) {
    // seed the row with the first pair still open
    const [first] = open
    const [left, right] = first.split('|').map((s) => s.split(':').map(Number))
    const row: (number | undefined)[] = Array(n).fill(undefined)
    row[left[0]] = left[1]
    row[right[0]] = right[1]

    for (let k = 0; k < n; k++) {
      if (row[k] !== undefined) continue
      let best = prefer[k]
      let bestGain = -1
      for (let v = 0; v < sizes[k]; v++) {
        let gain = 0
        for (let j = 0; j < n; j++) if (row[j] !== undefined && open.has(pair(k, v, j, row[j]!))) gain++
        // more new pairs wins; on a tie the preferred value, then the lower index
        if (gain > bestGain || (gain === bestGain && v === prefer[k])) {
          best = v
          bestGain = gain
        }
      }
      row[k] = best
    }

    const done = row as number[]
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) open.delete(key(i, done[i], j, done[j]))
    rows.push(done)
  }
  return rows
}

/** Pairs a list of rows leaves uncovered — for the tests of the generator itself. */
export function uncoveredPairs(sizes: readonly number[], rows: readonly number[][]): number {
  let missing = 0
  for (let i = 0; i < sizes.length; i++)
    for (let j = i + 1; j < sizes.length; j++)
      for (let vi = 0; vi < sizes[i]; vi++) for (let vj = 0; vj < sizes[j]; vj++) if (!rows.some((r) => r[i] === vi && r[j] === vj)) missing++
  return missing
}
