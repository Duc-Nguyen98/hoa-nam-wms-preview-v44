import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch({ headless: true }), results = [];
try {
  for (const [width, height] of [[1672, 941], [800, 1280]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 1101 });
    await page.goto('http://127.0.0.1:5273/tests/s01/harness.html?state=reference');
    await page.locator('.ov-attention [data-overview-detail-opener="p12-stock-PX-0007"].ov-document-link').click();
    await page.evaluate(() => document.fonts.ready);
    results.push(await page.locator('dialog.ov-detail-modal').evaluate((modal, width) => {
      const footer = modal.querySelector('.hn-global-modal__footer'), c = getComputedStyle(footer);
      return { width, modalHeight: modal.getBoundingClientRect().height, footerHeight: footer.getBoundingClientRect().height,
        paddingBlock: c.paddingBlock, paddingInline: c.paddingInline,
        buttons: [...footer.querySelectorAll('.hn-button')].map(e => ({ label: e.textContent, height: e.getBoundingClientRect().height })) };
    }, width));
    await page.close();
  }
} finally { await browser.close(); }
await fs.writeFile(new URL(`./footer-${process.env.FOOTER_PHASE ?? 'before'}.json`, import.meta.url), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results));
