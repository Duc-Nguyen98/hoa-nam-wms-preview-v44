import {chromium,expect} from '@playwright/test';import fs from 'node:fs/promises';
const base=process.env.AUDIT_BASE??'http://127.0.0.1:5186',phase=process.env.AUDIT_PHASE??'before',out=`output/reference-exact/${phase}`;
await fs.mkdir(out,{recursive:true});const saved=JSON.parse((await fs.readFile('output/reference-audit/session.json','utf8')).replaceAll('http://127.0.0.1:5189',base));const browser=await chromium.launch(),ctx=await browser.newContext({storageState:saved,viewport:{width:1672,height:941},permissions:['clipboard-read','clipboard-write']}),page=await ctx.newPage(),errors=[],checks=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
async function shot(name){await page.evaluate(()=>{document.activeElement?.blur();return document.fonts.ready});await page.mouse.move(0,0);await page.screenshot({path:`${out}/${name}.png`,fullPage:!name.includes("detail")&&!name.includes("create")&&!name.includes("validation")&&!name.includes("notifications")});checks.push(name);}
try{
if(false){await page.goto(base+'/#/preview/S07');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.locator('.ov-result-count').waitFor();await ctx.storageState({indexedDB:true,path:'output/reference-audit/session.json'});}else{await page.goto(base+'/#/preview/S01');await page.locator('.ov-result-count').waitFor();}
for(const [device,width,height] of [['desktop',1672,941],['tablet',992,1586]]){
await page.setViewportSize({width,height});
for(const screen of ['S01','S12','S15','S27']){
await page.goto(base+'/#/preview/'+screen);await page.locator({S01:'.ov-result-count',S12:'.s12-operational-results',S15:'[data-s15-operational-action]:visible',S27:'[data-audit-detail-open]:visible'}[screen]).first().waitFor();await shot(`${device}-${screen}-list`);
const opener={S01:'[data-overview-detail-opener]:visible',S12:'[data-s12-detail-open]:visible',S15:'[data-s15-operational-action]:visible',S27:'[data-audit-detail-open]:visible'}[screen];
await page.locator(opener).first().click();
await page.locator('dialog[open]').waitFor();await shot(`${device}-${screen}-detail`);await page.keyboard.press('Escape');
if(screen==='S12'){await page.getByRole('button',{name:'Tạo phiếu nhập',exact:true}).first().click();await shot(`${device}-S12-create`);await page.locator('.s12-receipt-header-form input').nth(0).fill('');await page.locator('.s12-receipt-header-form input').nth(1).fill('x'.repeat(201));await page.locator('button[form="s12-receipt-header-form"]').click();await shot(`${device}-S12-validation`);await page.keyboard.press('Escape');}
}
await page.goto(base+'/#/preview/S01');await page.locator('.ov-result-count').waitFor();await page.locator('.hn-notifications').click();await page.locator('#hn-preview-notification-center[open]').waitFor();await shot(`${device}-notifications-list`);if(device==='tablet'){await page.locator('[data-notification-id]').first().click();await shot(`${device}-notifications-detail`);}await page.keyboard.press('Escape');
}
expect(errors).toEqual([]);console.log(JSON.stringify({checks,errors}));
}catch(e){await page.screenshot({path:out+'/failure.png',fullPage:true});throw e;}finally{await fs.writeFile(out+'/results.json',JSON.stringify({phase,base,checks,errors},null,2));await browser.close();}

