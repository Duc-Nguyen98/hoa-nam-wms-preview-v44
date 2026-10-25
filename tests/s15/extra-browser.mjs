import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch(),results=[];
try {
 for(const [name,width,height,dpr] of [['zoom200-equivalent',960,540,2],['desktop',1920,1080,1]]) {
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:5188/tests/s15/harness.html?long&count=25');
  await page.locator('[data-s15-operational-action]:visible').first().waitFor();
  await page.locator('#s15-operational-search').fill('no-match');
  await expect(page.locator('[data-state="no-results"]')).toBeVisible();
  await page.screenshot({path:`output/s15-state-no-results-${name}.png`});
  await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();
  await page.locator('[data-s15-operational-action]:visible').first().click();
  const dialog=page.locator('.s15-operational-detail[open]');
  await expect(dialog.locator('.hn-global-modal__footer')).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
  await page.screenshot({path:`output/s15-${name}-long-detail.png`});
  await page.evaluate(()=>s15qa.state='missing');
  await dialog.getByRole('button',{name:'Đọc lại dữ liệu',exact:true}).click();
  await expect(dialog.locator('[data-state="record-not-found"]')).toBeVisible();
  await page.screenshot({path:`output/s15-state-detail-missing-${name}.png`});
  results.push({name,viewport:{width,height},dpr,passed:true});
  await context.close();
 }
} finally { await fs.writeFile('output/s15-extra-results.json',JSON.stringify(results,null,2));await browser.close(); }
console.log(JSON.stringify(results));
