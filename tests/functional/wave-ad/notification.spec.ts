import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const evidence=path.resolve(process.env.QA_EVIDENCE_DIR ?? 'output/functional-remediation-HN-NC-MA-PILOT-002/candidate-browser');
test.beforeAll(async()=>{await fs.mkdir(evidence,{recursive:true});});
test.beforeEach(async({page})=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>errors.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));(page as any).qaErrors=errors;});
test.afterEach(async({page},info)=>{await info.attach('console-and-network-errors',{body:JSON.stringify((page as any).qaErrors),contentType:'application/json'});expect((page as any).qaErrors).toEqual([]);});
async function open(page:Page,state='ready',width=1920,height=1080){
 await page.setViewportSize({width,height});
 await page.clock.setFixedTime(new Date('2026-10-25T05:00:00Z'));
 await page.addInitScript(()=>{localStorage.setItem('hn-wms.s00.language.v1','vi');localStorage.setItem('hn-wms.s00.theme.v1','light');});
 await page.goto(`/tests/visual/notification.html?run=independent-${Date.now()}-${Math.random()}&state=${state}`);
 await page.locator('#open-center').click();
 await expect(page.locator('dialog[open]')).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('#persisted-unread')).toHaveText(state==='many'?'101':'2');
}
test('independent: opening and selecting unread does not mutate; filtered read returns to list',async({page})=>{
 await open(page,'ready',800,1280);const d=page.locator('dialog[open]');
 await expect(page.locator('#persisted-unread')).toHaveText('2');
 await d.getByRole('tab',{name:/Chưa đọc/}).click();
 await page.locator('dialog[open] [data-notification-id="QA-DESIGN-2"]').click();
 await expect(page.locator('#persisted-unread')).toHaveText('2');
 await expect(page.locator('dialog[open] [data-notification-detail]')).toHaveAttribute('data-notification-detail','QA-DESIGN-2');
 await d.getByRole('button',{name:'Đánh dấu đã đọc',exact:true}).click();
 await expect(page.locator('#persisted-unread')).toHaveText('1');
 // The read row leaves the filter. Return to the list, never silently show another detail.
 await expect(page.locator('dialog[open] .hn-notification-detail-pane-wrap')).toBeHidden();
 await expect(page.locator('dialog[open] [data-notification-id="QA-DESIGN-2"]')).toHaveCount(0);
 await expect(page.locator('dialog[open] .hn-notification-search input')).toBeFocused();
});
test('independent: tablet back retains filter, query and scroll; keyboard tabs operate',async({page})=>{
 await open(page,'many',800,900);const d=page.locator('dialog[open]');
 await d.getByRole('tab',{name:/Tất cả/}).focus();await page.keyboard.press('ArrowRight');
 await expect(d.getByRole('tab',{name:/Chưa đọc/})).toHaveAttribute('aria-selected','true');
 await page.locator('dialog[open] .hn-notification-search input').fill('Kho');
 const list=page.locator('dialog[open] .hn-notification-list-scroll');
 await list.evaluate(e=>{e.scrollTop=360;});
 const before=await list.evaluate(e=>e.scrollTop);expect(before).toBeGreaterThan(100);
 const row=page.locator('dialog[open] [data-notification-id="QA-MANY-6"]');await row.scrollIntoViewIfNeeded();
 const scroll=await list.evaluate(e=>e.scrollTop);
 await row.click();await expect(page.locator('dialog[open] .hn-notification-detail-pane-wrap')).toBeVisible();
 await d.getByRole('button',{name:'Quay lại danh sách',exact:true}).click();
 await expect(page.locator('dialog[open] .hn-notification-search input')).toHaveValue('Kho');
 await expect(d.getByRole('tab',{name:/Chưa đọc/})).toHaveAttribute('aria-selected','true');
 expect(Math.abs(await list.evaluate(e=>e.scrollTop)-scroll)).toBeLessThanOrEqual(2);
 await expect(row).toBeFocused();
});
test('independent: offline mutation disabled, stale error preserves data, retry recovers',async({page,context})=>{
 await open(page);const d=page.locator('dialog[open]');
 await context.setOffline(true);
 await expect(d.getByRole('button',{name:'Đánh dấu tất cả đã đọc',exact:true})).toBeDisabled();
 await expect(d.locator('.hn-notification-banner')).toBeVisible();
 await expect(d.locator('.hn-notification-toggle-read')).toBeDisabled();
 await expect(page.locator('#persisted-unread')).toHaveText('2');
 await context.setOffline(false);await expect(d.locator('.hn-notification-toggle-read')).toBeEnabled();
 await page.keyboard.press('Escape');await page.locator('#fault').click();await page.locator('#open-center').click();
 await expect(d.getByRole('alert')).toBeVisible();await expect(d.locator('.hn-notification-banner')).toBeVisible();
 await page.locator('dialog[open] [data-notification-id="QA-DESIGN-2"]').click();
 await d.getByRole('button',{name:'Đánh dấu đã đọc',exact:true}).click();
 await expect(d.getByRole('alert')).toBeVisible();await expect(page.locator('#persisted-unread')).toHaveText('2');
 await page.screenshot({path:`${evidence}/independent-stale-error.png`});
 await page.keyboard.press('Escape');await page.locator('#recover').click();await page.locator('#open-center').click();
 await expect(d.getByRole('alert')).toHaveCount(0);await expect(page.locator('#persisted-unread')).toHaveText('2');
});
test('independent: focus trap in both directions and Escape restores opener',async({page})=>{
 await open(page);for(let i=0;i<24;i++){await page.keyboard.press(i<12?'Shift+Tab':'Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('dialog[open]'))).toBe(true);}
 expect(await page.evaluate(()=>getComputedStyle(document.body).overflow)).toBe('hidden');
 await page.keyboard.press('Escape');await expect(page.locator('#open-center')).toBeFocused();
 await page.locator('#open-center').click();await expect(page.locator('#persisted-unread')).toHaveText('2');
});
test('independent: desktop anatomical order, visible controls and tablet touch geometry',async({page})=>{
 await open(page);
 const checks=await page.locator('dialog[open]').evaluate(d=>{
  const q=(s:string)=>d.querySelector<HTMLElement>(s)!;const r=(s:string)=>{const a=q(s).getBoundingClientRect();return {x:a.x,y:a.y,w:a.width,h:a.height,bottom:a.bottom,right:a.right}};
  const order=['.hn-notification-category','.hn-notification-detail-title','.hn-notification-detail-metadata','.hn-notification-detail-body','.hn-notification-business-card','.hn-notification-detail-actions','.hn-notification-detail-footer'].map(r);
  return {order,search:r('.hn-notification-search'),right:r('.hn-notification-detail-pane-wrap'),modal:r('.hn-global-modal__surface'),buttons:Array.from(d.querySelectorAll<HTMLElement>('button,a,input')).filter(e=>e.getClientRects().length&&!e.closest('.hn-notification-list-scroll')).map(e=>{const a=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')??e.textContent,x:a.x,y:a.y,w:a.width,h:a.height,right:a.right,bottom:a.bottom}}),back:getComputedStyle(q('.hn-notification-detail-back')).display};
 });
 expect(checks.search.right).toBeLessThanOrEqual(checks.right.x);expect(checks.back).toBe('none');
 for(let i=1;i<checks.order.length;i++)expect(checks.order[i].y).toBeGreaterThanOrEqual(checks.order[i-1].bottom-1);
 for(const c of checks.buttons){expect(c.x).toBeGreaterThanOrEqual(checks.modal.x);expect(c.right).toBeLessThanOrEqual(checks.modal.right+1);}
 // The compact dialog deliberately scrolls long details. Every enabled control
 // must become reachable inside that pane, including actions below the fold.
 const controls=page.locator('dialog[open] .hn-notification-detail-pane button:visible:not(:disabled), dialog[open] .hn-notification-detail-pane a:visible');
 for(let i=0;i<await controls.count();i++){await controls.nth(i).scrollIntoViewIfNeeded();const r=await controls.nth(i).boundingBox();expect(r!.y).toBeGreaterThanOrEqual(checks.modal.y);expect(r!.y+r!.height).toBeLessThanOrEqual(checks.modal.bottom+1);}
 await page.setViewportSize({width:800,height:1280});
 const targets=await page.locator('dialog[open]').evaluate(d=>Array.from(d.querySelectorAll<HTMLElement>('button,input')).filter(e=>e.getClientRects().length&&!e.closest('[style*="display: none"]')).map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')??e.textContent,width:r.width,height:r.height}}));
 for(const c of targets){expect(c.height,`${c.label} height`).toBeGreaterThanOrEqual(44);expect(c.width,`${c.label} width`).toBeGreaterThanOrEqual(44);}
 await fs.writeFile(`${evidence}/independent-geometry.json`,JSON.stringify({checks,targets},null,2));
});
