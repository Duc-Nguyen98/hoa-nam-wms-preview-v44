import {chromium, expect} from '@playwright/test';
import fs from 'node:fs/promises';
const base=process.env.INVENTORY_BASE??'http://127.0.0.1:5334';
const out=process.env.INVENTORY_OUT??'docs/qa/inventory/HN-INVENTORY-32REF-001/functional';
if(!process.env.HN_QA_USERNAME||!process.env.HN_QA_PASSWORD)throw Error('Supply HN_QA_USERNAME/HN_QA_PASSWORD for normal login.');
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true}),results=[],errors=[],snapshots=[];let failure;
try{
 for(const [name,width,height,dpr] of [['desktop',1920,1080,1],['tablet',800,1280,2]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,locale:'vi-VN',timezoneId:'Asia/Bangkok'});const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try{
   await page.goto(base+'/#/preview/S07');await page.locator('#s07-username').fill(process.env.HN_QA_USERNAME);await page.locator('#s07-password').fill(process.env.HN_QA_PASSWORD);await page.locator('.s07-submit').click();await page.getByRole('button',{name:'Bắt đầu làm việc',exact:true}).click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.locator('.ov-result-count').waitFor({timeout:90000});
   const read=()=>page.evaluate(async()=>{const {createOperationalWebAdapter}=await import('/src/data/http/operational-preview-adapter.ts');return createOperationalWebAdapter(undefined,{scope:'inventory-fidelity-read-audit'}).read();});const before=await read();
   for(const [screen,selector] of [['S16','[data-operational-inventory]'],['S11','[data-operational-trays]'],['S20','[data-operational-movement-ledger]'],['S21','[data-operational-stock-report]']]){
    await page.goto(base+'/#/preview/'+screen);const root=page.locator(selector);await root.waitFor();await expect(root.locator('[data-state="loading"]')).toHaveCount(0,{timeout:30000});await root.locator('tbody tr').first().waitFor({state:'attached',timeout:30000});
    const metadata=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,overflow:document.documentElement.scrollWidth>innerWidth+1,layout:document.querySelector('.hn-shell')?.getAttribute('data-layout')}));expect(metadata.dpr).toBe(dpr);expect(metadata.overflow).toBe(false);
    results.push({name,screen,metadata,rows:await root.locator('tbody tr').count(),states:await root.locator('[data-state]:visible').evaluateAll(ns=>ns.map(n=>n.dataset.state)),title:await page.locator('main h1').innerText()});await page.screenshot({path:`${out}/before-${name}-${screen}.png`,fullPage:true});
    if(screen==='S16'){const search=root.locator('#s16-operational-search');await search.fill('ZX-999');await expect(root.locator('[data-state="no-results"]:visible').first()).toBeVisible();await search.clear();const action=root.locator('[data-s16-operational-action]:visible').first();await action.click();await page.locator('dialog[open] [data-inventory-sku-id]').waitFor();await page.keyboard.press('Escape');await expect(action).toBeFocused();}
    if(screen==='S11'){const action=root.locator('[data-s11-operational-action]:visible').first();await action.click();await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');await expect(action).toBeFocused();}
   }
   const after=await read();expect(after).toEqual(before);snapshots.push({name,snapshotRevision:before.snapshotRevision,preserved:JSON.stringify(before)===JSON.stringify(after)});
  }finally{await context.close();}
 }
}catch(e){failure=e.stack;}finally{const result={base,mode:'MOCK',source:'normal-login-confirm-setup',results,errors,failure,snapshots,readOnlySnapshotPreserved:snapshots.length===2&&snapshots.every(x=>x.preserved)};await fs.writeFile(out+'/baseline-browser.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();}if(failure)process.exitCode=1;
