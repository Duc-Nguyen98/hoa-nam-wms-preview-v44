import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [1920, 800, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5188/tests/s15/harness.html?state=error&recovery=pending');
    await expect(page.locator('[data-state="stale"]')).toBeVisible();
    await expect(page.locator('[data-state="stale"]')).toContainText('Chưa xác định kết quả');
    await expect(page.getByRole('button', { name: 'Đọc lại dữ liệu', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Kiểm tra lại thao tác', exact: true })).toBeEnabled();
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.locator('[data-state="stale"]')).toContainText('Chưa xác định kết quả');
    expect(await page.evaluate(() => s15qa.commands)).toBe(0);

    await page.goto('http://127.0.0.1:5188/tests/s15/harness.html');
    const opener = page.locator('[data-s15-operational-action]:visible').first();
    await opener.click(); await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
    await page.evaluate(() => {
      s15qa.snapshot.outbounds[0].data.status = 'SCANNING';
      s15qa.snapshot.outbounds[0].data.recipientSnapshot = null;
    });
    await page.getByRole('button', { name: 'Đọc lại dữ liệu', exact: true }).click();
    await page.locator('#s15-operational-search').fill('CURRENT CATALOG MUST NOT APPEAR');
    await expect(page.locator('[data-s15-operational-action]:visible')).toHaveCount(1);
    expect(await page.evaluate(() => s15qa.commands)).toBe(0);
    expect(errors).toEqual([]);
    results.push({ width, pendingRecovery: true, visibleFocus: true, scanningRecipientSearch: true, commands: 0 });
    await page.close();
  }
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
