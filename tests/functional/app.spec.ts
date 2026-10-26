import {test,expect} from '@playwright/test';
import fixture from '../../src/data/fixtures/S01_SCANNER_PINNED.json' with {type:'json'};
async function start(page:any,base:string){
 await page.goto(base+'/#/preview/S07');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await expect(page.locator('.ov-result-count')).toBeVisible({timeout:60000});
}
test('E-MAIN-002 local linked inbound/outbound identities, invalid direct URL and logout',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const base='http://127.0.0.1:5204';await start(page,base);
 for(const type of ['inbound','outbound']){
  const doc=fixture.stockDocuments.find(r=>r.type===type)!;await page.locator('#ov-search-input').fill(doc.number);await page.locator('#ov-search-input').press('Enter');
  await page.locator('.ov-table-desktop .ov-document-link').click();await page.getByRole('button',{name:type==='inbound'?'Mở phiếu nhập kho':'Mở phiếu xuất kho',exact:true}).click();
  await expect(page.locator('[data-source-document-id]')).toHaveAttribute('data-source-document-id',doc.id);await expect(page.locator('[data-source-document-id]')).toHaveAttribute('data-source-document-type',type);
  await expect(page.locator('[data-document-line-id]')).toHaveCount(doc.lines.length);
  for(const line of doc.lines){const item=page.locator(`[data-document-line-id="${line.id}"]`);await item.locator('summary').click();expect(await item.locator('li code').allTextContents()).toEqual(line.serials);}
  await page.reload();await expect(page.locator('[data-source-document-id]')).toHaveAttribute('data-source-document-id',doc.id);
  await page.goto(base+'/#/preview/S01');await expect(page.locator('.ov-result-count')).toBeVisible();
 }
 await page.goto(base+'/#/preview/S12?source=overview&documentId=missing&snapshotId=old');await expect(page.locator('[data-state="record-not-found"]')).toBeVisible();await expect(page.locator('[data-source-document-id]')).toHaveCount(0);
 await page.goto(base+'/#/preview/S01');await page.locator('.hn-profile').click();await page.locator('.hn-profile-menu-logout').click();await page.getByRole('dialog').getByRole('button',{name:'Đăng xuất',exact:true}).click();await expect(page.locator('#s07-username')).toBeVisible();
 await page.goto(base+'/#/preview/S02');await expect(page.locator('#s07-username')).toBeVisible();
 await info.attach('console-errors',{body:JSON.stringify(errors),contentType:'application/json'});expect(errors).toEqual([]);
});
test('E-PUB-001 public clean-session setup and deployment metadata observation',async({page,request},info)=>{
 const base='https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site';
 const build=await request.get(base+'/build-info.json');await info.attach('public-build-info',{body:await build.body(),contentType:build.headers()['content-type']??'text/plain'});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const started=Date.now();try{await start(page,base);await page.screenshot({path:'output/functional-qa-20261027/public-s01.png'});}
 finally{await info.attach('public-setup-observation',{body:JSON.stringify({elapsedMs:Date.now()-started,url:page.url(),body:(await page.locator('body').innerText()).slice(0,1600),errors}),contentType:'application/json'});}
 expect(errors).toEqual([]);
});
