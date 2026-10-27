import {test,expect,type Page} from '@playwright/test';

async function login(page:Page){
 await page.goto('/#/preview/S01');await expect(page.locator('#s07-username')).toBeVisible();
 await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');
 await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();
 await expect(page.getByRole('button',{name:'Tiếp tục',exact:true})).toBeVisible();
}
async function data(page:Page){return page.evaluate(async()=>{
 const {readBrowserPreviewRuntime}=await import('/src/preview-mock/browser-runtime.ts' as string);
 return readBrowserPreviewRuntime()!.appEventAdapters!.P04.read();
});}
test.beforeEach(async({page,context})=>{
 const errors:string[]=[];const watch=(p:Page)=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};watch(page);context.on('page',watch);(page as any).qaErrors=errors;
});
test.afterEach(async({page},info)=>{
 await info.attach('page-errors',{body:JSON.stringify((page as any).qaErrors),contentType:'application/json'});
 await info.attach('final-state',{body:JSON.stringify({url:page.url(),body:await page.locator('body').innerText().catch(()=>''),locks:await page.evaluate(()=>navigator.locks.query()).catch(()=>null)}),contentType:'application/json'});
 expect((page as any).qaErrors).toEqual([]);
});
for(let run=1;run<=3;run++)test(`W-A-CLEAN-${run} fresh auth/setup/reload preserves exact business snapshot`,async({page},info)=>{
 await login(page);const started=Date.now();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();
 await expect(page.locator('.ov-result-count')).toBeVisible({timeout:90000});
 const elapsedMs=Date.now()-started,before=await data(page);
 expect(before.receipts.length).toBeGreaterThan(0);expect(before.scenario).not.toBeNull();
 await page.reload();await expect(page.locator('.ov-result-count')).toBeVisible({timeout:30000});
 expect(await data(page)).toEqual(before);
 await info.attach('setup-timing',{body:JSON.stringify({run,elapsedMs,note:'Observation budget only; not approved SLO',receipts:before.receipts.length,stockEvents:before.stockEvents.length}),contentType:'application/json'});
});
test('W-A-SLOW reload during lock contention, busy keyboard and recover after release',async({page,context},info)=>{
 await login(page);
 // Second isolated test tab holds the real same-origin Web Lock. Mock business
 // requests do not traverse the network; this is explicit persistence contention.
 const holder=await context.newPage();await holder.goto('/tests/functional/wave-ad/lock-holder.html');
 await holder.evaluate(()=>{(window as any).__lockAcquired=false;navigator.locks.request('hoa-nam-public-demo-initial-setup',async()=>{(window as any).__lockAcquired=true;await new Promise<void>(r=>(window as any).__release=r);});});
 await expect.poll(()=>holder.evaluate(()=>(window as any).__lockAcquired)).toBe(true);
 const start=page.getByRole('button',{name:'Tiếp tục',exact:true});await start.focus();await page.keyboard.press('Enter');
 await expect(start).toHaveAttribute('aria-busy','true');await expect(start).toHaveAttribute('aria-disabled','true');await expect(start).toBeFocused();
 await page.keyboard.press('Enter');await page.keyboard.press('Space');
 const locks=await page.evaluate(()=>navigator.locks.query());expect(locks.pending?.filter(x=>x.name==='hoa-nam-public-demo-initial-setup').length).toBe(1);
 await page.reload();await expect(page.locator('#s07-username')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Tiếp tục',exact:true})).toBeVisible();
 await holder.evaluate(()=>(window as any).__release());await holder.close();
 await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await expect(page.locator('.ov-result-count')).toBeVisible({timeout:90000});
 const before=await data(page);await page.reload();await expect(page.locator('.ov-result-count')).toBeVisible();expect(await data(page)).toEqual(before);
 await info.attach('fault-model',{body:JSON.stringify({kind:'held Web Lock + reload',locks}),contentType:'application/json'});
});
test('W-A-ERROR one actual IndexedDB transaction failure exposes retry and preserves auth',async({page},info)=>{
 await login(page);await page.evaluate(()=>{
  const original=IDBDatabase.prototype.transaction;(window as any).__faultHits=0;
  IDBDatabase.prototype.transaction=function(...args:any[]){if(this.name.startsWith('hoa-nam-wms-preview-business')){IDBDatabase.prototype.transaction=original;(window as any).__faultHits++;throw new DOMException('QA transient storage failure','UnknownError');}return original.apply(this,args as any);};
 });
 await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible({timeout:90000});
 expect(await page.evaluate(()=>(window as any).__faultHits)).toBe(1);await expect(page.locator('#s07-username')).toHaveCount(0);
 const retry=page.getByRole('button',{name:'Thử lại',exact:true});await expect(retry).toBeEnabled();await retry.focus();await page.keyboard.press('Enter');
 await expect(page.locator('.ov-result-count')).toBeVisible({timeout:90000});
 await info.attach('fault-model',{body:'One-shot IndexedDB transaction exception; actual injected fault confirmed once. Browser-local mock; no backend failure claim.',contentType:'text/plain'});
});
test('W-A-NETWORK throttled real asset loading still requires auth and reaches ready',async({page,context},info)=>{
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:1024*1024,uploadThroughput:256*1024});
 await login(page);await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await expect(page.locator('.ov-result-count')).toBeVisible({timeout:90000});
 await info.attach('network-model',{body:'Chromium CDP: 100ms latency, 1MiB/s download, 256KiB/s upload. Only actual HTTP assets throttled; Axios preview business commands run in browser memory.',contentType:'text/plain'});
});
