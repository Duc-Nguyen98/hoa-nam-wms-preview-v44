import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const base=process.env.NOTIF_VISUAL_BASE??'http://127.0.0.1:5186',phase=process.env.NOTIF_VISUAL_PHASE??'before',baseline=phase==='before',out=`output/notification-visual-${phase}`;
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1920,height:1080},permissions:['clipboard-read','clipboard-write']}),results=[],references=[],errors=[];
page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));const dialog=()=>page.locator('#hn-preview-notification-center[open]'),links=[];
async function metrics(root){return root.evaluate(e=>{const read=s=>{const el=e.querySelector(s);if(!el)return null;const c=getComputedStyle(el),r=el.getBoundingClientRect();return {font:c.fontSize,line:c.lineHeight,weight:c.fontWeight,padding:c.padding,marginBottom:c.marginBottom,radius:c.borderRadius,width:r.width,height:r.height,x:r.x,y:r.y};};return {title:read('h1'),code:read('[data-record-reference]'),heading:read('.nsd-panel h3'),label:read('dt'),value:read('dd'),panel:read('.nsd-panel'),copy:read('.nsd-code button'),back:read('.hn-page-actions button'),list:read('.nsd-footer button'),status:read('.nsd-identity .hn-status-badge'),columns:getComputedStyle(e.querySelector('dl')).gridTemplateColumns,buttons:[...e.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return {label:b.getAttribute('aria-label')??b.textContent,width:r.width,height:r.height,x:r.x,right:r.right};})};});}
// Keep local QA stable while other owned screens are edited in the same checkout.
if(base.startsWith('http://127.0.0.1:'))await page.routeWebSocket(url=>url.hostname==='127.0.0.1',()=>{});
try{
 await page.goto(base+'/#/preview/S07');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.locator('.ov-result-count').waitFor();
 await page.locator('.hn-notifications').click();for(let i=0;i<6;i++){await dialog().locator(`[data-notification-id="PREVIEW-DESIGN-${i+1}"]`).click();links.push(await dialog().locator('.hn-notification-primary').getAttribute('href'));}await page.keyboard.press('Escape');
 for(const [layout,width,height] of [['desktop',1920,1080],['tablet',800,1280]]){
  await page.setViewportSize({width,height});
  if(baseline)for(const screen of ['S12','S15']){await page.goto(base+'/#/preview/'+screen);const opener=screen==='S12'?page.locator(width>1100?'.s12-operational-table button':'.s12-operational-cards [data-s12-detail-open]'):page.locator('[data-s15-operational-action]:visible');await opener.first().click();await page.locator('dialog[open]').waitFor();await page.screenshot({path:`${out}/${layout}-reference-${screen}.png`,fullPage:true});references.push({layout,screen});await page.keyboard.press('Escape');}
  for(const theme of ['light','dark'])for(const language of (baseline?['vi']:['vi','en','zh'])){
   await page.evaluate(({theme,language})=>{localStorage.setItem('hn-wms.s00.theme.v1',theme);localStorage.setItem('hn-wms.s00.language.v1',language);},{theme,language});await page.reload();await page.locator(".hn-shell").waitFor();
   for(let i=0;i<6;i++){
    await page.goto(base+'/'+links[i]);const root=page.locator('.nsd-screen');await root.waitFor();await expect(root).toHaveAttribute('data-notification-source-id',`PREVIEW-DESIGN-${i+1}`);await page.evaluate(()=>document.activeElement?.blur());const measured=await metrics(root);await page.mouse.move(0,0);if(language==='vi')await page.screenshot({path:`${out}/${layout}-${theme}-${i+1}.png`,fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    if(!baseline){
     for(const b of measured.buttons){expect(b.width,JSON.stringify(b)).toBeGreaterThanOrEqual(44);expect(b.height,JSON.stringify(b)).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(width+1);}
     expect(measured.label.font).toBe('15px');expect(measured.label.marginBottom).toBe('8px');expect(measured.value.font).toBe('18px');expect(measured.panel.padding).toBe('24px');expect(measured.back.font).toBe('16px');expect(measured.list.font).toBe('16px');expect(measured.status.font).toBe('14px');
     if(language==='vi'){const reference=await root.locator('[data-record-reference]').textContent();await root.locator('.nsd-code button').focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(reference);await expect(root.locator('[role="status"]')).toBeVisible();
     await root.locator('.hn-page-actions button').click();await expect(dialog().locator('[data-notification-detail]')).toHaveAttribute('data-notification-detail',`PREVIEW-DESIGN-${i+1}`);await page.keyboard.press('Escape');
     await root.locator('.nsd-footer button').click();await expect(page).toHaveURL(base+'/#/preview/'+['S15','S23','S16','S12','S09','S11'][i]);await page.goto(base+'/'+links[i]);await expect(root).toHaveAttribute('data-notification-source-id',`PREVIEW-DESIGN-${i+1}`);await page.evaluate(()=>document.activeElement?.blur());}
    }
    results.push({layout,theme,language,record:i+1,...measured});
   }
  }
 }
 expect(errors).toEqual([]);console.log(JSON.stringify({phase,scenarios:results.length,errors}));
}catch(e){await page.screenshot({path:out+'/failure.png',fullPage:true});throw e;}finally{await fs.writeFile(out+'/results.json',JSON.stringify({base,results,references,errors},null,2));await browser.close();}
