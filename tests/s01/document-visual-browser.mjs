import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';

const base=process.env.S01_LINK_BASE??'http://127.0.0.1:5187';
const phase=process.env.S01_LINK_PHASE??'visual-local';
const output=`output/s01-document-${phase}`;await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1920,height:1080}}),results=[],errors=[];
page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(15000);
const layouts=[['desktop',1920,1080],['tablet',800,1280],['phone',390,844],['low',960,540]];
async function geometry(locator){return locator.evaluateAll(elements=>elements.filter(e=>e.getClientRects().length).map(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return {label:e.getAttribute('aria-label')??e.textContent.trim(),width:b.width,height:b.height,font:s.fontSize,background:s.backgroundColor};}));}
try{
 await page.goto(base+'/#/preview/S07');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.locator('.ov-result-count').waitFor();
 for(const [layout,width,height] of layouts)for(const theme of ['light','dark'])for(const language of (['desktop','tablet'].includes(layout)?['vi','en','zh']:['vi'])){
  await page.setViewportSize({width,height});await page.evaluate(({theme,language})=>{localStorage.setItem('hn-wms.s00.theme.v1',theme);localStorage.setItem('hn-wms.s00.language.v1',language);},{theme,language});await page.goto(base+'/#/preview/S01');await page.reload();await page.locator('.ov-result-count').waitFor();
  for(const [number,id,screen] of [['PN-0005','fixture-inbound-0005','S12'],['PX-0004','b12-outbound-0004','S15']]){
   await page.locator('#ov-search-input').fill(number);await page.locator('#ov-search-input').press('Enter');const opener=page.locator(`.ov-activity [data-overview-detail-opener="${id}"].ov-document-link:visible`);await opener.click();const dialog=page.locator('.ov-detail-modal[open]');await expect(dialog.locator('[data-overview-detail-id]')).toHaveAttribute('data-overview-detail-id',id);
   const bounds=await dialog.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);expect(bounds.y+bounds.height).toBeLessThanOrEqual(height+1);
   const controls=await geometry(dialog.locator('button'));for(const control of controls){expect(control.width,JSON.stringify(control)).toBeGreaterThanOrEqual(44);expect(control.height,JSON.stringify(control)).toBeGreaterThanOrEqual(44);}
   const footer=await dialog.locator('footer').boundingBox();expect(footer.y+footer.height).toBeLessThanOrEqual(height+1);
   await page.keyboard.press('Escape');await expect(opener).toBeFocused();await opener.click();const cta=dialog.locator('footer .hn-button--primary');await cta.focus();await page.keyboard.press('Tab');expect(await dialog.evaluate(e=>e.contains(document.activeElement))).toBe(true);await cta.click();
   const root=page.locator('[data-source-document-id]');await expect(root).toHaveAttribute('data-source-document-id',id);expect(page.url()).toContain(`/preview/${screen}?`);await expect(root.locator('[data-document-field="number"]')).toHaveText(number);
   for(const summary of await root.locator('.ov-source-document__serials summary').all())await summary.click();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   const targets=await geometry(root.locator('button,summary,a'));for(const target of targets)expect(target.height,JSON.stringify(target)).toBeGreaterThanOrEqual(44);
   const metrics=await root.evaluate(e=>{const dt=e.querySelector('dt'),code=e.querySelector('code'),panel=e.querySelector('.ov-source-document__panel');return {labelValueGap:getComputedStyle(dt).marginBottom,codeFont:getComputedStyle(code).fontSize,panelPadding:getComputedStyle(panel).padding};});
   if(language==='vi'&&theme==='dark'&&['desktop','tablet'].includes(layout)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${output}/${layout}-${number}-${theme}.png`,fullPage:true});}
   results.push({layout,width,height,theme,language,number,id,controls,targets,metrics,bounds,footer});await page.goBack();await page.locator('.ov-result-count').waitFor();
  }
 }
 expect(errors).toEqual([]);console.log(JSON.stringify({scenarios:results.length,errors}));
}catch(error){await page.screenshot({path:`${output}/failure.png`,fullPage:true});throw error;}
finally{await fs.writeFile(`${output}/results.json`,JSON.stringify({base,results,errors},null,2));await browser.close();}
