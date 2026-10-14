/**
 * The feedback engine, assembled:
 *
 *   schedule ─▶ facts ─▶ level machines ─▶ rule table ─▶ MessageSpec ─▶ (i18n adapter) ─▶ text ─▶ (text fitter)
 *
 * `advance` is the engine's transition function: (state, input) → (state', output).
 * State is just the remembered level per scope key, so switching to another
 * day/week starts that scope's machine afresh while the period machine runs on.
 */
import { HOUR } from '../time';
import { SCOPES, readFact, type Facts, type ScopeName } from './facts';
import { DEFAULT_LEVELS, stepLevel, type Level, type LevelConfig } from './levelMachine';
import { holds } from './predicates';
import { ADVICE_RULES, SUMMARY_RULE, type MessageRule, type Tone, type Unit } from './rules';

export interface MessageSpec {
  ruleId: string;
  /** i18n key; the engine never produces prose. */
  key: string;
  params: Record<string, number>;
  tone: Tone;
}

export interface EngineState {
  levels: Readonly<Record<string, Level>>;
}

export interface Feedback {
  summary: MessageSpec;
  advice: MessageSpec;
  levels: Record<ScopeName, Level>;
}

export const INITIAL_ENGINE: EngineState = { levels: {} };

const convert = (value: number, unit: Unit = 'count'): number =>
  unit === 'hoursUp' ? Math.ceil(value / HOUR) : unit === 'percent' ? Math.round(value * 100) : value;

function render(rule: MessageRule, facts: Facts): MessageSpec {
  const params: Record<string, number> = {};
  for (const [name, source] of Object.entries(rule.params ?? {})) {
    params[name] = convert(readFact(facts, source.fact), source.unit);
  }
  return { ruleId: rule.id, key: `stats.${rule.message}`, params, tone: rule.tone };
}

export function advance(
  state: EngineState,
  input: { facts: Facts; keys: Record<ScopeName, string> },
  rules: readonly MessageRule[] = ADVICE_RULES,
  config: LevelConfig = DEFAULT_LEVELS,
): { state: EngineState; feedback: Feedback } {
  const levels = {} as Record<ScopeName, Level>;
  const remembered: Record<string, Level> = { ...state.levels };
  for (const scope of SCOPES) {
    const key = input.keys[scope];
    levels[scope] = stepLevel(state.levels[key], input.facts[scope].ratio, config);
    remembered[key] = levels[scope];
  }
  const situation = { facts: input.facts, levels };
  const winner = [...rules]
    .sort((a, b) => b.priority - a.priority)
    .find((rule) => holds(rule.when, situation));
  const fallback = rules[rules.length - 1];
  return {
    state: { levels: remembered },
    feedback: {
      summary: render(SUMMARY_RULE, input.facts),
      advice: render(winner ?? fallback, input.facts),
      levels,
    },
  };
}
