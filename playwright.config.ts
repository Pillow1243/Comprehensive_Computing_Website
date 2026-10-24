import {defineConfig,devices} from '@playwright/test';

const baseURL='http://127.0.0.1:4173/Comprehensive_Computing_Website/';

export default defineConfig({
  testDir:'./e2e',
  fullyParallel:true,
  forbidOnly:!!process.env.CI,
  retries:process.env.CI?1:0,
  workers:process.env.CI?2:undefined,
  reporter:process.env.CI?[['list'],['html',{outputFolder:'playwright-report',open:'never'}]]:'list',
  use:{baseURL,trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
  webServer:{
    command:'node scripts/serve-static.mjs',
    url:baseURL,
    reuseExistingServer:!process.env.CI,
    timeout:30_000,
  },
});
