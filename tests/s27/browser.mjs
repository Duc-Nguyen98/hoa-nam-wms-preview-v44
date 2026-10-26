import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.env.S27_BASE_URL??'http://127.0.0.1:5182', phase=process.env.S27_PHASE??'after';
const output=path.resolve('output/s27-qa');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});const results=[],errors=[];
const viewports=[{name:'desktop',width:1920,height:1080,dpr:1},{name:'tablet',width:800,height:1280,dpr:2,touch:true},
  ...process.env.S27_QUICK?[]:[{name:'intermediate',width:1024,height:768,dpr:1},{name:'short',width:1280,height:600,dpr:1},{name:'zoom200-equivalent',width:960,height:540,dpr:2},{name:'narrow',width:390,height:844,dpr:1,touch:true},{name:'tablet-native',width:1600,height:2560,dpr:1,touch:true}]];
async function metrics(page){return page.evaluate(()=>{
  const box=s=>{const el=document.querySelector(s);if(!el)return null;const r=el.getBoundingClientRect(),c=getComputedStyle(el);return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,padding:c.padding,gap:c.gap,radius:c.borderRadius,columns:c.gridTemplateColumns,display:c.display,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight};};
  return{viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,image:[innerWidth*devicePixelRatio,innerHeight*devicePixelRatio],pageWidth:document.documentElement.scrollWidth,main:box('.hn-main'),screen:box('.s27-operational'),heading:box('.s27-list-heading'),toolbar:box('.hn-catalogue-toolbar'),footer:box('.s27-footer'),table:box('.s27-operational-table-view'),cards:box('.s27-operational-card-view'),card:box('.s27-operational-card'),dialog:box('dialog[open]'),body:box('dialog[open] .hn-global-modal__body'),modalFooter:box('dialog[open] .hn-global-modal__footer'),info:box('.s27-detail-info'),trace:box('.s27-detail-trace__value'),lock:getComputedStyle(document.body).overflow};
});}
try{for(const v of viewports){const ctx=await browser.newContext({viewport:{width:v.width,height:v.height},deviceScaleFactor:v.dpr,hasTouch:v.touch??false,permissions:['clipboard-read','clipboard-write']});const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-25T08:00:00Z')});
  for(const lang of process.env.S27_QUICK||phase==='before'?['vi']:['vi','en','zh-CN'])for(const theme of process.env.S27_QUICK||phase==='before'?['light']:['light','dark']){
    await page.addInitScript(({lang,theme})=>{localStorage.setItem('hn-wms.s00.language.v1',lang);localStorage.setItem('hn-wms.s00.theme.v1',theme);},{lang,theme});
    await page.goto(`${base}/tests/s27/harness.html?${phase==='before'?'before=1':''}`);await page.locator('[data-audit-detail-open]:visible').first().waitFor();
    const prefix=`${phase}-${v.name}-${lang}-${theme}`,list=await metrics(page);expect(list.pageWidth).toBeLessThanOrEqual(v.width);
    if(phase==='after'){expect(list.main.padding).toBe(v.width<560?'16px':v.width<=1100||v.touch?'24px':'32px');expect(list.screen.gap).toBe('24px');expect(list.heading.padding).toBe(v.width<560?'16px':'24px');if(v.name==='tablet'||v.name==='tablet-native')expect(list.table.display).toBe('none');
      const audit=await page.evaluate(()=>{
        const visible=e=>!!e.getClientRects().length;
        const targets=[...document.querySelectorAll('.s27-screen button,.s27-screen select,.s27-screen input')].filter(visible).map(e=>{const r=e.getBoundingClientRect();return{label:e.getAttribute('aria-label')??e.textContent,width:r.width,height:r.height};});
        const lum=c=>{const a=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
        const badge=[...document.querySelectorAll('.s27-source-badge')].find(visible),c=getComputedStyle(badge),fg=lum(c.color),bg=lum(c.backgroundColor);
        return{targets,sourceBadgeContrast:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05),text:document.querySelector('.s27-screen').innerText};
      });list.accessibility=audit;expect(audit.sourceBadgeContrast).toBeGreaterThanOrEqual(4.5);if(v.touch)expect(audit.targets.filter(t=>t.width<43.9||t.height<43.9)).toEqual([]);
      if(lang!=='vi')expect(audit.text).not.toMatch(/Nhật ký|Hành động|Người thao tác|Phiên bản|Đọc lại|Chưa có|Tìm trong/);
    }
    const capture=['desktop','tablet'].includes(v.name);if(capture){await page.screenshot({path:path.join(output,`${prefix}-list.png`)});await page.screenshot({path:path.join(output,`${prefix}-list-full.png`),fullPage:true});}
    const opener=page.locator('[data-audit-detail-open]:visible').first();await opener.scrollIntoViewIfNeeded();const id=await opener.getAttribute('data-audit-detail-open');const scroll=await page.evaluate(()=>scrollY);await opener.click();const dialog=page.locator('dialog[open]');await expect(dialog).toBeVisible();
    const detail=await metrics(page);if(phase==='after'){
      await expect(dialog.locator('[data-audit-detail-id]')).toHaveAttribute('data-audit-detail-id',id);expect(detail.dialog.bottom).toBeLessThanOrEqual(v.height-15);expect(detail.modalFooter.bottom).toBeLessThanOrEqual(detail.dialog.bottom);expect(detail.lock).toBe('hidden');
      expect(detail.body.scrollWidth).toBeLessThanOrEqual(detail.body.clientWidth);expect(detail.body.padding).toBe(v.width<=560?'16px':'24px');
      for(let i=0;i<10;i++){await page.keyboard.press('Tab');expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);}
      await page.keyboard.press('Control+k');await expect(page.locator('dialog[open]')).toHaveCount(1);
      const refresh=dialog.locator('.hn-global-modal__footer button').first();await refresh.click();await expect(dialog).toHaveAttribute('data-audit-detail-state','ready');await expect(dialog.locator('[data-audit-detail-id]')).toHaveAttribute('data-audit-detail-id',id);
    }
    if(capture)await page.screenshot({path:path.join(output,`${prefix}-detail.png`)});
    await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);expect(await opener.evaluate(el=>document.activeElement===el)).toBe(true);expect(await page.evaluate(()=>scrollY)).toBe(scroll);results.push({prefix,list,detail,focusReturn:true,scrollPreserved:true});
  }await ctx.close();}expect(errors).toEqual([]);await fs.writeFile(path.join(output,`${phase}-matrix.json`),JSON.stringify({phase,base,results,errors},null,2));console.log(JSON.stringify({phase,checks:results.length,errors}));
}catch(e){await browser.contexts().at(-1)?.pages().at(-1)?.screenshot({path:path.join(output,`${phase}-failure.png`),fullPage:true});await fs.writeFile(path.join(output,`${phase}-failure.json`),JSON.stringify({error:String(e),stack:e.stack,results,errors},null,2));throw e;}finally{await browser.close();}
