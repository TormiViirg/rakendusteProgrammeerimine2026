import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, type Language } from '../../adapters/i18n';
import { useApp } from '../../app/AppContext';

/** Lists the *other* languages, like the mock-up's "EN RU" next to an Estonian page. */
export function LanguageSwitch() {
  const { i18n, t } = useTranslation();
  const { ports } = useApp();
  const choose = (language: Language) => {
    void i18n.changeLanguage(language);
    ports.preferences.set('language', language);
    document.documentElement.lang = language;
  };
  return (
    <nav className="lang" aria-label={t('language')}>
      {LANGUAGES.filter((l) => l !== i18n.language).map((l) => (
        <button key={l} type="button" lang={l} onClick={() => choose(l)} data-testid={`lang-${l}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}

/** A boolean preference remembered through the Preferences port (localStorage + cookie). */
export function usePreferenceFlag(key: string): [boolean, (value: boolean) => void] {
  const { ports } = useApp();
  const [value, setValue] = useState(() => ports.preferences.get(key) === '1');
  const set = useCallback(
    (next: boolean) => {
      ports.preferences.set(key, next ? '1' : '0');
      setValue(next);
    },
    [key, ports],
  );
  return [value, set];
}

export function Notice() {
  const { state } = useApp();
  const { t } = useTranslation();
  if (!state.notice) return null;
  return (
    <div className={`notice notice--${state.notice.kind}`} role="status" data-testid="notice" key={state.notice.seq}>
      {t(`notice.${state.notice.kind}`)}
    </div>
  );
}

/** Text with soft hyphens from the Hyphenator port, in the current language. */
export function useHyphenate(): (text: string) => string {
  const { ports } = useApp();
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return useCallback((text: string) => ports.hyphenator.hyphenate(text, lang), [ports, lang]);
}

export function Hy({ children }: { children: string }): ReactNode {
  const hy = useHyphenate();
  return hy(children);
}
