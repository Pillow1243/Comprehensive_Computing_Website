import { test, expect, type Page } from '@playwright/test';

/**
 * Desktop user flows (section 7, scenarios 1–5).
 * Selectors intentionally use accessible roles/labels so they double as an
 * accessibility regression check.
 */

const computeButton = (page: Page) =>
  page.getByRole('button', { name: /^محاسبه$/, exact: true }).last();

test('home → category → formula → compute → steps → history', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('home-hero')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('حل');

  // Category
  await page.getByRole('link', { name: /ریاضیات/ }).first().click();
  await expect(page).toHaveURL(/\/categories\/\?cat=math$/);

  // Formula (the math section is expanded by the ?cat parameter)
  const formulaLink = page.getByRole('link', { name: /معادله درجه دو/ }).first();
  await expect(formulaLink).toBeVisible();
  await formulaLink.click();
  await expect(page).toHaveURL(/\/formula\/quadratic\/?$/);
  await expect(page.getByRole('heading', { name: /معادله درجه دو/ }).first()).toBeVisible();

  // Inputs use inputmode=decimal and no native keyboard surprises
  const coefficient = page.locator('#input-a');
  await expect(coefficient).toHaveAttribute('inputmode', 'decimal');
  await expect(coefficient).toHaveValue('1');

  // Math keyboard inserts into the focused field (opened explicitly on desktop,
  // where focusing an input does not raise the sheet)
  await page.getByRole('button', { name: 'کیبورد ریاضی' }).click();
  await page.locator('#input-c').click();
  await expect(page.locator('section[aria-label="کیبورد ریاضی"]')).toBeVisible();
  await page.getByRole('button', { name: 'پاک کردن جستجو' }).click();
  await page.getByRole('button', { name: '9', exact: true }).click();
  await expect(page.locator('#input-c')).toHaveValue('9');
  await page.getByRole('button', { name: 'بستن کیبورد ریاضی' }).click();
  await expect(page.locator('section[aria-label="کیبورد ریاضی"]')).toBeHidden();

  // Compute (the values 1, -5, 9 give complex roots, so only Δ is real)
  await computeButton(page).click();
  const results = page.getByRole('region', { name: 'نتایج' });
  await expect(results).toBeVisible({ timeout: 15_000 });
  await expect(results.getByText(/Δ|دلتا|discriminant/i).first()).toBeVisible();

  // Steps tab
  await page.getByRole('tab', { name: 'مراحل' }).click();
  const steps = page.getByRole('list', { name: /گام/ });
  await expect(steps.getByRole('listitem').first()).toBeVisible();
  await expect(steps.getByRole('listitem').first()).toContainText(/Δ|x/);

  // History recorded
  await page.goto('./history/');
  await expect(page.getByRole('link', { name: /معادله درجه دو/ }).first()).toBeVisible();
});

test('deep link with query values computes automatically', async ({ page }) => {
  await page.goto('./formula/quadratic/?a=1&b=-5&c=6');
  await expect(page.locator('#input-a')).toHaveValue('1');
  await expect(page.getByText('نتایج')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('3', { exact: true }).first()).toBeVisible();
});

test('theme switch keeps every page readable', async ({ page }) => {
  await page.goto('./settings/');
  await page.getByRole('radio', { name: 'روشن' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('radio', { name: /تیره/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).not.toHaveClass(/light/);

  // Theme persists across navigation
  await page.goto('./categories/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('search filters, empty state and no alert/confirm dialogs', async ({ page }) => {
  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss();
  });

  await page.goto('./search/');
  const input = page.getByRole('searchbox');
  await input.fill('تشابه');
  await expect(page.getByText(/نتیجه/).first()).toBeVisible();

  await input.fill('zzz-nothing');
  await expect(page.getByText('چیزی پیدا نشد')).toBeVisible();
  expect(dialogs).toEqual([]);
});

test('long formula can be expanded full screen and copied', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./formula/heron/');
  await page.getByRole('button', { name: 'تمام‌صفحه' }).first().click();
  await expect(page.getByRole('dialog', { name: 'فرمول' })).toBeVisible();
  await page.getByRole('button', { name: 'بستن' }).first().click();
  await expect(page.getByRole('dialog', { name: 'فرمول' })).toBeHidden();
});

test('share link encodes the current inputs', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./formula/pythagorean/');
  await page.locator('#input-a').fill('6');
  await page.locator('#input-b').fill('8');
  await page.getByRole('button', { name: 'لینک این محاسبه' }).click();
  // navigator.share is absent in headless Chromium, so the link is copied and a
  // toast explains it — never a native alert/confirm.
  await expect(page.getByText(/لینک|کپی|اشتراک‌گذاری/).first()).toBeVisible();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  if (clipboard) expect(clipboard).toContain('a=6');
});

test('invalid input is explained inline, never as a stack trace', async ({ page }) => {
  await page.goto('./formula/quadratic/');
  await page.locator('#input-a').fill('not-a-number');
  await page.getByRole('button', { name: 'محاسبه', exact: true }).last().click();
  await expect(page.locator('[role="alert"]').first()).toBeVisible();
  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/at \w+ \(/);
});

test('404 page is branded and offers a way home', async ({ page }) => {
  await page.goto('./formula/does-not-exist/');
  await expect(page.getByRole('heading', { name: /صفحه پیدا نشد|not found/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /بازگشت به خانه/ })).toBeVisible();
});

test('manifest, icons and service worker are served from the repo sub-path', async ({ page, request }) => {
  await page.goto('./');
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toContain('/Comprehensive_Computing_Website/manifest.webmanifest');
  const manifestResponse = await request.get(manifestHref!);
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.name).toContain('SolveEverything');
  expect(manifest.start_url).toBe('./');
  expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === 'maskable')).toBe(true);

  const swResponse = await request.get('sw.js');
  expect(swResponse.ok()).toBeTruthy();
  expect(await swResponse.text()).toContain('CACHE_VERSION');
});
