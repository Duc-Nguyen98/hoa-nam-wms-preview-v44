import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const evidence=path.resolve('output','notification-design-data-20261025');
async function open(page:Page,options:{state?:string;before?:boolean;language?:string;theme?:string;run?:string}={}){
 await page.clock.setFixedTime(new Date('2026-10-25T05:00:00Z'));
 await page.addInitScript(({language,theme})=>{localStorage.setItem('hn-wms.s00.language.v1',language);localStorage.setItem('hn-wms.s00.theme.v1',theme);},{language:options.language??'vi',theme:options.theme??'light'});
 const q=new URLSearchParams({run:options.run??`${Date.now()}-${Math.random()}`,state:options.state??'ready',...(options.before?{before:'1'}:{})});
 await page.goto(`/tests/visual/notification.html?${q}`);
 await page.locator('#open-center').click();
 await expect(page.locator('dialog[open]')).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);
 await page.addStyleTag({content:'*,*::before,*::after {animation:none!important;transition:none!important;caret-color:transparent!important;}'});
 if(!['loading','error'].includes(options.state??''))await expect(page.locator('#persisted-unread')).not.toBeEmpty();
}
async function shot(page:Page,name:string){await fs.mkdir(evidence,{recursive:true});await page.screenshot({path:path.join(evidence,`${name}.png`),animations:'disabled'});await page.locator('dialog[open]').screenshot({path:path.join(evidence,`${name}-modal.png`),animations:'disabled'});}
async function measure(page:Page){return page.locator('dialog[open]').evaluate(dialog=>{const rect=dialog.getBoundingClientRect();const select=(s:string)=>{const e=dialog.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,height:r.height,font:c.fontFamily,size:c.fontSize,line:c.lineHeight,weight:c.fontWeight,padding:c.padding,gap:c.gap,color:c.color,background:c.backgroundColor,border:c.border,radius:c.borderRadius,overflow:c.overflow,display:c.display};};return {viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},modal:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},header:select('.hn-global-modal__header'),list:select('.hn-notification-list-pane'),detail:select('.hn-notification-detail-pane-wrap'),search:select('.hn-notification-search'),row:select('.hn-notification-item'),title:select('.hn-notification-item-copy strong'),overflow:dialog.scrollWidth>dialog.clientWidth+1};});}
for(const profile of [{name:'desktop',width:1920,height:1080,dpr:1},{name:'tablet',width:800,height:1280,dpr:2}]){
 test(`${profile.name} approved-reference captures and measured structure`,async({browser})=>{
 const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:profile.dpr,locale:'vi-VN',timezoneId:'Asia/Bangkok'});const page=await ctx.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await open(page);await shot(page,`${profile.name}-after`);const metrics=await measure(page);await fs.writeFile(path.join(evidence,`${profile.name}-metrics.json`),JSON.stringify(metrics,null,2));
 expect(metrics.overflow).toBe(false);expect(metrics.modal.y).toBeGreaterThanOrEqual(12);expect(metrics.modal.y+metrics.modal.height).toBeLessThanOrEqual(profile.height-12);
 if(profile.name==='desktop'){expect(metrics.search!.x).toBeLessThan(metrics.detail!.x);expect(metrics.search!.x+metrics.search!.width).toBeLessThanOrEqual(metrics.detail!.x);expect(metrics.detail!.display).not.toBe('none');}
 else {expect(metrics.detail!.display).toBe('none');await page.locator('[data-notification-id="QA-DESIGN-1"]').click();await shot(page,'tablet-detail');await page.getByRole('button',{name:'Quay lại danh sách'}).click();await expect(page.locator('[data-notification-id="QA-DESIGN-1"]')).toBeFocused();}
 expect(errors).toEqual([]);await ctx.close();
 });
 test(`${profile.name} immutable old implementation capture`,async({browser})=>{const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:profile.dpr,locale:'vi-VN',timezoneId:'Asia/Bangkok'});const page=await ctx.newPage();await open(page,{before:true});await shot(page,`${profile.name}-before`);await ctx.close();});
}
test('selection, read/unread, search, filters, pagination, focus and persistence',async({page})=>{
 await page.setViewportSize({width:1920,height:1080});const run=`persist-${Date.now()}`;await open(page,{run});
 const d=page.locator('dialog[open]');await expect(page.locator('#persisted-unread')).toHaveText('2');
 await page.locator('[data-notification-id="QA-DESIGN-2"]').click();await expect(page.locator('#persisted-unread')).toHaveText('2');
 await d.getByRole('button',{name:'Đánh dấu đã đọc',exact:true}).click();await expect(page.locator('#persisted-unread')).toHaveText('1');
 await d.getByRole('button',{name:'Đánh dấu chưa đọc',exact:true}).click();await expect(page.locator('#persisted-unread')).toHaveText('2');
 await d.getByRole('tab',{name:/Chưa đọc/}).click();await expect(page.locator('.hn-notification-item')).toHaveCount(2);
 await page.locator('dialog[open] .hn-notification-search input').fill('Không có kết quả này');await expect(page.locator('.hn-notification-item')).toHaveCount(0);await expect(page.locator('[data-notification-detail]')).toHaveCount(0);await shot(page,'no-results');
 await page.locator('dialog[open] .hn-notification-search input').fill('');await d.getByRole('tab',{name:/Tất cả/}).click();await page.locator('[data-notification-id="QA-DESIGN-1"]').click();
 await d.getByRole('button',{name:/Thông báo tiếp theo/}).click();await expect(page.locator('[data-notification-detail="QA-DESIGN-2"]')).toBeVisible();
 await d.getByRole('button',{name:/Thông báo trước/}).click();await expect(page.locator('[data-notification-detail="QA-DESIGN-1"]')).toBeVisible();
 await d.getByRole('button',{name:'Đánh dấu tất cả đã đọc',exact:true}).click();await expect(page.locator('#persisted-unread')).toHaveText('0');
 await page.keyboard.press('Escape');await expect(d).toHaveCount(0);await expect(page.locator('#open-center')).toBeFocused();
 await page.reload();await page.locator('#open-center').click();await expect(page.locator('#persisted-unread')).toHaveText('0');await shot(page,'all-read-persisted');
 for(let i=0;i<18;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('dialog[open]'))).toBe(true);}
});
for(const state of ['empty','loading','error','long','many'])test(`state ${state}`,async({page})=>{await page.setViewportSize({width:1920,height:1080});await open(page,{state});await shot(page,`state-${state}`);expect((await measure(page)).overflow).toBe(false);if(state==='many'){await expect(page.locator('dialog[open]')).toContainText('99+');await page.getByRole('button',{name:'Xem thêm thông báo'}).click();await expect(page.locator('.hn-notification-item')).toHaveCount(100);}});
for(const language of ['vi','en','zh-CN'])for(const theme of ['light','dark'])test(`locale ${language} ${theme}`,async({page})=>{await page.setViewportSize({width:800,height:1280});await open(page,{language,theme});await shot(page,`tablet-${language}-${theme}`);expect((await measure(page)).overflow).toBe(false);expect(await page.locator('dialog[open]').innerText()).not.toMatch(/undefined|\[object Object\]/);});
for(const viewport of [{width:1280,height:720},{width:1024,height:1366},{width:1600,height:2560},{width:600,height:640},{width:400,height:540}])test(`responsive ${viewport.width}x${viewport.height}`,async({page})=>{await page.setViewportSize(viewport);await open(page);await shot(page,`responsive-${viewport.width}x${viewport.height}`);const m=await measure(page);expect(m.overflow).toBe(false);expect(m.modal.x).toBeGreaterThanOrEqual(5);expect(m.modal.y).toBeGreaterThanOrEqual(5);expect(m.modal.height+m.modal.y).toBeLessThanOrEqual(viewport.height-5);if(viewport.height>viewport.width)expect(m.detail!.display).toBe('none');});

test('desktop dark selected-row contrast and stable screenshot rendering',async({page})=>{
 await page.setViewportSize({width:1920,height:1080});await open(page,{theme:'dark'});await shot(page,'desktop-dark');
 const row=page.locator('dialog[open] .hn-notification-item[data-selected="true"]');
 const contrast=await row.evaluate(e=>{const lum=(c:string)=>{const a=c.match(/[\d.]+/g)!.slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return a[0]*.2126+a[1]*.7152+a[2]*.0722;};const c=getComputedStyle(e),fg=lum(c.color),bg=lum(c.backgroundColor);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);});expect(contrast).toBeGreaterThanOrEqual(4.5);
 const first=await page.locator('dialog[open]').screenshot({animations:'disabled'});const second=await page.locator('dialog[open]').screenshot({animations:'disabled'});
 expect(first.equals(second)).toBe(true); // Determinism control only, NOT an approved-design baseline.
});

test('unverified document has no fabricated fields or link; verified fixture link closes modal',async({page})=>{
 await page.setViewportSize({width:1920,height:1080});await open(page,{state:'unverified'});
 const d=page.locator('dialog[open]');await expect(d.locator('.hn-notification-primary')).toHaveCount(0);await expect(d.locator('.hn-notification-missing-data')).toBeVisible();await shot(page,'state-unverified');
 await open(page);const link=page.locator('dialog[open] .hn-notification-primary');await expect(link).toHaveAttribute('href','#/preview/S15');await link.click();await expect(page.locator('dialog[open]')).toHaveCount(0);expect(new URL(page.url()).hash).toBe('#/preview/S15');
});

test('actual local S01 shell opens approved data and persists read state without extra labels',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-25T05:00:00Z'));
 await page.setViewportSize({width:1920,height:1080});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/#/preview/S01');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();
 const bell=page.getByRole('button',{name:/^Thông báo(?: · \d+)?$/});await bell.click();const d=page.locator('dialog[open]');await expect(d.locator('.hn-notification-item')).toHaveCount(6);await expect(d.locator('.hn-notification-heading-badge')).toHaveText('2 chưa đọc');await expect(d).toContainText('PX-0021');expect(await d.innerText()).not.toMatch(/mock|demo|dữ liệu (ảo|mẫu)|sample/i);await shot(page,'local-S01-real-shell-desktop');
 await page.setViewportSize({width:800,height:1280});await expect(d.locator('.hn-notification-detail-pane-wrap')).toBeHidden();await shot(page,'local-S01-real-shell-tablet');await d.locator('[data-notification-id="PREVIEW-DESIGN-2"]').click();await d.getByRole('button',{name:'Đánh dấu đã đọc',exact:true}).click();await expect(d.locator('.hn-notification-heading-badge')).toHaveText('1 chưa đọc');await page.keyboard.press('Escape');await expect(bell).toBeFocused();
 await page.reload();await bell.click();await expect(page.locator('dialog[open] .hn-notification-item')).toHaveCount(6);await expect(page.locator('dialog[open] .hn-notification-heading-badge')).toHaveText('1 chưa đọc');expect(errors).toEqual([]);
});
