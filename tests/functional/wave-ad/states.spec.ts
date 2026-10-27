import {test,expect} from '@playwright/test';
test('E-S01-003 empty and no-results are distinct supported fixture states',async({page})=>{
 await page.goto('/tests/functional/harness.html?screen=S01&state=empty');
 await expect(page.locator('main [data-state="empty"]').first()).toBeVisible();
 await expect(page.locator('main')).toContainText('Không có phiếu trong kỳ đã chọn.');
 await page.goto('/tests/functional/harness.html?screen=S01');
 await expect(page.locator('.ov-result-count')).toContainText('16');
 await page.locator('#ov-search-input').fill('NO-MATCH-WAVE-AD');
 await expect(page.locator('main [data-state="no-results"]').first()).toBeVisible();
 await expect(page.locator('main')).toContainText('Không có phiếu phù hợp.');
});
