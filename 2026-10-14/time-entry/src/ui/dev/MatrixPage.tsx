/**
 * Developer navigation over the generated boundary / equivalence combinations.
 * Opened with ?matrix. (Dev tooling: this is the one UI file allowed to read the dummy adapter.)
 */
import { useState } from 'react';
import { COMBINATIONS, FILLS, SPANS, TEAMS, TIMES, generatedId, type Combination } from '../../adapters/dummy/generated';

const DIMENSIONS = { span: SPANS, teams: TEAMS, time: TIMES, filled: FILLS } as const;
type Dimension = keyof typeof DIMENSIONS;

const NOTES: Record<Dimension, Record<string, string>> = {
  span: { day: '10:00–18:00', night: '18:00–02:00, past midnight', midnight: '16:00–24:00, ends on midnight', b2b: '08:00→08:00 twice, 48 h back to back' },
  teams: { one: 'ticket seller only', apart: '+ Black Carpet, not touching', gap: '+ Black Carpet 15 min later (sub-hour gap)', overlap: '+ Black Carpet, overlapping' },
  time: { open: 'before the grace point', locked: 'grace crossed, shift ahead', past: 'shift over' },
  filled: { empty: 'nothing chosen', partial: 'one confirmed hour', leader: 'lead added + removed an hour', new: 'window extended since last visit' },
};

export function MatrixPage() {
  const [filter, setFilter] = useState<Partial<Record<Dimension, string>>>({});
  const [lang, setLang] = useState('et');
  const [view, setView] = useState<'desktop' | 'phone'>('desktop');
  const rows = COMBINATIONS.filter((c) => (Object.keys(DIMENSIONS) as Dimension[]).every((d) => !filter[d] || c[d] === filter[d]));
  const link = (c: Combination) => `?scenario=${generatedId(c)}&lang=${lang}${view === 'phone' ? '&phone' : ''}`;
  return (
    <main className="matrix" data-testid="matrix">
      <h1>Testjuhud – {COMBINATIONS.length} combinations ({rows.length} shown)</h1>
      <p>
        Every combination of four boundary dimensions, each a complete dummy backend answer for the week of 2–8 November 2026. Links open the normal app
        on Thursday the 5th.
      </p>
      <div className="matrix__filters">
        {(Object.keys(DIMENSIONS) as Dimension[]).map((d) => (
          <label key={d}>
            {d}
            <select value={filter[d] ?? ''} onChange={(e) => setFilter({ ...filter, [d]: e.target.value || undefined })}>
              <option value="">all</option>
              {DIMENSIONS[d].map((v) => (
                <option key={v} value={v}>
                  {v} – {NOTES[d][v]}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          language
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            {['et', 'en', 'ru'].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          view
          <select value={view} onChange={(e) => setView(e.target.value as 'desktop' | 'phone')}>
            <option value="desktop">desktop</option>
            <option value="phone">phone (narrow window)</option>
          </select>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>span</th>
            <th>teams</th>
            <th>time</th>
            <th>filled</th>
            <th>scenario</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={generatedId(c)}>
              <td>{i + 1}</td>
              <td title={NOTES.span[c.span]}>{c.span}</td>
              <td title={NOTES.teams[c.teams]}>{c.teams}</td>
              <td title={NOTES.time[c.time]}>{c.time}</td>
              <td title={NOTES.filled[c.filled]}>{c.filled}</td>
              <td>
                <a href={link(c)} data-testid="matrix-link">
                  {generatedId(c)}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
