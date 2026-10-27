import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const base=process.env.S27_BASE_URL??'http://127.0.0.1:5287',out='docs/quality/uiux-task-HN-S27-005/functional/base-flow';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const ctx=await browser.newContext({viewport:{width:800,height:1280},deviceScaleFactor:2,hasTouch:true,permissions:['clipboard-read','clipboard-write']});const page=await ctx.newPage(),checks=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-25T08:00:00Z')});
const done=name=>{checks.push(name);console.log(name);};
const dialog=page.locator('dialog.s27-detail-modal[open]'),openers=page.locator('[data-audit-detail-open]:visible');
const goto=async(q='')=>{await page.goto(`${base}/tests/s27/harness.html?${q}`);await openers.first().waitFor();};
const read=async(state)=>{await page.evaluate(state=>s27qa.state=state,state);await dialog.locator('.hn-global-modal__footer button').first().click();};
try{
  await goto('count=35');const original=await page.evaluate(()=>JSON.stringify(s27qa.snapshot));
  const search=page.locator('#s27-operational-query-search');
  await page.getByRole('combobox',{name:'Hành động',exact:true}).selectOption('stock-profiles.create');
  await expect(page.locator('.hn-pagination__range')).toContainText('/ 32');
  await page.getByRole('combobox',{name:'Người thao tác',exact:true}).selectOption('preview:ducquang');await expect(page.locator('.hn-pagination__range')).toContainText('/ 17');
  await search.fill('00000004');await expect(page.locator('.hn-pagination__range')).toContainText('/ 1');
  await search.fill('not-found-identifier');await expect(page.locator('[data-state]:visible').filter({hasText:'sự kiện'}).first()).toContainText('Không có sự kiện phù hợp');done('combined action/actor/search filters and filtered totals');
  await page.getByRole('button',{name:'Đặt lại',exact:true}).first().click();await expect(page.locator('.hn-pagination__range')).toContainText('/ 35');
  expect(await openers.first().getAttribute('data-audit-detail-open')).toContain('00000000');done('reset and default stable timestamp tie-break (other sort modes tested independently at binding)');
  await page.getByRole('button',{name:'Trang 2',exact:true}).click();await expect(page.locator('.hn-pagination [aria-current="page"]')).toHaveText('2');
  const opener=openers.first();await opener.scrollIntoViewIfNeeded();const id=await opener.getAttribute('data-audit-detail-open'),scroll=await page.evaluate(()=>scrollY);
  await opener.click();await expect(dialog.locator('[data-audit-detail-id]')).toHaveAttribute('data-audit-detail-id',id);
  await read('loading');await expect(dialog).toHaveAttribute('data-audit-detail-state','loading');await expect(dialog.locator('[data-audit-detail-id]')).toHaveCount(0);
  await page.evaluate(()=>{s27qa.state='ready';s27qa.pending.splice(0).forEach(resolve=>resolve());});await expect(dialog).toHaveAttribute('data-audit-detail-state','ready');await expect(dialog.locator('[data-audit-detail-id]')).toHaveAttribute('data-audit-detail-id',id);
  await dialog.locator('.hn-global-modal__close').click();await expect(opener).toBeFocused();expect(await page.evaluate(()=>scrollY)).toBe(scroll);await expect(page.locator('.hn-pagination [aria-current="page"]')).toHaveText('2');
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('.hn-pagination [aria-current="page"]')).toHaveText('2');done('page 2 and exact event retained through explicit/automatic refresh, close and scroll');
  await opener.click();for(const [state,text] of [['error','Chưa tải được'],['forbidden','không có quyền'],['unavailable','chưa khả dụng'],['integrity','Chưa xác minh']]){
    await read(state);await expect(dialog).toHaveAttribute('data-audit-detail-state','error');await expect(dialog.locator('[data-state]')).toContainText(text);await expect(dialog.locator('[data-audit-detail-id]')).toHaveCount(0);
    await read('ready');await expect(dialog).toHaveAttribute('data-audit-detail-state','ready');await expect(dialog.locator('[data-audit-detail-id]')).toHaveAttribute('data-audit-detail-id',id);done(`${state} hides protected stale data, retry preserves exact event`);
  }
  await read('missing');await expect(dialog).toHaveAttribute('data-audit-detail-state','unavailable');await expect(dialog).toContainText('Sự kiện không còn khả dụng');await read('ready');await expect(dialog.locator('[data-audit-detail-id]')).toHaveAttribute('data-audit-detail-id',id);done('missing event is explicit, never a substitute row');
  await page.keyboard.press('Escape');
  for(let i=0;i<5;i++){const target=openers.nth(i),targetId=await target.getAttribute('data-audit-detail-open');await target.click();await expect(dialog.locator('[data-audit-detail-id]')).toHaveAttribute('data-audit-detail-id',targetId);await dialog.locator('.hn-global-modal__footer button').last().click();await expect(target).toBeFocused();}done('five sequential events, footer close and focus return');
  await openers.first().click();for(const label of ['Mã sự kiện','Mã đối tượng','Mã lệnh','Mã commit']){
    const raw=await dialog.locator(`[data-audit-raw-value="${label}"]`).textContent();await dialog.locator(`[data-audit-copy="${label}"]`).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(raw);
  }done('all four copy buttons use complete original values');await page.keyboard.press('Escape');
  await expect(page.locator('.hn-global-toast[data-tone="success"]')).toBeVisible();await page.locator('.hn-global-toast button').first().click();
  await openers.first().click();await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('denied'))}}));await dialog.locator('[data-audit-copy]').first().click();
  await page.keyboard.press('Escape');await expect(page.locator('.hn-global-toast[data-tone="error"]')).toContainText('Không thể sao chép');done('copy success/failure feedback delivered through shared Toast');
  expect(await page.evaluate(()=>JSON.stringify(s27qa.snapshot))).toBe(original);done('source snapshot unchanged by all reads, filters and clipboard actions');
  await goto('count=35');await page.getByRole('combobox',{name:'Số dòng mỗi trang'}).selectOption('25');await expect(openers).toHaveCount(25);await expect(page.locator('.hn-pagination__range')).toContainText('1–25 / 35');done('page size updates visible rows without corrupting filtered total');
  await page.locator('#s27-operational-period').click();await page.locator('#s27-operational-period-manual-from').fill('24/10/2026');await page.locator('#s27-operational-period-manual-to').fill('24/10/2026');await page.locator('.hn-date-picker__popup[data-open="true"]').getByRole('button',{name:'Áp dụng',exact:true}).click();await expect(page.locator('[data-state]:visible').filter({hasText:'sự kiện'}).first()).toContainText('Chưa có sự kiện');done('shared date picker changes period, distinguishes empty period');
  await goto('count=35&long=1');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(800);await openers.first().click();const long=await dialog.locator('[data-audit-raw-value="Mã sự kiện"]').textContent();expect(long.length).toBeGreaterThan(250);
  const dims=await dialog.evaluate(el=>{const b=el.querySelector('.hn-global-modal__body'),f=el.querySelector('.hn-global-modal__footer').getBoundingClientRect();return {scroll:b.scrollHeight>b.clientHeight,width:b.scrollWidth,client:b.clientWidth,footer:f.bottom};});expect(dims.scroll).toBe(true);expect(dims.width).toBe(dims.client);expect(dims.footer).toBeLessThan(1280);await dialog.locator('.hn-global-modal__body').evaluate(el=>el.scrollTop=el.scrollHeight);await dialog.locator('[data-audit-copy="Mã commit"]').click();expect((await page.evaluate(()=>navigator.clipboard.readText())).length).toBeGreaterThan(250);await page.screenshot({path:`${out}/edge-long-tablet.png`});await page.keyboard.press('Escape');done('long actor/identifiers wrap, scroll inside body, footer and full copy retained');
  await page.getByRole('combobox',{name:'Hành động',exact:true}).selectOption('future-extension.unknown-action');await expect(page.locator('.s27-operational-card h3')).toHaveText('future-extension.unknown-action');await openers.first().click();await expect(dialog.locator('.s27-detail-identity h3')).toHaveText('future-extension.unknown-action');await page.keyboard.press('Escape');done('unknown action remains unchanged in list and details');
  await goto();await openers.nth(1).click();await expect(dialog.locator('.s27-operational-codes')).toHaveCount(2);await expect(dialog).not.toContainText('Không có bút toán');await page.keyboard.press('Escape');done('stock-event and related IDs match supplied proof');
  await openers.first().click();await page.setViewportSize({width:1920,height:1080});await page.keyboard.press('Escape');expect(await page.evaluate(()=>document.activeElement?.getAttribute('data-audit-detail-open'))).toContain('00000000');done('resize while open returns focus to visible desktop/tablet opener');
  for(const state of ['loading','empty','error','forbidden','unavailable']){await page.goto(`${base}/tests/s27/harness.html?state=${state}`);if(state==='empty')await expect(page.locator('.hn-pagination__range')).toContainText('0–0 / 0');else await expect(page.locator('[data-operational-audit] [data-state]').first()).toBeVisible();done(`initial ${state} state`);}
  expect(errors).toEqual([]);await fs.writeFile(`${out}/flow-results.json`,JSON.stringify({checks,errors},null,2));
}catch(e){await page.screenshot({path:`${out}/flow-failure.png`,fullPage:true});await fs.writeFile(`${out}/flow-failure.json`,JSON.stringify({error:String(e),stack:e.stack,checks,errors},null,2));throw e;}finally{await browser.close();}


