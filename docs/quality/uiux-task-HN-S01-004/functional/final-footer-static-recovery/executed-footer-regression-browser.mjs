import {chromium, expect as baseExpect} from '@playwright/test';
import fs from 'node:fs/promises';
import cp from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
const expect=baseExpect.configure({timeout:15000});
const previous='f56e25cfc119f5a758f0cd48ebdc6a96e78f8a09';
const head=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const srcTree=cp.execFileSync('git',['rev-parse','HEAD:src'],{encoding:'utf8'}).trim();
const testsTree=cp.execFileSync('git',['rev-parse','HEAD:tests'],{encoding:'utf8'}).trim();
const status=cp.execFileSync('git',['status','--short','--','src','tests'],{encoding:'utf8'});
if(!process.env.QA_SOURCE_SHA||head!==process.env.QA_SOURCE_SHA||status)throw Error('Candidate custody mismatch');
const css='src/features/S01/overview.css';
const changed=cp.execFileSync('git',['diff','--name-only',previous,head,'--','src','tests'],{encoding:'utf8'}).trim().split('\n');
expect(changed).toEqual([css]);
const original=cp.execFileSync('git',['show',previous+':'+css],{encoding:'utf8'}).replaceAll('\r\n','\n');
const current=(await fs.readFile(css,'utf8')).replaceAll('\r\n','\n');
const allowed='.hn-global-modal.ov-detail-modal .hn-global-modal__footer { padding-block:16px; }';
expect(current.split('\n').filter(line=>line.trim()===allowed)).toHaveLength(1);
expect(current.split('\n').filter(line=>line.trim()!==allowed).join('\n')).toBe(original);
const diff=cp.execFileSync('git',['diff',previous,head,'--',css],{encoding:'utf8'});
const out='docs/quality/uiux-task-HN-S01-004/functional/'+(process.env.QA_RUN??'footer-final');
await fs.mkdir(out,{recursive:true});
await fs.copyFile(new URL(import.meta.url),out+'/executed-footer-regression-browser.mjs');
await fs.writeFile(out+'/source-diff.patch',diff);
const custody=[];
for(const file of [css,'src/features/S01/AcceptedRowDetail.tsx','src/shared/GlobalModal.tsx','src/data/fixtures/S01_SCANNER_PINNED.json','docs/quality/uiux-task-HN-S01-004/functional/footer-regression-browser.mjs'])custody.push({file,sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex')});
// QA runtime only: artifact HTML must not trigger development page reloads.
const watchIgnored=['**/output/**','**/docs/quality/**'];
let server;
let localBuild=null;
if(process.env.QA_OWN_SERVER){
 const {createServer,build,preview}=await import('vite');
 if(process.env.QA_STATIC_BUILD){
  const outDir=path.resolve('output/hn-s01-004-functional-temp/footer-static-dist');
  await build({build:{outDir,emptyOutDir:false}});
  const assets=[];
  async function collect(folder){for(const entry of await fs.readdir(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory())await collect(file);else assets.push({path:path.relative(outDir,file).replaceAll('\\','/'),sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex')})}}
  await collect(outDir);localBuild={outDir,sourceCommit:head,srcTree,assets};await fs.writeFile(out+'/local-build-custody.json',JSON.stringify(localBuild,null,2));
  server=await preview({build:{outDir},preview:{host:'127.0.0.1',port:5272,strictPort:true}});
 }else{server=await createServer({server:{host:'127.0.0.1',port:5272,strictPort:true,watch:{ignored:watchIgnored}}});await server.listen()}
}
const browser=await chromium.launch({headless:true,args:['--no-proxy-server']});
const context=await browser.newContext({viewport:{width:1920,height:1080},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage(),checks=[],errors=[];
page.setDefaultTimeout(45000);page.setDefaultNavigationTimeout(45000);
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const base='http://127.0.0.1:5272';
const openPX=async()=>{const opener=page.locator('[data-overview-detail-opener="p12-stock-PX-0007"]:visible').first();await opener.click();await expect(page.locator('[data-overview-detail-id]')).toHaveAttribute('data-overview-detail-id','p12-stock-PX-0007');return opener};
try{
 await page.goto(base+'/#/preview/S07',{waitUntil:'domcontentloaded'});
 await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();
 await page.getByRole('button',{name:'Bắt đầu làm việc',exact:true}).click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.locator('.ov-result-count').waitFor();
 for(const language of ['vi','en','zh-CN'])for(const theme of ['light','dark'])for(const [width,height] of [[1920,1080],[800,1280]]){
  const name=`${language}-${theme}-${width}`;
  try{
   if(page.url()!==base+'/#/preview/S01')await page.goto(base+'/#/preview/S01',{waitUntil:'domcontentloaded'});
   await page.locator('.ov-result-count').waitFor();await page.setViewportSize({width:1920,height:1080});
   await page.locator('.hn-language').click();await page.locator('.hn-header-option span[lang="'+language+'"]').click();
   await page.locator('.hn-theme').click();await page.locator('.hn-header-option').nth(theme==='light'?0:1).click();
   await page.setViewportSize({width,height});await expect(page.locator('html')).toHaveAttribute('data-hn-theme',theme);
   const opener=await openPX(),modal=page.locator('dialog.ov-detail-modal[open]');
   const geometry=await modal.evaluate(el=>{
    const box=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
    const footer=el.querySelector('.hn-global-modal__footer'),body=el.querySelector('.hn-global-modal__body'),style=getComputedStyle(footer);
    return {dialog:box(el),body:box(body),footer:box(footer),padding:{top:style.paddingTop,bottom:style.paddingBottom,left:style.paddingLeft,right:style.paddingRight},controls:[...el.querySelectorAll('button')].map(button=>({name:button.getAttribute('aria-label')??button.textContent.trim(),...box(button)})),footerButtons:[...footer.querySelectorAll('button')].map(box)};
   });
   expect(geometry.padding).toEqual({top:width>1100?'16px':'24px',bottom:width>1100?'16px':'24px',left:'24px',right:'24px'});
   expect(geometry.dialog.top).toBeGreaterThanOrEqual(0);expect(geometry.dialog.bottom).toBeLessThanOrEqual(height);
   expect(geometry.footer.bottom).toBeLessThanOrEqual(geometry.dialog.bottom);expect(geometry.body.bottom).toBeLessThanOrEqual(geometry.footer.top);
   for(const control of geometry.controls){expect(control.width).toBeGreaterThanOrEqual(44);expect(control.height).toBeGreaterThanOrEqual(44)}
   for(const button of geometry.footerButtons)expect(button.height).toBe(width>1100?50:56);
   const scroll=[];
   for(const fraction of [0,.5,1])scroll.push(await modal.locator('.hn-global-modal__body').evaluate((body,fraction)=>{body.scrollTop=(body.scrollHeight-body.clientHeight)*fraction;const footer=body.closest('dialog').querySelector('.hn-global-modal__footer').getBoundingClientRect();return {fraction,scrollTop:body.scrollTop,footerTop:footer.top,footerBottom:footer.bottom}},fraction));
   for(const position of scroll){expect(position.footerTop).toBe(geometry.footer.top);expect(position.footerBottom).toBeLessThanOrEqual(height)}
   for(const [index,value] of [[0,'PX-0007'],[1,'p12-stock-PX-0007']]){await modal.locator('.ov-copy-button').nth(index).click();await expect.poll(()=>page.evaluate(()=>navigator.clipboard.readText())).toBe(value)}
   for(let index=0;index<10;index++){await page.keyboard.press(index%2?'Tab':'Shift+Tab');expect(await modal.evaluate(el=>el.contains(document.activeElement))).toBe(true)}
   await page.screenshot({path:out+'/'+name+'.png'});
   await page.keyboard.press('Escape');await expect(opener).toBeFocused();
   await openPX();await page.locator('dialog.ov-detail-modal[open] .hn-global-modal__close').click();await expect(opener).toBeFocused();
   await openPX();await page.locator('dialog.ov-detail-modal[open] .hn-global-modal__footer .hn-button--primary').click();
   await expect(page.locator('[data-source-document-id]')).toHaveAttribute('data-source-document-id','p12-stock-PX-0007');
   checks.push({name,status:'PASS',language,theme,width,height,geometry,scroll,copyCode:true,copyID:true,escFocus:true,closeFocus:true,exactCTA:true});console.log('PASS '+name);
  }catch(error){checks.push({name,status:'FAIL',error:String(error),stack:error.stack});await page.screenshot({path:out+'/'+name+'-failure.png',fullPage:true});console.log('FAIL '+name+' '+error.message);break}
 }
}catch(error){checks.push({name:'setup',status:'FAIL',error:String(error),stack:error.stack});await page.screenshot({path:out+'/setup-failure.png',fullPage:true})}
finally{await fs.writeFile(out+'/results.json',JSON.stringify({head,srcTree,testsTree,status,custody,previous,ownServer:!!server,watchIgnored,localBuild:localBuild?{outDir:localBuild.outDir,sourceCommit:head,manifest:'local-build-custody.json'}:null,impact:'Only one desktop footer padding declaration differs; all other source/tests unchanged',checks,errors,classification:'Actual normal app MOCK; scoped modal regression, not visual acceptance'},null,2));await browser.close();if(server?.close)await server.close();else if(server?.httpServer)await new Promise(resolve=>server.httpServer.close(resolve))}
console.log(JSON.stringify({pass:checks.filter(x=>x.status==='PASS').length,fail:checks.filter(x=>x.status==='FAIL').length,errors}));
if(checks.some(x=>x.status==='FAIL')||errors.length)process.exitCode=1;
