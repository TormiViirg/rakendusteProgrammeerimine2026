import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { clamp, roundToStep } from '../../domain/time';

export interface TimeDrumProps {
  value: number | null;
  min: number;
  max: number;
  step: number;
  label(minute: number): string;
  title: string;
  onDone(minute: number): void;
  onCancel(): void;
}

/** Rows above and below the chosen one that stay visible. */
const VISIBLE = 2;

/**
 * The touch time picker: two drums, hours and minutes, each scrolled on its
 * own and snapping to a row (as on a phone's alarm clock), in this UI's own
 * mono-and-black-border style. Only values inside [min, max] are offered,
 * so the result can never leave the range.
 */
export function TimeDrum(props: TimeDrumProps) {
  const { min, max, step, label } = props;
  const { t } = useTranslation();
  const initial = clamp(roundToStep(props.value ?? min, step), min, max);
  const [hour, setHour] = useState(Math.floor(initial / 60));
  const [minute, setMinute] = useState(initial % 60);

  const hours = useMemo(() => {
    const out: number[] = [];
    for (let h = Math.floor(min / 60); h <= Math.floor(max / 60); h++) out.push(h);
    return out;
  }, [min, max]);
  const minutes = useMemo(() => {
    const out: number[] = [];
    for (let m = 0; m < 60; m += step) {
      const total = hour * 60 + m;
      if (total >= min && total <= max) out.push(m);
    }
    return out;
  }, [hour, min, max, step]);
  // a new hour may not offer the old minute – snap to the nearest it does
  useEffect(() => {
    if (minutes.length && !minutes.includes(minute)) {
      setMinute(minutes.reduce((best, m) => (Math.abs(m - minute) < Math.abs(best - minute) ? m : best)));
    }
  }, [minutes, minute]);

  const chosen = clamp(hour * 60 + minute, min, max);
  // rendered at the document root: the scrolling, masked panels would otherwise clip it
  return createPortal(
    <div className="drum-backdrop" role="dialog" aria-modal="true" aria-label={props.title} data-testid="drum" onPointerDown={(e) => e.target === e.currentTarget && props.onCancel()}>
      <div className="drum">
        <h2 className="drum__title">{props.title}</h2>
        <div className="drum__columns">
          <Column items={hours} value={hour} render={(h) => label(h * 60).slice(0, 2)} onChange={setHour} testId="drum-hours" />
          <span className="drum__colon">:</span>
          <Column items={minutes} value={minute} render={(m) => String(m).padStart(2, '0')} onChange={setMinute} testId="drum-minutes" />
        </div>
        <div className="drum__value" aria-live="polite" data-testid="drum-value">
          {label(chosen)}
        </div>
        <div className="drum__buttons">
          <button type="button" className="btn btn--ghost" onClick={props.onCancel}>
            {t('cancel')}
          </button>
          <button type="button" className="btn btn--solid" onClick={() => props.onDone(chosen)} data-testid="drum-done">
            {t('doneChoosing')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Column(props: { items: number[]; value: number; render(n: number): string; onChange(n: number): void; testId: string }) {
  const { items, value, onChange } = props;
  const box = useRef<HTMLDivElement>(null);
  const rowPx = useRef(0);
  const settling = useRef<number | null>(null);

  // scroll the chosen row into the middle whenever the value or the list changes from outside
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const row = el.querySelector<HTMLElement>('[data-row]');
    rowPx.current = row?.offsetHeight ?? 0;
    const index = Math.max(0, items.indexOf(value));
    el.scrollTo({ top: index * rowPx.current, behavior: 'auto' });
  }, [items, value]);

  const onScroll = () => {
    const el = box.current;
    if (!el || !rowPx.current) return;
    if (settling.current) window.clearTimeout(settling.current);
    settling.current = window.setTimeout(() => {
      const index = clamp(Math.round(el.scrollTop / rowPx.current), 0, items.length - 1);
      if (items[index] !== value) onChange(items[index]);
    }, 80);
  };

  return (
    <div className="drum__column" ref={box} onScroll={onScroll} data-testid={props.testId} data-value={value}>
      <div className="drum__pad" style={{ height: `calc(${VISIBLE} * var(--drum-row))` }} />
      {items.map((n) => (
        <button
          type="button"
          key={n}
          className={`drum__row${n === value ? ' is-on' : ''}`}
          data-row={n}
          onClick={() => onChange(n)}
          tabIndex={-1}
        >
          {props.render(n)}
        </button>
      ))}
      <div className="drum__pad" style={{ height: `calc(${VISIBLE} * var(--drum-row))` }} />
    </div>
  );
}
