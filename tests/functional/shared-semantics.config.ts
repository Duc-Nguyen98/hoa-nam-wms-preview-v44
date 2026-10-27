import {defineConfig} from '@playwright/test';
import path from 'node:path';
const evidence = path.resolve(process.env.QA_EVIDENCE_DIR ?? 'output/shared-semantics');
export default defineConfig({
  testDir: './wave-ad', testMatch: 'shared-semantics.spec.ts', workers: 1,
  timeout: 120000, expect: {timeout: 5000},
  use: {baseURL: 'http://127.0.0.1:5262', headless: true, locale: 'vi-VN', timezoneId: 'Asia/Bangkok', trace: 'retain-on-failure', screenshot: 'only-on-failure'},
  reporter: [['list'], ['json', {outputFile: path.join(evidence, 'browser-results.json')}]],
  outputDir: path.join(evidence, 'test-results'),
  webServer: {command: 'npm run dev -- --host 127.0.0.1 --port 5262 --strictPort', url: 'http://127.0.0.1:5262', cwd: process.cwd(), reuseExistingServer: !process.env.CI},
});
