import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const evidence=path.resolve(process.env.QA_AXE_EVIDENCE_DIR??'docs/quality/uiux-task-HN-NC-003/functional/axe');
const scanner=path.resolve('output/hn-nc-003-axe-runtime/node_modules/axe-core/axe.min.js');
async function custody(){const hashes=[];for(const file of ['src/notifications/notifications.css','src/shared/GlobalModal.tsx','src/toast/GlobalToastProvider.tsx'])hashes.push({file,sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex')});return {candidateSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceTree:execFileSync('git',['rev-parse','HEAD:src'],{encoding:'utf8'}).trim(),workingSourceDiff:execFileSync('git',['diff','HEAD','--','src'],{encoding:'utf8'}),hashes};}
for(const width of [1920,800])for(const theme of ['light','dark'])test(`F-NC-003-AXE-${width}-${theme} actual authenticated Notification modal`,async({browser},info)=>{
 const sourceStart=await custody();
 const ctx=await browser.newContext({viewport:{width,height:width===1920?1080:1280},deviceScaleFactor:width===1920?1:2,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce'}),page=await ctx.newPage(),errors:string[]=[],requests:any[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>requests.push({method:r.method(),url:r.url(),failure:r.failure()}));
 await page.addInitScript(theme=>{localStorage.setItem('hn-wms.s00.language.v1','vi');localStorage.setItem('hn-wms.s00.theme.v1',theme);},theme);
 await page.goto('/#/preview/S01');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await expect(page.locator('.ov-result-count')).toBeVisible({timeout:90000});
 await page.locator('.hn-notifications').click();const d=page.locator('dialog[open]');await expect(d).toBeVisible();await expect(d.locator('.hn-notification-item')).toHaveCount(6);await page.evaluate(()=>document.fonts.ready);await expect(page.locator('html')).toHaveAttribute('data-hn-theme',theme);
 await fs.mkdir(evidence,{recursive:true});await page.screenshot({path:`${evidence}/${width}-${theme}.png`});await page.addScriptTag({path:scanner});
 const result=await page.evaluate(async()=>{const a=(window as any).axe;return {engineVersion:a.version,ruleInventory:a.getRules(),result:await a.run({include:[['dialog[open]']]},{reporter:'v2',resultTypes:['violations','incomplete','passes','inapplicable']})};});
 const sourceEnd=await custody();const record={profile:{width,height:width===1920?1080:1280,dpr:width===1920?1:2,theme,locale:'vi-VN'},candidateSha:sourceEnd.candidateSha,sourceStart,sourceEnd,errors,requests,...result};
 await fs.writeFile(`${evidence}/${width}-${theme}.json`,JSON.stringify(record,null,2));await info.attach('axe-result',{body:JSON.stringify(record),contentType:'application/json'});await ctx.close();
 expect(sourceStart).toEqual(sourceEnd);expect(sourceEnd.workingSourceDiff).toBe('');expect(errors).toEqual([]);expect(requests).toEqual([]);expect(result.result.violations.map((v:any)=>({id:v.id,impact:v.impact,nodes:v.nodes.map((n:any)=>n.target)}))).toEqual([]);
});
