/**
 * Layer 3b: the rule table. Text lives in the translation files, the dynamic
 * content is named here, the conditions are predicates – three separate things.
 *
 * Each rule: WHEN <predicate> SAY <message key> WITH <params from facts>.
 * The highest-priority rule that holds wins (ties: table order).
 */
import type { FactPath } from './facts';
import type { Predicate } from './predicates';

export type Unit = 'count' | 'hoursUp' | 'percent';
export type Tone = 'neutral' | 'praise' | 'nudge';

export interface MessageRule {
  id: string;
  priority: number;
  when: Predicate;
  /** i18n key under `stats.` */
  message: string;
  params?: Record<string, { fact: FactPath; unit?: Unit }>;
  tone: Tone;
}

/** Line 1 – always the same sentence, only the numbers move. */
export const SUMMARY_RULE: MessageRule = {
  id: 'summary',
  priority: 0,
  when: { always: true },
  message: 'summary',
  params: {
    selected: { fact: 'period.selectedSlots' },
    possible: { fact: 'period.possibleSlots' },
    count: { fact: 'period.days' },
  },
  tone: 'neutral',
};

/** Line 2 – what is most worth saying right now. */
export const ADVICE_RULES: readonly MessageRule[] = [
  {
    id: 'nothing-yet',
    priority: 100,
    when: { fact: 'period.selectedMs', is: '==', value: 0 },
    message: 'nothingYet',
    tone: 'nudge',
  },
  {
    id: 'day-empty',
    priority: 90,
    when: { all: [{ fact: 'day.possibleMs', is: '>', value: 0 }, { level: 'day', in: ['none'] }, { level: 'week', in: ['none', 'low', 'near'] }] },
    message: 'dayEmpty',
    tone: 'nudge',
  },
  {
    id: 'week-short',
    priority: 80,
    when: { all: [{ fact: 'week.possibleMs', is: '>', value: 0 }, { level: 'week', in: ['low', 'near'] }] },
    message: 'weekMissing',
    params: { count: { fact: 'week.missingMs', unit: 'hoursUp' } },
    tone: 'nudge',
  },
  {
    id: 'top-cohort',
    priority: 70,
    when: { fact: 'percentile', is: '>=', value: 0.8 },
    message: 'topCohort',
    tone: 'praise',
  },
  {
    id: 'period-met',
    priority: 60,
    when: { level: 'period', in: ['met'] },
    message: 'periodMet',
    tone: 'praise',
  },
  {
    id: 'month-short',
    priority: 50,
    when: { level: 'month', in: ['none', 'low', 'near'] },
    message: 'monthMissing',
    params: { count: { fact: 'month.missingMs', unit: 'hoursUp' } },
    tone: 'nudge',
  },
  {
    id: 'period-short',
    priority: 10,
    when: { always: true },
    message: 'periodMissing',
    params: { count: { fact: 'period.missingMs', unit: 'hoursUp' } },
    tone: 'neutral',
  },
];
