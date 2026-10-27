import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});(page as any).qaErrors=errors;});
test.afterEach(async({page},info)=>{await info.attach('console-errors',{body:JSON.stringify((page as any).qaErrors),contentType:'application/json'});expect((page as any).qaErrors).toEqual([]);});
for(const width of [1920,800])test(`F-CANARY-BADGE-${width} actual production CSS counts, accessible labels and negative control`,async({page},info)=>{
 await page.setViewportSize({width,height:width===1920?1080:1280});await page.goto('/tests/functional/canary-badge/badge.html');await expect(page.locator('[data-count]')).toHaveCount(7);
 const measurements=[];
 for(const count of [0,1,9,10,99,100,999]){
  const root=page.locator(`[data-count="${count}"]`),bell=root.getByRole('button',{name:`Thông báo · ${count}`,exact:true}),badge=root.locator('.hn-notifications__count');
  await expect(bell).toBeVisible();await bell.focus();await expect(bell).toBeFocused();
  if(count===0)await expect(badge).toHaveCount(0);
  else {await expect(badge).toHaveText(count>=100?'99+':String(count));await expect(badge).toBeVisible();const r=await badge.boundingBox();expect(r!.width).toBeGreaterThan(0);expect(r!.height).toBeGreaterThan(0);expect(r!.x).toBeGreaterThanOrEqual(0);expect(r!.x+r!.width).toBeLessThanOrEqual(width);measurements.push({count,...r});}
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 // Browser-only regression control reproduces the exact deleted suppression.
 // It does not mutate source or an approved baseline.
 const control=await page.addStyleTag({content:'.hn-shell .hn-notifications__count { display:none !important; }'});
 await expect(page.locator('[data-count="100"] .hn-notifications__count')).toBeHidden();
 await info.attach('negative-control',{body:'Exact prior suppression injected in test browser: positive-count badge becomes hidden; after removing control it must be visible.',contentType:'text/plain'});
 await control.evaluate(e=>(e as Element).remove());await expect(page.locator('[data-count="100"] .hn-notifications__count')).toBeVisible();
 await info.attach('badge-measurements',{body:JSON.stringify(measurements),contentType:'application/json'});
 await info.attach('actual-badges',{body:await page.screenshot(),contentType:'image/png'});
});
test('F-CANARY-MAIN actual S01 bell 2 → 1 → 0, dialog focus and reload persistence',async({page},info)=>{
 await page.goto('/#/preview/S01');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await expect(page.locator('.ov-result-count')).toBeVisible({timeout:90000});
 const bell=page.locator('.hn-notifications'),badge=bell.locator('.hn-notifications__count');await expect(badge).toHaveText('2');await expect(badge).toBeVisible();await expect(bell).toHaveAccessibleName('Thông báo · 2');
 await bell.click();const dialog=page.locator('dialog[open]');await expect(dialog).toBeVisible();await dialog.locator('[data-notification-id="PREVIEW-DESIGN-2"]').click();await dialog.getByRole('button',{name:'Đánh dấu đã đọc',exact:true}).click();await expect(badge).toHaveText('1');await expect(badge).toBeVisible();await page.keyboard.press('Escape');await expect(bell).toBeFocused();
 await page.reload();await expect(badge).toHaveText('1');await expect(badge).toBeVisible();await bell.click();await page.locator('dialog[open]').getByRole('button',{name:'Đánh dấu tất cả đã đọc',exact:true}).click();await expect(badge).toHaveCount(0);await expect(bell).toHaveAccessibleName('Thông báo · 0');await page.keyboard.press('Escape');await page.reload();await expect(bell).toHaveAccessibleName('Thông báo · 0');await expect(badge).toHaveCount(0);
 await info.attach('actual-s01-zero',{body:await page.screenshot(),contentType:'image/png'});
});
