/**
 * Fitting live feedback into a fixed box: a small deterministic machine.
 * States are rungs of a size ladder that descends in 2-unit steps; each rung
 * allows a number of rows, and smaller rungs allow more. An `overflow` event
 * moves one rung down; the last rung clamps (the UI then ellipsises).
 */
export interface Rung {
  size: number;
  maxRows: number;
}

export type FitState =
  | { phase: 'trying'; rung: number }
  | { phase: 'fitted'; rung: number }
  | { phase: 'clamped'; rung: number };

export const SIZE_STEP = 2;
/** Text never shrinks below this share of its base size. */
export const SHRINK_FLOOR = 0.75;

/**
 * The smallest size a base size may reach: a quarter of it, rounded down to a
 * whole step, taken off. 36 → 36 − 8 = 28; 48 → 36; 64 → 48; 38 → 38 − 8 = 30.
 */
export const floorSize = (base: number): number => base - Math.floor((base * (1 - SHRINK_FLOOR)) / SIZE_STEP) * SIZE_STEP;

/**
 * ladder(36, [2, 2, 3, 3, 4]) → 36/2, 34/2, 32/3, 30/3, 28/4.
 * One rung per step from the base down to its floor; `rowsPerRung` must give
 * exactly that many rows, non-decreasing.
 */
export function ladder(base: number, rowsPerRung: readonly number[]): Rung[] {
  const rungs = (base - floorSize(base)) / SIZE_STEP + 1;
  if (rowsPerRung.length !== rungs) throw new Error(`ladder(${base}) needs ${rungs} rows, got ${rowsPerRung.length}`);
  rowsPerRung.forEach((rows, i) => {
    if (i > 0 && rows < rowsPerRung[i - 1]) throw new Error('rows must not shrink as the type gets smaller');
  });
  return rowsPerRung.map((maxRows, i) => ({ size: base - i * SIZE_STEP, maxRows }));
}

export function fitTransition(state: FitState, event: 'fits' | 'overflow', rungs: readonly Rung[]): FitState {
  if (state.phase !== 'trying') return state;
  if (event === 'fits') return { phase: 'fitted', rung: state.rung };
  return state.rung + 1 < rungs.length
    ? { phase: 'trying', rung: state.rung + 1 }
    : { phase: 'clamped', rung: state.rung };
}

export function fitText(rungs: readonly Rung[], rowsNeeded: (size: number) => number): { rung: Rung; clamped: boolean } {
  let state: FitState = { phase: 'trying', rung: 0 };
  while (state.phase === 'trying') {
    const rung = rungs[state.rung];
    state = fitTransition(state, rowsNeeded(rung.size) <= rung.maxRows ? 'fits' : 'overflow', rungs);
  }
  return { rung: rungs[state.rung], clamped: state.phase === 'clamped' };
}

export const SOFT_HYPHEN = '\u00ad';

/**
 * Greedy word wrap: how many rows do these paragraphs need at this width?
 * A word may contain soft hyphens; when it does not fit, the longest piece that
 * ends at a soft hyphen (plus a visible "-") is put on the current row.
 */
export function countRows(paragraphs: readonly string[], maxWidth: number, widthOf: (text: string) => number): number {
  const fits = (text: string) => widthOf(text.replaceAll(SOFT_HYPHEN, '')) <= maxWidth;
  let rows = 0;
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';
    rows += 1;
    for (let word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (!line || fits(candidate)) {
        line = candidate;
        continue;
      }
      // break the word at its soft hyphens, filling the current row first
      while (word.includes(SOFT_HYPHEN)) {
        const parts = word.split(SOFT_HYPHEN);
        let taken = -1;
        for (let n = parts.length - 1; n >= 1; n--) {
          const head = `${line ? `${line} ` : ''}${parts.slice(0, n).join('')}-`;
          if (fits(head)) {
            taken = n;
            break;
          }
        }
        if (taken < 0) break;
        rows += 1;
        line = '';
        word = parts.slice(taken).join(SOFT_HYPHEN);
      }
      if (line) rows += 1;
      line = word;
    }
  }
  return rows;
}
