import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out=process.env.VQ_OUT??path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(!process.env.VQ_EXPECTED_SHA || sha!==process.env.VQ_EXPECTED_SHA)throw Error('Source SHA must exactly match VQ_EXPECTED_SHA');
const status=execFileSync('git',['status','--porcelain','--','src'],{encoding:'utf8'}).trim();if(status)throw Error('Runtime source dirty: '+status);
const browser=await chromium.launch();
const results=[];
await fs.mkdir(out,{recursive:true});
for(const cfg of [{name:'desktop-native',width:1774,height:887,dpr:1},{name:'tablet-native',width:992,height:1586,dpr:1},{name:'desktop-canonical',width:1920,height:1080,dpr:1},{name:'tablet-canonical',width:800,height:1280,dpr:2},{name:'portrait-neighbor',width:900,height:1440,dpr:1},{name:'portrait-short',width:900,height:1100,dpr:1},{name:'portrait-801-edge',width:801,height:1100,dpr:1}].filter(c=>(!process.env.VQ_PROFILE||c.name===process.env.VQ_PROFILE)&&(!process.env.VQ_PROFILE_SET||process.env.VQ_PROFILE_SET.split(',').includes(c.name)))){
 const ctx=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},deviceScaleFactor:cfg.dpr,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh'});
 await ctx.tracing.start({screenshots:true,snapshots:true});
 const p=await ctx.newPage();const errors=[],requests=[];
 p.on('pageerror',e=>errors.push({kind:'pageerror',message:e.message}));p.on('console',m=>{if(m.type()==='error')errors.push({kind:'console',message:m.text()});});p.on('requestfailed',r=>requests.push({url:r.url(),failure:r.failure()}));p.on('response',r=>{if(r.status()>=400)requests.push({url:r.url(),status:r.status()});});
 const row={profile:cfg,sha,environment:'LOCAL_PREVIEW_MOCK',base:'http://127.0.0.1:5233',errors,requests};
 try{
 // Use wall-clock authentication/setup; source data remains browser-local MOCK.
 await p.goto('http://127.0.0.1:5233/#/preview/S07');await p.locator('#s07-username').fill('demo');await p.locator('#s07-password').fill('HoaNamDemo@2026');await p.locator('.s07-submit').click();await p.locator('.s08-confirm').click();await p.getByRole('button',{name:'Tiếp tục',exact:true}).click();await p.locator('.ov-result-count').waitFor({timeout:180000});
 await p.goto('http://127.0.0.1:5233/#/preview/S15');await p.locator('.hn-notifications').click();const d=p.locator('dialog[open].hn-notification-center');await d.waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(600);
 const measure=()=>d.evaluate(el=>{const sels=['.hn-global-modal__close','.hn-global-modal__close svg','.hn-notification-list-footer','.hn-notification-detail-back','.hn-global-modal__header','.hn-global-modal__heading h2','.hn-notification-heading-icon','.hn-notification-heading-badge','.hn-notification-center-grid','.hn-notification-list-pane','.hn-notification-search','.hn-notification-filter-row','.hn-notification-list-scroll','.hn-notification-item','.hn-notification-item-copy strong','.hn-notification-item-icon','.hn-notification-detail-pane-wrap','.hn-notification-detail-title','.hn-notification-business-card','.hn-notification-detail-actions','.hn-notification-detail-footer'];const read=e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,height:r.height,fontFamily:c.fontFamily,fontSize:c.fontSize,lineHeight:c.lineHeight,fontWeight:c.fontWeight,color:c.color,background:c.backgroundColor,padding:c.padding,gap:c.gap,border:c.border,radius:c.borderRadius,boxShadow:c.boxShadow,display:c.display,overflow:c.overflow,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};};return {url:location.href,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},modal:read(el),elements:Object.fromEntries(sels.map(s=>[s,el.querySelector(s)?read(el.querySelector(s)):null])),horizontalOverflow:el.scrollWidth>el.clientWidth+1,bodyOverflow:document.documentElement.scrollWidth>innerWidth,fonts:document.fonts.status,items:[...el.querySelectorAll('.hn-notification-item')].map(e=>({id:e.getAttribute('data-notification-id'),box:read(e),icon:read(e.querySelector('.hn-notification-item-icon')),title:read(e.querySelector('strong')),subtitle:read(e.querySelector('.hn-notification-item-copy>span')),time:read(e.querySelector('time'))})),groups:[...el.querySelectorAll('.hn-notification-group h3')].map(read),backdrop:{background:getComputedStyle(el,'::backdrop').backgroundColor},buttons:[...el.querySelectorAll('button,a')].map(b=>({name:b.getAttribute('aria-label')||b.textContent,rect:read(b)}))};});
 row.after=await measure();await p.screenshot({path:path.join(out,`${cfg.name}-after.png`)});await d.screenshot({path:path.join(out,`${cfg.name}-modal.png`)});
 const search=d.getByRole('searchbox');await search.fill('in nhan');await p.waitForTimeout(350);row.searchCount=await d.locator('.hn-notification-item').count();await search.fill('');await p.waitForTimeout(350);await d.getByRole('tab',{name:/Chưa đọc/}).click();row.unreadFilterCount=await d.locator('.hn-notification-item').count();await d.getByRole('tab',{name:/Tất cả/}).click();
 if(cfg.height>cfg.width){
  row.listBeforeDetail=await measure();
  await d.locator('[data-notification-id="PREVIEW-DESIGN-2"]').click();row.detail=await measure();await p.screenshot({path:path.join(out,`${cfg.name}-detail.png`)});
  await d.getByRole('button',{name:'Đánh dấu đã đọc',exact:true}).click();row.readCount=await d.locator('.hn-notification-heading-badge').innerText();
  await d.getByRole('button',{name:'Quay lại danh sách'}).click();row.afterReadList=await measure();
  await d.locator('[data-notification-id="PREVIEW-DESIGN-2"]').click();await d.getByRole('button',{name:'Đánh dấu chưa đọc',exact:true}).click();row.unreadCount=await d.locator('.hn-notification-heading-badge').innerText();
  await d.getByRole('button',{name:'Quay lại danh sách'}).click();row.afterUnreadList=await measure();row.focusRestored=await d.locator('[data-notification-id="PREVIEW-DESIGN-2"]').evaluate(e=>e===document.activeElement);
 }
 else {await d.locator('[data-notification-id="PREVIEW-DESIGN-2"]').click();await d.getByRole('button',{name:'Đánh dấu đã đọc',exact:true}).click();row.readCount=await d.locator('.hn-notification-heading-badge').innerText();await d.getByRole('button',{name:'Đánh dấu chưa đọc',exact:true}).click();row.unreadCount=await d.locator('.hn-notification-heading-badge').innerText();}
 for(let i=0;i<16;i++){await p.keyboard.press('Tab');if(!await p.evaluate(()=>!!document.activeElement?.closest('dialog[open]')))throw Error('Focus escaped modal');}
 await p.keyboard.press('Escape');row.closeFocus=await p.locator('.hn-notifications').evaluate(e=>e===document.activeElement);await p.locator('.hn-notifications').click();
 row.end=await measure();row.runtimeSourceClean=execFileSync('git',['status','--porcelain','--','src'],{encoding:'utf8'}).trim()==='';row.result='CAPTURED';
 }catch(e){row.result='FAIL';row.failure=String(e);await p.screenshot({path:path.join(out,`${cfg.name}-failure.png`)}).catch(()=>{});}
 await ctx.tracing.stop({path:path.join(out,`${cfg.name}.zip`)});results.push(row);await fs.writeFile(path.join(out,'capture-results.json'),JSON.stringify({sha,results},null,2));await ctx.close();
}
await browser.close();await fs.writeFile(path.join(out,'capture-results.json'),JSON.stringify({sha,endedSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),results},null,2));console.log(JSON.stringify(results.map(r=>({profile:r.profile,result:r.result,failure:r.failure,errors:r.errors,modal:r.after?.modal})),null,2));





