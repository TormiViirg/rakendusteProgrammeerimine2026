import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../app/AppContext';
import type { Draft } from '../../app/store';
import { clockTools, formatDate, pieceAtMinute, splitDuration, viewDay, type ClockTools, type DayView } from '../../app/view';
import { addDays, dayParts, weekdayOf, type DayKey } from '../../domain/calendar';
import { teamOf, type LeaderPiece } from '../../domain/model';
import { canRemove, harshestGrace, showsLock } from '../../domain/rules';
import { ladder } from '../../domain/textFit';
import { MINUTE, clipTo, duration, type Interval } from '../../domain/time';
import { FeedbackText } from '../shared/FeedbackText';
import { ArrowRightIcon, ChevronIcon, CloseIcon, Crossed, EyeIcon, HelpIcon, LockIcon, PlusIcon } from '../shared/Icons';
import { CommentField } from '../shared/CommentField';
import { TimeWheel } from '../shared/TimeWheel';
import { Hy, LanguageSwitch, Notice, usePreferenceFlag } from '../shared/bits';

/** Live feedback on the phone, in mock points (@3x): 48pt on two rows, down in 2pt steps to 36pt on four. */
const FEEDBACK_RUNGS = ladder(48, [2, 2, 3, 3, 3, 4, 4]);
const IMPLICIT_DRAFT: Draft = { id: 0, start: null, end: null };

export function MobileView() {
  const app = useApp();
  const { t } = useTranslation();
  const { state, zone, now } = app;
  const day = useMemo(() => viewDay(state.schedule, zone, state.focus, now), [state.schedule, zone, state.focus, now]);
  const addable = !day.status.empty && !day.past;

  return (
    <div className="m" data-testid="mobile-view" style={{ ['--accent' as string]: app.accent }}>
      <header className="m-head">
        <div className="m-head__row">
          <h1 className="m-title">{t('title')}</h1>
          <LanguageSwitch />
        </div>
        <p className="m-range">
          {formatDate(app.firstDay, false)} - {formatDate(app.lastDay, false)}
        </p>
        <Progress />
        <DayChips />
      </header>

      <main className="m-body" data-testid="day-body" data-day={day.day}>
        <p className="m-prompt prose">
          <Hy>{t('prompt')}</Hy>
        </p>
        {day.status.empty && (
          <div className="m-closed" data-testid="day-closed">
            <Crossed />
            <span>{t('noWindow')}</span>
          </div>
        )}
        <Cards day={day} />
        {day.crossesMidnight && <MidnightTip />}
      </main>

      <div className="m-dock">
        {!day.status.empty && (
          <div className="m-dock__actions">
            <CommentField day={day.day} variant="phone" />
            <button
              type="button"
              className={`m-add${addable ? '' : ' is-inert'}`}
              // A past day stays visible but simply does not respond.
              aria-disabled={!addable}
              onClick={() => addable && app.newDraft(day.day)}
              data-testid="add-interval"
            >
              <span>{t('addInterval')}</span>
              <PlusIcon />
            </button>
          </div>
        )}
        <footer className="m-foot">
          <FeedbackText rungs={FEEDBACK_RUNGS} pointsPerUnit={3} weight={400} align="left" />
          <button type="button" className="m-confirm" onClick={app.confirm} disabled={state.saving} data-testid="confirm">
            <span>{t('confirmAll')}</span>
            <ArrowRightIcon />
          </button>
        </footer>
      </div>
      <Notice />
    </div>
  );
}

/** One segment per interval the volunteer has added over the whole period. */
function Progress() {
  const { state } = useApp();
  const { t } = useTranslation();
  const count = Object.values(state.schedule.selections).reduce((n, s) => n + s.current.length, 0);
  return (
    <div className="m-progress" role="img" aria-label={t('intervalsAdded', { count })} data-testid="progress" data-count={count}>
      {Array.from({ length: count }, (_, i) => (
        <i key={i} data-testid="progress-segment" />
      ))}
    </div>
  );
}

function DayChips() {
  const app = useApp();
  const { t } = useTranslation();
  const { state, zone, now, config } = app;
  const strip = useRef<HTMLDivElement>(null);
  const days = useMemo(() => {
    const out: DayKey[] = [];
    for (let d = app.firstDay; d <= app.lastDay; d = addDays(d, 1)) if (config.weekdays.includes(weekdayOf(d))) out.push(d);
    return out;
  }, [app.firstDay, app.lastDay, config.weekdays]);
  const index = days.indexOf(state.focus);
  const short = t('weekdaysShort') as unknown as string[];

  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>('[aria-current="date"]');
    const box = strip.current;
    if (el && box) box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: 'auto' });
  }, [state.focus, app.layout.u]);

  const go = (step: number) => {
    const next = days[index + step];
    if (next) app.focus(next);
  };
  return (
    <div className="m-days">
      <button type="button" className="m-days__arrow" onClick={() => go(-1)} disabled={index <= 0} aria-label={t('prevDay')} data-testid="day-prev">
        <ChevronIcon left />
      </button>
      <div className="m-days__strip" ref={strip}>
        {days.map((d) => {
          const v = viewDay(state.schedule, zone, d, now);
          const flags = [d === state.focus && 'is-on', v.filled && 'is-filled', v.past && 'is-past', v.status.empty && 'is-closed'];
          return (
            <button
              key={d}
              type="button"
              className={`chip ${flags.filter(Boolean).join(' ')}`}
              aria-current={d === state.focus ? 'date' : undefined}
              onClick={() => app.focus(d)}
              data-testid="day-chip"
              data-day={d}
              data-locked={v.tabLock || undefined}
            >
              {short[weekdayOf(d)]} {String(dayParts(d).date).padStart(2, '0')}
              {v.tabLock && <LockIcon className="chip__lock" />}
            </button>
          );
        })}
      </div>
      <button type="button" className="m-days__arrow" onClick={() => go(1)} disabled={index >= days.length - 1} aria-label={t('nextDay')} data-testid="day-next">
        <ChevronIcon />
      </button>
    </div>
  );
}

type CardItem = { kind: 'mine'; piece: Interval } | { kind: 'leaderAdded' | 'leaderRemoved'; piece: LeaderPiece };

function Cards({ day }: { day: DayView }) {
  const app = useApp();
  const tools = clockTools(app.zone, day.day, app.state.schedule.stepMs);
  const items: CardItem[] = [
    ...day.selection.current.map((piece) => ({ kind: 'mine' as const, piece })),
    ...day.selection.leaderAdded.map((piece) => ({ kind: 'leaderAdded' as const, piece })),
    ...day.selection.leaderRemoved.map((piece) => ({ kind: 'leaderRemoved' as const, piece })),
  ].sort((a, b) => a.piece.start - b.piece.start);
  const drafts = app.state.drafts[day.day] ?? [];
  const showImplicit = items.length === 0 && drafts.length === 0 && !day.status.empty && !day.past;
  return (
    <>
      {items.map((item, i) =>
        item.kind === 'mine' ? (
          <EntryCard key={`m${i}`} day={day} piece={item.piece} tools={tools} />
        ) : (
          <LeaderCard key={`${item.kind}${item.piece.start}`} kind={item.kind} piece={item.piece} tools={tools} />
        ),
      )}
      {(showImplicit ? [IMPLICIT_DRAFT] : drafts).map((draft, i) => (
        <DraftCard key={`d${i}`} day={day} draft={draft} tools={tools} />
      ))}
    </>
  );
}

function Duration({ ms }: { ms: number }) {
  const { t } = useTranslation();
  return <span className="card__duration">{t('duration', splitDuration(ms))}</span>;
}

function wheelText(t: (k: string) => string) {
  return { earlierLabel: t('earlier'), laterLabel: t('later') };
}

function EntryCard({ day, piece, tools }: { day: DayView; piece: Interval; tools: ClockTools }) {
  const app = useApp();
  const { t } = useTranslation();
  const grace = harshestGrace(app.state.schedule.teams);
  const start = tools.toMinute(piece.start);
  const end = tools.toMinute(piece.end);
  const host = pieceAtMinute(day.pieces, start) ?? day.pieces[0];
  const status = host.status;
  // Once frozen, the accepted part of this card is a floor: ends may only move outwards.
  const floor = status.locked ? clipTo(day.selection.confirmed, [piece]) : [];
  const startMax = floor.length ? tools.toMinute(floor[0].start) : end - tools.step;
  const endMin = floor.length ? tools.toMinute(floor[floor.length - 1].end) : start + tools.step;
  const removable = canRemove(piece, day.selection, day.open, app.now, grace);
  const replace = (to: Interval) => app.edit(day.day, { kind: 'replace', from: piece, to });
  return (
    <article className={`card${status.past ? ' is-past' : ''}`} data-testid="entry-card">
      <div className="card__main">
        <TimeWheel
          value={start}
          min={host.from}
          max={startMax}
          step={tools.step}
          label={tools.label}
          parse={tools.parse}
          hint="min"
          ariaLabel={t('startTime')}
          {...wheelText(t)}
          disabled={status.past}
          testId="wheel-start"
          onCommit={(m) => replace({ start: tools.toInstant(m), end: piece.end })}
        />
        <TimeWheel
          value={end}
          min={endMin}
          max={host.to}
          step={tools.step}
          label={tools.label}
          parse={tools.parse}
          hint="max"
          ariaLabel={t('endTime')}
          {...wheelText(t)}
          disabled={status.past}
          testId="wheel-end"
          onCommit={(m) => replace({ start: piece.start, end: tools.toInstant(m) })}
        />
        <div className="card__info">
          <span className="card__label">{t('selected')}</span>
          <Duration ms={duration(piece)} />
        </div>
        {end > 1440 && (
          <span className="card__night" data-testid="next-night">
            {t('nextNight')}
          </span>
        )}
      </div>
      {removable ? (
        <button type="button" className="card__side" aria-label={t('removeInterval')} data-testid="remove" onClick={() => app.edit(day.day, { kind: 'remove', interval: piece })}>
          <CloseIcon />
        </button>
      ) : (
        <div className="card__side" title={showsLock(status) ? t('locked') : undefined} data-testid={showsLock(status) ? 'entry-lock' : 'entry-inert'}>
          {showsLock(status) && <LockIcon />}
        </div>
      )}
    </article>
  );
}

function DraftCard({ day, draft, tools }: { day: DayView; draft: Draft; tools: ClockTools }) {
  const app = useApp();
  const { t } = useTranslation();
  const start = draft.start === null ? null : tools.toMinute(draft.start);
  const end = draft.end === null ? null : tools.toMinute(draft.end);
  // The draft lives in the open piece its first filled end points at; before that, the whole day's range.
  const host = pieceAtMinute(day.pieces, start ?? end ?? -1);
  const min = host?.from ?? day.from;
  const max = host?.to ?? day.to;
  const set = (field: 'start' | 'end') => (m: number) => app.setDraft(day.day, draft.id, field, tools.toInstant(m));
  return (
    <article className="card" data-testid="draft-card">
      <div className="card__main">
        <TimeWheel
          value={start}
          min={min}
          max={(end ?? max) - tools.step}
          step={tools.step}
          label={tools.label}
          parse={tools.parse}
          hint="min"
          ariaLabel={t('startTime')}
          {...wheelText(t)}
          testId="wheel-start"
          onCommit={set('start')}
        />
        <TimeWheel
          value={end}
          min={(start ?? min) + tools.step}
          max={max}
          step={tools.step}
          label={tools.label}
          parse={tools.parse}
          hint="max"
          ariaLabel={t('endTime')}
          {...wheelText(t)}
          testId="wheel-end"
          onCommit={set('end')}
        />
        <div className="card__info">
          <span className="card__label">{t('selected')}</span>
          <Duration ms={start !== null && end !== null ? (end - start) * MINUTE : 0} />
        </div>
        {max > 1440 && (end === null || end > 1440) && <span className="card__night">{t('nextNight')}</span>}
      </div>
      <button type="button" className="card__side" aria-label={t('removeInterval')} data-testid="remove-draft" onClick={() => app.dropDraft(day.day, draft.id)}>
        <CloseIcon />
      </button>
    </article>
  );
}

/** A team lead's change: the card wears that team's colour. */
function LeaderCard({ kind, piece, tools }: { kind: 'leaderAdded' | 'leaderRemoved'; piece: LeaderPiece; tools: ClockTools }) {
  const { t, i18n } = useTranslation();
  const { state } = useApp();
  const team = teamOf(state.schedule, piece.teamId);
  const end = tools.toMinute(piece.end);
  return (
    <article className={`card card--leader card--${kind}`} style={{ ['--team' as string]: team.color }} data-testid={`${kind}-card`} data-team={team.id}>
      <div className="card__main">
        <div className="wheel wheel--lg wheel--static">
          <span className="wheel__value">{tools.label(tools.toMinute(piece.start))}</span>
        </div>
        <div className="wheel wheel--lg wheel--static">
          <span className="wheel__value">{tools.label(end)}</span>
        </div>
        <div className="card__info card__info--leader">
          <strong>{t(kind)}</strong>
          <Duration ms={duration(piece)} />
          <small>{team.names[i18n.language] ?? team.names.et}</small>
          {end > 1440 && <span className="card__night card__night--inline">{t('nextNight')}</span>}
        </div>
      </div>
    </article>
  );
}

/** The past-midnight explanation. The eye closes it; what remains is its blurred top edge, and the choice is remembered. */
function MidnightTip() {
  const { t } = useTranslation();
  const [hidden, setHidden] = usePreferenceFlag('tip.midnight.hidden');
  const [more, setMore] = useState(false);
  return (
    <aside className={`tip${hidden ? ' tip--hidden' : ''}`} data-testid="tip" data-hidden={hidden ? 'true' : 'false'}>
      <p className="prose" aria-hidden={hidden || undefined}>
        <Hy>{t('midnightTip')}</Hy>
        {more && !hidden && (
          <span className="tip__more">
            {' '}
            <Hy>{t('midnightHelp')}</Hy>
          </span>
        )}
      </p>
      <div className="tip__tools">
        <button type="button" className="tip__eye" onClick={() => setHidden(!hidden)} aria-label={hidden ? t('tipShow') : t('tipHide')} aria-pressed={hidden} data-testid="tip-eye">
          <EyeIcon off={hidden} />
        </button>
        {!hidden && (
          <button type="button" className="tip__help" onClick={() => setMore((v) => !v)} aria-label={t('help')} aria-expanded={more}>
            <HelpIcon />
          </button>
        )}
      </div>
    </aside>
  );
}
