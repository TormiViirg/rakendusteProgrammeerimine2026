import type { ProblemSink } from '../../core/ports'

/** ADAPTER — data problems to the browser console, once each. Replace with your monitoring. */
export function createConsoleProblems(): ProblemSink {
  const seen = new Set<string>()
  return {
    report(problems) {
      for (const p of problems) {
        const key = [p.shiftId, p.field, p.code, p.detail].join('|')
        if (seen.has(key)) continue
        seen.add(key)
        const line = `[shift ${p.shiftId || '?'}${p.kind ? ` · ${p.kind}` : ''}] ${p.field ?? ''}: ${p.code}${p.detail ? ` (${p.detail})` : ''}`
        if (p.severity === 'error') console.error(`${line} — not shown`)
        else console.warn(line)
      }
    },
  }
}
