import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const out = path.resolve('output/design-evidence/public-setup-blocker-20261027');
await fs.mkdir(out, { recursive: true });
const url = process.env.PUBLIC_URL ?? 'https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'vi-VN', timezoneId: 'Asia/Bangkok' });
const events = [];
page.on('pageerror', e => events.push({ kind: 'pageerror', message: e.message, atMs: Date.now() - started }));
page.on('console', m => { if (m.type() === 'error') events.push({ kind: 'console', message: m.text(), atMs: Date.now() - started }); });
const started = Date.now();
await page.goto(`${url}#/preview/S07`, { waitUntil: 'domcontentloaded' });
await page.locator('#s07-username').fill('demo'); await page.locator('#s07-password').fill('HoaNamDemo@2026'); await page.locator('.s07-submit').click();
await page.locator('.s08-confirm').click();
await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
const samples = [];
for (const delay of [0, 5000, 20000, 60000, 120000]) {
  if (delay) await page.waitForTimeout(delay - (samples.at(-1)?.delay ?? 0));
  const sample = await page.evaluate(() => ({ url: location.href, body: document.body.innerText.slice(0, 800), button: [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Tiếp tục') ? (() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Tiếp tục'); return { ariaDisabled: b?.getAttribute('aria-disabled'), disabled: b?.disabled, text: b?.textContent?.trim() }; })() : null, locks: navigator.locks?.query ? undefined : 'unsupported' }));
  sample.delay = delay; sample.elapsedMs = Date.now() - started; sample.locks = await page.evaluate(() => navigator.locks?.query()); samples.push(sample); await page.screenshot({ path: path.join(out, `setup-${String(delay).padStart(6, '0')}ms.png`), fullPage: true });
}
await fs.writeFile(path.join(out, 'result.json'), JSON.stringify({ url, startedAt: new Date(started).toISOString(), samples, events }, null, 2));
console.log(JSON.stringify({ out, samples, events }, null, 2));
await browser.close();
