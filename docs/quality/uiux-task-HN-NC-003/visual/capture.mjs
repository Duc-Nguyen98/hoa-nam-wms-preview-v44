import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out=process.env.VQ_OUT??path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const browser=await chromium.launch();
const results=[];
await fs.mkdir(out,{recursive:true});
for(const cfg of [{name:'desktop-native',width:1774,height:887,dpr:1},{name:'tablet-native',width:992,height:1586,dpr:1}]){
 const ctx=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},deviceScaleFactor:cfg.dpr,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh'});
 await ctx.tracing.start({screenshots:true,snapshots:true});
 const p=await ctx.newPage();const errors=[],requests=[];
 p.on('pageerror',e=>errors.push({kind:'pageerror',message:e.message}));p.on('console',m=>{if(m.type()==='error')errors.push({kind:'console',message:m.text()});});p.on('requestfailed',r=>requests.push({url:r.url(),failure:r.failure()}));p.on('response',r=>{if(r.status()>=400)requests.push({url:r.url(),status:r.status()});});
 const row={profile:cfg,sha,environment:'LOCAL_PREVIEW_MOCK',base:'http://127.0.0.1:5233',errors,requests};
 try{
 if(!process.env.VQ_WALL_CLOCK)await p.clock.setFixedTime(new Date('2026-10-25T05:00:00Z'));
 await p.goto('http://127.0.0.1:5233/#/preview/S07');await p.locator('#s07-username').fill('demo');await p.locator('#s07-password').fill('HoaNamDemo@2026');await p.locator('.s07-submit').click();await p.locator('.s08-confirm').click();await p.getByRole('button',{name:'Tiếp tục',exact:true}).click();await p.locator('.ov-result-count').waitFor({timeout:180000});
 await p.goto('http://127.0.0.1:5233/#/preview/S15');await p.locator('.hn-notifications').click();const d=p.locator('dialog[open].hn-notification-center');await d.waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(600);
 const measure=()=>d.evaluate(el=>{const sels=['.hn-global-modal__header','.hn-global-modal__heading h2','.hn-notification-heading-icon','.hn-notification-heading-badge','.hn-notification-center-grid','.hn-notification-list-pane','.hn-notification-search','.hn-notification-filter-row','.hn-notification-list-scroll','.hn-notification-item','.hn-notification-item-copy strong','.hn-notification-item-icon','.hn-notification-detail-pane-wrap','.hn-notification-detail-title','.hn-notification-business-card','.hn-notification-detail-actions','.hn-notification-detail-footer'];const read=e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,height:r.height,fontFamily:c.fontFamily,fontSize:c.fontSize,lineHeight:c.lineHeight,fontWeight:c.fontWeight,color:c.color,background:c.backgroundColor,padding:c.padding,gap:c.gap,border:c.border,radius:c.borderRadius,boxShadow:c.boxShadow,display:c.display,overflow:c.overflow,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};};return {url:location.href,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},modal:read(el),elements:Object.fromEntries(sels.map(s=>[s,el.querySelector(s)?read(el.querySelector(s)):null])),horizontalOverflow:el.scrollWidth>el.clientWidth+1,bodyOverflow:document.documentElement.scrollWidth>innerWidth,fonts:document.fonts.status,backdrop:{background:getComputedStyle(el,'::backdrop').backgroundColor},buttons:[...el.querySelectorAll('button,a')].map(b=>({name:b.getAttribute('aria-label')||b.textContent,rect:read(b)}))};});
 row.before=await measure();await p.screenshot({path:path.join(out,`${cfg.name}-before.png`)});await d.screenshot({path:path.join(out,`${cfg.name}-modal.png`)});
 const search=d.getByRole('searchbox');await search.fill('in nhan');await p.waitForTimeout(350);row.searchCount=await d.locator('.hn-notification-item').count();await search.fill('');await p.waitForTimeout(350);await d.getByRole('tab',{name:/Chưa đọc/}).click();row.unreadFilterCount=await d.locator('.hn-notification-item').count();await d.getByRole('tab',{name:/Tất cả/}).click();
 if(cfg.name.startsWith('tablet')){await d.locator('[data-notification-id="PREVIEW-DESIGN-2"]').click();row.detail=await measure();await p.screenshot({path:path.join(out,`${cfg.name}-detail.png`)});await d.getByRole('button',{name:'Quay lại danh sách'}).click();row.focusRestored=await d.locator('[data-notification-id="PREVIEW-DESIGN-2"]').evaluate(e=>e===document.activeElement);}
 else {await d.locator('[data-notification-id="PREVIEW-DESIGN-2"]').click();await d.getByRole('button',{name:'Đánh dấu đã đọc',exact:true}).click();row.readCount=await d.locator('.hn-notification-heading-badge').innerText();await d.getByRole('button',{name:'Đánh dấu chưa đọc',exact:true}).click();row.unreadCount=await d.locator('.hn-notification-heading-badge').innerText();}
 for(let i=0;i<16;i++){await p.keyboard.press('Tab');if(!await p.evaluate(()=>!!document.activeElement?.closest('dialog[open]')))throw Error('Focus escaped modal');}
 await p.keyboard.press('Escape');row.closeFocus=await p.locator('.hn-notifications').evaluate(e=>e===document.activeElement);await p.locator('.hn-notifications').click();
 await p.setViewportSize(cfg.name.startsWith('desktop')?{width:1920,height:1080}:{width:800,height:1280});await p.waitForTimeout(300);row.canonical=await measure();await p.screenshot({path:path.join(out,`${cfg.name}-canonical.png`)});
 row.result='CAPTURED';
 }catch(e){row.result='FAIL';row.failure=String(e);await p.screenshot({path:path.join(out,`${cfg.name}-failure.png`)}).catch(()=>{});}
 await ctx.tracing.stop({path:path.join(out,`${cfg.name}.zip`)});results.push(row);await fs.writeFile(path.join(out,'capture-results.json'),JSON.stringify({sha,results},null,2));await ctx.close();
}
await browser.close();await fs.writeFile(path.join(out,'capture-results.json'),JSON.stringify({sha,endedSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),results},null,2));console.log(JSON.stringify(results.map(r=>({profile:r.profile,result:r.result,failure:r.failure,errors:r.errors,modal:r.before?.modal})),null,2));
