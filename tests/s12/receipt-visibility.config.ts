import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'receipt-visibility.spec.ts',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5289', headless: true, locale: 'vi-VN' },
  outputDir: '../../output/s12-receipt-visibility',
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5289 --strictPort',
    url: 'http://127.0.0.1:5289',
    cwd: process.cwd(),
    reuseExistingServer: !process.env.CI,
  },
});
