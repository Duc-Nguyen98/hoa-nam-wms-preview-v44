import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
const base=process.env.S01_BASE_URL??'http://127.0.0.1:5182';
const out='output/s01-qa'; await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:800,height:1280},deviceScaleFactor:2,hasTouch:true,permissions:['clipboard-read','clipboard-write']});
const page=await ctx.newPage(),checks=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
const result=(name)=>{checks.push(name);console.log(name);};
const overview=async()=>{await page.goto(`${base}/#/preview/S01`);await page.locator('.ov-result-count').waitFor();};
try {
  await page.goto(`${base}/#/preview/S07`);
  await page.getByRole('textbox',{name:'Tên đăng nhập',exact:true}).fill('demo');
  await page.getByRole('textbox',{name:'Mật khẩu',exact:true}).fill('HoaNamDemo@2026');
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await page.getByRole('button',{name:'Bắt đầu làm việc',exact:true}).click();
  await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await page.locator('.ov-result-count').waitFor();
  await page.reload(); await page.locator('.ov-result-count').waitFor(); result('fresh login, direct S01 and reload');
  const attention=await page.locator('.ov-attention__list').innerText();
  await page.locator('#ov-search-input').fill('no-matching-document');
  await expect(page.locator('.ov-result-count')).toHaveText('0 phiếu phù hợp');
  expect(await page.locator('.ov-attention__list').innerText()).toBe(attention);
  await page.locator('.ov-attention__row .ov-document-link').first().click();
  await expect(page.locator('dialog[open] .ov-detail-title__number')).toHaveText('PX-0010');
  await page.locator('dialog[open] .hn-global-modal__close').click();
  await expect(page.locator('#ov-search-input')).toHaveValue('no-matching-document');
  await page.locator('.ov-attention .ov-view-all').click();
  await expect(page.locator('.ov-result-count')).toHaveText('5 phiếu phù hợp');
  await expect(page.locator('#ov-search-input')).toHaveValue(''); result('no-result + attention independent and view-all clears conflicting filters');
  await page.locator('.ov-reset').click();
  await page.locator('#ov-type-filter').selectOption('inbound');
  await expect(page.locator('.ov-result-count')).toHaveText('8 phiếu phù hợp');
  await page.locator('#ov-status-filter').selectOption('posted');
  await expect(page.locator('.ov-result-count')).toHaveText('5 phiếu phù hợp');
  await page.locator('.ov-refresh').click();
  await expect(page.locator('.ov-result-count')).toHaveText('5 phiếu phù hợp');
  const downloadPromise=page.waitForEvent('download'); await page.getByRole('button',{name:'Xuất Excel',exact:true}).click();
  const download=await downloadPromise; await download.saveAs(`${out}/filtered-inbound.xlsx`);
  const zip=unzipSync(await fs.readFile(`${out}/filtered-inbound.xlsx`));
  const xml=Object.values(zip).map(strFromU8).join('\n');
  expect(xml).toContain('PN-0011'); expect(xml).not.toContain('PX-0011'); expect(xml).not.toContain('PN-0009'); result('filter, refresh and exported rows match accepted inbound/posted scope');
  await page.locator('.ov-reset').click();
  await page.locator('.hn-pagination button').filter({hasText:/^2$/}).click();
  await expect(page.locator('.hn-pagination [aria-current="page"]')).toHaveText('2');
  const opener=page.locator('.ov-mobile-row .ov-document-link').first(); await opener.scrollIntoViewIfNeeded();
  const scrollBefore=await page.evaluate(()=>scrollY); await opener.click();
  await expect(page.locator('dialog[open] #ov-detail-navigation-reason')).toBeVisible();
  await page.locator('dialog[open] .hn-global-modal__footer .hn-button--secondary').click();
  expect(await page.evaluate(()=>scrollY)).toBe(scrollBefore); expect(await opener.evaluate(e=>e===document.activeElement)).toBe(true);
  await expect(page.locator('.hn-pagination [aria-current="page"]')).toHaveText('2'); result('page 2 / scroll / opener retained after footer close');
  await overview();
  await page.locator('.ov-mobile-row .ov-document-link').first().click();
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('denied'))}}));
  await page.getByRole('button',{name:'Sao chép ID',exact:true}).click();
  // The approved shared Toast contract queues behind tall foreground dialogs.
  // Closing the foreground releases the queued feedback; it must not vanish.
  await expect(page.locator('.hn-global-toast-region')).toHaveAttribute('data-queued-count','1');
  await page.keyboard.press('Escape');
  await expect(page.locator('.hn-global-toast[data-tone="error"]')).toContainText('Không thể sao chép.');
  result('clipboard failure survives the shared foreground Toast queue');
  await page.reload(); await page.locator('.ov-result-count').waitFor();
  const profile=page.locator('.hn-profile');
  await profile.click(); await page.locator('.hn-profile-menu-action').filter({hasText:'Ngôn ngữ'}).click();
  await page.locator('.hn-header-option').filter({hasText:'English'}).click();
  await expect(page.locator('.ov-page-intro h1')).toHaveText('Operations overview');
  await expect(profile).toBeFocused();
  await profile.click(); await page.locator('.hn-profile-menu-action').filter({hasText:'Theme'}).click();
  await page.locator('.hn-header-option').filter({hasText:'Dark'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-hn-theme','dark'); await expect(profile).toBeFocused(); result('compact profile exposes language/theme with focus restoration');
  await page.locator('.hn-shell-search').click(); await expect(page.locator('.hn-search-dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('.hn-shell-search')).toBeFocused();
  await page.locator('.hn-notifications').click(); await expect(page.locator('#hn-preview-notification-center[open]')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('.hn-notifications')).toBeFocused();
  await page.locator('.hn-menu-toggle').click(); await expect(page.locator('#hn-navigation-drawer[open]')).toBeVisible();
  await page.keyboard.press('Escape'); result('search, notification center and sidebar modal regression');
  for (const route of ['S21','S26','S20']) {
    await overview(); const index=['S21','S26','S20'].indexOf(route); await page.locator('.ov-quick__link').nth(index).click();
    await expect(page).toHaveURL(new RegExp(`#/preview/${route}$`)); await expect(page.locator('.hn-shell')).toBeVisible();
  } result('quick access uses existing report/trace/history routes');
  await page.evaluate(()=>{localStorage.setItem('hn-wms.s00.language.v1','vi');localStorage.setItem('hn-wms.s00.theme.v1','light');});
  await overview();await page.reload();await page.locator('.ov-result-count').waitFor();
  await page.locator('#ov-period-picker').click();
  await page.locator('#ov-period-picker-manual-from').fill('01/09/2026');await page.locator('#ov-period-picker-manual-to').fill('01/09/2026');
  await page.locator('.hn-date-picker__popup[data-open="true"]').getByRole('button',{name:'Áp dụng',exact:true}).click();
  await expect(page.locator('.ov-result-count')).toHaveText('0 phiếu trong kỳ');
  await expect(page.locator('.ov-metric').nth(3).locator('strong')).toHaveText('4');
  await page.locator('#ov-period-picker').click();
  await page.locator('#ov-period-picker-manual-from').fill('01/09/2026');await page.locator('#ov-period-picker-manual-to').fill('30/09/2026');
  await page.locator('.hn-date-picker__popup[data-open="true"]').getByRole('button',{name:'Áp dụng',exact:true}).click();
  await expect(page.locator('.ov-result-count')).toHaveText('16 phiếu trong kỳ');result('shared date picker applies valid period; current warranty metric remains unchanged');
  // Test-only endpoint, never installed in Main.
  for (const state of ['loading','error','empty','long','missing']) {
    await page.goto(`${base}/tests/s01/harness.html?state=${state}`);
    if(state==='loading') {await expect(page.locator('.hn-feedback')).toContainText(/Đang tải|Loading/);result('loading');continue;}
    if(state==='error') {await expect(page.getByRole('button',{name:/Thử lại|Retry/})).toBeVisible();result('read error and retry');continue;}
    await page.locator('.ov-result-count').waitFor();
    if(state==='empty') {await expect(page.locator('.ov-mobile-list')).toContainText(/Không có phiếu|No documents/);result('empty distinct from no-result');continue;}
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(800);
    await page.locator('.ov-mobile-row .ov-document-link').first().click();
    const dialog=page.locator('dialog.ov-detail-modal[open]');
    await expect(dialog).toBeVisible();
    expect(await dialog.innerText()).not.toMatch(/undefined|null/);
    const geometry=await dialog.evaluate(el=>{const r=el.getBoundingClientRect(),b=el.querySelector('.hn-global-modal__body'),f=el.querySelector('.hn-global-modal__footer').getBoundingClientRect();return {right:r.right,bottom:r.bottom,footer:f.bottom,overflow:b.scrollHeight>b.clientHeight};});
    expect(geometry.right).toBeLessThanOrEqual(800); expect(geometry.footer).toBeLessThanOrEqual(1280);
    if(state==='long') {expect(geometry.overflow).toBe(true);await dialog.locator('.hn-global-modal__body').evaluate(el=>el.scrollTop=el.scrollHeight);await expect(dialog.locator('.ov-detail-id')).toBeVisible();}
    await page.screenshot({path:`${out}/edge-${state}.png`});await page.keyboard.press('Escape'); result(`isolated ${state} data, body scroll and viewport containment`);
  }
  expect(errors).toEqual([]);
  await fs.writeFile(`${out}/flow-results.json`,JSON.stringify({checks,errors},null,2));
} catch(e) {await page.screenshot({path:`${out}/flow-failure.png`,fullPage:true});await fs.writeFile(`${out}/flow-failure.json`,JSON.stringify({error:String(e),stack:e.stack,checks,errors},null,2));throw e;}
finally {await browser.close();}
