import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { addDays, type DayKey, type Zone } from '../domain/calendar';
import type { Schedule } from '../domain/model';
import type { Edit } from '../domain/selection';
import type { Instant } from '../domain/time';
import type { AppConfig, Ports } from '../ports';
import { layoutFor, type Layout } from './layout';
import { createReducer, initialState, type AppState } from './store';
import { accentFor } from './view';

export interface App {
  state: AppState;
  ports: Ports;
  config: AppConfig;
  zone: Zone;
  now: Instant;
  layout: Layout;
  firstDay: DayKey;
  lastDay: DayKey;
  /** The colour the volunteer's entries take, from the feedback engine's tone. */
  accent: string;
  focus(day: DayKey): void;
  edit(day: DayKey, edit: Edit): void;
  reveal(day: DayKey): void;
  newDraft(day: DayKey): void;
  setDraft(day: DayKey, id: number, field: 'start' | 'end', value: Instant): void;
  dropDraft(day: DayKey, id: number): void;
  comment(day: DayKey, text: string): void;
  noteSent(): void;
  confirm(): void;
}

const Context = createContext<App | null>(null);

export const useApp = (): App => {
  const app = useContext(Context);
  if (!app) throw new Error('AppProvider is missing');
  return app;
};

function useLayout(weekLength: number): Layout {
  const [layout, setLayout] = useState(() => layoutFor(window.innerWidth, weekLength));
  useEffect(() => {
    const update = () => setLayout(layoutFor(document.documentElement.clientWidth || window.innerWidth, weekLength));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [weekLength]);
  useEffect(() => {
    document.documentElement.style.setProperty('--u', `${layout.u}px`);
    document.documentElement.dataset.layout = layout.mode;
  }, [layout]);
  return layout;
}

/** Re-render every half minute so locks and "past" follow the clock. */
function useNow(ports: Ports): Instant {
  const [now, setNow] = useState(() => ports.clock.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(ports.clock.now()), 30_000);
    return () => window.clearInterval(id);
  }, [ports]);
  return now;
}

export function AppProvider(props: { schedule: Schedule; ports: Ports; config: AppConfig; children: ReactNode }) {
  const { schedule, ports, config } = props;
  const zone = useMemo(() => ports.zones(schedule.period.timeZone), [ports, schedule.period.timeZone]);
  const reducer = useMemo(() => createReducer(zone), [zone]);
  const firstDay = zone.dayOf(schedule.period.interval.start);
  const lastDay = zone.dayOf(schedule.period.interval.end - 1);
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const today = zone.dayOf(ports.clock.now());
    let start = config.startDay ?? (today < firstDay ? firstDay : today > lastDay ? lastDay : today);
    while (!config.weekdays.includes((new Date(`${start}T00:00:00Z`).getUTCDay() + 6) % 7)) start = addDays(start, 1);
    return initialState(schedule, zone, start);
  });
  const now = useNow(ports);
  const layout = useLayout(config.weekdays.length);

  useEffect(() => {
    if (!state.notice) return;
    const id = window.setTimeout(() => dispatch({ type: 'notice/clear' }), 2600);
    return () => window.clearTimeout(id);
  }, [state.notice]);

  const confirm = useCallback(() => {
    dispatch({ type: 'saving' });
    const selections = Object.fromEntries(Object.entries(state.schedule.selections).map(([day, s]) => [day, s.current]));
    ports.backend
      .confirm({ selections, comments: { ...state.schedule.comments }, sentAt: ports.clock.now() })
      .then((result) => dispatch(result.ok ? { type: 'confirmed', schedule: result.schedule } : { type: 'notice', kind: 'rejected' }))
      .catch(() => dispatch({ type: 'notice', kind: 'rejected' }));
  }, [ports, state.schedule]);

  const app = useMemo<App>(
    () => ({
      state,
      ports,
      config,
      zone,
      now,
      layout,
      firstDay,
      lastDay,
      accent: accentFor(state.feedback.advice.tone),
      focus: (day) => dispatch({ type: 'focus', day }),
      edit: (day, edit) => dispatch({ type: 'edit', day, edit, now: ports.clock.now() }),
      reveal: (day) => dispatch({ type: 'reveal', day }),
      newDraft: (day) => dispatch({ type: 'draft/new', day }),
      setDraft: (day, id, field, value) => dispatch({ type: 'draft/set', day, id, field, value, now: ports.clock.now() }),
      dropDraft: (day, id) => dispatch({ type: 'draft/drop', day, id }),
      comment: (day, text) => dispatch({ type: 'comment', day, text }),
      noteSent: () => dispatch({ type: 'notice', kind: 'sent' }),
      confirm,
    }),
    [state, ports, config, zone, now, layout, firstDay, lastDay, confirm],
  );

  return <Context.Provider value={app}>{props.children}</Context.Provider>;
}
