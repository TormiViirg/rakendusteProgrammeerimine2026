/**
 * Composition root – the only place where adapters are chosen and wired to ports.
 *
 * Demo switches (query string):
 *   ?scenario=demo|fresh|backToBack|single|overlap   dummy data set
 *   ?now=2026-11-03T08:00:00Z | system               "current time" (default: the scenario's own)
 *   ?lang=et|en|ru                                   language (otherwise the saved one, then Estonian)
 *   ?days=5                                          show Monday–Friday instead of Monday–Sunday
 *   ?day=2026-11-06                                  day to open on
 *   ?matrix                                          the generated boundary combinations
 *   ?phone                                           force the phone layout (for the matrix links)
 *   ?touch                                           force the touch time drums (otherwise: coarse pointer)
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fira-sans-extra-condensed/400.css';
import '@fontsource/fira-sans-extra-condensed/500.css';
import '@fontsource/fira-sans-extra-condensed/600.css';
import '@fontsource/fira-sans-extra-condensed/700.css';
import '@fontsource/fira-mono/400.css';
import '@fontsource/fira-mono/700.css';
import './ui/styles/tokens.css';
import './ui/styles/shared.css';
import './ui/styles/mobile.css';
import './ui/styles/desktop.css';
import { browserPreferences } from './adapters/browserPreferences';
import { ruleHyphenator } from './adapters/hyphenator';
import { MatrixPage } from './ui/dev/MatrixPage';
import { canvasMeasure } from './adapters/canvasMeasure';
import { offsetClock, systemClock } from './adapters/clocks';
import { dummyBackend } from './adapters/dummy/backend';
import { SCENARIOS, type ScenarioName } from './adapters/dummy/scenarios';
import { initI18n, isLanguage } from './adapters/i18n';
import { intlZone } from './adapters/intlZone';
import type { AppConfig, Ports } from './ports';
import { App } from './ui/App';

const query = new URLSearchParams(window.location.search);
const scenario = SCENARIOS[(query.get('scenario') ?? 'demo') as ScenarioName] ?? SCENARIOS.demo;

const nowParam = query.get('now');
const clock = nowParam === 'system' ? systemClock : offsetClock(Date.parse(nowParam ?? scenario.suggestedNowUtc) || Date.parse(scenario.suggestedNowUtc));

const langParam = query.get('lang');
const saved = browserPreferences.get('language');
const language = isLanguage(langParam) ? langParam : isLanguage(saved) ? saved : 'et';
initI18n(language);
document.documentElement.lang = language;

const ports: Ports = {
  backend: dummyBackend(scenario, clock),
  clock,
  preferences: browserPreferences,
  measure: canvasMeasure,
  zones: intlZone,
  hyphenator: ruleHyphenator,
};
const config: AppConfig = {
  weekdays: query.get('days') === '5' ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6],
  startDay: query.get('day') ?? scenario.suggestedDay,
};
if (query.has('phone')) document.documentElement.style.maxWidth = '420px';
if (query.has('touch')) document.documentElement.dataset.touch = '1';

createRoot(document.getElementById('root')!).render(
  <StrictMode>{query.has('matrix') ? <MatrixPage /> : <App ports={ports} config={config} />}</StrictMode>,
);
