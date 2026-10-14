/**
 * Layer 2: a finite-state machine per scope that classifies progress towards
 * the scope's target. It is a Moore machine – the output *is* the state – with
 * hysteresis on the way down, so that nudging a selection back and forth
 * around a threshold does not make the message flicker.
 *
 *            r ≥ near            r ≥ met
 *   none ─▶ low ───────▶ near ───────▶ met
 *            ◀───────────   ◀───────────
 *          r < near − h     r < met − h          (r ≤ 0 ⇒ none from anywhere)
 */
export const LEVELS = ['none', 'low', 'near', 'met'] as const;
export type Level = (typeof LEVELS)[number];

export interface LevelConfig {
  near: number;
  met: number;
  hysteresis: number;
}

export const DEFAULT_LEVELS: LevelConfig = { near: 0.5, met: 1, hysteresis: 0.05 };

export function stepLevel(prev: Level | undefined, ratio: number, cfg: LevelConfig = DEFAULT_LEVELS): Level {
  if (!(ratio > 0)) return 'none';
  const fresh: Level = ratio >= cfg.met ? 'met' : ratio >= cfg.near ? 'near' : 'low';
  if (prev === 'met' && ratio >= cfg.met - cfg.hysteresis) return 'met';
  if (prev === 'near' && fresh === 'low' && ratio >= cfg.near - cfg.hysteresis) return 'near';
  if (prev === 'met' && fresh === 'low' && ratio >= cfg.near - cfg.hysteresis) return 'near';
  return fresh;
}
