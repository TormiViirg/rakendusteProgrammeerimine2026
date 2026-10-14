import { expect, test } from '@playwright/test';
import { DESKTOP, LANGS, SOFT_HYPHEN, WORDS, cellAt, column, open, timeOf, typeTime } from './helpers';

test.use({ viewport: DESKTOP });

test('UI-B2B-01 two back-to-back windows covering 48 hours', async ({ page }) => {
  // Thu 08:00 → Fri 08:00 and Fri 08:00 → Sat 08:00. Boundary: windows touch, each runs a full 24 h.
  await open(page, { scenario: 'backToBack' });
  const grid = page.getByTestId('grid');
  await expect(grid).toHaveAttribute('data-main-rows', '16');
  await expect(grid).toHaveAttribute('data-night-rows', '8');
  for (const day of ['2026-11-05', '2026-11-06']) {
    await expect(column(page, day).getByTestId('cell')).toHaveCount(24);
    await expect(column(page, day).getByTestId('closed-block')).toHaveCount(0);
  }
  // A day without a window is crossed out for the whole day: one rectangle to midnight, one for the night.
  await expect(column(page, '2026-11-04').getByTestId('closed-block')).toHaveCount(2);
  await expect(column(page, '2026-11-04').getByTestId('closed-block').first()).toHaveAttribute('data-rows', '16');
  await expect(column(page, '2026-11-04').getByTestId('closed-block').last()).toHaveAttribute('data-rows', '8');
  // Thursday's 07:00–08:00 night cell is Thursday's, Friday's 08:00 cell is Friday's.
  await expect(cellAt(page, '2026-11-05', '07:00')).toHaveAttribute('data-state', 'selected');
  await expect(cellAt(page, '2026-11-06', '08:00')).toHaveAttribute('data-state', 'free');
});

test('UI-NIGHT-01 an admin interval that runs into the next day is shown under the day that reached midnight', async ({ page }) => {
  await open(page);
  await expect(page.locator('[data-testid=time-row][data-night]')).toHaveCount(3); // 00–01, 01–02, 02–02:30
  await expect(cellAt(page, '2026-11-03', '00:00')).toHaveCount(1); // Tuesday's night, under Tuesday
  await expect(cellAt(page, '2026-11-04', '00:00')).toHaveCount(1);
  // Thursday ends at 21:00: no night cells; the crossed-out area stops at midnight and starts again after the note.
  await expect(cellAt(page, '2026-11-05', '00:00')).toHaveCount(0);
  const closed = column(page, '2026-11-05').getByTestId('closed-block');
  await expect(closed).toHaveCount(2);
  await expect(closed.last()).toHaveAttribute('data-night', 'true');
  // the note sits over the run of days that cross midnight (Mon–Wed), and separately over Sunday
  const notes = page.getByTestId('midnight-note');
  await expect(notes).toHaveCount(2);
  await expect(notes.first()).toHaveAttribute('data-span', '3');
  await expect(notes.last()).toHaveAttribute('data-span', '1');
  const note = (await notes.first().boundingBox())!;
  const mon = (await column(page, '2026-11-02').boundingBox())!;
  const wed = (await column(page, '2026-11-04').boundingBox())!;
  expect(Math.abs(note.x + note.width / 2 - (mon.x + wed.x + wed.width) / 2)).toBeLessThan(4);
});

for (const lang of LANGS) {
  test(`UI-COL-01 [${lang}] the week has seven columns; narrower screens drop columns and say "range"`, async ({ page }) => {
    await open(page, { lang });
    await expect(page.getByTestId('desktop-view')).toHaveAttribute('data-page-mode', 'week');
    await expect(page.getByTestId('desktop-view')).toHaveAttribute('data-columns', '7');
    await expect(page.getByTestId('nav-next')).toContainText(WORDS[lang].nextWeek);
    await expect(page.getByTestId('day-header')).toHaveCount(7); // Monday to Sunday
    await expect(page.getByTestId('day-header').last()).toHaveAttribute('data-day', '2026-11-08');

    // the smallest text (12 u) must stay ≥ 9 px, so u ≥ 0.75 decides how many columns fit
    await page.setViewportSize({ width: 1100, height: 900 }); // five columns
    await expect(page.getByTestId('desktop-view')).toHaveAttribute('data-page-mode', 'range');
    await expect(page.getByTestId('desktop-view')).toHaveAttribute('data-columns', '5');
    await expect(page.getByTestId('nav-next')).toContainText(WORDS[lang].nextRange);

    await page.setViewportSize({ width: 950, height: 900 }); // four columns
    await expect(page.getByTestId('desktop-view')).toHaveAttribute('data-columns', '4');
    await page.setViewportSize({ width: 800, height: 900 }); // three columns
    await expect(page.getByTestId('desktop-view')).toHaveAttribute('data-columns', '3');

    await page.setViewportSize({ width: 700, height: 900 }); // below the desktop breakpoint: the phone layout
    await expect(page.getByTestId('mobile-view')).toBeVisible();
  });
}

test('UI-COL-02 columns always start at Monday: culling keeps the week, chunks are cut from Monday, headers stay over their columns', async ({ page }) => {
  await open(page, { day: '2026-11-05' }); // Thursday
  await expect(page.getByTestId('day-header').first()).toHaveAttribute('data-day', '2026-11-02');
  await page.setViewportSize({ width: 950, height: 600 }); // four columns, and a scrollbar on the grid
  await expect(page.getByTestId('desktop-view')).toHaveAttribute('data-columns', '4');
  await expect(page.getByTestId('day-header').first()).toHaveAttribute('data-day', '2026-11-02'); // Mon–Thu, not Thu–Sun
  await expect(page.getByTestId('desktop-view')).toHaveAttribute('data-monday', '2026-11-02');
  await page.getByTestId('nav-next').click();
  await expect(page.getByTestId('day-header').first()).toHaveAttribute('data-day', '2026-11-06'); // Fri–Sun
  await expect(page.getByTestId('day-header')).toHaveCount(3);
  await page.getByTestId('nav-next').click();
  await expect(page.getByTestId('day-header').first()).toHaveAttribute('data-day', '2026-11-09'); // next Monday
  // header, grid and the pinned comment bar share one column grid – even with the scrollbar showing
  const header = (await page.locator('[data-testid=day-header][data-day="2026-11-10"]').boundingBox())!;
  const col = (await column(page, '2026-11-10').boundingBox())!;
  expect(Math.abs(header.x - col.x)).toBeLessThan(1);
  expect(Math.abs(header.width - col.width)).toBeLessThan(1);
  const comment = (await page.locator('[data-testid=comment][data-day="2026-11-10"]').boundingBox())!;
  expect(Math.abs(comment.x - col.x)).toBeLessThan(1);
  expect(Math.abs(comment.width - col.width)).toBeLessThan(1);
});

test('UI-GAP-01 a sub-hour gap between two teams is a visible closed band in one cell; a click picks both open parts, never the gap', async ({ page }) => {
  await open(page, { scenario: 'gen-day-gap-open-empty' }); // ticket 10:00–18:00, Black Carpet 18:15–22:00
  const cell = cellAt(page, '2026-11-05', '18:00');
  await expect(cell).toHaveAttribute('data-gaps', '1');
  await expect(cell.getByTestId('cell-gap')).toHaveCount(1);
  const band = (await cell.getByTestId('cell-gap').boundingBox())!;
  const box = (await cell.boundingBox())!;
  expect(band.height / box.height).toBeCloseTo(0.25, 1);
  expect(Math.abs(band.y - box.y)).toBeLessThan(2); // 18:00–18:15 sits at the top of the row
  await expect(column(page, '2026-11-05').getByTestId('closed-block')).toHaveCount(0);
  await column(page, '2026-11-05').getByTestId('prompt-step-away').click(); // the prompt floats over the middle rows
  await cell.click({ position: { x: 6, y: box.height - 4 } });
  await expect(cell).toHaveAttribute('data-state', 'selected');
  // the run's end is 19:00 (through the gap into the second piece) – wheels bound by the pieces
  await expect(cell.getByTestId('edge-start')).toHaveCount(1);
  expect(await timeOf(cell.getByTestId('edge-start'))).toBe('18:15'); // the selection starts after the gap
});

test('UI-VEIL-01 touching a veiled cell lifts the veil and picks it – no button needed; the veil keeps a crisp outline', async ({ page }) => {
  await open(page, { scenario: 'fresh' });
  const thursday = column(page, '2026-11-05');
  await expect(thursday).toHaveAttribute('data-veiled', 'true');
  const veil = thursday.getByTestId('veil').first();
  expect(await veil.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('1px');
  await cellAt(page, '2026-11-05', '11:00').click({ position: { x: 6, y: 6 } });
  await expect(thursday).not.toHaveAttribute('data-veiled', 'true');
  await expect(cellAt(page, '2026-11-05', '11:00')).toHaveAttribute('data-state', 'selected');
});

test('UI-PROMPT-03 the first-view prompt sits in the middle of the visible part of its column and follows the scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 620 });
  await open(page, { scenario: 'fresh' });
  const scroll = page.getByTestId('grid-scroll');
  const prompt = column(page, '2026-11-05').getByTestId('prompt');
  const veil = column(page, '2026-11-05').getByTestId('veil').first();
  const centreOfVisible = async () => {
    const s = (await scroll.boundingBox())!;
    const v = (await veil.boundingBox())!;
    const header = (await page.locator('.d-top').boundingBox())!;
    return (Math.max(v.y, s.y + header.height) + Math.min(v.y + v.height, s.y + s.height)) / 2;
  };
  const before = (await prompt.boundingBox())!;
  expect(Math.abs(before.y + before.height / 2 - (await centreOfVisible()))).toBeLessThan(3);
  await scroll.evaluate((el) => el.scrollTo(0, 220));
  await page.waitForTimeout(120);
  const after = (await prompt.boundingBox())!;
  expect(Math.abs(after.y + after.height / 2 - (await centreOfVisible()))).toBeLessThan(3);
  expect(after.y).not.toBeCloseTo(before.y - 220, 0); // it did not simply scroll away
});

test('UI-CAL-02 the mini calendar shows the period\'s year and gives every row the same height', async ({ page }) => {
  await open(page);
  await expect(page.getByTestId('cal-year')).toHaveText('2026');
  const rows = page.locator('.cal__year, .cal__months, .cal__head, .cal__week');
  const heights = await rows.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  expect(heights.length).toBe(8); // year, months, header, 5 weeks
  const bottom = (await page.getByTestId('mini-calendar').boundingBox())!;
  const lastWeek = (await page.locator('.cal__week').last().boundingBox())!;
  expect(lastWeek.y + lastWeek.height).toBeLessThanOrEqual(bottom.y + bottom.height + 1); // nothing cut off
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(2.5);
});

test('UI-FLOOR-01 the entry row shrinks with the column but never below three quarters of its size', async ({ page }) => {
  await open(page, { scenario: 'fresh' });
  const sizeAt = async () => parseFloat(await column(page, '2026-11-05').getByTestId('prompt-entry').evaluate((el) => getComputedStyle(el).fontSize));
  const u = async () => parseFloat(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--u')));
  for (const width of [1440, 1100, 800]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, { scenario: 'fresh', day: '2026-11-05' });
    const ratio = (await sizeAt()) / (14 * (await u()));
    expect(ratio).toBeGreaterThanOrEqual(0.75 - 0.01);
    expect(ratio).toBeLessThanOrEqual(1.01);
  }
});

test('UI-COMMENT-02 a finished desktop comment shows a tick', async ({ page }) => {
  await open(page, { scenario: 'fresh' });
  const field = page.locator('[data-testid=comment][data-day="2026-11-05"]');
  await field.fill('Tulen bussiga');
  await field.press('Enter');
  await expect(page.getByTestId('comment-done')).toHaveCount(1);
});

test('UI-GRID-01 the time column is exactly as wide as a day column, and the margin is always 32 units of the current scale', async ({ page }) => {
  await open(page);
  const unit = async () => parseFloat(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--u')));
  for (const width of [1440, 1100, 950]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(80);
    const time = (await page.getByTestId('time-row').first().boundingBox())!;
    const day = (await page.getByTestId('day-column').first().boundingBox())!;
    expect(Math.abs(time.width - day.width)).toBeLessThan(1.5);
    expect(Math.abs(time.height - (await page.getByTestId('cell').first().boundingBox())!.height)).toBeLessThan(1.5);
    expect(time.x / (await unit())).toBeCloseTo(32, 0); // the 32-unit margin, in whatever the unit is now
    expect((day.x - time.x - time.width) / (await unit())).toBeCloseTo(20, 0); // and the 20-unit gutter
  }
});

test('UI-NAV-01 any week of the period can be reached and Sunday is never a column', async ({ page }) => {
  await open(page);
  let guard = 0;
  while (await page.getByTestId('nav-next').isEnabled()) {
    await page.getByTestId('nav-next').click();
    expect(++guard).toBeLessThan(10);
  }
  await expect(page.getByTestId('day-header').last()).toHaveAttribute('data-day', '2026-11-29');
  while (await page.getByTestId('nav-prev').isEnabled()) await page.getByTestId('nav-prev').click();
  await expect(page.getByTestId('day-header').first()).toHaveAttribute('data-day', '2026-10-26');
  await page.locator('[data-testid=cal-day][data-day="2026-11-15"]').click(); // a Sunday
  await expect(page.getByTestId('day-header').first()).toHaveAttribute('data-day', '2026-11-09');
  await expect(page.getByTestId('day-header').last()).toHaveAttribute('data-day', '2026-11-15');
});

test('UI-PROMPT-01 first view: one span through "Mulle sobib", rounded and clamped', async ({ page }) => {
  await open(page, { scenario: 'fresh' });
  const prompt = column(page, '2026-11-05').getByTestId('prompt'); // Thursday 09:30–21:00
  await typeTime(prompt.getByTestId('prompt-start'), '08:00'); // below the range → 09:30
  expect(await timeOf(prompt.getByTestId('prompt-start'))).toBe('09:30');
  await typeTime(prompt.getByTestId('prompt-end'), '13:02'); // → 13:00
  expect(await timeOf(prompt.getByTestId('prompt-end'))).toBe('13:00');
  await prompt.getByTestId('prompt-done').click();
  await expect(prompt).toHaveCount(0);
  await expect(column(page, '2026-11-05').locator('[data-state=selected]')).toHaveCount(4); // 09:30, 10, 11, 12
  await expect(page.getByTestId('feedback')).not.toHaveAttribute('data-rule', 'nothing-yet');
});

test('UI-CELL-01 click selects, click again clears, dragging selects several', async ({ page }) => {
  await open(page, { scenario: 'fresh' });
  const thursday = column(page, '2026-11-05');
  await thursday.getByTestId('prompt-step-away').click();
  const ten = cellAt(page, '2026-11-05', '10:00');
  await ten.click();
  await expect(ten).toHaveAttribute('data-state', 'selected');
  await ten.click({ position: { x: 6, y: 6 } }); // beside the start/end wheels the cell now carries
  await expect(ten).toHaveAttribute('data-state', 'free');

  const from = await cellAt(page, '2026-11-05', '12:00').boundingBox();
  const to = await cellAt(page, '2026-11-05', '14:00').boundingBox();
  await page.mouse.move(from!.x + 20, from!.y + 10);
  await page.mouse.down();
  await page.mouse.move(to!.x + 20, to!.y + 10, { steps: 6 });
  await page.mouse.up();
  await expect(thursday.locator('[data-state=selected]')).toHaveCount(3);
});

test('UI-EDGE-01 the first and last cell of a chosen run carry its exact start and end, rounded and kept in range', async ({ page }) => {
  await open(page, { scenario: 'fresh' });
  await column(page, '2026-11-05').getByTestId('prompt-step-away').click();
  const from = await cellAt(page, '2026-11-05', '10:00').boundingBox();
  const to = await cellAt(page, '2026-11-05', '12:00').boundingBox();
  await page.mouse.move(from!.x + 20, from!.y + 10);
  await page.mouse.down();
  await page.mouse.move(to!.x + 20, to!.y + 10, { steps: 5 });
  await page.mouse.up();
  const thursday = column(page, '2026-11-05');
  await expect(thursday.getByTestId('edge-start')).toHaveCount(1);
  await expect(thursday.getByTestId('edge-end')).toHaveCount(1);
  expect(await timeOf(thursday.getByTestId('edge-start'))).toBe('10:00');
  expect(await timeOf(thursday.getByTestId('edge-end'))).toBe('13:00');
  await expect(cellAt(page, '2026-11-05', '11:00').locator('.d-edge')).toHaveCount(0); // a middle cell shows only the tick
  await typeTime(thursday.getByTestId('edge-start'), '10:07'); // arriving late → 10:05
  expect(await timeOf(thursday.getByTestId('edge-start'))).toBe('10:05');
  await typeTime(thursday.getByTestId('edge-end'), '22:30'); // window ends 21:00
  expect(await timeOf(thursday.getByTestId('edge-end'))).toBe('21:00');
});

test('UI-EDGE-02 a single chosen cell carries both ends', async ({ page }) => {
  await open(page, { scenario: 'fresh' });
  await column(page, '2026-11-05').getByTestId('prompt-step-away').click();
  await cellAt(page, '2026-11-05', '10:00').click();
  const cell = cellAt(page, '2026-11-05', '10:00');
  await expect(cell.getByTestId('edge-start')).toHaveCount(1);
  await expect(cell.getByTestId('edge-end')).toHaveCount(1);
});

test('UI-LOCK-03 locked day: confirmed cells stay, free cells can be added; the header lock marks today and before, not the grace period', async ({ page }) => {
  await open(page);
  await expect(page.locator('[data-testid=day-header][data-day="2026-11-04"]').getByTestId('day-lock')).toHaveCount(0);
  await expect(page.locator('[data-testid=day-header][data-day="2026-11-03"]').getByTestId('day-lock')).toBeVisible(); // today
  await expect(page.locator('[data-testid=day-header][data-day="2026-11-02"]').getByTestId('day-lock')).toBeVisible(); // past
  await expect(page.locator('[data-testid=day-header][data-day="2026-11-05"]').getByTestId('day-lock')).toHaveCount(0);
  const locked = cellAt(page, '2026-11-04', '15:00');
  await expect(locked).toHaveAttribute('data-state', 'selectedLocked');
  await locked.click();
  await expect(locked).toHaveAttribute('data-state', 'selectedLocked');
  const free = cellAt(page, '2026-11-04', '12:00');
  await free.click();
  await expect(free).toHaveAttribute('data-state', 'selected'); // added after the lock, still removable
  await free.click({ position: { x: 6, y: 6 } });
  await expect(free).toHaveAttribute('data-state', 'free');
});

test('UI-PAST-02 past day: cells do not respond', async ({ page }) => {
  await open(page);
  const header = page.locator('[data-testid=day-header][data-day="2026-11-02"]');
  await expect(header).toHaveAttribute('data-past', 'true');
  const free = cellAt(page, '2026-11-02', '13:00');
  await free.click({ force: true });
  await expect(free).toHaveAttribute('data-state', 'free');
});

test('UI-LEAD-01 team-lead changes are shown and cannot be toggled', async ({ page }) => {
  await open(page, { now: '2026-10-30T08:00:00Z', day: '2026-11-02' }); // before Monday's grace point
  const added = cellAt(page, '2026-11-02', '21:00');
  await expect(added).toHaveAttribute('data-state', 'leaderAdded');
  await added.click({ force: true });
  await expect(added).toHaveAttribute('data-state', 'leaderAdded');
  await expect(cellAt(page, '2026-11-02', '01:00')).toHaveAttribute('data-state', 'leaderRemoved');
});

test('UI-NEW-01 hours the admin added since the last visit are flagged until chosen', async ({ page }) => {
  await open(page);
  const fresh = cellAt(page, '2026-11-05', '19:00');
  await expect(fresh).toHaveAttribute('data-state', 'new');
  await fresh.click();
  await expect(fresh).toHaveAttribute('data-state', 'selected');
});

test('UI-TEAM-02 overlapping windows of two teams are one open area in one column, with one comment field', async ({ page }) => {
  await open(page, { scenario: 'overlap' }); // ticket 09:00–17:00 + Black Carpet 15:00–01:00
  const thursday = column(page, '2026-11-05');
  await expect(thursday.getByTestId('cell')).toHaveCount(16); // 09:00 … 01:00 without a gap
  await expect(thursday.getByTestId('closed-block')).toHaveCount(0);
  await expect(page.locator('[data-testid=comment][data-day="2026-11-05"]')).toHaveCount(1);
  // the team lead's hour wears the Black Carpet colour
  await expect(cellAt(page, '2026-11-05', '16:00')).toHaveAttribute('data-team', 'carpet');
});

test('UI-TEAM-03 windows of two teams that do not touch share the column with a crossed-out gap between them', async ({ page }) => {
  await open(page);
  const tuesday = column(page, '2026-11-03');
  await expect(tuesday.getByTestId('closed-block')).toHaveCount(1); // 18:00–20:00 between them
  await expect(tuesday.getByTestId('closed-block')).toHaveAttribute('data-rows', '2');
});

test('UI-PIN-01 comment bar, instructions and confirm stay pinned while the grid scrolls; the page itself never scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await open(page, { scenario: 'fresh' });
  const footer = page.getByTestId('confirm');
  const before = (await footer.boundingBox())!;
  const header = (await page.locator('[data-testid=day-header]').first().boundingBox())!;
  await page.getByTestId('grid-scroll').evaluate((el) => el.scrollTo(0, 300));
  await page.waitForTimeout(100);
  const after = (await footer.boundingBox())!;
  expect(after.y).toBeCloseTo(before.y, 0);
  const headerAfter = (await page.locator('[data-testid=day-header]').first().boundingBox())!;
  expect(headerAfter.y).toBeCloseTo(header.y, 0); // the day headers stick too
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
});

test('UI-PROMPT-02 "Mulle sobib" and both wheels stay on one line however narrow the column', async ({ page }) => {
  for (const width of [1440, 1100, 800]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, { scenario: 'fresh', day: '2026-11-05' });
    const entry = column(page, '2026-11-05').getByTestId('prompt-entry');
    const box = (await entry.boundingBox())!;
    const label = (await entry.locator('span').first().boundingBox())!;
    const wheel = (await entry.getByTestId('prompt-end').boundingBox())!;
    expect(Math.abs(label.y + label.height / 2 - (wheel.y + wheel.height / 2))).toBeLessThan(wheel.height); // same line
    expect(wheel.x + wheel.width).toBeLessThanOrEqual(box.x + box.width + 1);
  }
});

test('UI-CAL-01 the mini calendar greys out days of other months and lists the period\'s months', async ({ page }) => {
  await open(page);
  await expect(page.getByTestId('cal-month')).toHaveCount(2);
  await expect(page.getByTestId('cal-month').nth(1)).toHaveClass(/is-on/);
  await expect(page.locator('[data-testid=cal-day][data-day="2026-10-30"]')).toHaveClass(/is-other/);
  await expect(page.locator('[data-testid=cal-day][data-day="2026-11-10"]')).not.toHaveClass(/is-other/);
  await expect(page.getByTestId('mini-calendar')).toHaveAttribute('data-month-rows', '1');
});

for (const lang of LANGS) {
  test(`UI-HYPH-02 [${lang}] desktop texts carry soft hyphens in Estonian and Russian only`, async ({ page }) => {
    await open(page, { scenario: 'fresh', lang });
    const text = await column(page, '2026-11-05').getByTestId('prompt').locator('p').textContent();
    expect(text!.includes(SOFT_HYPHEN)).toBe(lang !== 'en');
  });
}

test('UI-MATRIX-01 the generated combinations are listed and each link opens the matching case', async ({ page }) => {
  await page.goto('/?matrix');
  await expect(page.getByTestId('matrix-link')).toHaveCount(192);
  await page.locator('[data-testid=matrix-link]', { hasText: 'gen-night-apart-locked-leader' }).click();
  await page.getByTestId('confirm').waitFor();
  await expect(cellAt(page, '2026-11-05', '18:00')).toHaveAttribute('data-state', 'leaderAdded'); // locked: the lead's hour is frozen
  await expect(column(page, '2026-11-05').getByTestId('closed-block')).toHaveCount(1); // apart: a gap, one column
  await expect(column(page, '2026-11-05').locator('[data-state=leaderAdded]')).toHaveCount(1); // leader
  await expect(page.locator('[data-testid=time-row][data-night]')).toHaveCount(2); // night: 00–01, 01–02
});

for (const lang of LANGS) {
  test(`UI-SAVE-01 [${lang}] confirming is acknowledged`, async ({ page }) => {
    await open(page, { lang });
    await cellAt(page, '2026-11-05', '16:00').click();
    await page.getByTestId('confirm').click();
    await expect(page.getByTestId('notice')).toHaveText(WORDS[lang].saved);
  });
}

test('UI-SAVE-02 after confirming on a locked day the new shift is frozen too', async ({ page }) => {
  await open(page);
  const cell = cellAt(page, '2026-11-04', '12:00');
  await cell.click();
  await page.getByTestId('confirm').click();
  await expect(cell).toHaveAttribute('data-state', 'selectedLocked');
});

test('UI-A11Y-01 cells can be toggled from the keyboard', async ({ page }) => {
  await open(page, { scenario: 'fresh' });
  await column(page, '2026-11-05').getByTestId('prompt-step-away').click();
  const cell = cellAt(page, '2026-11-05', '11:00');
  await cell.focus();
  await page.keyboard.press('Enter');
  await expect(cell).toHaveAttribute('data-state', 'selected');
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
});

const readFeedback = async (page: import('@playwright/test').Page) => {
  const feedback = page.getByTestId('feedback');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  return {
    size: Number(await feedback.getAttribute('data-size')),
    rows: Number(await feedback.getAttribute('data-max-rows')),
    box: await feedback.evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight })),
  };
};

for (const lang of LANGS) {
  for (const width of [1440, 1040, 800]) {
    test(`UI-FIT-01 [${lang}, ${width}px] feedback sits on a 2-point rung and is never cut off`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, { lang, day: '2026-11-04' });
      const fb = await readFeedback(page);
      expect(fb.size).toBeLessThanOrEqual(64);
      expect(fb.size).toBeGreaterThanOrEqual(48);
      expect((64 - fb.size) % 2).toBe(0);
      expect(fb.box.scroll).toBeLessThanOrEqual(fb.box.client + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
}

test('UI-FIT-04 short Estonian text on a wide screen keeps the base size on two rows', async ({ page }) => {
  await open(page, { lang: 'et', day: '2026-11-04' });
  expect(await readFeedback(page)).toMatchObject({ size: 64, rows: 2 });
});

test('UI-FIT-05 long Russian text in a narrower nav steps down the ladder: smaller type, never fewer rows', async ({ page }) => {
  await open(page, { lang: 'ru', day: '2026-11-04' });
  const wide = await readFeedback(page);
  await page.setViewportSize({ width: 800, height: 900 }); // three columns
  await expect(page.getByTestId('desktop-view')).toHaveAttribute('data-columns', '3');
  const narrow = await readFeedback(page);
  expect(narrow.size).toBeLessThan(64);
  expect(narrow.size).toBeLessThanOrEqual(wide.size);
  expect(narrow.rows).toBeGreaterThanOrEqual(wide.rows);
});
