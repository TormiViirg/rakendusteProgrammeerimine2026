import { describe, expect, it } from 'vitest';
import en from '../../src/locales/en.json';
import et from '../../src/locales/et.json';
import ru from '../../src/locales/ru.json';
import { INITIAL_ENGINE, advance } from '../../src/domain/stats/engine';
import { deriveFacts, percentileOf, scopeKeys } from '../../src/domain/stats/facts';
import { stepLevel, type Level } from '../../src/domain/stats/levelMachine';
import { holds, type Predicate } from '../../src/domain/stats/predicates';
import { ADVICE_RULES, SUMMARY_RULE } from '../../src/domain/stats/rules';
import { HOUR } from '../../src/domain/time';
import { EET, scheduleOf, selection, span, windowOf } from './fixtures';

const pick = (day: string, from: string, to: string) => selection({ current: [span(day, from, to)] });

describe('facts: buckets by illustrative day', () => {
  const sat = windowOf('a', '2026-10-31', '18:00', '26:00'); // Saturday, last day of October, runs into 1 Nov
  const mon = windowOf('a', '2026-11-02', '09:30', '18:00');
  const tue = windowOf('a', '2026-11-03', '09:30', '18:00');
  const schedule = scheduleOf([sat, mon, tue], {
    '2026-10-31': pick('2026-10-31', '23:00', '26:00'),
    '2026-11-02': pick('2026-11-02', '10:00', '12:00'),
  });

  it('BV-FACT-01 hours after midnight count for the day, week and month the shift started in', () => {
    const facts = deriveFacts(schedule, EET, '2026-10-31');
    expect(facts.day.selectedMs).toBe(3 * HOUR);
    expect(facts.week.selectedMs).toBe(3 * HOUR); // week of 26 Oct, not the week of 2 Nov
    expect(facts.month.selectedMs).toBe(3 * HOUR); // October, although 2 of the 3 hours fall on 1 Nov
  });
  it('BV-FACT-02 Monday starts a new week and November a new month', () => {
    const facts = deriveFacts(schedule, EET, '2026-11-02');
    expect(facts.week.selectedMs).toBe(2 * HOUR);
    expect(facts.month.selectedMs).toBe(2 * HOUR);
    expect(facts.period.selectedMs).toBe(5 * HOUR);
  });
  it('EC-FACT-03 slots are hour cells; a half-hour first slot counts as one', () => {
    const facts = deriveFacts(schedule, EET, '2026-11-02');
    expect(facts.day.possibleSlots).toBe(9); // 09:30–10:00 + 8 whole hours
    expect(facts.day.selectedSlots).toBe(2);
    expect(facts.period).toMatchObject({ possibleSlots: 8 + 9 + 9, selectedSlots: 5, days: 2 });
  });
  it('BV-FACT-04 a day without any window: nothing possible, ratio 0, nothing missing', () => {
    const facts = deriveFacts(schedule, EET, '2026-11-07');
    expect(facts.day).toMatchObject({ possibleMs: 0, ratio: 0, missingMs: 0, targetMs: 0 });
  });
  it('BV-FACT-05 the target is capped by what can be chosen at all', () => {
    const short = windowOf('a', '2026-11-05', '10:00', '12:00');
    const facts = deriveFacts(scheduleOf([short], { '2026-11-05': pick('2026-11-05', '10:00', '12:00') }), EET, '2026-11-05');
    expect(facts.day.targetMs).toBe(2 * HOUR); // not the 6 h default
    expect(facts.day.ratio).toBe(1);
  });
  it('EC-FACT-07 two teams on one day are counted once, as one open area', () => {
    const a = windowOf('a', '2026-11-05', '10:00', '16:00');
    const b = windowOf('b', '2026-11-05', '14:00', '20:00');
    const facts = deriveFacts(scheduleOf([a, b], { '2026-11-05': pick('2026-11-05', '15:00', '17:00') }), EET, '2026-11-05');
    expect(facts.day).toMatchObject({ possibleSlots: 10, possibleMs: 10 * HOUR, selectedMs: 2 * HOUR, selectedSlots: 2 });
  });
  it('EC-FACT-06 time a team lead added counts; overlapping volunteer time is not counted twice', () => {
    const w = windowOf('a', '2026-11-05', '10:00', '16:00');
    const sel = selection({ current: [span('2026-11-05', '10:00', '12:00')], leaderAdded: [{ ...span('2026-11-05', '11:00', '13:00'), teamId: 'a' }] });
    expect(deriveFacts(scheduleOf([w], { '2026-11-05': sel }), EET, '2026-11-05').day.selectedMs).toBe(3 * HOUR);
  });
});

describe('cohort percentile', () => {
  const cohort = { quantiles: [{ p: 0.5, ms: 24 * HOUR }, { p: 0.8, ms: 40 * HOUR }, { p: 1, ms: 120 * HOUR }] };
  it.each([
    { id: 'BV-PCT-01', boundary: 'nothing chosen', hours: 0, expected: 0 },
    { id: 'EC-PCT-02', boundary: 'half way to the median', hours: 12, expected: 0.25 },
    { id: 'BV-PCT-03', boundary: 'exactly the median', hours: 24, expected: 0.5 },
    { id: 'BV-PCT-04', boundary: 'exactly the 80th percentile', hours: 40, expected: 0.8 },
    { id: 'BV-PCT-05', boundary: 'above everybody', hours: 500, expected: 1 },
  ])('$id $boundary', ({ hours, expected }) => {
    expect(percentileOf(cohort, hours * HOUR)).toBeCloseTo(expected, 10);
  });
});

describe('level machine (thresholds 0.5 / 1.0, hysteresis 0.05)', () => {
  it.each<{ id: string; boundary: string; prev: Level | undefined; ratio: number; expected: Level }>([
    { id: 'BV-LVL-01', boundary: 'ratio 0', prev: 'near', ratio: 0, expected: 'none' },
    { id: 'BV-LVL-02', boundary: 'smallest positive ratio', prev: undefined, ratio: 0.001, expected: 'low' },
    { id: 'BV-LVL-03', boundary: 'just under near', prev: 'low', ratio: 0.499, expected: 'low' },
    { id: 'BV-LVL-04', boundary: 'exactly near', prev: 'low', ratio: 0.5, expected: 'near' },
    { id: 'BV-LVL-05', boundary: 'falling inside the band stays near', prev: 'near', ratio: 0.46, expected: 'near' },
    { id: 'BV-LVL-06', boundary: 'falling below the band drops to low', prev: 'near', ratio: 0.449, expected: 'low' },
    { id: 'BV-LVL-07', boundary: 'just under met', prev: 'near', ratio: 0.999, expected: 'near' },
    { id: 'BV-LVL-08', boundary: 'exactly met', prev: 'near', ratio: 1, expected: 'met' },
    { id: 'BV-LVL-09', boundary: 'falling inside the band stays met', prev: 'met', ratio: 0.96, expected: 'met' },
    { id: 'BV-LVL-10', boundary: 'falling below the band drops to near', prev: 'met', ratio: 0.949, expected: 'near' },
    { id: 'EC-LVL-11', boundary: 'no memory: same ratio as LVL-09 is only near', prev: undefined, ratio: 0.96, expected: 'near' },
    { id: 'EC-LVL-12', boundary: 'well above the target', prev: 'low', ratio: 3, expected: 'met' },
  ])('$id $boundary', ({ prev, ratio, expected }) => {
    expect(stepLevel(prev, ratio)).toBe(expected);
  });
});

describe('predicate language', () => {
  const w = windowOf('a', '2026-11-05', '10:00', '16:00');
  const facts = deriveFacts(scheduleOf([w], { '2026-11-05': pick('2026-11-05', '10:00', '13:00') }), EET, '2026-11-05');
  const situation = { facts, levels: { day: 'near', week: 'low', month: 'low', period: 'low' } as const };
  it.each<{ id: string; p: Predicate; expected: boolean }>([
    { id: 'EC-PRED-01 comparison true', p: { fact: 'day.selectedMs', is: '==', value: 3 * HOUR }, expected: true },
    { id: 'BV-PRED-02 strict comparison at the value', p: { fact: 'day.selectedMs', is: '>', value: 3 * HOUR }, expected: false },
    { id: 'EC-PRED-03 level membership', p: { level: 'day', in: ['near', 'met'] }, expected: true },
    { id: 'EC-PRED-04 all', p: { all: [{ always: true }, { level: 'week', in: ['met'] }] }, expected: false },
    { id: 'EC-PRED-05 any', p: { any: [{ level: 'week', in: ['met'] }, { always: true }] }, expected: true },
    { id: 'EC-PRED-06 not', p: { not: { level: 'week', in: ['met'] } }, expected: true },
    { id: 'BV-PRED-07 empty all is true, empty any is false', p: { all: [{ all: [] }, { not: { any: [] } }] }, expected: true },
  ])('$id', ({ p, expected }) => {
    expect(holds(p, situation)).toBe(expected);
  });
});

describe('engine: which sentence wins', () => {
  const days = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'];
  const windows = days.map((d) => windowOf('a', d, '08:00', '24:00'));
  const run = (hoursPerDay: number[], focus = '2026-11-02', state = INITIAL_ENGINE) => {
    const selections = Object.fromEntries(
      windows.map((w, i) => [w.day, hoursPerDay[i] ? pick(w.day, '08:00', `${8 + hoursPerDay[i]}:00`) : selection()]),
    );
    const facts = deriveFacts(scheduleOf(windows, selections), EET, focus);
    return advance(state, { facts, keys: scopeKeys(focus) });
  };
  it.each([
    { id: 'EC-ENG-01', situation: 'nothing chosen anywhere', hours: [0, 0, 0, 0, 0], rule: 'nothing-yet' },
    { id: 'EC-ENG-02', situation: 'focused day empty, week under target', hours: [0, 6, 0, 0, 0], rule: 'day-empty' },
    { id: 'EC-ENG-03', situation: 'day has time, week under target', hours: [6, 6, 0, 0, 0], rule: 'week-short' },
    { id: 'BV-ENG-04', situation: 'week exactly on target (24 h), cohort median', hours: [6, 6, 6, 6, 0], rule: 'month-short' },
    { id: 'BV-ENG-05', situation: 'period total exactly at the 80th percentile (40 h)', hours: [8, 8, 8, 8, 8], rule: 'top-cohort' },
  ])('$id $situation → $rule', ({ hours, rule }) => {
    expect(run(hours).feedback.advice.ruleId).toBe(rule);
  });

  it('EC-ENG-06 the summary line always reports slots, possible slots and distinct days', () => {
    expect(run([6, 6, 0, 0, 0]).feedback.summary).toMatchObject({ key: 'stats.summary', params: { selected: 12, possible: 80, count: 2 } });
  });
  it('BV-ENG-07 missing hours are rounded up to whole hours', () => {
    const w = windowOf('a', '2026-11-02', '08:00', '24:00');
    const facts = deriveFacts(scheduleOf(windows, { [w.day]: pick('2026-11-02', '08:00', '13:25') }), EET, '2026-11-02');
    const { feedback } = advance(INITIAL_ENGINE, { facts, keys: scopeKeys('2026-11-02') });
    expect(feedback.advice).toMatchObject({ ruleId: 'week-short', params: { count: 19 } }); // 24 h − 5 h 25 min = 18 h 35 min
  });
  it('EC-ENG-08 hysteresis: a week that reached its target does not fall back after losing 1 hour', () => {
    const reached = run([6, 6, 6, 6, 0]);
    expect(reached.feedback.levels.week).toBe('met');
    expect(run([6, 6, 6, 5, 0], '2026-11-02', reached.state).feedback.levels.week).toBe('met');
    expect(run([6, 6, 6, 5, 0]).feedback.levels.week).toBe('near');
  });
  it('EC-ENG-09 moving to another week starts that week afresh but keeps the period going', () => {
    const reached = run([6, 6, 6, 6, 0]);
    const elsewhere = run([6, 6, 6, 5, 0], '2026-11-10', reached.state);
    expect(elsewhere.feedback.levels.week).toBe('none');
    expect(Object.keys(elsewhere.state.levels)).toEqual(expect.arrayContaining(['week:2026-11-02', 'week:2026-11-09', 'period']));
  });
  it('EC-ENG-10 the engine is deterministic: same state and input, same output', () => {
    expect(run([6, 3, 0, 0, 0])).toEqual(run([6, 3, 0, 0, 0]));
  });
});

describe('every engine message has wording in every language', () => {
  const PLURALS: Record<string, string[]> = { et: ['one', 'other'], en: ['one', 'other'], ru: ['one', 'few', 'many', 'other'] };
  const catalogues: Record<string, Record<string, unknown>> = { et: et.stats, en: en.stats, ru: ru.stats };
  for (const [language, stats] of Object.entries(catalogues)) {
    it.each([SUMMARY_RULE, ...ADVICE_RULES].map((r) => ({ rule: r.id, message: r.message, counted: !!r.params?.count })))(
      `I18N-${language.toUpperCase()} $rule`,
      ({ message, counted }) => {
        const plain = typeof stats[message] === 'string';
        const plural = PLURALS[language].every((form) => typeof stats[`${message}_${form}`] === 'string');
        expect(plain || (counted && plural)).toBe(true);
      },
    );
  }
});
