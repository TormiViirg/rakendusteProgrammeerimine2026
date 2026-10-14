/**
 * Application state: one pure reducer. Side effects (backend, clock) stay in
 * the hooks; every action that depends on time carries `now` explicitly.
 */
import type { DayKey, Zone } from '../domain/calendar';
import { openDay, selectionOf, type Schedule } from '../domain/model';
import { harshestGrace } from '../domain/rules';
import { applyEdit, withSelection, type Edit } from '../domain/selection';
import { INITIAL_ENGINE, advance, type EngineState, type Feedback } from '../domain/stats/engine';
import { deriveFacts, scopeKeys } from '../domain/stats/facts';
import type { Instant } from '../domain/time';

/** A card on the phone whose two ends are not both filled in yet. */
export interface Draft {
  id: number;
  start: Instant | null;
  end: Instant | null;
}

export type NoticeKind = 'saved' | 'rejected' | 'held' | 'sent';

export interface AppState {
  schedule: Schedule;
  focus: DayKey;
  /** Days whose hour grid has been opened (desktop first-view veil lifted). */
  revealed: Readonly<Record<DayKey, true>>;
  drafts: Readonly<Record<DayKey, readonly Draft[]>>;
  engine: EngineState;
  feedback: Feedback;
  notice: { kind: NoticeKind; seq: number } | null;
  saving: boolean;
  nextDraftId: number;
}

export type Action =
  | { type: 'focus'; day: DayKey }
  | { type: 'edit'; day: DayKey; edit: Edit; now: Instant }
  | { type: 'reveal'; day: DayKey }
  | { type: 'draft/new'; day: DayKey }
  | { type: 'draft/set'; day: DayKey; id: number; field: 'start' | 'end'; value: Instant; now: Instant }
  | { type: 'draft/drop'; day: DayKey; id: number }
  | { type: 'comment'; day: DayKey; text: string }
  | { type: 'saving' }
  | { type: 'confirmed'; schedule: Schedule }
  | { type: 'notice'; kind: NoticeKind }
  | { type: 'notice/clear' };

function withFeedback(state: Omit<AppState, 'feedback' | 'engine'> & { engine: EngineState }, zone: Zone): AppState {
  const facts = deriveFacts(state.schedule, zone, state.focus);
  const { state: engine, feedback } = advance(state.engine, { facts, keys: scopeKeys(state.focus) });
  return { ...state, engine, feedback };
}

export function initialState(schedule: Schedule, zone: Zone, focus: DayKey): AppState {
  const revealed: Record<string, true> = {};
  for (const [day, s] of Object.entries(schedule.selections)) {
    if (s.current.length + s.leaderAdded.length + s.leaderRemoved.length > 0) revealed[day] = true;
  }
  return withFeedback(
    {
      schedule,
      focus,
      revealed,
      drafts: {},
      engine: INITIAL_ENGINE,
      notice: null,
      saving: false,
      nextDraftId: 1,
    },
    zone,
  );
}

export function createReducer(zone: Zone) {
  const notify = (state: AppState, kind: NoticeKind): AppState => ({
    ...state,
    notice: { kind, seq: (state.notice?.seq ?? 0) + 1 },
  });

  function edit(state: AppState, day: DayKey, change: Edit, now: Instant): AppState | null {
    const open = openDay(state.schedule, day);
    const ctx = { open, now, graceMs: harshestGrace(state.schedule.teams), step: state.schedule.stepMs };
    const outcome = applyEdit(selectionOf(state.schedule, day), ctx, change);
    if (!outcome.ok) return null; // past / outside: simply does not respond
    const next = withFeedback(
      {
        ...state,
        schedule: withSelection(state.schedule, day, outcome.selection),
        revealed: { ...state.revealed, [day]: true },
      },
      zone,
    );
    return outcome.held ? notify(next, 'held') : next;
  }

  return function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
      case 'focus':
        return action.day === state.focus ? state : withFeedback({ ...state, focus: action.day }, zone);
      case 'edit':
        return edit(state, action.day, action.edit, action.now) ?? state;
      case 'reveal':
        return { ...state, revealed: { ...state.revealed, [action.day]: true } };
      case 'draft/new': {
        const list = state.drafts[action.day] ?? [];
        return {
          ...state,
          drafts: { ...state.drafts, [action.day]: [...list, { id: state.nextDraftId, start: null, end: null }] },
          nextDraftId: state.nextDraftId + 1,
        };
      }
      case 'draft/set': {
        const list = state.drafts[action.day] ?? [];
        const existing = list.find((d) => d.id === action.id) ?? { id: state.nextDraftId, start: null, end: null };
        const draft: Draft = { ...existing, [action.field]: action.value };
        const others = list.filter((d) => d.id !== existing.id);
        if (draft.start !== null && draft.end !== null) {
          const committed = edit(state, action.day, { kind: 'add', interval: { start: draft.start, end: draft.end } }, action.now);
          if (committed) return { ...committed, drafts: { ...state.drafts, [action.day]: others } };
        }
        return {
          ...state,
          drafts: { ...state.drafts, [action.day]: [...others, draft].sort((a, b) => a.id - b.id) },
          nextDraftId: Math.max(state.nextDraftId, draft.id + 1),
        };
      }
      case 'draft/drop':
        return {
          ...state,
          drafts: { ...state.drafts, [action.day]: (state.drafts[action.day] ?? []).filter((d) => d.id !== action.id) },
        };
      case 'comment':
        return { ...state, schedule: { ...state.schedule, comments: { ...state.schedule.comments, [action.day]: action.text } } };
      case 'saving':
        return { ...state, saving: true };
      case 'confirmed':
        return notify(withFeedback({ ...state, schedule: action.schedule, saving: false }, zone), 'saved');
      case 'notice':
        return notify({ ...state, saving: false }, action.kind);
      case 'notice/clear':
        return { ...state, notice: null };
    }
  };
}
