import {chromium,expect} from '@playwright/test';import fs from 'node:fs/promises';
const base=process.env.REVERSAL_BASELINE_BASE??'https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site',out='output/reversal-v46-before';
const build=await(await fetch(base+'/build-info.json')).json();expect(build.buildId).toBe('c48d9f3dfc76a37acb73d3dfb0955721655d6b3e04f6d7609df9ebaa0ae361e4');
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1920,height:1080}}),page=await context.newPage(),errors=[],checks=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
const selectors={S17:'[data-operational-reversals]',S10:'[data-operational-parts-issues]',S16:'[data-operational-inventory]',S21:'[data-operational-stock-report]',S22:'[data-operational-warranty-report]'};
try{
 await page.goto(base+'/#/preview/S07');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.locator('.ov-result-count').waitFor();
 await context.storageState({indexedDB:true,path:'output/demo-v46-browser-state.json'});
 for(const [device,width,height] of [['desktop',1920,1080],['tablet',800,1280]]){
  await page.setViewportSize({width,height});
  for(const screen of ['S17','S10','S16','S21','S22']){
   await page.goto(base+'/#/preview/'+screen);const root=page.locator(selectors[screen]);await root.waitFor();
   if(screen==='S17')await expect(root).toContainText('Chưa có phiếu hoàn trong phiên hiện tại.');
   else if(screen==='S16'){await expect(root.locator('[data-inventory-quantity]:visible')).toHaveCount(2);expect(await root.locator('[data-inventory-quantity]:visible').evaluateAll(ns=>ns.map(n=>Number(n.dataset.inventoryQuantity)).sort((a,b)=>a-b))).toEqual([1,16]);}
   else await root.locator('tbody tr').first().waitFor();
   await page.evaluate(()=>{document.activeElement?.blur();return document.fonts.ready;});await page.screenshot({path:`${out}/${device}-${screen}-list.png`,fullPage:true});
   if(screen==='S17')await root.getByRole('button',{name:'Tạo phiếu hoàn',exact:true}).click();
   if(screen==='S10'||screen==='S22')await root.locator(`[data-${screen.toLowerCase()}-operational-action]`).click();
   if(screen==='S16')await root.locator('[data-s16-operational-action]:visible').last().click();
   if(screen!=='S21'){const modal=page.locator('dialog[open]');await modal.waitFor();await page.screenshot({path:`${out}/${device}-${screen}-${screen==='S17'?'create':'detail'}.png`});await page.keyboard.press('Escape');}
   checks.push(`${device} ${screen} v46 before`);
  }
 }
 expect(errors).toEqual([]);console.log(JSON.stringify({checks,errors}));
}finally{await fs.writeFile(out+'/results.json',JSON.stringify({buildId:build.buildId,base,checks,errors},null,2));await browser.close();}
