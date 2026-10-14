import type { CaptionKey } from '../schedule/captions'

/**
 * PORT — texts with a limited set of options, in one language.
 *
 * Captions ship with the frontend; lookup tables mirror database tables with
 * one row per id and one column per language. The core never sees i18next:
 * adapters/i18next implements this port.
 *
 * Tables are named by the kinds that read them (`venue`, `role`, `subtitle` …);
 * the port does not list them, so a new kind can bring a new table without a
 * change here.
 */

/** Texts with placeholders. */
export interface Patterns {
  /** "Pühapäev - 11.10.2026" */
  dayHeader: { weekday: string; date: string }
  /** "Press / Insener Garini Hüperboloid" */
  filmWithPrefix: { prefix: string; title: string }
  /** "Saal 8" */
  hallNumbered: { n: number }
  /** "2 vahetust ei saanud kuvada" */
  notShown: { count: number }
}

export interface Lookup {
  /** the language these texts are in */
  readonly lang: string
  caption(key: CaptionKey): string
  /**
   * The text of row `id` in lookup table `table`, or undefined when there is
   * no such row in this language or its fallbacks. `id` is data from the
   * backend: an implementation must treat it as a plain key, never as a path
   * or an expression.
   */
  row(table: string, id: string): string | undefined
  pattern<K extends keyof Patterns>(key: K, values: Patterns[K]): string
}
