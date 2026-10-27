# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: axe.spec.ts >> F-NC-003-AXE-1920-dark actual authenticated Notification modal
- Location: docs\quality\uiux-task-HN-NC-003\functional\axe.spec.ts:7:67

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 20

- Array []
+ Array [
+   Object {
+     "id": "aria-prohibited-attr",
+     "impact": "serious",
+     "nodes": Array [
+       Array [
+         ".hn-global-toast-region",
+       ],
+     ],
+   },
+   Object {
+     "id": "landmark-banner-is-top-level",
+     "impact": "moderate",
+     "nodes": Array [
+       Array [
+         "#hn-preview-notification-center > .hn-global-modal__surface > .hn-global-modal__header",
+       ],
+     ],
+   },
+ ]
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import fs from 'node:fs/promises';
  3  | import path from 'node:path';
  4  | import {execFileSync} from 'node:child_process';
  5  | const evidence=path.resolve('docs/quality/uiux-task-HN-NC-003/functional/axe');
  6  | const scanner=path.resolve('output/hn-nc-003-axe-runtime/node_modules/axe-core/axe.min.js');
  7  | for(const width of [1920,800])for(const theme of ['light','dark'])test(`F-NC-003-AXE-${width}-${theme} actual authenticated Notification modal`,async({browser},info)=>{
  8  |  const ctx=await browser.newContext({viewport:{width,height:width===1920?1080:1280},deviceScaleFactor:width===1920?1:2,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce'}),page=await ctx.newPage(),errors:string[]=[],requests:any[]=[];
  9  |  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>requests.push({method:r.method(),url:r.url(),failure:r.failure()}));
  10 |  await page.addInitScript(theme=>{localStorage.setItem('hn-wms.s00.language.v1','vi');localStorage.setItem('hn-wms.s00.theme.v1',theme);},theme);
  11 |  await page.goto('/#/preview/S01');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await expect(page.locator('.ov-result-count')).toBeVisible({timeout:90000});
  12 |  await page.locator('.hn-notifications').click();const d=page.locator('dialog[open]');await expect(d).toBeVisible();await expect(d.locator('.hn-notification-item')).toHaveCount(6);await page.evaluate(()=>document.fonts.ready);await expect(page.locator('html')).toHaveAttribute('data-hn-theme',theme);
  13 |  await fs.mkdir(evidence,{recursive:true});await page.screenshot({path:`${evidence}/${width}-${theme}.png`});await page.addScriptTag({path:scanner});
  14 |  const result=await page.evaluate(async()=>{const a=(window as any).axe;return {engineVersion:a.version,ruleInventory:a.getRules(),result:await a.run({include:[['dialog[open]']]},{reporter:'v2',resultTypes:['violations','incomplete','passes','inapplicable']})};});
  15 |  const record={profile:{width,height:width===1920?1080:1280,dpr:width===1920?1:2,theme,locale:'vi-VN'},candidateSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceTree:execFileSync('git',['rev-parse','HEAD:src'],{encoding:'utf8'}).trim(),errors,requests,...result};
  16 |  await fs.writeFile(`${evidence}/${width}-${theme}.json`,JSON.stringify(record,null,2));await info.attach('axe-result',{body:JSON.stringify(record),contentType:'application/json'});await ctx.close();
> 17 |  expect(errors).toEqual([]);expect(requests).toEqual([]);expect(result.result.violations.map((v:any)=>({id:v.id,impact:v.impact,nodes:v.nodes.map((n:any)=>n.target)}))).toEqual([]);
     |                                                                                                                                                                          ^ Error: expect(received).toEqual(expected) // deep equality
  18 | });
  19 | 
```