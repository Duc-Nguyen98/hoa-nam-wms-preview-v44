import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='output/reference-final',base=process.env.PREVIEW_URL??'http://127.0.0.1:5186';
await fs.mkdir(out+'/qa',{recursive:true});
const browser=await chromium.launch(),results=[],errors=[];
async function open(width=1774,height=887,state='ready',language='vi',theme='light'){
 const p=await browser.newPage({viewport:{width,height}});
 p.on('pageerror',e=>errors.push(e.message));
 await p.clock.setFixedTime(new Date('2026-10-25T05:00:00Z'));
 await p.addInitScript(({language,theme})=>{localStorage.setItem('hn-wms.s00.language.v1',language);localStorage.setItem('hn-wms.s00.theme.v1',theme);},{language,theme});
 await p.goto(`${base}/tests/visual/notification.html?source-identity=1&state=${state}&run=final-${Date.now()}-${Math.random()}`);
 await p.locator('#open-center').click();
 await expect(p.locator('dialog[open]')).toBeVisible();
 if(!['empty','loading','error'].includes(state))await expect(p.locator('dialog[open] [data-notification-id]').first()).toBeVisible();
 await p.evaluate(()=>document.fonts.ready);
 return p;
}
const p=await open(),d=p.locator('dialog[open]'),search=d.locator('input[type=search]');
await expect(d.locator('[data-notification-id]')).toHaveCount(6);
await expect(d.locator('.hn-notification-primary')).toHaveAttribute('href',/S15\?.*record/);
await search.fill('hoang minh');await expect(d.locator('[data-notification-id]')).toHaveCount(1);
await search.fill('no-match-123');await expect(d.locator('[data-notification-id]')).toHaveCount(0);
await d.getByRole('button',{name:'Tất cả',exact:true}).click();await expect(d.locator('[data-notification-id]')).toHaveCount(6);
results.push('search: accent-insensitive, no-results and reset');
await d.getByRole('tab',{name:/Chưa đọc/}).click();await expect(d.locator('[data-notification-id]')).toHaveCount(2);
await d.locator('[data-notification-id="PREVIEW-DESIGN-2"]').click();await expect(p.locator('#persisted-unread')).toHaveText('2');
await d.getByRole('button',{name:'Đánh dấu đã đọc',exact:true}).click();await expect(p.locator('#persisted-unread')).toHaveText('1');
await d.getByRole('tab',{name:/Tất cả/}).click();
await d.locator('[data-notification-id="PREVIEW-DESIGN-2"]').click();
await d.getByRole('button',{name:'Đánh dấu chưa đọc',exact:true}).click();await expect(p.locator('#persisted-unread')).toHaveText('2');
await d.getByRole('button',{name:/Thông báo trước/}).click();await expect(d.locator('[data-notification-detail]')).toHaveAttribute('data-notification-detail','PREVIEW-DESIGN-1');
await d.getByRole('button',{name:/Thông báo tiếp theo/}).click();await expect(d.locator('[data-notification-detail]')).toHaveAttribute('data-notification-detail','PREVIEW-DESIGN-2');
await d.locator('.hn-notification-mark-all').click();await expect(p.locator('#persisted-unread')).toHaveText('0');
await p.keyboard.press('Escape');await expect(d).toHaveCount(0);await expect(p.locator('#open-center')).toBeFocused();
await p.reload();await p.locator('#open-center').click();await expect(p.locator('#persisted-unread')).toHaveText('0');
for(let i=0;i<16;i++){await p.keyboard.press('Tab');assert(await p.evaluate(()=>!!document.activeElement?.closest('dialog[open]')));}
await d.locator('.hn-notification-primary').click();await expect(d).toHaveCount(0);assert(new URL(p.url()).hash.includes('S15?'));
results.push('read/unread persistence, mark all, previous/next, focus trap, Escape and document link');await p.close();
for(const [w,h] of [[1774,887],[1920,1080],[1280,720],[992,1586],[800,1280],[390,844]]){
 const q=await open(w,h),dialog=q.locator('dialog[open]');
 const bounds=await dialog.evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,overflow:e.scrollWidth>e.clientWidth+1}});
 assert(bounds.x>=0&&bounds.y>=0&&bounds.right<=w&&bounds.bottom<=h&&!bounds.overflow,JSON.stringify(bounds));
 if(w<1001){await expect(dialog.locator('.hn-notification-detail-pane-wrap')).toBeHidden();await dialog.locator('[data-notification-id]').first().click();await expect(dialog.locator('.hn-notification-detail-pane-wrap')).toBeVisible();await dialog.locator('.hn-notification-detail-back').click();await expect(dialog.locator('[data-notification-id]').first()).toBeFocused();}
 await q.evaluate(()=>document.activeElement?.blur());await q.screenshot({path:`${out}/qa/ready-${w}.png`});results.push(`responsive ${w}x${h}, bounds and portrait navigation`);await q.close();
}
for(const state of ['empty','loading','error','long','many','unverified']){
 const q=await open(1774,887,state),dialog=q.locator('dialog[open]');
 assert(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 if(state==='unverified')await expect(dialog.locator('.hn-notification-primary')).toHaveCount(0);
 if(state==='many'){await dialog.getByRole('button',{name:'Xem thêm thông báo'}).click();await expect(dialog.locator('[data-notification-id]')).toHaveCount(100);}
 await q.screenshot({path:`${out}/qa/${state}.png`});results.push(`state ${state}`);await q.close();
}
for(const [language,theme] of [['vi','dark'],['en','light'],['zh-CN','dark']]){
 const q=await open(1774,887,'ready',language,theme),dialog=q.locator('dialog[open]');
 assert(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert(!/undefined|\[object Object\]/.test(await dialog.innerText()));
 await q.screenshot({path:`${out}/qa/${language}-${theme}.png`});results.push(`${language} ${theme}`);await q.close();
}
assert.deepEqual(errors,[]);
const before=JSON.parse(await fs.readFile(out+'/before/protected.json')),after=JSON.parse(await fs.readFile(out+'/after/protected.json'));
// The shell header contains a closed notification dialog. Compare visible
// protected elements so that hidden content is not mistaken for menu chrome.
const visible=rows=>rows.filter(row=>row.w>0&&row.h>0).map(row=>({...row,w:Math.round(row.w*100)/100,h:Math.round(row.h*100)/100}));
assert.deepEqual(visible(after),visible(before),'protected header/sidebar/footer styles and dimensions');results.push('protected visible header/sidebar/footer styles and dimensions unchanged');
await fs.writeFile(out+'/qa/results.json',JSON.stringify({passed:results.length,results,errors},null,2));
await browser.close();console.log(`PASS ${results.length} notification verification groups`);
