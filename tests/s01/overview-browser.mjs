import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.S01_BASE_URL ?? 'http://127.0.0.1:5182';
const phase = process.env.S01_PHASE ?? 'after';
const output = path.resolve('output/s01-qa');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [], errors = [];
const samples = process.env.S01_QUICK ? [
  { name: 'desktop', width: 1920, height: 1080, dpr: 1 },
  { name: 'tablet', width: 800, height: 1280, dpr: 2, touch: true },
] : [
  { name: 'desktop', width: 1920, height: 1080, dpr: 1 },
  { name: 'tablet', width: 800, height: 1280, dpr: 2, touch: true },
  { name: 'intermediate', width: 1024, height: 768, dpr: 1 },
  { name: 'short', width: 1280, height: 600, dpr: 1 },
  { name: 'zoom200-equivalent', width: 960, height: 540, dpr: 2 },
  { name: 'narrow', width: 390, height: 844, dpr: 1, touch: true },
  { name: 'tablet-native', width: 1600, height: 2560, dpr: 1, touch: true },
];
async function login(page) {
  await page.goto(`${base}/#/preview/S07`);
  await page.getByRole('textbox', { name: 'Tên đăng nhập', exact: true }).fill('demo');
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill('HoaNamDemo@2026');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Bắt đầu làm việc', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu làm việc', exact: true }).click();
  const next = page.getByRole('button', { name: 'Tiếp tục', exact: true });
  await next.waitFor({ state: 'visible', timeout: 10000 });
  await next.click();
  await page.locator('.hn-shell').waitFor({ state: 'visible', timeout: 15000 });
}
async function dimensions(page, dialog = false) {
  return page.evaluate(dialog => {
    const box = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const r = element.getBoundingClientRect(), css = getComputedStyle(element);
      return { x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right,padding:css.padding,gap:css.gap,columns:css.gridTemplateColumns,display:css.display,radius:css.borderRadius,scrollHeight:element.scrollHeight,clientHeight:element.clientHeight };
    };
    return { viewport: [innerWidth,innerHeight], dpr:devicePixelRatio, image:[innerWidth*devicePixelRatio,innerHeight*devicePixelRatio], pageWidth:document.documentElement.scrollWidth,
      main:box('.hn-main'),screen:box('.ov-screen'),kpi:box('.ov-metrics'),cards:[...document.querySelectorAll('.ov-metric')].map(e=>e.getBoundingClientRect().height),activity:box('.ov-activity'),pagination:box('.hn-pagination'),mobile:box('.ov-mobile-list'),table:box('.ov-table-desktop'),filters:box('.ov-filters'),
      ...(dialog ? { dialog:box('dialog.ov-detail-modal'), body:box('.ov-detail-modal .hn-global-modal__body'), footer:box('.ov-detail-modal .hn-global-modal__footer'),fields:box('.ov-detail-fields'), field:box('.ov-detail-field'),bodyOverflow:getComputedStyle(document.body).overflow } : {}) };
  }, dialog);
}
try {
  for (const sample of samples) {
    const ctx = await browser.newContext({ viewport:{width:sample.width,height:sample.height}, deviceScaleFactor:sample.dpr, hasTouch:sample.touch ?? false, permissions:['clipboard-read','clipboard-write'] });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`${sample.name}: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`${sample.name}: ${m.text()}`); });
    await login(page);
    const langs = process.env.S01_QUICK || phase === 'before' ? ['vi'] : ['vi','en','zh-CN'];
    for (const lang of langs) for (const theme of (process.env.S01_QUICK || phase === 'before' ? ['light'] : ['light','dark'])) {
      await page.evaluate(({lang,theme}) => { localStorage.setItem('hn-wms.s00.language.v1',lang);localStorage.setItem('hn-wms.s00.theme.v1',theme); }, {lang,theme});
      await page.goto(`${base}/#/preview/S01`); await page.reload();
      await page.locator('.ov-result-count').waitFor();
      const prefix = `${phase}-${sample.name}-${lang}-${theme}`;
      const overview = await dimensions(page);
      expect(overview.pageWidth).toBeLessThanOrEqual(sample.width);
      if (phase === 'after') {
        expect(new Set(overview.cards).size).toBe(1);
        expect(overview.screen.gap).toBe('24px');
        expect(overview.kpi.gap).toBe('16px');
      }
      const capture = ['desktop','tablet'].includes(sample.name);
      if (capture) {
        await page.screenshot({path:path.join(output,`${prefix}-overview.png`)});
        await page.screenshot({path:path.join(output,`${prefix}-overview-full.png`),fullPage:true});
      }
      for (const number of ['PX-0007','PN-0009']) {
        const opener = page.locator(`button[data-overview-detail-opener="p12-stock-${number}"]:visible`).first();
        await opener.scrollIntoViewIfNeeded();
        const before = await page.evaluate(() => ({scrollY, search:document.querySelector('#ov-search-input').value,type:document.querySelector('#ov-type-filter').value,status:document.querySelector('#ov-status-filter').value,pagination:document.querySelector('.hn-pagination').textContent}));
        await opener.click();
        const dialog = page.locator('dialog[open]').filter({ has:page.locator('[data-overview-detail-id]') });
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('[data-overview-detail-id]')).toHaveAttribute('data-overview-detail-id',`p12-stock-${number}`);
        const detail = phase === 'after' ? await dimensions(page,true) : {};
        if (phase === 'after') {
          expect(detail.dialog.x).toBeGreaterThanOrEqual(15);
          expect(detail.dialog.bottom).toBeLessThanOrEqual(sample.height-15);
          expect(detail.footer.bottom).toBeLessThanOrEqual(detail.dialog.bottom);
          expect(detail.field.gap).toBe('8px 12px');
          expect(detail.bodyOverflow).toBe('hidden');
          await expect(dialog.locator('.hn-button--primary')).toBeDisabled();
          for (let i=0;i<9;i++) { await page.keyboard.press('Tab'); expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true); }
          await page.keyboard.press('Control+k'); await expect(page.locator('dialog[open]')).toHaveCount(1);
          if (lang==='vi' && theme==='light' && sample.name==='desktop') {
            await dialog.getByRole('button',{name:'Sao chép mã phiếu',exact:true}).click();
            await expect(page.locator('.hn-global-toast[data-tone="success"]')).toBeVisible();
            expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(number);
          }
        }
        if (capture) await page.screenshot({path:path.join(output,`${prefix}-${number.startsWith('PX')?'outbound':'inbound'}.png`)});
        await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
        expect(await opener.evaluate(el=>document.activeElement===el)).toBe(true);
        const after = await page.evaluate(() => ({scrollY, search:document.querySelector('#ov-search-input').value,type:document.querySelector('#ov-type-filter').value,status:document.querySelector('#ov-status-filter').value,pagination:document.querySelector('.hn-pagination').textContent}));
        expect(after).toEqual(before);
        results.push({name:prefix,number,overview,detail,focusAndStatePreserved:true});
      }
    }
    await ctx.close();
  }
  expect(errors).toEqual([]);
  await fs.writeFile(path.join(output,`${phase}-browser-results.json`),JSON.stringify({base,phase,results,errors},null,2));
  console.log(JSON.stringify({phase,checks:results.length,errors,output}));
} catch (e) {
  const pages=browser.contexts().flatMap(c=>c.pages());
  await pages.at(-1)?.screenshot({path:path.join(output,`${phase}-failure.png`),fullPage:true});
  await fs.writeFile(path.join(output,`${phase}-failure.json`),JSON.stringify({error:String(e),stack:e.stack,results,errors},null,2));
  throw e;
} finally { await browser.close(); }
