import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../app/AppContext';
import { countRows, fitText, type Rung } from '../../domain/textFit';
import { useHyphenate } from './bits';

const FAMILY = '"Fira Sans Extra Condensed"';
const LINE_HEIGHT = 1.2;

/**
 * Renders the feedback engine's output. The engine hands over message specs
 * (key + numbers); wording comes from the translations, and the fit machine
 * picks the type size: 2-unit steps down, more rows allowed as it gets smaller.
 */
/**
 * `rungs` are in mock-up points (one mock pixel); `pointsPerUnit` is 3 for the
 * @3x phone drawings and 4 for the @4x desktop ones.
 */
export function FeedbackText(props: { rungs: readonly Rung[]; pointsPerUnit: number; weight: number; align: 'left' | 'center' }) {
  const { state, ports, layout } = useApp();
  const { t, i18n } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [fontsReady, setFontsReady] = useState(0);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let alive = true;
    void ports.measure.ready().then(() => alive && setFontsReady((n) => n + 1));
    return () => {
      alive = false;
    };
  }, [ports]);

  const { summary, advice } = state.feedback;
  const hy = useHyphenate();
  const lines = useMemo(
    () => [hy(t(summary.key, summary.params)), hy(t(advice.key, advice.params))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summary, advice, i18n.language, hy],
  );
  const fit = useMemo(() => {
    if (width === 0) return { rung: props.rungs[0], clamped: false };
    return fitText(props.rungs, (size) =>
      countRows(lines, width, (text) => ports.measure.width(text, { family: FAMILY, weight: props.weight, sizePx: (size / props.pointsPerUnit) * layout.u })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, width, layout.u, fontsReady, props.rungs, props.weight, props.pointsPerUnit]);

  const sizePx = (fit.rung.size / props.pointsPerUnit) * layout.u;
  return (
    <div
      ref={box}
      className={`feedback feedback--${props.align}`}
      role="status"
      aria-live="polite"
      data-testid="feedback"
      data-size={fit.rung.size}
      data-max-rows={fit.rung.maxRows}
      data-rule={advice.ruleId}
      data-tone={advice.tone}
      style={{
        fontSize: sizePx,
        fontWeight: props.weight,
        lineHeight: LINE_HEIGHT,
        maxHeight: Math.ceil(fit.rung.maxRows * sizePx * LINE_HEIGHT),
        ['--rows' as string]: fit.rung.maxRows,
      }}
    >
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  );
}
