import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const base=process.env.NOTIF_RETURN_BASE??'http://127.0.0.1:5186',out='output/notification-return-local';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1920,height:1080}}),checks=[],errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
// Keep local QA stable while other owned screens are edited in the same checkout.
if(base.startsWith('http://127.0.0.1:'))await page.routeWebSocket(url=>url.hostname==='127.0.0.1',()=>{});
try{
 await page.goto(base+'/#/preview/S07');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.locator('.ov-result-count').waitFor();
 const dialog=page.locator('#hn-preview-notification-center[open]'),links=[];await page.locator('.hn-notifications').click();for(let i=0;i<6;i++){await dialog.locator(`[data-notification-id="PREVIEW-DESIGN-${i+1}"]`).click();links.push(await dialog.locator('.hn-notification-primary').getAttribute('href'));}await page.keyboard.press('Escape');
 const before=await page.evaluate(async()=>{const {readBrowserPreviewRuntime}=await import('/src/preview-mock/browser-runtime.ts');const repo=readBrowserPreviewRuntime().notifications,read=repo.read.bind(repo),snapshot=await read();window.__restoreNotificationRead=()=>{repo.read=read;};repo.read=async(...args)=>{await new Promise(resolve=>setTimeout(resolve,500));return read(...args);};return snapshot.items.map(i=>({id:i.id,readAt:i.readAt}));});
 for(let i=0;i<6;i++){
  await page.evaluate(hash=>{location.hash=hash;},links[i]);const root=page.locator(`[data-notification-source-id="PREVIEW-DESIGN-${i+1}"]`);await root.waitFor();await root.getByRole('button',{name:'Quay lại thông báo',exact:true}).click();await expect(dialog.locator('[data-notification-detail]')).toHaveAttribute('data-notification-detail',`PREVIEW-DESIGN-${i+1}`);await page.keyboard.press('Escape');checks.push(`delayed initial read selects notification ${i+1}`);
 }
 const after=await page.evaluate(async()=>{window.__restoreNotificationRead();const {readBrowserPreviewRuntime}=await import('/src/preview-mock/browser-runtime.ts');return (await readBrowserPreviewRuntime().notifications.read()).items.map(i=>({id:i.id,readAt:i.readAt}));});expect(after).toEqual(before);
 for(let i=0;i<6;i++){
  await page.goto(base+'/'+links[i]);await page.reload();const root=page.locator(`[data-notification-source-id="PREVIEW-DESIGN-${i+1}"]`);await root.waitFor();await root.getByRole('button',{name:'Quay lại thông báo',exact:true}).click();await expect(dialog.locator('[data-notification-detail]')).toHaveAttribute('data-notification-detail',`PREVIEW-DESIGN-${i+1}`);await page.keyboard.press('Escape');checks.push(`reload selects notification ${i+1}`);
 }
 const reloaded=await page.evaluate(async()=>{const {readBrowserPreviewRuntime}=await import('/src/preview-mock/browser-runtime.ts');return (await readBrowserPreviewRuntime().notifications.read()).items.map(i=>({id:i.id,readAt:i.readAt}));});expect(reloaded).toEqual(before);expect(errors).toEqual([]);console.log(JSON.stringify({checks,readStatePreserved:true,errors}));
}catch(e){await page.screenshot({path:out+'/failure.png',fullPage:true});throw e;}finally{await fs.writeFile(out+'/results.json',JSON.stringify({checks,errors},null,2));await browser.close();}
