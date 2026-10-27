import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(),out=path.join(root,'docs/quality/uiux-task-HN-S01-004/visual'),phase=process.env.VQ_PHASE??'before',base=process.env.VQ_BASE??'http://127.0.0.1:5271';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const provenance=()=>({head:git('rev-parse','HEAD'),sourceTree:git('rev-parse','HEAD:src'),testTree:git('rev-parse','HEAD:tests/s01'),sourceStatus:git('status','--porcelain','--','src','tests/s01'),utc:new Date().toISOString()});
const hash=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
const initial=provenance();if(initial.sourceStatus)throw Error('Source dirty before capture');
if(process.env.VQ_EXPECTED_SHA!==initial.head)throw Error('Expected HEAD mismatch');
const dir=path.join(out,phase);await fs.mkdir(dir,{recursive:true});
if(await fs.stat(path.join(dir,'capture-results.json')).catch(()=>null))throw Error('Preserve prior captures: choose a new VQ_PHASE');
const scenario=process.env.VQ_SCENARIO??'normal';if(!['normal','reference','reference-pending3'].includes(scenario))throw Error('Unknown scenario');
const profiles=[{name:'desktop',width:1920,height:1080,dpr:1,touch:false},{name:'tablet',width:800,height:1280,dpr:2,touch:true}];
if(process.env.VQ_NATIVE)profiles.push({name:'desktop-native',width:1672,height:941,dpr:1,touch:false},{name:'tablet-native',width:992,height:1586,dpr:1,touch:true},{name:'tablet-modal-native',width:793,height:1983,dpr:1,touch:true});
const browser=await chromium.launch({headless:true}),results=[];
async function measure(p){return p.evaluate(()=>{
 const read=e=>{if(!e)return null;const b=e.getBoundingClientRect(),c=getComputedStyle(e);return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom,display:c.display,font:c.font,fontFamily:c.fontFamily,fontSize:c.fontSize,lineHeight:c.lineHeight,fontWeight:c.fontWeight,color:c.color,background:c.backgroundColor,padding:c.padding,gap:c.gap,grid:c.gridTemplateColumns,border:c.border,borderRadius:c.borderRadius,boxShadow:c.boxShadow,overflow:c.overflow,clientHeight:e.clientHeight,scrollHeight:e.scrollHeight};};
 const selectors=['.hn-main','.ov-screen','.ov-page-heading','.ov-page-intro h1','.ov-period','.ov-metrics','.ov-metric','.ov-metric__top','.ov-metric__value','.ov-icon-tile','.ov-middle','.ov-attention','.ov-attention__heading','.ov-attention__row','.ov-attention__count','.ov-quick','.ov-quick__grid','.ov-quick__link','.ov-activity','.ov-activity__heading','.ov-filters','.ov-search','.ov-table-desktop','.ov-mobile-list','.ov-mobile-row','.hn-pagination','dialog.ov-detail-modal','.ov-detail-modal .hn-global-modal__header','.ov-detail-modal .hn-global-modal__heading','.ov-detail-title__eyebrow','.ov-detail-title__number','.ov-detail-title__icon','.ov-detail-modal .hn-status-badge','.ov-detail-modal .hn-global-modal__close','.ov-detail-modal .hn-global-modal__body','.ov-detail-body','.ov-detail-section','.ov-detail-section h3','.ov-detail-fields','.ov-detail-field','.ov-detail-field dt','.ov-detail-field dd','.ov-detail-system','.ov-detail-id','.ov-detail-modal .hn-global-modal__footer'];
 return {url:location.href,title:document.title,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,touch:navigator.maxTouchPoints,coarse:matchMedia('(pointer:coarse)').matches},fonts:document.fonts.status,bodyWidth:document.documentElement.scrollWidth,bodyHeight:document.documentElement.scrollHeight,scrollY,bodyOverflow:getComputedStyle(document.body).overflow,elements:Object.fromEntries(selectors.map(s=>[s,[...document.querySelectorAll(s)].filter(e=>e.getClientRects().length).map(read)])),metrics:[...document.querySelectorAll('.ov-metric')].map(e=>e.innerText),pending:document.querySelector('.ov-attention__count')?.textContent,resultCount:document.querySelector('.ov-result-count')?.textContent,pagination:document.querySelector('.hn-pagination')?.innerText,detailId:document.querySelector('[data-overview-detail-id]')?.getAttribute('data-overview-detail-id'),detail:document.querySelector('.ov-detail-body')?.innerText,buttons:[...document.querySelectorAll('.ov-screen button,dialog.ov-detail-modal button')].filter(e=>e.getClientRects().length).map(e=>({name:e.getAttribute('aria-label')||e.textContent,box:read(e)}))};
 });}
try{for(const cfg of profiles.filter(c=>!process.env.VQ_PROFILE_SET||process.env.VQ_PROFILE_SET.split(',').includes(c.name))){
 const ctx=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},deviceScaleFactor:cfg.dpr,hasTouch:cfg.touch,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh'});await ctx.tracing.start({screenshots:true,snapshots:true});
 const p=await ctx.newPage();p.setDefaultTimeout(30000);const row={profile:cfg,sourceStart:provenance(),environment:scenario==='reference-pending3'?'ISOLATED_QA_SYNTHETIC_PENDING3_PAGE4_REAL_COMPONENT':scenario==='reference'?'ISOLATED_QA_REFERENCE_PAGE4_REAL_COMPONENT_SOURCE_FIXTURE':'LOCAL_REAL_APP_SOURCE_FIXTURE_MOCK',scenario,base,errors:[],network:[],captures:[]};
 p.on('pageerror',e=>row.errors.push({kind:'pageerror',message:e.message}));p.on('console',m=>{if(['error','warning'].includes(m.type()))row.errors.push({kind:m.type(),message:m.text()});});p.on('requestfailed',r=>row.network.push({url:r.url(),failure:r.failure()}));p.on('response',r=>{if(r.status()>=400)row.network.push({url:r.url(),status:r.status()});});
 try{
 await p.goto(base+'/#/preview/S07');await p.locator('#s07-username').fill('demo');await p.locator('#s07-password').fill('HoaNamDemo@2026');await p.locator('.s07-submit').click();await p.locator('.s08-confirm').click();await p.getByRole('button',{name:'Tiếp tục',exact:true}).click();await p.locator('.ov-result-count').waitFor({timeout:180000});
 await expect(p).toHaveURL(/#\/preview\/S01$/);
 if(scenario!=='normal'){await p.goto(base+'/tests/s01/harness.html?state='+scenario);await p.locator('.ov-result-count').waitFor();}
 await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);await p.evaluate(()=>scrollTo(0,0));
 row.dashboard=await measure(p);
 await expect(p.locator('.ov-attention__count')).toHaveText(scenario==='reference-pending3'?'3':'5');
 row.layoutDiagnostics=await p.evaluate(()=>{
  const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const overlaps=[];for(const row of document.querySelectorAll('.ov-mobile-row')){
   if(!row.getClientRects().length)continue;
   const targets=[...row.querySelectorAll('.ov-document-link,.hn-status-badge,.ov-mobile-row__meta>span')];
   const textBox=e=>{const walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);const rects=[];while(walker.nextNode()){const n=walker.currentNode;if(!n.textContent.trim()||n.parentElement.closest('svg'))continue;const range=document.createRange();range.selectNodeContents(n);rects.push(...range.getClientRects());}if(!rects.length)return null;return{x:Math.min(...rects.map(r=>r.x)),y:Math.min(...rects.map(r=>r.y)),right:Math.max(...rects.map(r=>r.right)),bottom:Math.max(...rects.map(r=>r.bottom))};};
   for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++){const a=textBox(targets[i]),b=textBox(targets[j]);if(a&&b&&Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1)overlaps.push({row:row.querySelector('.ov-document-link')?.textContent,a:targets[i].textContent,b:targets[j].textContent,rectA:a,rectB:b});}
  }
  return{mobileTextOverlaps:overlaps,pageSizeOptions:[...document.querySelectorAll('.hn-pagination select option')].map(e=>({value:e.value,text:e.textContent})),smallButtons:[...document.querySelectorAll('.ov-screen button')].filter(e=>e.getClientRects().length).map(e=>({name:e.getAttribute('aria-label')||e.textContent,box:box(e)})).filter(e=>e.box.width<44||e.box.height<44)};
 });
 for(const [state,fullPage] of [['dashboard',false],['dashboard-full',true]]){const file=path.join(dir,`${cfg.name}-${state}.png`);await p.screenshot({path:file,fullPage});row.captures.push({state,path:path.relative(root,file),sha256:await hash(file)});}
 if(scenario!=='reference-pending3'){
 // Discover the exact source record through its attention row, then search if absent.
 let opener=p.locator('.ov-attention [data-overview-detail-opener="p12-stock-PX-0007"].ov-document-link:visible');
 row.discovery='exact-ID attention';if(!await opener.count()){row.discovery='exact-ID search';await p.locator('#ov-search-input').fill('PX-0007');await expect(p.locator('.ov-result-count')).toHaveText('1 phiếu phù hợp');opener=p.locator('[data-overview-detail-opener="p12-stock-PX-0007"].ov-document-link:visible');}
 await opener.click();const dialog=p.locator('dialog.ov-detail-modal[open]');await expect(dialog).toBeVisible();await expect(dialog.locator('[data-overview-detail-id]')).toHaveAttribute('data-overview-detail-id','p12-stock-PX-0007');await p.waitForTimeout(300);row.modal=await measure(p);
 for(const state of ['px0007','px0007-modal']){const file=path.join(dir,`${cfg.name}-${state}.png`);if(state.endsWith('-modal'))await dialog.screenshot({path:file});else await p.screenshot({path:file});row.captures.push({state,path:path.relative(root,file),sha256:await hash(file)});}
 const body=dialog.locator('.hn-global-modal__body');await body.evaluate(e=>e.scrollTop=e.scrollHeight);row.modalScrolled=await measure(p);row.idReachable=await dialog.locator('.ov-detail-id').evaluate(e=>{const b=e.getBoundingClientRect(),p=e.closest('.hn-global-modal__body').getBoundingClientRect();return b.top>=p.top&&b.bottom<=p.bottom;});const scrollFile=path.join(dir,`${cfg.name}-px0007-scrolled.png`);await p.screenshot({path:scrollFile});row.captures.push({state:'px0007-scrolled',path:path.relative(root,scrollFile),sha256:await hash(scrollFile)});
 row.modalDiagnostics=await dialog.evaluate(e=>{const f=e.querySelector('.hn-global-modal__footer'),r=e.getBoundingClientRect(),fr=f.getBoundingClientRect();return{footerReachable:fr.top>=r.top&&fr.bottom<=r.bottom&&fr.bottom<=innerHeight,ctaDisabled:e.querySelector('footer .hn-button--primary')?.disabled,detailId:e.querySelector('[data-overview-detail-id]')?.getAttribute('data-overview-detail-id')};});
 }
 row.result='CAPTURED';
 }catch(e){row.result='FAIL';row.failure=String(e);row.stack=e.stack;await p.screenshot({path:path.join(dir,`${cfg.name}-failure.png`),fullPage:true}).catch(()=>{});}
 row.sourceEnd=provenance();row.sourceCustodyStable=row.sourceStart.head===initial.head&&row.sourceEnd.head===initial.head&&!row.sourceStart.sourceStatus&&!row.sourceEnd.sourceStatus;if(!row.sourceCustodyStable){row.result='FAIL';row.failure='Source custody changed during capture';}
 await ctx.tracing.stop({path:path.join(dir,`${cfg.name}-trace.zip`)});results.push(row);await fs.writeFile(path.join(dir,'capture-results.json'),JSON.stringify({phase,scenario,initial,results},null,2));await ctx.close();
 console.log(JSON.stringify({profile:cfg.name,result:row.result,failure:row.failure,errors:row.errors.length,pending:row.dashboard?.pending,metrics:row.dashboard?.metrics}));
 }}finally{await browser.close();await fs.writeFile(path.join(dir,'capture-results.json'),JSON.stringify({phase,scenario,initial,end:provenance(),results},null,2));}
if(results.some(r=>r.result!=='CAPTURED'))process.exitCode=1;
