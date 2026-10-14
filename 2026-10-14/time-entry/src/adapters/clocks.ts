import type { Clock } from '../ports';

export const systemClock: Clock = { now: () => Date.now() };

/** A clock frozen at a start instant that still ticks – used for the demo and for tests. */
export const offsetClock = (startAt: number): Clock => {
  const bootedAt = Date.now();
  return { now: () => startAt + (Date.now() - bootedAt) };
};
