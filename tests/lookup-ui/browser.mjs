import {chromium, expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {unzipSync,strFromU8} from 'fflate';
const base=process.env.LOOKUP_BASE??'http://127.0.0.1:5186', out=process.env.LOOKUP_OUTPUT??'output/lookup-ui-after';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1920,height:1080}}),checks=[],errors=[];
page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
const preferences=async(language,theme)=>page.evaluate(({language,theme})=>{localStorage.setItem('hn-wms.s00.language.v1',language);localStorage.setItem('hn-wms.s00.theme.v1',theme);window.dispatchEvent(new StorageEvent('storage',{key:null}));},{language,theme});
async function screen(id,width){
 await page.goto(base+'/#/preview/'+id);const root=page.locator(`[data-screen="${id}"]`),prefix=id.toLowerCase();
 await root.locator(width<=1100?`.${prefix}-lookup-card`:'.hn-table tbody tr').first().waitFor();
 const action=root.locator(width<=1100?`.${prefix}-lookup-card > button`:`.${prefix}-lookup-table tbody [data-column="actions"] button`).first();
 await expect(action).not.toHaveAttribute('aria-disabled','true');await expect(action).toBeEnabled();await page.evaluate(()=>document.fonts.ready);return {root,action};
}
try {
 await page.goto(base+'/#/preview/S07');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.locator('.ov-result-count').waitFor();
 for(const [layout,width,height] of (process.env.LOOKUP_FAST?[]:[['desktop',1920,1080],['tablet',800,1280]]))for(const language of ['vi','en','zh-CN'])for(const theme of ['light','dark']) {
  await page.setViewportSize({width,height});await preferences(language,theme);
  for(const id of ['S11','S16','S23']) {
   const {root,action}=await screen(id,width);await page.mouse.move(0,0);await page.evaluate(()=>document.activeElement?.blur());
   const metrics=await root.evaluate(e=>({overflow:document.documentElement.scrollWidth>innerWidth+1,title:getComputedStyle(e.querySelector('h1')).fontSize,visibleActions:[...e.querySelectorAll('[class$="-lookup-card"] > button, [class$="-lookup-table"] tbody [data-column="actions"] button')].filter(el=>el.getClientRects().length).map(el=>{const b=el.getBoundingClientRect();return {height:b.height,left:b.left,right:b.right,font:getComputedStyle(el).fontSize};})}));
   expect(metrics.overflow).toBe(false);expect(metrics.visibleActions.length).toBeGreaterThan(0);for(const a of metrics.visibleActions){expect(a.left).toBeGreaterThanOrEqual(0);expect(a.right).toBeLessThanOrEqual(width);expect(a.height).toBeGreaterThanOrEqual(width<=1100?52:48);}
   if(language==='vi'||layout==='tablet'&&theme==='dark')await page.screenshot({path:`${out}/${layout}-${language}-${theme}-${id}-list.png`,fullPage:true});
   await action.click();const modal=page.locator('dialog[open]');await modal.waitFor();await expect(modal.locator('h2')).not.toBeEmpty();
   const bounds=await modal.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);
   if(language==='vi'||layout==='tablet'&&theme==='dark')await page.screenshot({path:`${out}/${layout}-${language}-${theme}-${id}-detail.png`,fullPage:true});
   await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);await expect(action).toBeFocused();
   checks.push({kind:'layout',layout,language,theme,id,...metrics});console.log('PASS',layout,language,theme,id);
  }
 }
 await preferences('vi','light');
 for(const [width,height] of (process.env.LOOKUP_FAST?[]:[[1024,768],[1280,800],[400,860]])){
  await page.setViewportSize({width,height});
  for(const id of ['S11','S16','S23']){const {root,action}=await screen(id,width);const actionBounds=await action.boundingBox();expect(actionBounds.x).toBeGreaterThanOrEqual(0);expect(actionBounds.x+actionBounds.width).toBeLessThanOrEqual(width);await action.click();const modal=page.locator('dialog[open]');await expect(modal).toBeVisible();await page.screenshot({path:`${out}/edge-${width}-${id}.png`,fullPage:true});await modal.locator('.hn-global-modal__footer button').last().scrollIntoViewIfNeeded();await page.keyboard.press('Escape');expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);checks.push({kind:'edge',width,height,id});}
 }
 await page.setViewportSize({width:800,height:1280});
 for(const id of ['S11','S16']) {
  const {root,action}=await screen(id,800),prefix=id.toLowerCase(),search=root.locator(`#${prefix}-operational-search`),cards=root.locator(`.${prefix}-lookup-card`),code=await cards.first().locator('h3').innerText();
  await search.fill('NO-SUCH-ROW-987654');await expect(cards).toHaveCount(0);await search.fill(code);await expect(cards).toHaveCount(1);await search.clear();await expect(cards).toHaveCount(2);
  await action.click();const modal=page.locator('dialog[open]');const refresh=modal.getByRole('button',{name:'Đọc lại dữ liệu',exact:true});await refresh.click();await expect(refresh).toBeEnabled();await expect(modal.locator('dl').first()).toContainText(code);if(id==='S16'){await page.screenshot({path:out+'/S16-final-detail.png',fullPage:true});expect(await modal.locator('.hn-table-scroll').evaluate(e=>e.scrollWidth>e.clientWidth+1)).toBe(false);}await modal.getByRole('button',{name:'Đóng',exact:true}).last().click();await expect(action).toBeFocused();checks.push({kind:'search-refresh-focus',id});
 }
 const {root}=await screen('S23',800),search=root.locator('#s23-query-search'),cards=root.locator('.s23-lookup-card');
 await search.fill('NO-SUCH-LABEL-987654');await expect(cards).toHaveCount(0);await search.clear();await expect(cards).toHaveCount(5);
 await root.getByRole('button',{name:'Bộ lọc',exact:true}).click();await root.locator('#s23-query-fields select').selectOption('Lỗi in');await expect(cards).toHaveCount(1);await expect(cards.first().locator('h3')).toHaveText('LBH0012343');await root.getByRole('button',{name:'Đặt lại',exact:true}).click();await expect(cards).toHaveCount(5);await root.getByRole('button',{name:'Đóng bộ lọc',exact:true}).click();
 await root.locator('.s23-card-sort select').first().selectOption('labelCode');await expect(cards.first().locator('h3')).toHaveText('LBH0012341');await root.locator('.s23-card-sort select').last().selectOption('desc');await expect(cards.first().locator('h3')).toHaveText('LBH0012345');
 const count=Number(await cards.first().locator('dl > div').nth(1).locator('dd').innerText());await cards.first().locator(':scope > button').click();await page.locator('dialog[open]').getByRole('button',{name:'Hủy',exact:true}).click();await expect(cards.first().locator('dl > div').nth(1).locator('dd')).toHaveText(String(count));
 await cards.first().locator(':scope > button').click();await page.locator('dialog[open]').getByRole('button',{name:'Xác nhận in lại',exact:true}).click();await expect(page.locator('[data-print-phase]')).toHaveAttribute('data-print-phase','success');await page.locator('dialog[open]').getByRole('button',{name:'Đóng',exact:true}).last().click();await expect(cards.first().locator('dl > div').nth(1).locator('dd')).toHaveText(String(count+1));
 await expect(page.locator('dialog[open]')).toHaveCount(0);await page.reload();await screen('S23',800);const printed=cards.filter({has:page.getByRole('heading',{name:'LBH0012345',exact:true})});await expect(printed.locator('dl > div').nth(1).locator('dd')).toHaveText(String(count+1));
 await printed.locator(':scope > button').click();await expect(page.locator('dialog[open] .s23-print-details > div').last().locator('dd')).toHaveText(String(count+1));await page.keyboard.press('Escape');
 const failed=cards.filter({has:page.getByRole('heading',{name:'LBH0012343',exact:true})});await failed.locator(':scope > button').click();await page.locator('dialog[open]').getByRole('button',{name:'Xác nhận thử lại',exact:true}).click();await expect(page.locator('[data-print-phase]')).toHaveAttribute('data-print-phase','success');await page.locator('dialog[open]').getByRole('button',{name:'Đóng',exact:true}).last().click();await expect(failed.locator('dl > div').nth(1).locator('dd')).toHaveText('2');await expect(failed.getByText('In thành công',{exact:true})).toBeVisible();
 const download=page.waitForEvent('download');await root.getByRole('button',{name:'Xuất Excel',exact:true}).click();const file=await download;expect(file.suggestedFilename()).toMatch(/\.xlsx$/);const exportPath=out+'/'+file.suggestedFilename();await file.saveAs(exportPath);const xml=strFromU8(unzipSync(await fs.readFile(exportPath))['xl/worksheets/sheet1.xml']);for(const code of ['LBH0012345','LBH0012343']){const row=xml.match(/<row\b[^>]*>.*?<\/row>/g).find(row=>row.includes(code));expect(row).toMatch(/<c r="H\d+"[^>]*><v>2<\/v>/);}
 checks.push({kind:'label-search-filter-sort-cancel-reprint-retry-reload-detail-export'});
 expect(errors).toEqual([]);console.log(JSON.stringify({checks:checks.length,errors}));
} catch(error){await page.screenshot({path:out+'/failure.png',fullPage:true});throw error;} finally {await fs.writeFile(out+'/results.json',JSON.stringify({checks,errors},null,2));await browser.close();}
