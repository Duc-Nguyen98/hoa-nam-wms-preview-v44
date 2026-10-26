import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const fixture=JSON.parse(await fs.readFile(new URL('../../src/data/fixtures/S01_SCANNER_PINNED.json',import.meta.url),'utf8'));
const base=process.env.S01_LINK_BASE ?? 'http://127.0.0.1:5185', phase=process.env.S01_LINK_PHASE ?? 'local';
const output=`output/s01-document-links-${phase}`;await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true}), page=await browser.newPage({viewport:{width:1672,height:942}}), checks=[],errors=[];
page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
const snapshot=`scanner:${fixture.source.commit}:${fixture.source.documentVersion}`;
function link(doc){return `#/preview/${doc.type==='inbound'?'S12':'S15'}?`+new URLSearchParams({source:'overview',documentId:doc.id,snapshotId:snapshot});}
async function checkDocument(doc){
 const root=page.locator('[data-source-document-id]');await expect(root).toHaveAttribute('data-source-document-id',doc.id);
 await expect(root).toHaveAttribute('data-source-document-type',doc.type);await expect(page.locator('h1')).toContainText(doc.number);
 for(const field of ['number','partner','warehouse','actor','note'])if(doc[field])await expect(root.locator(`[data-document-field="${field}"]`)).toHaveText(doc[field]);
 await expect(root.locator('[data-document-line-id]')).toHaveCount(doc.lines.length);
 for(const line of doc.lines){const item=root.locator(`[data-document-line-id="${line.id}"]`);await expect(item.locator('h3')).toHaveText(line.name);await expect(item.locator('.ov-source-document__quantity')).toHaveText(`${line.quantity} ${line.unit}`);await item.locator('summary').click();expect(await item.locator('li code').allTextContents()).toEqual(line.serials);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
try{
 await page.goto(base+'/#/preview/S07');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.locator('.ov-result-count').waitFor();
 for(const doc of (process.env.S01_LINK_LAYOUT_ONLY ? fixture.stockDocuments.slice(0,2) : fixture.stockDocuments)){
  await page.locator('#ov-search-input').fill(doc.number);await page.locator('#ov-search-input').press('Enter');
  const opener=page.locator('.ov-table-desktop .ov-document-link');await expect(opener).toHaveCount(1);await expect(opener).toHaveText(doc.number);await opener.click();
  await expect(page.locator('[data-overview-detail-id]')).toHaveAttribute('data-overview-detail-id',doc.id);
  const cta=page.getByRole('button',{name:doc.type==='inbound'?'Mở phiếu nhập kho':'Mở phiếu xuất kho',exact:true});await expect(cta).toBeEnabled();await cta.click();
  await expect(page).toHaveURL(base+'/'+link(doc));await checkDocument(doc);
  if(['PN-0005','PX-0004'].includes(doc.number)){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/desktop-${doc.number}.png`,fullPage:true});}
  await page.reload();await expect(page.locator('[data-source-document-id]')).toHaveAttribute('data-source-document-id',doc.id);
  await page.goBack();await expect(page.locator('.ov-result-count')).toBeVisible();checks.push({number:doc.number,id:doc.id,screen:doc.type==='inbound'?'S12':'S15',click:true,fields:true,lines:true,serials:true,reload:true,back:true});
 }
 // Pending attention cards use the same exact identity contract.
 const attention=page.locator('.ov-attention__row .ov-document-link').first();await attention.click();const attentionId=await page.locator('[data-overview-detail-id]').getAttribute('data-overview-detail-id');await page.getByRole('button',{name:/^Mở phiếu (nhập|xuất) kho$/}).click();await expect(page.locator('[data-source-document-id]')).toHaveAttribute('data-source-document-id',attentionId);checks.push({attention:true});
 const inbound=fixture.stockDocuments.find(d=>d.number==='PN-0011'),outbound=fixture.stockDocuments.find(d=>d.type==='outbound');
 for(const [name,width,height] of [['tablet',834,1334],['phone',390,844]])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height});await page.evaluate(theme=>localStorage.setItem('hn-wms.s00.theme.v1',theme),theme);await page.reload();
  for(const doc of [inbound,outbound]){await page.goto(base+'/'+link(doc));await checkDocument(doc);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/${name}-${theme}-${doc.type}.png`,fullPage:true});checks.push({name,theme,type:doc.type,bounds:true});}
 }
 for(const bad of [link(inbound).replace('S12','S15'),link(inbound)+'&documentId=other',link(inbound).replace(encodeURIComponent(inbound.id),'missing'),link(inbound).replace(encodeURIComponent(snapshot),'old'),link(inbound).replace('source=overview','source=session')]){
  await page.goto(base+'/'+bad);await expect(page.locator('[data-state="record-not-found"]')).toBeVisible();await expect(page.locator('[data-source-document-id]')).toHaveCount(0);checks.push({invalidLink:true});
 }
 await page.goto(base+'/'+link(inbound));await page.getByRole('button',{name:'Danh sách phiếu nhập',exact:true}).click();await expect(page).toHaveURL(base+'/#/preview/S12');await expect(page.locator('.s12-receipt-card')).toHaveCount(4);await expect(page.locator('[data-source-document-id]')).toHaveCount(0);checks.push({existingReceiptList:true});
 await page.goto(base+'/'+link(outbound));await page.getByRole('button',{name:'Danh sách phiếu xuất',exact:true}).click();await expect(page).toHaveURL(base+'/#/preview/S15');await expect(page.locator('.s15-outbound-card')).toHaveCount(1);checks.push({existingOutboundList:true});
 expect(errors).toEqual([]);console.log(JSON.stringify({checks:checks.length,documents:checks.filter(check=>check.number).length,errors}));
}catch(e){await page.screenshot({path:`${output}/failure.png`,fullPage:true});throw e;}
finally{await fs.writeFile(`${output}/results.json`,JSON.stringify({base,checks,errors},null,2));await browser.close();}
