import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// Diagnostic only: a new browser context per attempt; never clear user storage.
const base = process.env.DEMO_BASE ?? 'https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/';
const out = process.env.DEMO_OUT ?? 'output/wave-a-setup-before';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'vi-VN', timezoneId: 'Asia/Bangkok' });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const row = { attempt, startedAt: new Date().toISOString(), base, errors: [], samples: [] };
    const started = Date.now();
    page.on('pageerror', e => row.errors.push({ kind: 'pageerror', message: e.message }));
    page.on('console', m => { if (m.type() === 'error') row.errors.push({ kind: 'console', message: m.text() }); });
    try {
      await page.goto(new URL('#/preview/S07', base).href, { waitUntil: 'domcontentloaded' });
      await page.locator('#s07-username').fill('demo');
      await page.locator('#s07-password').fill('HoaNamDemo@2026');
      await page.locator('.s07-submit').click();
      await page.locator('.s08-confirm').click();
      await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
      row.clickedAtMs = Date.now() - started;
      await page.locator('.ov-result-count').waitFor({ timeout: 180000 });
      row.setupMs = Date.now() - started - row.clickedAtMs;
      row.result = 'PASS';
      await page.reload();
      await page.locator('.ov-result-count').waitFor({ timeout: 30000 });
      row.reload = 'PASS';
    } catch (error) {
      row.result = 'FAIL'; row.failure = String(error);
    } finally {
      row.elapsedMs = Date.now() - started;
      row.state = await page.evaluate(async () => ({ url: location.href, body: document.body.innerText.slice(0, 1600), locks: await navigator.locks?.query() })).catch(e => ({ failure: String(e) }));
      await page.screenshot({ path: `${out}/attempt-${attempt}.png`, fullPage: true }).catch(() => {});
      await context.tracing.stop({ path: `${out}/attempt-${attempt}.zip` });
      results.push(row);
      await fs.writeFile(`${out}/results.json`, JSON.stringify({ localSource: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), note: 'Local source SHA is not proof of hosted deployment identity. Browser-local MOCK.', results }, null, 2));
      console.log(JSON.stringify(row));
      await context.close();
    }
  }
} finally { await browser.close(); }
if (results.some(row => row.result !== 'PASS' || row.reload !== 'PASS')) process.exitCode = 1;
