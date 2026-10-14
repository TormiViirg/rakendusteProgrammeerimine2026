import { useEffect, useRef, useState } from 'react';
import { clamp, roundToStep } from '../../domain/time';
import { TimeDrum } from './TimeDrum';

/** Coarse pointers (fingers) get the drums; `?touch` forces them for testing. */
export const isTouch = () =>
  document.documentElement.dataset.touch === '1' || (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches);

export interface TimeWheelProps {
  /** Day minute, or null while still empty. */
  value: number | null;
  min: number;
  max: number;
  step: number;
  label(minute: number): string;
  parse(text: string, min: number, max: number): number | null;
  onCommit(minute: number): void;
  /** Which bound the empty wheel offers as a hint: start wheels the earliest, end wheels the latest. */
  hint: 'min' | 'max';
  ariaLabel: string;
  earlierLabel: string;
  laterLabel: string;
  disabled?: boolean;
  size?: 'lg' | 'sm';
  testId?: string;
}

const EMPTY = 'XX:XX';
const DRAG_PX_PER_STEP = 14;

/**
 * A three-row time wheel: previous value, editable value, next value.
 * Whatever comes in – typing, arrow keys, mouse wheel, drag, tapping a
 * neighbour – goes through the same `settle`: round to the step, clamp to
 * [min, max]. A value outside the range cannot be produced.
 */
export function TimeWheel(props: TimeWheelProps) {
  const { value, min, max, step, label, hint, disabled } = props;
  const [typing, setTyping] = useState<string | null>(null);
  const [drum, setDrum] = useState(false);
  const touch = isTouch();
  const input = useRef<HTMLInputElement>(null);
  const drag = useRef<{ y: number; moved: boolean } | null>(null);

  const settle = (minute: number) => {
    const next = clamp(roundToStep(minute, step), min, max);
    if (next !== value) props.onCommit(next);
  };
  const previous = value === null ? null : Math.max(min, roundToStep(value - 1, step, 'floor'));
  const following = value === null ? null : Math.min(max, roundToStep(value + 1, step, 'ceil'));
  const nudge = (direction: -1 | 1) => {
    if (disabled || max < min) return;
    if (value === null) settle(hint === 'min' ? min : max);
    else settle(direction < 0 ? previous! : following!);
  };
  const commitTyped = () => {
    if (typing === null) return;
    const parsed = props.parse(typing, min, max);
    setTyping(null);
    if (parsed !== null && !disabled) settle(parsed);
  };

  // Mouse wheel only steps a focused field, so the page keeps scrolling normally.
  const nudgeRef = useRef(nudge);
  nudgeRef.current = nudge;
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (document.activeElement !== el) return;
      e.preventDefault();
      nudgeRef.current(e.deltaY > 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const above = value === null ? (hint === 'min' ? label(min) : EMPTY) : label(previous!);
  const below = value === null ? (hint === 'max' ? label(max) : EMPTY) : label(following!);

  return (
    <div
      className={`wheel wheel--${props.size ?? 'lg'}${disabled ? ' is-disabled' : ''}`}
      data-testid={props.testId}
      onPointerDown={(e) => {
        if (disabled) return;
        drag.current = { y: e.clientY, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || e.buttons === 0) return;
        const delta = e.clientY - d.y;
        if (Math.abs(delta) >= DRAG_PX_PER_STEP) {
          d.y = e.clientY;
          d.moved = true;
          nudge(delta < 0 ? 1 : -1);
        }
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <button type="button" className="wheel__near" tabIndex={-1} aria-label={props.earlierLabel} disabled={disabled} onClick={() => nudge(-1)}>
        {above}
      </button>
      <input
        ref={input}
        className="wheel__value"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        placeholder={EMPTY}
        aria-label={props.ariaLabel}
        readOnly={disabled || touch}
        value={typing ?? (value === null ? '' : label(value))}
        onFocus={(e) => (touch ? setDrum(!disabled) : e.currentTarget.select())}
        onClick={() => touch && !disabled && setDrum(true)}
        onChange={(e) => setTyping(e.currentTarget.value)}
        onBlur={commitTyped}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitTyped();
            e.currentTarget.select();
          } else if (e.key === 'Escape') {
            setTyping(null);
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            setTyping(null);
            nudge(e.key === 'ArrowUp' ? -1 : 1);
          }
        }}
      />
      <button type="button" className="wheel__near" tabIndex={-1} aria-label={props.laterLabel} disabled={disabled} onClick={() => nudge(1)}>
        {below}
      </button>
      {drum && (
        <TimeDrum
          value={value}
          min={min}
          max={max}
          step={step}
          label={label}
          title={props.ariaLabel}
          onCancel={() => setDrum(false)}
          onDone={(m) => {
            setDrum(false);
            settle(m);
          }}
        />
      )}
    </div>
  );
}
