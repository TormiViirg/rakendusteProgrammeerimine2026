import { expect, test } from '@playwright/test';
import { LANGS, PHONE, SOFT_HYPHEN, WORDS, open, timeOf, typeTime } from './helpers';

test.use({ viewport: PHONE });

for (const lang of LANGS) {
  test(`UI-PM-01 [${lang}] past midnight: 23:00 → 01:30 is filed under the day that reached midnight`, async ({ page }) => {
    // Wednesday 4 Nov, window 12:00 → 02:00 on Thursday. Boundary: interval crosses 24:00.
    await open(page, { scenario: 'fresh', day: '2026-11-04', lang });
    const draft = page.getByTestId('draft-card');
    await typeTime(draft.getByTestId('wheel-start'), '23:00');
    await typeTime(draft.getByTestId('wheel-end'), '01:30');
    const card = page.getByTestId('entry-card');
    await expect(card).toHaveCount(1);
    expect(await timeOf(card.getByTestId('wheel-start'))).toBe('23:00');
    expect(await timeOf(card.getByTestId('wheel-end'))).toBe('01:30');
    await expect(card.getByTestId('next-night')).toHaveText(WORDS[lang].nextNight);
    await expect(card).toContainText(WORDS[lang].duration);
    await expect(page.getByTestId('day-body')).toHaveAttribute('data-day', '2026-11-04');
  });
}

test('UI-RNG-01 a time after the window end is pulled back to the end (02:00)', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-04' });
  const draft = page.getByTestId('draft-card');
  await typeTime(draft.getByTestId('wheel-end'), '03:00'); // boundary: 60 min past the upper bound
  expect(await timeOf(draft.getByTestId('wheel-end'))).toBe('02:00');
  await typeTime(draft.getByTestId('wheel-end'), '02:05'); // boundary: one step past the upper bound
  expect(await timeOf(draft.getByTestId('wheel-end'))).toBe('02:00');
});

test('UI-RNG-02 a time before the window start is pulled forward to the start (12:00)', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-04' });
  const draft = page.getByTestId('draft-card');
  await typeTime(draft.getByTestId('wheel-start'), '11:55'); // boundary: one step below the lower bound
  expect(await timeOf(draft.getByTestId('wheel-start'))).toBe('12:00');
});

test('UI-RNG-03 the end can never be at or before the start', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-04' });
  const draft = page.getByTestId('draft-card');
  await typeTime(draft.getByTestId('wheel-start'), '15:00');
  await typeTime(draft.getByTestId('wheel-end'), '15:00'); // boundary: zero-length interval
  expect(await timeOf(page.getByTestId('entry-card').getByTestId('wheel-end'))).toBe('15:05');
});

for (const [typed, shown, why] of [
  ['20:36', '20:35', 'below the half step rounds down'],
  ['20:38', '20:40', 'above the half step rounds up'],
  ['2040', '20:40', 'digits without a colon'],
] as const) {
  test(`UI-RND-01 typed ${typed} becomes ${shown} (${why})`, async ({ page }) => {
    await open(page, { scenario: 'fresh', day: '2026-11-04' });
    const start = page.getByTestId('draft-card').getByTestId('wheel-start');
    await typeTime(start, typed);
    expect(await timeOf(start)).toBe(shown);
  });
}

test('UI-RND-02 text that is not a time leaves the value alone', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-04' });
  const start = page.getByTestId('draft-card').getByTestId('wheel-start');
  await typeTime(start, '13:00');
  await typeTime(start, 'ab:cd');
  expect(await timeOf(start)).toBe('13:00');
});

test('UI-LOCK-01 grace period crossed: confirmed shifts show a lock and cannot be removed, new ones can be added', async ({ page }) => {
  // Demo "now" is Tue 3 Nov 10:00; harshest grace 36 h ⇒ Wednesday is frozen.
  await open(page, { day: '2026-11-04' });
  const cards = page.getByTestId('entry-card');
  await expect(cards).toHaveCount(2);
  await expect(page.getByTestId('entry-lock')).toHaveCount(2);
  await expect(page.getByTestId('remove')).toHaveCount(0);
  // the tab lock marks today and the past, not the grace period: Wednesday has none, Tuesday (today) and Monday do
  await expect(page.locator('[data-testid=day-chip][data-day="2026-11-04"]')).not.toHaveAttribute('data-locked', 'true');
  await expect(page.locator('[data-testid=day-chip][data-day="2026-11-03"]')).toHaveAttribute('data-locked', 'true');
  await expect(page.locator('[data-testid=day-chip][data-day="2026-11-02"]')).toHaveAttribute('data-locked', 'true');

  await page.getByTestId('add-interval').click();
  const draft = page.getByTestId('draft-card');
  await typeTime(draft.getByTestId('wheel-start'), '12:00');
  await typeTime(draft.getByTestId('wheel-end'), '13:00');
  await expect(cards).toHaveCount(3);
  await expect(page.getByTestId('remove')).toHaveCount(1); // only the not-yet-confirmed one
});

test('UI-LOCK-02 a locked shift can be made longer but not shorter', async ({ page }) => {
  await open(page, { day: '2026-11-04' });
  const first = page.getByTestId('entry-card').first(); // confirmed 14:00–21:00
  await typeTime(first.getByTestId('wheel-start'), '15:00');
  expect(await timeOf(first.getByTestId('wheel-start'))).toBe('14:00');
  await typeTime(first.getByTestId('wheel-start'), '13:00');
  expect(await timeOf(first.getByTestId('wheel-start'))).toBe('13:00');
});

test('UI-PAST-01 a past day: adding does not respond; its tab carries the lock', async ({ page }) => {
  await open(page, { day: '2026-11-02' }); // Monday, over since 02:00 on Tuesday
  await expect(page.locator('[data-testid=day-chip][data-day="2026-11-02"]')).toHaveAttribute('data-locked', 'true');
  const before = await page.getByTestId('entry-card').count();
  await page.getByTestId('add-interval').click({ force: true });
  await expect(page.getByTestId('draft-card')).toHaveCount(0);
  await expect(page.getByTestId('entry-card')).toHaveCount(before);
  await expect(page.getByTestId('remove')).toHaveCount(0);
  await expect(page.getByTestId('entry-lock')).toHaveCount(0);
  await expect(page.getByTestId('entry-card').first().locator('input').first()).toHaveAttribute('readonly', '');
});

test('UI-PROG-01 the progress bar has one segment per interval added over the whole period', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-05' });
  await expect(page.getByTestId('progress-segment')).toHaveCount(0); // boundary: none
  const fill = async (a: string, b: string) => {
    const draft = page.getByTestId('draft-card');
    await typeTime(draft.getByTestId('wheel-start'), a);
    await typeTime(draft.getByTestId('wheel-end'), b);
  };
  await fill('10:00', '12:00');
  await expect(page.getByTestId('progress-segment')).toHaveCount(1);
  await page.getByTestId('add-interval').click();
  await fill('14:00', '16:00');
  await expect(page.getByTestId('progress-segment')).toHaveCount(2);
  await page.getByTestId('add-interval').click();
  await fill('12:00', '14:00'); // back to back with both ⇒ everything merges into one
  await expect(page.getByTestId('progress-segment')).toHaveCount(1);
  await page.getByTestId('day-next').click(); // Friday: another day's interval counts too
  await fill('10:00', '12:00');
  await expect(page.getByTestId('progress-segment')).toHaveCount(2);
  await page.getByTestId('day-prev').click();
  await page.getByTestId('remove').click();
  await expect(page.getByTestId('progress-segment')).toHaveCount(1);
});

test('UI-TIP-01 the blue eye hides the tip and the choice survives a reload (storage and cookie)', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-04' });
  await expect(page.getByTestId('tip')).toHaveAttribute('data-hidden', 'false');
  const before = (await page.getByTestId('tip').boundingBox())!.height;
  await page.getByTestId('tip-eye').click();
  await expect(page.getByTestId('tip')).toHaveAttribute('data-hidden', 'true');
  // the top edge of the tip stays, blurred, with the eye closed
  const after = (await page.getByTestId('tip').boundingBox())!.height;
  expect(after).toBeLessThan(before / 2);
  expect(after).toBeGreaterThan(0);
  expect(await page.getByTestId('tip').locator('p').evaluate((el) => getComputedStyle(el).filter)).toContain('blur');
  await expect(page.getByTestId('tip-eye')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('poff.vabadajad.tip.midnight.hidden'))).toBe('1');
  expect(await page.evaluate(() => document.cookie)).toContain('poff.vabadajad.tip.midnight.hidden=1');

  await page.reload();
  await expect(page.getByTestId('tip')).toHaveAttribute('data-hidden', 'true');

  // The cookie alone is enough when storage has been wiped.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('tip')).toHaveAttribute('data-hidden', 'true');

  await page.getByTestId('tip-eye').click();
  await expect(page.getByTestId('tip')).toHaveAttribute('data-hidden', 'false');
});

test('UI-TIP-02 a day that ends before midnight shows no past-midnight tip', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-05' }); // 09:30–21:00
  await expect(page.getByTestId('tip')).toHaveCount(0);
});

test('UI-TEAM-01 two teams on one day: one list of cards, one comment, one add button – the team split is not the volunteer\'s concern', async ({ page }) => {
  await open(page, { day: '2026-11-03' });
  await expect(page.getByTestId('entry-card')).toHaveCount(2); // 09:30–16:00 (ticket window) and 20:35–01:30 (Black Carpet window)
  await expect(page.getByTestId('comment')).toHaveCount(1);
  await expect(page.getByTestId('add-interval')).toHaveCount(1);
  // a team lead's entry wears that team's colour; the volunteer's own entries wear the feedback accent
  const lead = page.getByTestId('leaderAdded-card');
  await expect(lead).toHaveAttribute('data-team', 'carpet');
  const leadColour = await lead.evaluate((el) => getComputedStyle(el).borderTopColor);
  const mineColour = await page.getByTestId('entry-card').first().evaluate((el) => getComputedStyle(el).borderLeftColor);
  expect(leadColour).toContain('oklch');
  expect(leadColour).not.toBe(mineColour);
});

test('UI-TEAM-02 a new span may start in one team\'s window and end in the other\'s: it is clipped to the open pieces', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-03' }); // ticket 09:30–18:00, Black Carpet 20:30–02:30
  const draft = page.getByTestId('draft-card');
  await typeTime(draft.getByTestId('wheel-start'), '17:00');
  await typeTime(draft.getByTestId('wheel-end'), '18:00');
  await expect(page.getByTestId('entry-card')).toHaveCount(1);
  await page.getByTestId('add-interval').click();
  await typeTime(page.getByTestId('draft-card').getByTestId('wheel-start'), '21:00');
  await typeTime(page.getByTestId('draft-card').getByTestId('wheel-end'), '19:00'); // inside the gap → pulled to the piece's edge
  const cards = page.getByTestId('entry-card');
  await expect(cards).toHaveCount(2);
  expect(await timeOf(cards.nth(1).getByTestId('wheel-end'))).toBe('21:05');
});

test('UI-NOWIN-01 a day without any admin interval is crossed out', async ({ page }) => {
  await open(page, { day: '2026-11-07' });
  await expect(page.getByTestId('day-closed')).toBeVisible();
  await expect(page.getByTestId('add-interval')).toHaveCount(0);
});

test('UI-LANG-01 switching language is remembered', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-04' });
  await expect(page.getByTestId('feedback')).toContainText(WORDS.et.start);
  await page.getByTestId('lang-ru').click();
  await expect(page.getByTestId('feedback')).toContainText(WORDS.ru.start);
  await page.goto('/?scenario=fresh&day=2026-11-04');
  await expect(page.getByTestId('feedback')).toContainText(WORDS.ru.start);
  await page.getByTestId('lang-en').click();
  await expect(page.getByTestId('feedback')).toContainText(WORDS.en.start);
});

test('UI-ACCENT-01 the entries\' border colour follows the feedback tone: nudge while short, green once praised', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-04' });
  const draft = page.getByTestId('draft-card');
  await typeTime(draft.getByTestId('wheel-start'), '12:00');
  await typeTime(draft.getByTestId('wheel-end'), '15:00');
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-tone', 'nudge');
  const short = await page.getByTestId('entry-card').evaluate((el) => getComputedStyle(el).borderLeftColor);
  await open(page, { day: '2026-11-04' }); // demo: top of the cohort
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-tone', 'praise');
  const praised = await page.getByTestId('entry-card').first().evaluate((el) => getComputedStyle(el).borderLeftColor);
  expect(praised).not.toBe(short);
  expect(praised).toContain('oklch');
  // "pick more" is never red or orange: hue outside 0–70°
  const hue = Number(short.match(/oklch\([^)]*?\s([\d.]+)\)/)?.[1] ?? -1);
  expect(hue).not.toBeLessThan(0);
  expect(hue > 70 || hue === 0).toBe(true);
});

for (const lang of LANGS) {
  test(`UI-HYPH-01 [${lang}] long words get soft hyphens in Estonian and Russian, English is left to the browser`, async ({ page }) => {
    await open(page, { scenario: 'fresh', day: '2026-11-04', lang });
    const text = await page.locator('.m-prompt').textContent();
    expect(text!.includes(SOFT_HYPHEN)).toBe(lang !== 'en');
  });
}

test('UI-FB-01 feedback reacts live: the sentence changes as time is added', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-04' });
  const feedback = page.getByTestId('feedback');
  await expect(feedback).toHaveAttribute('data-rule', 'nothing-yet');
  const draft = page.getByTestId('draft-card');
  await typeTime(draft.getByTestId('wheel-start'), '12:00');
  await typeTime(draft.getByTestId('wheel-end'), '15:00');
  await expect(feedback).toHaveAttribute('data-rule', 'week-short');
  await expect(feedback).toContainText('3 aega');
  await expect(feedback).toContainText('21 tundi'); // 24 h weekly target − 3 h
});

test.describe('narrow phone', () => {
  test.use({ viewport: { width: 320, height: 700 } });
  for (const lang of LANGS) {
    test(`UI-FIT-02 [${lang}] feedback is never cut off on a 320 px phone`, async ({ page }) => {
      await open(page, { day: '2026-11-04', lang });
      const feedback = page.getByTestId('feedback');
      expect((48 - Number(await feedback.getAttribute('data-size'))) % 2).toBe(0);
      const box = await feedback.evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight }));
      expect(box.scroll).toBeLessThanOrEqual(box.client + 1);
    });
  }
  test('UI-FIT-03 nothing overflows sideways at 320 px', async ({ page }) => {
    await open(page, { day: '2026-11-03', lang: 'ru' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test.describe('touch', () => {
  test.use({ hasTouch: true });
  test('UI-TOUCH-01 on a touch device the time wheel opens two drums; the result stays inside the window', async ({ page }) => {
    await page.goto('/?scenario=fresh&day=2026-11-04&touch'); // Wednesday 12:00–02:00
    await page.getByTestId('confirm').waitFor();
    await page.getByTestId('draft-card').getByTestId('wheel-start').locator('input').click();
    const drum = page.getByTestId('drum');
    await expect(drum).toBeVisible();
    const hours = drum.getByTestId('drum-hours');
    await expect(hours.locator('[data-row]').first()).toHaveAttribute('data-row', '12'); // nothing before the window start
    await hours.locator('[data-row="15"]').click();
    await expect(hours).toHaveAttribute('data-value', '15');
    const minutes = drum.getByTestId('drum-minutes');
    await minutes.locator('[data-row="35"]').click();
    await expect(drum.getByTestId('drum-value')).toHaveText('15:35');
    await drum.getByTestId('drum-done').click();
    await expect(drum).toHaveCount(0);
    expect(await timeOf(page.getByTestId('draft-card').getByTestId('wheel-start'))).toBe('15:35');
  });
  test('UI-TOUCH-02 the last hour offers only the minutes up to the window end', async ({ page }) => {
    await page.goto('/?scenario=fresh&day=2026-11-05&touch'); // Thursday 09:30–21:00
    await page.getByTestId('confirm').waitFor();
    await page.getByTestId('draft-card').getByTestId('wheel-end').locator('input').click();
    const drum = page.getByTestId('drum');
    await drum.getByTestId('drum-hours').locator('[data-row="21"]').click();
    await expect(drum.getByTestId('drum-minutes').locator('[data-row]')).toHaveCount(1); // only :00
    await drum.getByTestId('drum-hours').locator('[data-row="9"]').click();
    await expect(drum.getByTestId('drum-minutes').locator('[data-row]').first()).toHaveAttribute('data-row', '35'); // an end must follow the 09:30 start by a step
  });
});

test('UI-COMMENT-01 a finished comment is marked and announced as going out with the choices', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-04' });
  await expect(page.getByTestId('comment-done')).toHaveCount(0);
  await page.getByTestId('comment').fill('Jõuan natuke hiljem');
  await page.getByTestId('comment').press('Enter');
  await expect(page.getByTestId('comment-done')).toBeVisible();
  await expect(page.getByTestId('comment')).toHaveAttribute('data-done', 'true');
  await expect(page.locator('.m-comment__done')).toContainText('koos valikutega');
  await page.getByTestId('comment').fill('Jõuan natuke hiljem, umbes 12:15');
  await expect(page.getByTestId('comment-done')).toHaveCount(0); // editing reopens it
});

test('UI-PROSE-01 multi-row text is justified with an indented first line', async ({ page }) => {
  await open(page, { scenario: 'fresh', day: '2026-11-04' });
  const style = await page.locator('.m-prompt').evaluate((el) => ({ align: getComputedStyle(el).textAlign, indent: getComputedStyle(el).textIndent }));
  expect(style.align).toBe('justify');
  expect(parseFloat(style.indent)).toBeGreaterThan(0);
});
