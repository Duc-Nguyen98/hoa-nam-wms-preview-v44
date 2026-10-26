import { chromium, expect } from '@playwright/test';
import { unzipSync, strFromU8 } from 'fflate';
import fs from 'node:fs/promises';
// Capture a real v45 session first with capture-v45-baseline.mjs against that
// version. This ignored browser profile is only synthetic Demo test data.
const base=process.env.DEMO_BASE??'http://127.0.0.1:5187',out=process.env.DEMO_OUT??'output/public-warranty-local';
const baseline=JSON.parse(await fs.readFile('output/demo-v45-browser-state.json','utf8'));
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch(),checks=[],errors=[];let failure;
const selectors={S09:'[data-operational-warranty]',S10:'[data-operational-parts-issues]',S16:'[data-operational-inventory]',S21:'[data-operational-stock-report]',S22:'[data-operational-warranty-report]'};
const business=state=>state.origins.flatMap(o=>o.indexedDB??[]).find(d=>d.name==='hoa-nam-wms-preview-business-v1:s27-design-v1').stores.find(s=>s.name==='business').records.find(r=>r.key==='state').value;
const rows=(raw,kind)=>Object.values(raw.records).filter(r=>r.kind===kind);
const stock=raw=>Object.fromEntries(rows(raw,'catalog-sku-v1').map(k=>[k.data.code,rows(raw,'stock-event').filter(e=>e.data.skuId===k.id).reduce((n,e)=>n+e.data.signedQuantity,0)]));
async function read(context){return business(await context.storageState({indexedDB:true}));}
async function bounds(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);const modal=page.locator('dialog[open]');if(await modal.count()){const b=await modal.boundingBox();expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(page.viewportSize().width+1);expect(b.y+b.height).toBeLessThanOrEqual(page.viewportSize().height+1);}}
try{
 for(const mode of ['fresh','upgrade']){
  const restored=structuredClone(baseline);restored.cookies=[];restored.origins.forEach(o=>o.origin=base);
  const context=await browser.newContext({viewport:{width:1920,height:1080},...(mode==='upgrade'?{storageState:restored}:{})});
  const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/#/preview/S07');
  if(mode==='fresh'){await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();}
  await expect(page.getByRole('heading',{name:'Bắt đầu phiên làm việc'})).toBeVisible();
  if(mode==='upgrade')expect(stock(await read(context))).toEqual({'PUBLIC-DEMO-SKU-A':1,'PUBLIC-DEMO-SKU-B':18});
  await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.locator('.ov-result-count').waitFor();
  const first=await read(context),cas=rows(first,'warranty-case')[0],issue=rows(first,'parts-issue')[0];
  expect(rows(first,'warranty-case')).toHaveLength(1);expect(rows(first,'parts-issue')).toHaveLength(1);
  expect(cas.data.state).toBe('RETURNED');expect(issue.data.status).toBe('POSTED');expect(issue.data.caseId).toBe(cas.id);expect(issue.data.lines[0].quantity).toBe(2);
  expect(stock(first)).toEqual({'PUBLIC-DEMO-SKU-A':1,'PUBLIC-DEMO-SKU-B':16});
  expect(rows(first,'case-event').filter(r=>r.data.caseId===cas.id).map(r=>r.data.state)).toEqual(['RECEIVED','CHECKING','REPAIRING','REPAIRED','RETURNED']);
  if(mode==='upgrade'){const old=business(baseline);for(const kind of ['operational-scenario','receipt','outbound','physical','putaway'])expect(rows(first,kind)).toEqual(rows(old,kind));}
  checks.push(`${mode}: full lifecycle, one linked issue, stock18→16, additive data`);
  for(const [device,width,height] of [['desktop',1920,1080],['tablet',800,1280]]){
   await page.setViewportSize({width,height});
   for(const screen of ['S09','S10','S16','S21','S22']){
    await page.goto(base+'/#/preview/'+screen);const root=page.locator(selectors[screen]);await root.waitFor();
    if(screen==='S09'||screen==='S10'){await expect(root.locator('tbody tr')).toHaveCount(1);await expect(root).toContainText(cas.data.code);}
    if(screen==='S16'){await expect(root.locator('[data-inventory-quantity]:visible')).toHaveCount(2);expect(await root.locator('[data-inventory-quantity]:visible').evaluateAll(ns=>ns.map(n=>Number(n.dataset.inventoryQuantity)).sort((a,b)=>a-b))).toEqual([1,16]);}
    if(screen==='S21'){const row=root.locator('tbody tr').filter({hasText:'PUBLIC-DEMO-SKU-B'});await expect(row).toHaveCount(1);expect(await row.locator('td').allTextContents()).toEqual(['PUBLIC-DEMO-SKU-B','Linh kiện Demo','warehouse-hn-01','Cái','0','18','0','2','0','16','Chưa xác định','Chưa xác định']);}
    if(screen==='S22'){await expect(root.locator('[data-metric="total"] strong')).toHaveText('1');await expect(root.locator('[data-metric="complete"] strong')).toHaveText('1');await expect(root).toContainText(cas.data.code);}
    await bounds(page);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${out}/${mode}-${device}-${screen}.png`,fullPage:true});
    if(['S09','S10','S22'].includes(screen)){
     await root.locator(`[data-${screen.toLowerCase()}-operational-action]`).click();const modal=page.locator('dialog[open]');await modal.waitFor();await bounds(page);
     if(screen==='S09'){await expect(modal.locator('[data-warranty-case-id]')).toHaveAttribute('data-warranty-case-id',cas.id);await expect(modal).toContainText('PUBLIC-DEMO-SERIAL-0012');await expect(modal.locator('.s09-operational__timeline li')).toHaveCount(5);await expect(modal).toContainText('DF-POWER-01');}
     if(screen==='S10'){await expect(modal.locator('[data-operational-parts-id]')).toHaveAttribute('data-operational-parts-id',issue.id);await expect(modal).toContainText(cas.id);await expect(modal).toContainText('PUBLIC-DEMO-BOX-0010');await expect(modal).toContainText('-2 Cái');}
     if(screen==='S22'){await expect(modal.locator('[data-case-id]')).toHaveAttribute('data-case-id',cas.id);await expect(modal.locator('tbody tr')).toHaveCount(5);}
     await page.screenshot({path:`${out}/${mode}-${device}-${screen}-detail.png`});await page.keyboard.press('Escape');
    }
    checks.push(`${mode} ${device} ${screen}: same records and balance, no overflow`);
   }
  }
  await page.reload();await expect(page.locator('[data-metric="total"] strong')).toHaveText('1');
  expect(await read(context)).toEqual(first);checks.push(`${mode}: screen reads and reload preserve exact business snapshot`);
  const downloading=page.waitForEvent('download');await page.locator(selectors.S22).getByRole('button',{name:'Xuất Excel',exact:true}).click();const download=await downloading;const path=`${out}/${mode}-${download.suggestedFilename()}`;await download.saveAs(path);const zip=unzipSync(new Uint8Array(await fs.readFile(path)));expect(Object.values(zip).map(strFromU8).join('\n')).toContain(cas.id);checks.push(`${mode}: S22 Excel contains the same case`);
  await fs.writeFile(`${out}/${mode}-data.json`,JSON.stringify({case:cas,issue,stock:stock(first),timeline:rows(first,'case-event')},null,2));await context.close();
 }
 expect(errors).toEqual([]);
}catch(e){failure=e.stack;throw e;}finally{await fs.writeFile(out+'/results.json',JSON.stringify({base,checks,errors,failure},null,2));console.log(JSON.stringify({checks:checks.length,errors,failure}));await browser.close();}
