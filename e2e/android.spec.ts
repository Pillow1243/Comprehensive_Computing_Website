import { test, expect, type Page } from '@playwright/test';

/**
 * Android-specific behaviour (section 7 "تست‌های خاص اندروید").
 * Runs on every emulated device listed in playwright.config.ts.
 */

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
};

test('home is thumb-friendly and does not overflow', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('home-hero')).toBeVisible();
  await expectNoHorizontalOverflow(page);

  // Bottom navigation has five tabs, each at least 44 px tall.
  const nav = page.locator('nav.bottom-nav');
  await expect(nav.getByRole('link')).toHaveCount(5);
  const boxes = await nav.getByRole('link').evaluateAll((links) =>
    links.map((link) => link.getBoundingClientRect().height),
  );
  for (const height of boxes) expect(height).toBeGreaterThanOrEqual(44);
});

test('bottom nav navigates and keeps its active state', async ({ page }) => {
  await page.goto('./');
  await page.locator('nav.bottom-nav').getByRole('link', { name: 'تاریخچه' }).click();
  await expect(page).toHaveURL(/\/history\/?$/);
  await expect(page.locator('nav.bottom-nav').getByRole('link', { name: 'تاریخچه' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('math keyboard stays above the safe area and inserts symbols', async ({ page }) => {
  await page.goto('./formula/pythagorean/');
  await page.getByRole('button', { name: 'کیبورد ریاضی' }).click();
  const keyboard = page.locator('section[aria-label="کیبورد ریاضی"]');
  await expect(keyboard).toBeVisible();

  await page.locator('#input-a').click();
  await page.getByRole('button', { name: 'پاک کردن جستجو' }).click();
  await page.getByRole('tab', { name: 'ƒ(x)' }).click();
  await page.getByRole('button', { name: 'ریشه دوم' }).click();
  await expect(page.locator('#input-a')).toHaveValue(/sqrt\(/);

  // The keyboard must not be pushed under the gesture bar.
  const box = await keyboard.boundingBox();
  const viewport = page.viewportSize();
  expect(box && viewport && box.y + box.height <= viewport.height + 1).toBeTruthy();
});

test('numeric inputs suppress the system keyboard on touch devices', async ({ page }) => {
  await page.goto('./formula/quadratic/');
  const input = page.locator('#input-a');
  const mode = await input.evaluate((element) => element.getAttribute('inputmode'));
  expect(['none', 'decimal']).toContain(mode);
});

test('orientation change does not break the layout', async ({ page }) => {
  await page.goto('./formula/heron/');
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: size.height, height: size.width });
  await expect(page.getByTestId('formula-page')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.setViewportSize(size);
  await expect(page.getByTestId('formula-page')).toBeVisible();
});

test('plot supports zoom, reset and drag interactions', async ({ page }) => {
  await page.goto('./formula/heron/');
  await page.getByRole('tab', { name: 'رسم' }).click();
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  await page.getByRole('button', { name: 'بزرگ‌نمایی' }).click();
  await page.getByRole('button', { name: 'بازنشانی' }).click();

  // Drag a triangle vertex with a touch-like pointer gesture.
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.4, { steps: 8 });
  await page.mouse.up();
  await expect(canvas).toBeVisible();
});

test('swipe to delete removes a history entry after confirmation', async ({ page }) => {
  // Deep link → the solver computes without opening the on-screen keyboard.
  await page.goto('./formula/pythagorean/?a=3&b=4');
  await expect(page.getByRole('region', { name: 'نتایج' })).toBeVisible({ timeout: 15_000 });

  await page.goto('./history/');
  const row = page.locator('li').first();
  await expect(row).toBeVisible();

  // Drive the swipe through the same pointer events a finger produces. Mouse
  // synthesis is unreliable here because the row translates under the cursor.
  const box = (await row.boundingBox())!;
  const startX = box.x + box.width - 30;
  const y = box.y + box.height / 2;
  await row.dispatchEvent('pointerdown', { clientX: startX, clientY: y, pointerType: 'touch', isPrimary: true });
  await row.dispatchEvent('pointermove', { clientX: startX - 60, clientY: y, pointerType: 'touch' });
  await row.dispatchEvent('pointermove', { clientX: startX - 120, clientY: y, pointerType: 'touch' });
  await row.dispatchEvent('pointerup', { clientX: startX - 120, clientY: y, pointerType: 'touch' });

  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'حذف' }).click();
  await expect(page.getByText('هنوز محاسبه‌ای ذخیره نکرده‌اید')).toBeVisible();
});

test('Android back button returns to the previous screen', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: /معادله درجه دو/ }).first().click();
  await expect(page).toHaveURL(/\/formula\/quadratic\/?$/);
  await page.goBack();
  await expect(page).toHaveURL(/Comprehensive_Computing_Website\/?$/);
});

test('offline banner appears when the network drops', async ({ page, context }) => {
  await page.goto('./');
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByRole('status').filter({ hasText: 'آفلاین' })).toBeVisible();
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByRole('status').filter({ hasText: 'آفلاین' })).toBeHidden();
});

test('safe-area insets are wired through the viewport and CSS', async ({ page }) => {
  await page.goto('./formula/quadratic/');
  const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewportMeta).toContain('viewport-fit=cover');
  const safeTop = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--safe-top'),
  );
  expect(safeTop.trim().length).toBeGreaterThan(0);
  const headerPadding = await page
    .locator('header')
    .first()
    .evaluate((element) => getComputedStyle(element).paddingTop);
  expect(headerPadding).toBeTruthy();
});
