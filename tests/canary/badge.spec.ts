import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const evidence=path.resolve(process.env.CANARY_EVIDENCE??'docs/quality/canary/HN-AUTO-NC-BADGE-001/before');
for(const profile of [{name:'desktop',width:1920,height:1080},{name:'tablet',width:800,height:1280}]){
 test(`actual NotificationBell visible cap ${profile.name}`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
  await page.setViewportSize(profile);await page.goto('/tests/canary/badge.html');await expect(page.locator('[data-case]')).toHaveCount(7);
  const rows=[];
  for(const count of [0,1,9,10,99,100,999]){
   const root=page.locator(`[data-case="${count}"]`),bell=root.getByRole('button',{name:`Thông báo · ${count}`,exact:true}),badge=root.locator('.hn-notifications__count');
   await expect(bell).toBeVisible();
   rows.push(await root.evaluate(e=>{const b=e.querySelector('.hn-notifications__count');const r=b?.getBoundingClientRect();return{count:Number(e.getAttribute('data-case')),text:b?.textContent??'',display:b?getComputedStyle(b).display:null,rect:r?{width:r.width,height:r.height,x:r.x,y:r.y}:null};}));
   if(count===0)await expect(badge).toHaveCount(0);else {await expect.soft(badge).toHaveText(count>=100?'99+':String(count));await expect.soft(badge).toBeVisible();}
  }
  for(const row of rows.filter(r=>r.count>0)){expect.soft(row.rect!.width).toBeGreaterThan(0);expect.soft(row.rect!.height).toBeGreaterThan(0);expect.soft(row.rect!.x).toBeGreaterThanOrEqual(0);expect.soft(row.rect!.x+row.rect!.width).toBeLessThanOrEqual(profile.width);}
  const provenance={runtimeSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),contractSha256:createHash('sha256').update(await fs.readFile('docs/quality/DESIGN_CONTRACT.md')).digest('hex')};
  await fs.mkdir(evidence,{recursive:true});await page.screenshot({path:path.join(evidence,`${profile.name}.png`)});await fs.writeFile(path.join(evidence,`${profile.name}.json`),JSON.stringify({profile,provenance,rows,errors},null,2));
  expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
