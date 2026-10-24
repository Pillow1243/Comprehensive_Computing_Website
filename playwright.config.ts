import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173/Comprehensive_Computing_Website/';

/**
 * Android-first device matrix (requirement section 7).
 * Each project emulates a real viewport, DPR, touch support and user agent.
 */
const androidDevices = [
  { name: 'pixel-7', device: 'Pixel 7' },
  { name: 'pixel-7-pro', device: 'Pixel 7 Pro' },
  { name: 'galaxy-s24', device: 'Galaxy S24' }, // Playwright ships S24; S23 metrics are identical for layout tests
  { name: 'galaxy-a55', device: 'Galaxy A55' }, // mid-range reference device
  { name: 'pixel-8a', device: 'Pixel 8a' }, // Xiaomi/OnePlus class density
  { name: 'pixel-9-pro', device: 'Pixel 9 Pro' },
  { name: 'galaxy-tab-s9', device: 'Galaxy Tab S9' },
];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }], ['json', { outputFile: 'e2e-results.json' }]]
    : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fa-IR',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
      testIgnore: /android|device/,
    },
    ...androidDevices.map(({ name, device }) => ({
      name: `android-${name}`,
      use: { ...devices[device] },
      testMatch: /android\.spec\.ts/,
    })),
  ],
  webServer: {
    command: 'node scripts/serve-static.mjs',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
