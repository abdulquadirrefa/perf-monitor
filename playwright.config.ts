import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 1,
  workers: 1,
  use: {
    headless: true,
    ignoreHTTPSErrors: true,
  },
  reporter: [['list']],
});
