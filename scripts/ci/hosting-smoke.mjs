// Read-only reachability smoke. Does not authenticate, mutate data or approve QA.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const targets = [
  ['pages-s01','https://duc-nguyen98.github.io/hoa-nam-wms-preview-v44/#/preview/S01'],
  ['pages-report','https://duc-nguyen98.github.io/hoa-nam-wms-preview-v44/review/DOCUMENT_FLOW_VISUAL_COMPARISON.html'],
  ['site-s01','https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S01'],
];
const browser = await chromium.launch({headless:true});
const results = [];
await fs.mkdir('output/s00-5/hosting',{recursive:true});
try {
  for (const [profile,viewport] of [['desktop',{width:1920,height:1080}],['tablet',{width:800,height:1280}]]) {
    for (const [name,url] of targets) {
      const context = await browser.newContext({viewport,locale:'vi-VN',timezoneId:'Asia/Bangkok'});
      const page = await context.newPage();
      const result = {name,profile,url,checkedAt:new Date().toISOString(),errors:[],failedRequests:[],httpErrors:[]};
      page.on('pageerror',e=>result.errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
      page.on('requestfailed',r=>result.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
      page.on('response',r=>{if(r.status()>=400)result.httpErrors.push({url:r.url(),status:r.status()});});
      try {
        const response = await page.goto(url,{waitUntil:'networkidle',timeout:30000});
        result.httpStatus = response?.status();
        result.finalURL = page.url();
        result.title = await page.title();
        result.visibleText = (await page.locator('body').innerText()).slice(0,1600);
        result.links = await page.locator('a[href]').evaluateAll(nodes=>nodes.slice(0,40).map(n=>({text:n.textContent,url:n.href})));
        result.screenshot = `output/s00-5/hosting/${name}-${profile}.png`;
        await page.screenshot({path:result.screenshot,fullPage:false});
        result.status = result.httpStatus===200 && !result.errors.length && !result.httpErrors.length && !result.failedRequests.length ? 'REACHABLE' : 'OBSERVED_ERRORS';
      } catch(error) { result.status='BLOCKED';result.error=error.message; }
      results.push(result);
      await context.close();
    }
  }
} finally { await browser.close(); }
await fs.writeFile('output/s00-5/hosting-smoke.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(({name,profile,status,httpStatus,errors,failedRequests,httpErrors,visibleText})=>({name,profile,status,httpStatus,errors,failedRequests,httpErrors,visibleText})),null,2));
