import type { Problem } from '../ticket/problem'

/** PORT — where problems found in the data are sent (console, monitoring …). */
export interface ProblemSink {
  report(problems: readonly Problem[]): void
}
