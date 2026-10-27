import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const phase = process.env.V08_PHASE ?? 'before';
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [800, 992]) {
    const page = await browser.newPage({ viewport: { width, height: 1280 }, hasTouch: true });
    await page.goto('http://127.0.0.1:5273/tests/s01/harness.html?state=reference');
    await page.locator('.ov-mobile-row').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    const rows = await page.locator('.ov-mobile-row').evaluateAll(rows => rows.map(row => {
      const textBox = e => {
        const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), rects = [];
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent.trim() || walker.currentNode.parentElement.closest('svg')) continue;
          const range = document.createRange(); range.selectNodeContents(walker.currentNode);
          rects.push(...range.getClientRects());
        }
        return { top: Math.min(...rects.map(r => r.top)), bottom: Math.max(...rects.map(r => r.bottom)) };
      };
      const number = row.querySelector('.ov-document-link'), type = row.querySelector('.ov-document-type');
      const n = textBox(number), t = textBox(type), b = number.getBoundingClientRect();
      return { number: number.textContent, type: type.textContent, numberText: n, typeText: t,
        textGap: t.top - n.bottom, button: { width: b.width, height: b.height },
        meta: row.querySelector('.ov-mobile-row__meta').innerText,
        status: row.querySelector('.hn-status-badge').innerText,
        action: row.querySelector('.ov-mobile-row__action').getAttribute('aria-label') };
    }));
    results.push({ width, rows });
    await page.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(new URL(`./mobile-row-${phase}.json`, import.meta.url), JSON.stringify({ phase, results }, null, 2));
}
console.log(JSON.stringify(results));
if (phase === 'after' && results.some(r => r.rows.some(row => row.textGap <= 0 || row.button.height < 44 || row.button.width < 44))) process.exitCode = 1;
