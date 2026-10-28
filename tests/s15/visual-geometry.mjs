import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 992, height: 1586 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:5188/tests/s15/harness.html');

  const toggle = page.locator('.s15-card-recipient:visible').first();
  await toggle.waitFor();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const expandedGeometry = await page.evaluate(() => {
    const card = document.querySelector('.s15-outbound-card');
    const cta = card?.querySelector('.s15-view-button');
    const footer = document.querySelector('.s15-operational-footer--tablet');
    const rect = (element) => element?.getBoundingClientRect();
    return {
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight,
      ctaBottom: rect(cta)?.bottom,
      footerBottom: rect(footer)?.bottom,
      interactiveBelowMinimum: [...document.querySelectorAll('button,input,select')]
        .filter(element => element.getClientRects().length)
        .some(element => { const r = element.getBoundingClientRect(); return r.width < 44 || r.height < 44; }),
    };
  });
  expect(expandedGeometry.scrollHeight).toBeLessThanOrEqual(expandedGeometry.innerHeight);
  expect(expandedGeometry.ctaBottom).toBeLessThanOrEqual(expandedGeometry.innerHeight);
  expect(expandedGeometry.footerBottom).toBeLessThanOrEqual(expandedGeometry.innerHeight);
  expect(expandedGeometry.interactiveBelowMinimum).toBe(false);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.locator('[data-s15-operational-action]:visible').first().click();
  const detail = page.locator('.s15-operational-detail[open]');
  await detail.waitFor();
  const modalGeometry = await detail.evaluate(element => {
    const dialog = element.getBoundingClientRect();
    const footer = element.querySelector('.hn-global-modal__footer')?.getBoundingClientRect();
    return { top: dialog.top, bottom: dialog.bottom, footerBottom: footer?.bottom };
  });
  expect(modalGeometry.top).toBeGreaterThan(250);
  expect(modalGeometry.footerBottom).toBeLessThanOrEqual(1586);
  await page.keyboard.press('Escape');
  await expect(detail).toHaveCount(0);
  expect(pageErrors).toEqual([]);
  console.log(JSON.stringify({ expandedGeometry, modalGeometry, pageErrors }));
  await context.close();
} finally {
  await browser.close();
}
