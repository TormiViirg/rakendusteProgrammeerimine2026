import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../app/AppContext';
import { GRID } from '../../app/layout';
import { clockTools, formatDate, pieceAtMinute, viewDay, type DayView } from '../../app/view';
import { addDays, dayParts, formatClock, mondayOf, monthOf, pageOf, weekdayOf, type DayKey, type Page } from '../../domain/calendar';
import { buildScale, cellState, extentsOf, planDay, rowInterval, type Block, type CellState, type Scale } from '../../domain/grid';
import { teamOf } from '../../domain/model';
import { harshestGrace } from '../../domain/rules';
import { ladder } from '../../domain/textFit';
import { DAY, clipTo } from '../../domain/time';
import { FeedbackText } from '../shared/FeedbackText';
import { ArrowRightIcon, CheckIcon, Crossed, HelpIcon, LockIcon, TriangleIcon } from '../shared/Icons';
import { CommentField } from '../shared/CommentField';
import { TimeWheel } from '../shared/TimeWheel';
import { Hy, LanguageSwitch, Notice, useHyphenate } from '../shared/bits';

/** Live feedback on desktop, in mock points (@4x): 64pt on two rows, down in 2pt steps to 48pt on four. */
const FEEDBACK_RUNGS = ladder(64, [2, 2, 2, 3, 3, 3, 3, 4, 4]);

interface Drag {
  day: DayKey;
  mode: 'add' | 'remove';
  from: number;
  to: number;
}

const u = (n: number) => `calc(${n} * var(--u))`;

/** Stretches of consecutive `true`s – each gets its own past-midnight note, centred over those columns. */
function runs(flags: boolean[]): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = [];
  let start = -1;
  flags.forEach((flag, i) => {
    if (flag && start < 0) start = i;
    if (start >= 0 && (!flag || i === flags.length - 1)) {
      out.push({ from: start, to: flag ? i : i - 1 });
      start = -1;
    }
  });
  return out;
}

export function DesktopView() {
  const app = useApp();
  const { t } = useTranslation();
  const hy = useHyphenate();
  const { state, zone, now, config, layout } = app;

  const page = useMemo(
    () => pageOf(app.firstDay, app.lastDay, state.focus, layout.fit, config.weekdays),
    [app.firstDay, app.lastDay, state.focus, layout.fit, config.weekdays],
  );
  const days = useMemo(() => page.days.map((d) => viewDay(state.schedule, zone, d, now)), [page, state.schedule, zone, now]);
  const scale = useMemo(() => {
    const visible = days.flatMap((d) => extentsOf(zone, d.open));
    // An empty page borrows the period's overall extent so the grid keeps its shape.
    const all = Object.keys(state.schedule.selections).flatMap((day) => extentsOf(zone, viewDay(state.schedule, zone, day, now).open));
    return buildScale(visible.length ? visible : all);
  }, [days, zone, state.schedule, now]);

  const columns = `repeat(${days.length + 1}, minmax(0, 1fr))`;
  const rows = [
    scale.mainCount ? `repeat(${scale.mainCount}, ${u(GRID.row)})` : '',
    scale.nightCount ? `minmax(${u(GRID.gapRow)}, auto) repeat(${scale.nightCount}, ${u(GRID.nightRow)})` : '',
  ].join(' ');
  const noteRuns = runs(days.map((d) => d.crossesMidnight));
  const anyRevealed = days.some((d) => state.revealed[d.day]);
  const contact = state.schedule.contact;

  const scroller = useScrollbarWidth();

  return (
    <div className="d" data-testid="desktop-view" data-columns={days.length} data-page-mode={page.mode} data-monday={page.monday} style={{ ['--columns' as string]: columns, ['--accent' as string]: app.accent, ['--scrollbar' as string]: `${scroller.width}px` }}>
      <div className="d-lang">
        <a className="d-dev" href="?matrix" title="Testjuhud">
          ⌗
        </a>
        <LanguageSwitch />
      </div>

      {/* Header and grid share one scroll container, so their columns can never drift apart. */}
      <div className="d-scroll" ref={scroller.ref} data-testid="grid-scroll">
        <div className="d-top d-cols">
          <MiniCalendar page={page} />
          <Nav page={page} />
          {days.map((d, i) => (
            <DayHeader key={d.day} day={d} column={i + 2} />
          ))}
        </div>
        <div className="d-grid d-cols" style={{ gridTemplateRows: rows }} data-testid="grid" data-main-rows={scale.mainCount} data-night-rows={scale.nightCount}>
          <TimeColumn scale={scale} />
          {scale.nightCount > 0 &&
            noteRuns.map((run) => (
              <p key={run.from} className="d-midnight" style={{ gridRow: scale.mainCount + 1, gridColumn: `${run.from + 2} / ${run.to + 3}` }} data-testid="midnight-note" data-span={run.to - run.from + 1}>
                <span>{hy(t('midnightNote'))}</span>
                <span className="d-help" tabIndex={0} aria-label={t('midnightHelp')} data-tip={t('midnightHelp')}>
                  <HelpIcon />
                </span>
              </p>
            ))}
          {days.map((d, i) => (
            <DayColumn key={d.day} day={d} scale={scale} column={i + 2} />
          ))}
        </div>
      </div>

      <div className="d-comments">
        <div className="d-cols d-comments__inner">
          <div className="d-comments__label">{t('yourComment')}</div>
          {days.map((d) => (
            <div className="d-comments__day" key={d.day}>
              {!d.status.empty && <CommentField day={d.day} variant="desktop" />}
            </div>
          ))}
        </div>
      </div>

      <footer className="d-foot">
        <p className="prose" data-testid="footer-text">
          {hy(
            anyRevealed
              ? t('footer.howto')
              : t('footer.policy', {
                  days: Math.max(1, Math.round(harshestGrace(state.schedule.teams) / DAY)),
                  email: contact.email,
                  emailHours: contact.emailUntilHours,
                  callHours: contact.callWithinHours,
                  phone: contact.phone,
                }),
          )}
        </p>
        <button type="button" className="d-confirm" onClick={app.confirm} disabled={state.saving} data-testid="confirm">
          <span>{t('confirm')}</span>
          <ArrowRightIcon />
        </button>
      </footer>
      <Notice />
    </div>
  );
}

/** The scroll container's scrollbar width, so the pinned bars below it can keep the same column grid. */
function useScrollbarWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.offsetWidth - el.clientWidth);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

// ── Navigation ──────────────────────────────────────────────────────────────

function Nav({ page }: { page: Page }) {
  const app = useApp();
  const { t } = useTranslation();
  const range = page.mode === 'range';
  return (
    <div className={`d-nav${range ? ' d-nav--range' : ''}`}>
      <button type="button" className="d-nav__btn" disabled={!page.prevAnchor} onClick={() => page.prevAnchor && app.focus(page.prevAnchor)} data-testid="nav-prev">
        <span className="d-nav__title">
          <TriangleIcon left />
          {t(range ? 'nav.prevRange' : 'nav.prevWeek')}
        </span>
        <span className="d-nav__caption">{page.before ? `${formatDate(page.before.from)} - ${formatDate(page.before.to)}` : ' '}</span>
      </button>
      <FeedbackText rungs={FEEDBACK_RUNGS} pointsPerUnit={4} weight={500} align="left" />
      <button type="button" className="d-nav__btn d-nav__btn--next" disabled={!page.nextAnchor} onClick={() => page.nextAnchor && app.focus(page.nextAnchor)} data-testid="nav-next">
        <span className="d-nav__title">
          {t(range ? 'nav.nextRange' : 'nav.nextWeek')}
          <TriangleIcon />
        </span>
        <span className="d-nav__caption">{page.after ? `${formatDate(page.after.from)} - ${t('nav.untilEnd')}` : ' '}</span>
      </button>
    </div>
  );
}

/**
 * The mini calendar. Month tabs: full names for one or two months, three
 * letters up to four, several rows beyond that. Every row – year, month tabs,
 * weekday header, weeks – gets the same height, so whitespace above and below
 * each element is equal; the year comes from the period's own bounds.
 */
const MONTHS_PER_ROW = 4;

function MiniCalendar({ page }: { page: Page }) {
  const app = useApp();
  const { t } = useTranslation();
  const short = t('weekdaysShort') as unknown as string[];
  const months = t('months') as unknown as string[];
  const weeks: DayKey[][] = [];
  for (let monday = mondayOf(app.firstDay); monday <= app.lastDay; monday = addDays(monday, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(monday, i)));
  }
  const monthKeys = [...new Set(weeks.flat().filter((d) => d >= app.firstDay && d <= app.lastDay).map(monthOf))];
  const currentMonth = monthOf(app.state.focus);
  const visible = new Set(page.days);
  const monthRows = Math.ceil(monthKeys.length / MONTHS_PER_ROW);
  const monthLabel = (m: string) => {
    const name = months[Number(m.slice(5)) - 1];
    return monthKeys.length <= 2 ? name : name.slice(0, 3);
  };
  const years = [...new Set([dayParts(app.firstDay).year, dayParts(app.lastDay).year])].join('/');
  // year + month tabs + weekday header + weeks share the calendar's height equally
  const rowCount = 1 + monthRows + 1 + weeks.length;
  const line = (GRID.nav + GRID.header) / rowCount;
  return (
    <div
      className="cal"
      data-testid="mini-calendar"
      data-month-rows={monthRows}
      data-weeks={weeks.length}
      // the three inner rules take 3px off the height; every row gets an equal share of the rest
      style={{ ['--line' as string]: `calc((${u(GRID.nav + GRID.header)} - 5px) / ${rowCount})`, fontSize: u(Math.min(11, line * 0.68)) }}
    >
      <div className="cal__year" data-testid="cal-year">
        {years}
      </div>
      <div className="cal__months" style={{ gridTemplateColumns: `repeat(${Math.min(monthKeys.length, MONTHS_PER_ROW)}, 1fr)` }}>
        {monthKeys.map((m) => (
          <button
            key={m}
            type="button"
            className={m === currentMonth ? 'is-on' : ''}
            title={months[Number(m.slice(5)) - 1]}
            onClick={() => app.focus(m === monthOf(app.firstDay) ? app.firstDay : `${m}-01`)}
            data-testid="cal-month"
          >
            {monthLabel(m)}
          </button>
        ))}
      </div>
      <div className="cal__head">
        {short.map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </div>
      <div className="cal__weeks">
        {weeks.map((week) => (
          <div key={week[0]} className={`cal__week${week.some((d) => visible.has(d)) ? ' is-on' : ''}`}>
            {week.map((d) =>
              d < app.firstDay || d > app.lastDay ? (
                <span key={d} className="cal__out">
                  X
                </span>
              ) : (
                <button
                  key={d}
                  type="button"
                  className={monthOf(d) === currentMonth ? '' : 'is-other'}
                  onClick={() => app.focus(d)}
                  aria-label={formatDate(d)}
                  data-testid="cal-day"
                  data-day={d}
                >
                  {dayParts(d).date}
                </button>
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayHeader({ day, column }: { day: DayView; column: number }) {
  const { t } = useTranslation();
  const long = t('weekdaysLong') as unknown as string[];
  return (
    <div
      className={`d-day${day.today ? ' is-today' : ''}${day.past ? ' is-past' : ''}`}
      style={{ gridColumn: column }}
      data-testid="day-header"
      data-day={day.day}
      data-locked={day.tabLock || undefined}
      data-past={day.past || undefined}
    >
      <strong>{long[weekdayOf(day.day)]}</strong>
      <span>{formatDate(day.day)}</span>
      {day.tabLock && (
        <span className="d-day__lock" title={t('locked')} data-testid="day-lock">
          <LockIcon />
        </span>
      )}
    </div>
  );
}

// ── The hour grid ───────────────────────────────────────────────────────────

/** Scale row index → CSS grid line; the gap row sits between day and night rows. */
const lineOf = (scale: Scale, row: number) => (row < scale.mainCount ? row + 1 : row + 2);

function TimeColumn({ scale }: { scale: Scale }) {
  const { t } = useTranslation();
  return (
    <>
      {scale.rows.map((row, i) => (
        <div
          key={row.from}
          className={`d-time${i % 2 === 0 ? ' is-alt' : ''}${row.night ? ' d-time--night' : ''}`}
          style={{ gridColumn: 1, gridRow: lineOf(scale, i) }}
          data-testid="time-row"
          data-night={row.night || undefined}
        >
          <span>
            {formatClock(row.from)} - {row.to === 1440 ? '23:59' : formatClock(row.to)}
          </span>
          {row.night && <small>{t('nextNight')}</small>}
        </div>
      ))}
    </>
  );
}

function DayColumn({ day, scale, column }: { day: DayView; scale: Scale; column: number }) {
  const app = useApp();
  const { zone, state } = app;
  const plan = useMemo(() => planDay(zone, day.open, scale), [zone, day.open, scale]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  dragRef.current = drag;

  const cells = plan.blocks.filter((b): b is Extract<Block, { kind: 'cell' }> => b.kind === 'cell');

  // A drag ends wherever the button is released, even outside the column.
  // The edit covers whole rows; snapping clips it to the open pieces, so a
  // sub-hour gap inside a row is never picked.
  useEffect(() => {
    if (!drag) return;
    const finish = () => {
      const d = dragRef.current;
      setDrag(null);
      if (!d) return;
      const lo = Math.min(d.from, d.to);
      const hi = Math.max(d.from, d.to);
      const first = rowInterval(zone, day.day, scale.rows[lo]);
      const last = rowInterval(zone, day.day, scale.rows[hi]);
      app.edit(d.day, { kind: d.mode, interval: { start: first.start, end: last.end } });
    };
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null]);

  // First view: the hour grid stays veiled until a span is given, the volunteer steps in – or simply touches a cell.
  const veiled = !state.revealed[day.day] && !day.status.empty && !day.past && day.selection.current.length === 0;
  // one veil per contiguous run of cells (the night section is its own run), each with its own outline
  const veils = useMemo(() => {
    const out: { from: number; to: number }[] = [];
    for (const c of cells) {
      const last = out[out.length - 1];
      if (last && last.to === c.row - 1 && scale.rows[c.row].night === scale.rows[last.from].night) last.to = c.row;
      else out.push({ from: c.row, to: c.row });
    }
    return out;
  }, [cells, scale]);

  return (
    <div className="d-col" style={{ gridColumn: column }} data-testid="day-column" data-day={day.day} data-veiled={veiled || undefined}>
      {plan.blocks.map((block) => {
        if (block.kind === 'closed') {
          return (
            <div
              key={`x${block.fromRow}`}
              className="d-closed"
              style={{ gridRow: `${lineOf(scale, block.fromRow)} / ${lineOf(scale, block.toRow) + 1}` }}
              data-testid="closed-block"
              data-rows={block.toRow - block.fromRow + 1}
              data-night={block.night || undefined}
            >
              <Crossed />
            </div>
          );
        }
        const inDrag = drag && block.row >= Math.min(drag.from, drag.to) && block.row <= Math.max(drag.from, drag.to);
        return (
          <Cell
            key={`c${block.row}`}
            block={block}
            day={day}
            scale={scale}
            veiled={veiled}
            preview={inDrag ? drag.mode : null}
            onStart={(mode) => {
              if (veiled) app.reveal(day.day);
              setDrag({ day: day.day, mode, from: block.row, to: block.row });
            }}
            onEnter={() => drag && setDrag({ ...drag, to: block.row })}
          />
        );
      })}
      {veiled &&
        veils.map((run, i) => (
          <div key={run.from} className="d-veil" style={{ gridRow: `${lineOf(scale, run.from)} / ${lineOf(scale, run.to) + 1}` }} data-testid="veil">
            {i === 0 && <Prompt day={day} />}
          </div>
        ))}
    </div>
  );
}

const INTERACTIVE: Record<CellState, boolean> = {
  free: true,
  new: true,
  selected: true,
  selectedLocked: false,
  leaderAdded: false,
  leaderRemoved: true,
};

function Cell(props: {
  block: Extract<Block, { kind: 'cell' }>;
  day: DayView;
  scale: Scale;
  veiled: boolean;
  preview: 'add' | 'remove' | null;
  onStart(mode: 'add' | 'remove'): void;
  onEnter(): void;
}) {
  const { block, day, scale } = props;
  const app = useApp();
  const { t } = useTranslation();
  const tools = clockTools(app.zone, day.day, app.state.schedule.stepMs);
  const first = block.spans[0];
  const lastSpan = block.spans[block.spans.length - 1];
  const host = pieceAtMinute(day.pieces, tools.toMinute(first.start)) ?? day.pieces[0];
  const status = host.status;
  const cell = cellState(block.spans, day.selection, day.open, status);
  // a veiled cell still responds: touching it lifts the veil
  const responsive = !status.past;
  const row = scale.rows[block.row];
  const overlapsCell = (p: { start: number; end: number }) => block.spans.some((s) => p.start < s.end && p.end > s.start);
  const leader = cell === 'leaderAdded' || cell === 'leaderRemoved' ? (cell === 'leaderAdded' ? day.selection.leaderAdded : day.selection.leaderRemoved).find(overlapsCell) : undefined;
  const team = leader ? teamOf(app.state.schedule, leader.teamId) : undefined;

  // The first and last cell of a chosen run carry its exact start and end.
  const run = cell === 'selected' || cell === 'selectedLocked' ? (day.selection.current.find(overlapsCell) ?? null) : null;
  const showStart = !!run && run.start >= first.start && run.start < lastSpan.end && responsive && !props.veiled;
  const showEnd = !!run && run.end > first.start && run.end <= lastSpan.end && responsive && !props.veiled;
  const floor = run && status.locked ? clipTo(day.selection.confirmed, [run]) : [];

  const classes = ['d-cell', `d-cell--${cell}`, block.row % 2 === 0 && 'is-alt', props.veiled && 'is-veiled', status.past && 'is-past', props.preview && `is-preview-${props.preview}`, row.night && 'd-cell--night'];
  const start = tools.label(tools.toMinute(first.start));
  const end = tools.label(tools.toMinute(lastSpan.end));
  const rowSpan = rowInterval(app.zone, day.day, row);
  // the cell's content lives in its widest open part, so a gap band never covers it
  const rowLength = rowSpan.end - rowSpan.start;
  const widest = block.spans.reduce((best, sp) => (sp.end - sp.start > best.end - best.start ? sp : best));
  const band = { top: (widest.start - rowSpan.start) / rowLength, height: (widest.end - widest.start) / rowLength };
  const tight = band.height < 0.7;
  const toggleMode = cell === 'selected' ? 'remove' : 'add';
  const wheel = { size: 'sm' as const, step: tools.step, label: tools.label, parse: tools.parse, earlierLabel: t('earlier'), laterLabel: t('later') };

  return (
    <div
      role="button"
      tabIndex={responsive && INTERACTIVE[cell] ? 0 : -1}
      aria-pressed={cell === 'selected' || cell === 'selectedLocked'}
      aria-label={`${start}–${end}`}
      className={classes.filter(Boolean).join(' ')}
      style={{ gridRow: lineOf(scale, block.row), ['--team' as string]: team?.color }}
      data-testid="cell"
      data-state={cell}
      data-row={block.row}
      data-from={tools.label(tools.toMinute(rowSpan.start))}
      data-open-from={start}
      data-open-to={end}
      data-gaps={block.gaps.length || undefined}
      data-team={team?.id}
      onPointerDown={(e) => {
        if (e.button !== 0 || !responsive || !INTERACTIVE[cell]) return;
        e.preventDefault();
        props.onStart(toggleMode);
      }}
      onPointerEnter={props.onEnter}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && responsive && INTERACTIVE[cell]) {
          e.preventDefault();
          if (props.veiled) app.reveal(day.day);
          app.edit(day.day, { kind: toggleMode, interval: rowSpan });
        }
      }}
    >
      {block.gaps.map((gap) => (
        // the closed part of a row (a gap shorter than an hour between two pieces) – visible, never pickable
        <span key={gap.from} className="d-cell__gap" style={{ top: `${gap.from * 100}%`, height: `${(gap.to - gap.from) * 100}%` }} data-testid="cell-gap" aria-hidden>
          <Crossed />
        </span>
      ))}
      <div className={`d-cell__body${tight ? ' is-tight' : ''}`} style={band.height < 1 ? { top: `${band.top * 100}%`, height: `${band.height * 100}%` } : undefined}>
      {cell === 'selectedLocked' && !showStart && !showEnd && <LockIcon className="d-cell__icon" />}
      {cell === 'selected' && !showStart && !showEnd && <CheckIcon className="d-cell__icon d-cell__icon--check" />}
      {(cell === 'leaderAdded' || cell === 'leaderRemoved') && (
        <span className="d-cell__text">
          <Hy>{t(cell)}</Hy>
        </span>
      )}
      {cell === 'new' && (
        <span className="d-cell__new">
          <Hy>{t('newShift')}</Hy>
        </span>
      )}
      {(showStart || showEnd) && run && (
        <div className={`d-edge${showStart && showEnd ? ' d-edge--both' : ''}`} onPointerDown={(e) => e.stopPropagation()}>
          {showStart && (
            <label>
              <span>{t('myStart')}</span>
              <TimeWheel
                {...wheel}
                value={tools.toMinute(run.start)}
                min={host.from}
                max={floor.length ? tools.toMinute(floor[0].start) : tools.toMinute(run.end) - tools.step}
                hint="min"
                ariaLabel={t('startTime')}
                testId="edge-start"
                onCommit={(m) => app.edit(day.day, { kind: 'replace', from: run, to: { start: tools.toInstant(m), end: run.end } })}
              />
            </label>
          )}
          {showEnd && (
            <label>
              <span>{t('myEnd')}</span>
              <TimeWheel
                {...wheel}
                value={tools.toMinute(run.end)}
                min={floor.length ? tools.toMinute(floor[floor.length - 1].end) : tools.toMinute(run.start) + tools.step}
                max={(pieceAtMinute(day.pieces, tools.toMinute(run.end) - 1) ?? host).to}
                hint="max"
                ariaLabel={t('endTime')}
                testId="edge-end"
                onCommit={(m) => app.edit(day.day, { kind: 'replace', from: run, to: { start: run.start, end: tools.toInstant(m) } })}
              />
            </label>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

/**
 * First view of a day: ask for one span, or step into the hour grid.
 * It sits in the middle of whatever part of its column is on screen: on every
 * scroll and resize its top is set so that its centre meets the centre of the
 * visible slice of the veil (clamped to the veil's own bounds).
 */
function Prompt({ day }: { day: DayView }) {
  const app = useApp();
  const { t } = useTranslation();
  const tools = clockTools(app.zone, day.day, app.state.schedule.stepMs);
  const box = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    const veil = el?.parentElement;
    const scroller = el?.closest<HTMLElement>('.d-scroll');
    const header = scroller?.querySelector<HTMLElement>('.d-top');
    if (!el || !veil || !scroller || !header) return;
    const place = () => {
      const s = scroller.getBoundingClientRect();
      const v = veil.getBoundingClientRect();
      const visibleTop = Math.max(v.top, s.top + header.offsetHeight);
      const visibleBottom = Math.min(v.bottom, s.bottom);
      const middle = (visibleTop + visibleBottom) / 2;
      const h = el.offsetHeight;
      setTop(Math.max(0, Math.min(v.height - h, middle - h / 2 - v.top)));
    };
    place();
    scroller.addEventListener('scroll', place, { passive: true });
    const observer = new ResizeObserver(place);
    observer.observe(scroller);
    observer.observe(el);
    return () => {
      scroller.removeEventListener('scroll', place);
      observer.disconnect();
    };
  }, []);
  const [start, setStart] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);
  const host = pieceAtMinute(day.pieces, start ?? end ?? -1);
  const min = host?.from ?? day.from;
  const max = host?.to ?? day.to;
  const apply = () => {
    if (start !== null && end !== null) {
      app.edit(day.day, { kind: 'add', interval: { start: tools.toInstant(start), end: tools.toInstant(end) } });
    }
    app.reveal(day.day);
  };
  const wheel = { step: tools.step, label: tools.label, parse: tools.parse, size: 'sm' as const, earlierLabel: t('earlier'), laterLabel: t('later') };
  return (
    <div className="d-prompt" ref={box} style={{ top }} data-testid="prompt" data-day={day.day}>
      <p className="prose">
        <Hy>{t('prompt')}</Hy>
        <span className="d-help" tabIndex={0} aria-label={t('promptHelp')} data-tip={t('promptHelp')}>
          <HelpIcon />
        </span>
      </p>
      <div className="d-prompt__entry" data-testid="prompt-entry">
        <span>{t('suitsMe')}</span>
        <div className="d-prompt__wheels">
          <TimeWheel {...wheel} value={start} min={min} max={(end ?? max) - tools.step} hint="min" ariaLabel={t('startTime')} testId="prompt-start" onCommit={setStart} />
          <i>-</i>
          <TimeWheel {...wheel} value={end} min={(start ?? min) + tools.step} max={max} hint="max" ariaLabel={t('endTime')} testId="prompt-end" onCommit={setEnd} />
        </div>
      </div>
      <div className="d-prompt__buttons">
        <button type="button" className="btn btn--ghost" onClick={apply} data-testid="prompt-step-away">
          {t('stepAway')}
        </button>
        <button type="button" className="btn btn--solid" onClick={apply} data-testid="prompt-done">
          {t('doneChoosing')}
        </button>
      </div>
    </div>
  );
}
