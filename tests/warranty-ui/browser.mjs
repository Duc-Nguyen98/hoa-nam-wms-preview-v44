import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const base = process.env.WARRANTY_BASE ?? 'http://127.0.0.1:5187';
const out = 'output/warranty-ui-final';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch(), page = await browser.newPage();
page.setDefaultTimeout(20000);
const errors = [], checks = [];
page.on('pageerror', e => errors.push(e.message));
const selectors = { S09: '[data-operational-warranty]', S10: '[data-operational-parts-issues]', S16: '[data-operational-inventory]', S22: '[data-operational-warranty-report]' };
const goto = async screen => { await page.goto(`${base}/#/preview/${screen}`); await page.locator(selectors[screen] + (screen === 'S16' ? ' [data-inventory-quantity]:visible' : ' tbody tr')).first().waitFor(); };
const modal = () => page.locator('dialog[open]');
const refresh = () => modal().locator('.hn-global-modal__footer button').first();
async function preferences(language, theme) {
  await page.evaluate(({ language, theme }) => {
    localStorage.setItem('hn-wms.s00.language.v1', language);
    localStorage.setItem('hn-wms.s00.theme.v1', theme);
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
  }, { language, theme });
}
async function bounds() {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  if (await modal().count()) {
    const box = await modal().boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height + 1);
    expect(await modal().locator('.hn-global-modal__footer button').evaluateAll(nodes => nodes.every(n => n.getBoundingClientRect().height >= 44))).toBe(true);
  }
}
try {
  await page.goto(base + '/#/preview/S07');
  await page.locator('#s07-username').fill('demo'); await page.locator('#s07-password').fill('HoaNamDemo@2026');
  await page.locator('.s07-submit').click(); await page.locator('.s08-confirm').click();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click(); await page.locator('.ov-result-count').waitFor();
  await page.evaluate(async () => { const { seedWarrantyUi } = await import('/tests/warranty-ui/seed.ts'); window.warrantyQa = await seedWarrantyUi(); await window.warrantyQa.post(); });
  const before = await page.evaluate(() => window.warrantyQa.adapter.read());
  const profiles = process.env.WARRANTY_FLOW_ONLY ? [] : [
    ['desktop', 1920, 1080, 'vi', 'light'], ['tablet', 800, 1280, 'vi', 'light'], ['phone', 390, 844, 'vi', 'light'],
    ['desktop-en', 1920, 1080, 'en', 'dark'], ['tablet-zh', 800, 1280, 'zh-CN', 'dark'], ['short', 960, 540, 'vi', 'dark'],
  ];
  for (const [name, width, height, language, theme] of profiles) {
    await page.setViewportSize({ width, height }); await preferences(language, theme);
    for (const screen of ['S09', 'S10', 'S16', 'S22']) {
      await goto(screen); await bounds();
      const root = page.locator(selectors[screen]);
      await expect(root.locator('tbody tr')).toHaveCount(screen === 'S16' ? 2 : 1);
      if (screen === 'S22') await expect(root).toContainText(before.warrantyCases[0].data.code);
      if (screen === 'S16') expect(await root.locator('[data-inventory-quantity]:visible').evaluateAll(nodes => nodes.map(n => Number(n.dataset.inventoryQuantity)).sort())).toEqual([0, 8]);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${out}/${name}-${screen}-list.png`, fullPage: true });
      if (screen === 'S09' || screen === 'S10') {
        const action = root.locator(`[data-${screen.toLowerCase()}-operational-action]`).first();
        await action.click(); await modal().waitFor(); await bounds();
        if (screen === 'S09') await expect(modal().locator('[data-warranty-case-id]')).toHaveAttribute('data-warranty-case-id', before.warrantyCases[0].id);
        else {
          await expect(modal().locator('[data-operational-parts-id]')).toHaveAttribute('data-operational-parts-id', before.partsIssues[0].id);
          expect(await modal().locator('td, small').evaluateAll(nodes => nodes.every(n => n.scrollWidth <= n.clientWidth + 2))).toBe(true);
        }
        await page.screenshot({ path: `${out}/${name}-${screen}-detail.png` });
        await refresh().click(); await expect(refresh()).toBeEnabled(); await page.keyboard.press('Escape');
        await expect(action).toBeFocused();
      }
      checks.push(`${name} ${screen} correct record, bounds and controls`);
    }
  }
  await preferences('vi', 'light'); await page.setViewportSize({ width: 800, height: 1280 });
  for (const screen of ['S09', 'S10']) {
    await goto(screen); const action = page.locator(`[data-${screen.toLowerCase()}-operational-action]`).first(); await action.click();
    await page.evaluate(() => { window.failReadId = window.warrantyQa.client.interceptors.response.use(r => { if (r.config.url === 'operations/snapshot') throw new Error('QA_READ_LOSS'); return r; }); });
    await refresh().click(); await expect(modal().getByRole('alert').first()).toBeVisible();
    await page.evaluate(() => window.warrantyQa.client.interceptors.response.eject(window.failReadId));
    await refresh().click(); await expect(refresh()).toBeEnabled(); await page.keyboard.press('Escape'); await expect(action).toBeFocused();
    checks.push(`${screen} read failure/recovery restores exact row focus`);
  }
  await goto('S10'); await page.locator('[data-s10-operational-action]').first().click();
  await page.evaluate(() => { window.holdReadId = window.warrantyQa.client.interceptors.response.use(async r => { if (r.config.url === 'operations/snapshot') await new Promise(resolve => window.releaseRead = resolve); return r; }); });
  await refresh().click(); await expect(refresh()).toBeDisabled();
  await page.waitForFunction(() => typeof window.releaseRead === 'function');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-operational-parts-issues]')).toBeFocused();
  await page.evaluate(() => { window.warrantyQa.client.interceptors.response.eject(window.holdReadId); window.releaseRead(); });
  await expect(page.locator('[data-s10-operational-refresh]')).toBeEnabled(); checks.push('S10 close during delayed read uses focusable fallback');
  expect(await page.evaluate(() => window.warrantyQa.adapter.read())).toEqual(before);
  checks.push('all read/navigation/error recovery paths preserve stock, versions and history');
  await goto('S09'); await page.locator('[data-s09-operational-action]').click();
  await modal().getByRole('button', { name: 'Chẩn đoán', exact: true }).click();
  await modal().getByRole('textbox', { name: 'Kỹ thuật viên chẩn đoán', exact: true }).fill('Kiểm tra lại nguồn và đầu in qua biểu mẫu');
  await modal().getByRole('button', { name: 'Lưu chẩn đoán', exact: true }).click();
  await expect(modal().locator('[data-warranty-case-id]')).toBeVisible();
  await expect(modal()).toContainText('Kiểm tra lại nguồn và đầu in qua biểu mẫu');
  const diagnosed = await page.evaluate(() => window.warrantyQa.adapter.read());
  expect(diagnosed.stock).toEqual(before.stock); expect(diagnosed.stockEvents).toEqual(before.stockEvents);
  expect(diagnosed.warrantyCases[0].version).toBe(before.warrantyCases[0].version + 1);
  checks.push('S09 diagnosis form saves the selected case without stock changes');
  await page.evaluate(() => window.warrantyQa.reset()); await refresh().click(); await expect(refresh()).toBeEnabled();
  await expect(modal().locator('[data-warranty-case-id]')).toHaveCount(0);
  await expect(modal().getByRole('button', { name: 'Chẩn đoán', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape'); await expect(page.locator('[data-s09-operational-refresh]')).toBeFocused();
  checks.push('S09 session reset invalidates detail and returns to refresh');
  expect(errors).toEqual([]); console.log(JSON.stringify({ checks, errors }));
} catch (error) { console.error(await page.evaluate(() => ({ focus: document.activeElement?.outerHTML.slice(0,400), dialogs: [...document.querySelectorAll('dialog[open]')].length }))); await page.screenshot({ path: out + '/failure.png', fullPage: true }); throw error; }
finally { await fs.writeFile(out + '/results.json', JSON.stringify({ checks, errors }, null, 2)); await browser.close(); }
