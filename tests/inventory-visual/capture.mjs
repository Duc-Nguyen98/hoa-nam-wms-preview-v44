import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base=process.env.INVENTORY_BASE??'http://127.0.0.1:5340';
const out=process.env.INVENTORY_VISUAL_OUT??'docs/qa/inventory/HN-INVENTORY-32REF-001/visual/round1';
if(!process.env.HN_QA_USERNAME||!process.env.HN_QA_PASSWORD)throw Error('QA login must be supplied through environment.');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const provenance={baseSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),diffSha256:hash(execFileSync('git',['diff','--binary'])),sourceHashes:Object.fromEntries(await Promise.all(['src/app/App.tsx','src/features/S16/approved/InventoryDesignWorkspace.tsx','src/features/S16/approved/approved.css','src/features/S16/approved/adapter.ts'].map(async p=>[p,hash(await fs.readFile(p))])))};
const cases=[['stock'],['sku'],['allocation'],['box','box=BOX-001'],['tray','box=BOX-001'],['movement'],['reconcile'],['difference'],['history'],['snapshot','snapshot=DS-20261028-01'],['stock','scenario=loading'],['stock','scenario=empty'],['stock','scenario=no-results'],['stock','scenario=error'],['history','scenario=forbidden'],['box','scenario=not-found']];
await fs.mkdir(out,{recursive:true}); const results=process.env.CAPTURE_RESUME?JSON.parse(await fs.readFile(out+'/capture.json','utf8')).results:[];
for(const [device,width,height,dpr] of [['Desktop',1920,1080,1],['Tablet',800,1280,2]]){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh'});
 const page=await context.newPage(); page.setDefaultTimeout(30000);const errors=[];const failedRequests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 page.on('requestfailed',r=>{const u=new URL(r.url());failedRequests.push({path:u.pathname,error:r.failure()?.errorText})});
 try{
  await page.goto(base+'/#/preview/S07'); await page.locator('#s07-username').fill(process.env.HN_QA_USERNAME);await page.locator('#s07-password').fill(process.env.HN_QA_PASSWORD);await page.locator('.s07-submit').click();await page.getByRole('button',{name:'Bắt đầu làm việc',exact:true}).click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.locator('.ov-result-count').waitFor({timeout:90000});
  for(let i=0;i<cases.length;i++){
   if(results.some(r=>r.device===device&&r.id===String(i+1).padStart(2,'0')))continue;
   const [view,params='']=cases[i],id=String(i+1).padStart(2,'0');const prefix=`${id}-${device}`;
   await page.goto(`${base}/?inventoryDesign=20261029&capture=${id}#/preview/S16?view=${view}&${params}`);await page.locator('.iad').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(200);
   const geometry=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return {tag:e.tagName,x:r.x,y:r.y,width:r.width,height:r.height,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,font:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,padding:s.padding,color:s.color,background:s.backgroundColor}};
    const root=document.querySelector('.iad');return {viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},zoom:visualViewport?.scale,language:document.documentElement.lang,theme:root.className,title:root.querySelector('h1')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1,pageHeight:document.documentElement.scrollHeight,root:rect(root),heading:rect(root.querySelector('h1')),tables:[...root.querySelectorAll('table')].map(rect),controls:[...root.querySelectorAll('button,input,select')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({...rect(e),name:e.getAttribute('aria-label')||e.textContent?.trim()})),text:root.innerText};
   });
   await page.screenshot({path:`${out}/${prefix}.png`,fullPage:false});
   if(geometry.pageHeight>height)await page.screenshot({path:`${out}/${prefix}-full.png`,fullPage:true});
   await fs.writeFile(`${out}/${prefix}-dom.txt`,await page.locator('.iad').evaluate(e=>e.outerHTML));
   results.push({id,device,view,params,geometry,errors:[...errors],failedRequests:[...failedRequests]});
   await fs.writeFile(out+'/capture.json',JSON.stringify({mode:'MOCK',base,provenance,browser:browser.version(),results},null,2));
   console.log(`${prefix}: captured; overflow=${geometry.overflow}; height=${geometry.pageHeight}`);
  }
 }finally{await context.close();await browser.close();}
}
