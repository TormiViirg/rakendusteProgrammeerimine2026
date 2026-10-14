import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import et from '../locales/et.json';
import ru from '../locales/ru.json';

export const LANGUAGES = ['et', 'en', 'ru'] as const;
export type Language = (typeof LANGUAGES)[number];

export const isLanguage = (value: string | null | undefined): value is Language =>
  LANGUAGES.includes(value as Language);

/** i18n adapter: static interface text. Lookup values (team names) come from the backend. */
export function initI18n(language: Language) {
  void i18next.use(initReactI18next).init({
    resources: { et: { translation: et }, en: { translation: en }, ru: { translation: ru } },
    lng: language,
    fallbackLng: 'et',
    interpolation: { escapeValue: false },
    returnObjects: true,
  });
  return i18next;
}
