import type { Preferences } from '../ports';

const PREFIX = 'poff.vabadajad.';
const YEAR = 60 * 60 * 24 * 365;

/**
 * Preferences in localStorage, mirrored to a cookie so they survive when
 * storage is unavailable (private windows, blocked site data).
 */
export const browserPreferences: Preferences = {
  get(key) {
    try {
      const v = window.localStorage.getItem(PREFIX + key);
      if (v !== null) return v;
    } catch {
      /* fall through to the cookie */
    }
    try {
      const hit = document.cookie.split('; ').find((c) => c.startsWith(`${PREFIX}${key}=`));
      return hit ? decodeURIComponent(hit.slice(PREFIX.length + key.length + 1)) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, value);
    } catch {
      /* cookie below is the fallback */
    }
    try {
      document.cookie = `${PREFIX}${key}=${encodeURIComponent(value)}; max-age=${YEAR}; path=/; SameSite=Lax`;
    } catch {
      /* nothing left to try */
    }
  },
};

export const memoryPreferences = (): Preferences => {
  const store = new Map<string, string>();
  return { get: (k) => store.get(k) ?? null, set: (k, v) => void store.set(k, v) };
};
