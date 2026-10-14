/**
 * Layer 3a: a tiny predicate language over facts and levels.
 * Rules are data (JSON-serialisable), so targets and wording rules can later
 * be shipped by the backend without touching the evaluator.
 */
import { readFact, type FactPath, type Facts, type ScopeName } from './facts';
import type { Level } from './levelMachine';

export type Comparison = '<' | '<=' | '>' | '>=' | '==';

export type Predicate =
  | { always: true }
  | { all: Predicate[] }
  | { any: Predicate[] }
  | { not: Predicate }
  | { fact: FactPath; is: Comparison; value: number }
  | { level: ScopeName; in: Level[] };

export interface Situation {
  facts: Facts;
  levels: Record<ScopeName, Level>;
}

export function holds(p: Predicate, s: Situation): boolean {
  if ('always' in p) return true;
  if ('all' in p) return p.all.every((q) => holds(q, s));
  if ('any' in p) return p.any.some((q) => holds(q, s));
  if ('not' in p) return !holds(p.not, s);
  if ('level' in p) return p.in.includes(s.levels[p.level]);
  const actual = readFact(s.facts, p.fact);
  switch (p.is) {
    case '<':
      return actual < p.value;
    case '<=':
      return actual <= p.value;
    case '>':
      return actual > p.value;
    case '>=':
      return actual >= p.value;
    case '==':
      return actual === p.value;
  }
}
