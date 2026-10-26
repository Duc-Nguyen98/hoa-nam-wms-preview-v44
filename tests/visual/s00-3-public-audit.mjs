import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

const publicUrl = process.env.PUBLIC_URL ?? 'https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/';
const candidateSha = process.env.CANDIDATE_SHA ?? 'b287d1294f0aa37b1c38c14275ef8c0a279d4fcc';
const runId = process.env.VISUAL_RUN_ID ?? new Date().toISOString().replace(/[:.]/g, '-');
const evidenceRoot = path.resolve('output', 'design-evidence', candidateSha, runId);
await fs.mkdir(evidenceRoot, { recursive: true });

const references = {
  'BL-NOTIFY-D': 'docs/quality/references/hn-astra-20261027/1.png',
  'BL-NOTIFY-T': 'docs/quality/references/hn-astra-20261027/2.png',
  'BL-S01-D': 'docs/quality/references/hn-astra-20261027/3.png',
  'BL-S01-T': 'docs/quality/references/hn-astra-20261027/4.png',
  'BL-S01-DETAIL-D': 'docs/quality/references/hn-astra-20261027/5.png',
  'BL-S01-DETAIL-T': 'docs/quality/references/hn-astra-20261027/6.png',
};
const profiles = [
  { id: 'desktop', width: 1920, height: 1080, dpr: 1, baseline: 'D' },
  { id: 'tablet', width: 800, height: 1280, dpr: 2, baseline: 'T' },
  { id: 'fold-outer', width: 412, height: 915, dpr: 2, baseline: null },
  { id: 'fold-narrow', width: 390, height: 844, dpr: 2, baseline: null },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ locale: 'vi-VN', timezoneId: 'Asia/Bangkok', colorScheme: 'light', deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push({ type: 'pageerror', message: e.message }));
page.on('console', m => { if (m.type() === 'error') errors.push({ type: 'console', message: m.text() }); });
page.setDefaultTimeout(20000);

async function login() {
  await page.goto(`${publicUrl}#/preview/S07`, { waitUntil: 'domcontentloaded' });
  if (await page.locator('#s07-username').count()) {
    await page.locator('#s07-username').fill('demo');
    await page.locator('#s07-password').fill('HoaNamDemo@2026');
    await page.locator('.s07-submit').click();
    if (await page.locator('.s08-confirm').count()) await page.locator('.s08-confirm').click();
    const continueButton = page.getByRole('button', { name: /^(Tiếp tục|Bắt đầu làm việc)$/ });
    if (await continueButton.count()) await continueButton.click();
  }
  try { await page.locator('.ov-screen').waitFor({ timeout: 180000 }); }
  catch (error) { console.log('LOGIN_TIMEOUT', page.url(), (await page.locator('body').innerText()).slice(0, 2500)); await page.screenshot({ path: path.join(evidenceRoot, 'login-failure.png'), fullPage: true }); throw error; }
}

async function sha256(file) { return crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'); }
async function visibleMetrics() {
  return await page.evaluate(() => {
    const qs = (s) => [...document.querySelectorAll(s)].filter(e => e.getClientRects().length).map(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return { tag: e.tagName, text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120), aria: e.getAttribute('aria-label'), x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom, font: cs.font, color: cs.color, background: cs.backgroundColor }; });
    return {
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollHeight: document.body.scrollHeight,
      title: qs('h1')[0],
      filters: qs('.ov-filters input, .ov-filters button, .ov-filters select'),
      metrics: qs('.ov-metric'),
      activity: qs('.ov-activity'),
      detail: qs('.ov-detail-modal[open]'),
      shell: qs('.hn-shell, .hn-sidebar, .hn-header, .hn-content'),
      notifications: qs('.hn-notification-center, .hn-notification-list-pane, .hn-notification-detail-pane-wrap, .hn-global-modal__surface'),
      buttons: qs('button:visible, a:visible, input:visible, select:visible').filter(x => x.width < 44 || x.height < 44),
    };
  });
}
async function capture(name, profile) {
  await page.setViewportSize({ width: profile.width, height: profile.height });
  await page.waitForTimeout(250);
  await page.evaluate(() => document.fonts?.ready);
  const dir = path.join(evidenceRoot, name, profile.id, 'vi', 'light');
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'actual.png');
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  await fs.writeFile(path.join(dir, 'measurement.json'), JSON.stringify(await visibleMetrics(), null, 2));
  return { actual: path.relative(process.cwd(), file), actualSha256: await sha256(file), measurementReport: path.relative(process.cwd(), path.join(dir, 'measurement.json')) };
}

await login();
const rows = [];
for (const profile of profiles) {
  const pageCapture = await capture('BL-S01-' + (profile.baseline ?? 'FOLD') + '-DEFAULT', profile);
  rows.push({ baselineId: profile.baseline ? `BL-S01-${profile.baseline}` : null, route: '#/preview/S01', state: 'Default', profile, ...pageCapture });
  if (profile.baseline) {
    await page.locator('#ov-search-input').fill('PX-0004');
    await page.locator('#ov-search-input').press('Enter');
    const opener = page.locator('.ov-activity [data-overview-detail-opener="b12-outbound-0004"].ov-document-link:visible');
    if (await opener.count()) {
      await opener.click();
      await page.locator('.ov-detail-modal[open]').waitFor();
      const detailCapture = await capture('BL-S01-DETAIL-' + profile.baseline, profile);
      rows.push({ baselineId: `BL-S01-DETAIL-${profile.baseline}`, route: '#/preview/S01', state: 'Outbound detail PX-0004', profile, ...detailCapture });
      await page.keyboard.press('Escape');
    }
    await page.goto(`${publicUrl}#/preview/S01`, { waitUntil: 'domcontentloaded' });
    await page.locator('.ov-screen').waitFor();
  }
}

// Notification Center from the real public shell, if available.
await page.setViewportSize({ width: 1920, height: 1080 });
await page.goto(`${publicUrl}#/preview/S01`, { waitUntil: 'domcontentloaded' });
await page.locator('.ov-screen').waitFor();
const bell = page.locator('button[aria-label*="Thông báo"], button[aria-label*="Notifications"], button[aria-label*="通知"]').first();
let notificationResult = 'NOT_RUN';
if (await bell.count()) {
  await bell.click();
  if (await page.locator('#hn-preview-notification-center[open]').count()) {
    const desktop = profiles[0];
    const n1 = await capture('BL-NOTIFY-D', desktop);
    rows.push({ baselineId: 'BL-NOTIFY-D', route: '#/preview/S01 + notification center', state: 'Notification Center desktop', profile: desktop, ...n1 });
    await page.setViewportSize({ width: 800, height: 1280 });
    await page.waitForTimeout(200);
    const n2 = await capture('BL-NOTIFY-T', profiles[1]);
    rows.push({ baselineId: 'BL-NOTIFY-T', route: '#/preview/S01 + notification center', state: 'Notification Center tablet', profile: profiles[1], ...n2 });
    notificationResult = 'CAPTURED';
  } else notificationResult = 'OPEN_FAILED';
} else notificationResult = 'BELL_NOT_FOUND';

const manifest = [];
for (const row of rows) {
  const source = row.baselineId ? references[row.baselineId] : null;
  manifest.push({ ...row, sourceOriginal: source, sourceSha256: source ? await sha256(source) : null, diff: null, testReport: null, openGapIds: row.baselineId?.includes('DETAIL') ? ['DG-05'] : row.baselineId?.includes('NOTIFY') ? ['DG-02','DG-06','DG-11'] : ['DG-02','DG-03','DG-04','DG-07','DG-08'], result: 'BLOCKED' });
}
await fs.writeFile(path.join(evidenceRoot, 'evidence-manifest.json'), JSON.stringify({ publicUrl, candidateSha, runId, errors, notificationResult, rows: manifest }, null, 2));
console.log(JSON.stringify({ publicUrl, candidateSha, runId, errors, notificationResult, captures: manifest.length, evidenceRoot }, null, 2));
await browser.close();
