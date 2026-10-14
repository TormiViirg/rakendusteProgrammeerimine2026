/**
 * PORTS – everything the application needs from the outside world.
 * The domain and UI only ever see these interfaces; `main.tsx` plugs adapters in.
 */
import type { DayKey, Zone } from '../domain/calendar';
import type { Schedule } from '../domain/model';
import type { Instant, IntervalSet } from '../domain/time';

/** Driven port: the scheduling backend. */
export interface ScheduleBackend {
  load(): Promise<Schedule>;
  /** The backend validates everything again and answers with what it accepted. */
  confirm(request: ConfirmRequest): Promise<ConfirmResult>;
}

export interface ConfirmRequest {
  /** per illustrative day */
  selections: Record<DayKey, IntervalSet>;
  comments: Record<DayKey, string>;
  sentAt: Instant;
}

export type ConfirmResult =
  | { ok: true; schedule: Schedule }
  | { ok: false; rejected: { day: DayKey; reason: string }[] };

export interface Clock {
  now(): Instant;
}

/** Small per-browser preferences (hidden tips, language). */
export interface Preferences {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

export interface FontSpec {
  family: string;
  weight: number;
  sizePx: number;
}

export interface TextMeasure {
  width(text: string, font: FontSpec): number;
  /** Resolves when web fonts are usable, so measurements can be repeated. */
  ready(): Promise<void>;
}

export type ZoneFactory = (timeZone: string) => Zone;

/** Inserts soft hyphens so long words wrap at syllables; `knows` says whether a language is handled here. */
export interface Hyphenator {
  hyphenate(text: string, lang: string | undefined): string;
  knows(lang: string | undefined): boolean;
}

export interface Ports {
  backend: ScheduleBackend;
  clock: Clock;
  preferences: Preferences;
  measure: TextMeasure;
  zones: ZoneFactory;
  hyphenator: Hyphenator;
}

export interface AppConfig {
  /** Weekdays shown as columns, 0 = Monday; Monday–Sunday by default. */
  weekdays: readonly number[];
  /** Day to open on; defaults to "today" clamped into the period. */
  startDay?: DayKey;
}
