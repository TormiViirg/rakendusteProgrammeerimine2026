import type { Locator, Page } from '@playwright/test';

export const PHONE = { width: 393, height: 800 };
export const DESKTOP = { width: 1440, height: 1100 };

export interface OpenOptions {
  scenario?: string;
  lang?: 'et' | 'en' | 'ru';
  day?: string;
  now?: string;
  days?: 5;
}

export async function open(page: Page, options: OpenOptions = {}) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(options)) if (v !== undefined) query.set(k, String(v));
  await page.goto(`/?${query}`);
  await page.getByTestId('confirm').waitFor();
}

/** Type a time into a wheel the way a volunteer would, and commit it. */
export async function typeTime(wheel: Locator, text: string) {
  const input = wheel.locator('input');
  await input.fill(text);
  await input.press('Enter');
}
export const timeOf = (wheel: Locator) => wheel.locator('input').inputValue();

/** Strings the tests look for, per language – the UI data in three languages. */
export const WORDS = {
  et: { nextNight: 'Järgmise päeva öö', nextWeek: 'Näita järgmist nädalat', nextRange: 'Näita järgmist vahemikku', duration: '02h 30min', saved: 'Valikud on salvestatud', start: 'Alustage', audience: 'Publikuteenindus' },
  en: { nextNight: "Next day's night", nextWeek: 'Show next week', nextRange: 'Show next range', duration: '02h 30min', saved: 'Your choices are saved', start: 'Start by', audience: 'Audience services' },
  ru: { nextNight: 'Ночь следующего дня', nextWeek: 'Показать следующую неделю', nextRange: 'Показать следующий период', duration: '02ч 30мин', saved: 'Выбор сохранён', start: 'Начните', audience: 'Работа со зрителями' },
} as const;
export const LANGS = ['et', 'en', 'ru'] as const;

export const column = (page: Page, day: string) => page.locator(`[data-testid=day-column][data-day="${day}"]`);
export const SOFT_HYPHEN = '\u00ad';
export const cellAt = (page: Page, day: string, from: string) => column(page, day).locator(`[data-testid=cell][data-from="${from}"]`);
