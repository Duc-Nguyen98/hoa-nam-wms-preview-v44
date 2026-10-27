import {test,expect,type Page} from '@playwright/test';
test.beforeEach(async({page})=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>errors.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));(page as any).qaErrors=errors;});
test.afterEach(async({page},info)=>{await info.attach('console-errors',{body:JSON.stringify((page as any).qaErrors),contentType:'application/json'});expect((page as any).qaErrors).toEqual([]);});
async function open(page:Page,state='ready',language='vi',theme='light'){
 await page.clock.setFixedTime(new Date('2026-10-25T05:00:00Z'));
 await page.addInitScript(({language,theme})=>{localStorage.setItem('hn-wms.s00.language.v1',language);localStorage.setItem('hn-wms.s00.theme.v1',theme);},{language,theme});
 await page.goto(`/tests/visual/notification.html?run=hn-nc-003-${Date.now()}-${Math.random()}&state=${state}`);
 await page.locator('#open-center').click();await expect(page.locator('dialog[open]')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
}
test('F-NC-003-LIFECYCLE search/filter read-unread navigation mark-all persistence and verified deep link',async({page})=>{
 await open(page);const d=page.locator('dialog[open]');await expect(d.locator('.hn-notification-item')).toHaveCount(6);await expect(page.locator('#persisted-unread')).toHaveText('2');
 await d.locator('[data-notification-id="QA-DESIGN-2"]').click();await expect(page.locator('#persisted-unread')).toHaveText('2');
 await d.getByRole('button',{name:'Đánh dấu đã đọc',exact:true}).click();await expect(page.locator('#persisted-unread')).toHaveText('1');await d.getByRole('button',{name:'Đánh dấu chưa đọc',exact:true}).click();await expect(page.locator('#persisted-unread')).toHaveText('2');
 await d.getByRole('tab',{name:/Chưa đọc/}).click();await expect(d.locator('.hn-notification-item')).toHaveCount(2);await d.getByRole('searchbox').fill('NO-RESULT-HN-003');await expect(d.locator('.hn-notification-item')).toHaveCount(0);await expect(d.locator('[data-notification-detail]')).toHaveCount(0);
 await d.getByRole('searchbox').fill('');await d.getByRole('tab',{name:/Tất cả/}).click();await d.locator('[data-notification-id="QA-DESIGN-1"]').click();await d.getByRole('button',{name:'Thông báo tiếp theo',exact:true}).click();await expect(d.locator('[data-notification-detail]')).toHaveAttribute('data-notification-detail','QA-DESIGN-2');await d.getByRole('button',{name:'Thông báo trước',exact:true}).click();await expect(d.locator('[data-notification-detail]')).toHaveAttribute('data-notification-detail','QA-DESIGN-1');
 await d.getByRole('button',{name:'Đánh dấu tất cả đã đọc',exact:true}).click();await expect(page.locator('#persisted-unread')).toHaveText('0');await page.keyboard.press('Escape');await page.reload();await page.locator('#open-center').click();await expect(page.locator('#persisted-unread')).toHaveText('0');
 const link=d.locator('.hn-notification-primary');await expect(link).toHaveAttribute('href',/^#\/preview\/S15\?source=notification&/);const href=await link.getAttribute('href');await link.click();await expect(d).toHaveCount(0);expect(new URL(page.url()).hash).toBe(href);
});
for(const state of ['empty','loading','error','unverified','many'])test(`F-NC-003-STATE-${state}`,async({page},info)=>{
 await open(page,state);const d=page.locator('dialog[open]');
 if(state==='empty')await expect(d.locator('.hn-notification-item')).toHaveCount(0);
 if(state==='loading'||state==='error'){await expect(d.locator('.hn-notification-item')).toHaveCount(0);await page.keyboard.press('Escape');await page.locator('#recover').click();await page.locator('#open-center').click();await expect(d.locator('.hn-notification-item')).toHaveCount(6);}
 if(state==='unverified'){await expect(d.locator('.hn-notification-primary')).toHaveCount(0);await expect(d.locator('.hn-notification-missing-data')).toBeVisible();}
 if(state==='many'){await expect(d).toContainText('99+');await d.getByRole('button',{name:'Xem thêm thông báo',exact:true}).click();await expect(d.locator('.hn-notification-item')).toHaveCount(100);}
 expect(await d.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await info.attach('actual-state',{body:await page.screenshot(),contentType:'image/png'});
});
for(const width of [1920,800])for(const language of ['vi','en','zh-CN'])for(const theme of ['light','dark'])test(`F-NC-003-I18N-${width}-${language}-${theme}`,async({page},info)=>{
 await page.setViewportSize({width,height:width===1920?1080:1280});await open(page,'ready',language,theme);const d=page.locator('dialog[open]');await expect(d.locator('.hn-notification-item')).toHaveCount(6);expect(await d.innerText()).not.toMatch(/undefined|\[object Object\]|notifications\.[a-z]/i);expect(await d.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await info.attach('actual-locale-theme',{body:await page.screenshot(),contentType:'image/png'});
});
test('F-NC-003-MAIN-SESSION authenticated notifications close before logout; anonymous route exposes no prior data',async({page},info)=>{
 await page.goto('/#/preview/S01');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await expect(page.locator('.ov-result-count')).toBeVisible({timeout:90000});
 await page.locator('.hn-notifications').click();await expect(page.locator('dialog[open] .hn-notification-item')).toHaveCount(6);await page.keyboard.press('Escape');await expect(page.locator('.hn-notifications')).toBeFocused();
 await page.locator('.hn-profile').click();await page.locator('.hn-profile-menu-logout').click();await page.getByRole('dialog').getByRole('button',{name:'Đăng xuất',exact:true}).click();await expect(page.locator('#s07-username')).toBeVisible();await expect(page.locator('.hn-notification-item')).toHaveCount(0);await expect(page.locator('.hn-notifications')).toHaveCount(0);
 await page.goto('/#/preview/S01');await expect(page.locator('#s07-username')).toBeVisible();await expect(page.locator('.hn-notification-item')).toHaveCount(0);await info.attach('logged-out-safe-ui',{body:await page.screenshot(),contentType:'image/png'});
});
