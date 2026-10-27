import { test, expect, type Page } from '@playwright/test';
import type { OperationalSnapshot, ReceiptData } from '../../src/contracts/operational-preview';

// Exercise the real screen with its existing supplied-adapter harness. Changes
// below affect only this isolated browser's adapter response, never source data.
async function supplyReceipts(page: Page, rows: { code: string; status: ReceiptData['status'] }[]) {
  await page.evaluate(rows => {
    const qa = (window as unknown as { receiptqa: { snapshot: OperationalSnapshot } }).receiptqa;
    const template = qa.snapshot.receipts[0];
    qa.snapshot.receipts = rows.map((row, index) => ({
      ...structuredClone(template), id: `receipt:visibility-${index}`,
      data: { ...template.data, ...row, sourceText: `Supplier ${index}`, referenceText: `REF-${index}` },
    }));
  }, rows);
  await page.locator('[data-operational-receipts]').getByRole('button', { name: 'Đọc lại dữ liệu', exact: true }).click();
}

test('all adapter receipts remain visible with arbitrary codes, search and status filters', async ({ page }) => {
  await page.goto('/tests/reference-exact/receipts.html');
  await expect(page.locator('.s12-operational-table tbody tr')).toHaveCount(3);
  await supplyReceipts(page, [
    { code: 'PN-8327', status: 'DRAFT' },
    { code: 'CUSTOM-INBOUND-42', status: 'SCANNING' },
    { code: 'APP-RECEIPT-77', status: 'SUBMITTED' },
    { code: 'WAREHOUSE-REC-99', status: 'POSTED' },
  ]);
  await expect(page.locator('.s12-operational-table tbody tr')).toHaveCount(4);
  await expect(page.locator('.s12-operational-cards article')).toHaveCount(4);
  await expect(page.locator('.s12-operational-results')).toHaveText('4 phiếu trong phiên hiện tại.');
  for (const code of ['PN-8327', 'CUSTOM-INBOUND-42', 'APP-RECEIPT-77', 'WAREHOUSE-REC-99']) {
    await expect(page.locator('.s12-operational-table')).toContainText(code);
  }
  await page.locator('#s12-operational-search').fill('supplier 2');
  await expect(page.locator('.s12-operational-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.s12-operational-table')).toContainText('APP-RECEIPT-77');
  await expect(page.locator('.s12-operational-results')).toHaveText('1 / 4 phiếu');
  await page.locator('#s12-operational-status').selectOption('POSTED');
  await expect(page.locator('[data-operational-receipts] [data-state="no-results"]')).toBeVisible();
  await expect(page.locator('.s12-operational-results')).toHaveText('0 / 4 phiếu');
  await page.locator('#s12-operational-search').fill('ref-3');
  await expect(page.locator('.s12-operational-table')).toContainText('WAREHOUSE-REC-99');
  await page.locator('#s12-operational-search').fill('warehouse-rec');
  await expect(page.locator('.s12-operational-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.s12-operational-results')).toHaveText('1 / 4 phiếu');
  expect(await page.evaluate(() => (window as unknown as { receiptqa: { commands: number } }).receiptqa.commands)).toBe(0);
});

test('refresh replaces the visible pool with the adapter current scope and preserves empty state', async ({ page }) => {
  await page.goto('/tests/reference-exact/receipts.html');
  await expect(page.locator('.s12-operational-table tbody tr')).toHaveCount(3);
  await supplyReceipts(page, [{ code: 'NEW-SESSION-RECEIPT', status: 'DRAFT' }]);
  await expect(page.locator('.s12-operational-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.s12-operational-table')).toContainText('NEW-SESSION-RECEIPT');
  await expect(page.locator('.s12-operational-results')).toHaveText('1 phiếu trong phiên hiện tại.');
  await supplyReceipts(page, []);
  await expect(page.locator('.s12-operational-table tbody tr')).toHaveCount(0);
  await expect(page.locator('[data-operational-receipts] [data-state="empty"]')).toBeVisible();
  await expect(page.locator('.s12-operational-results')).toHaveText('0 phiếu trong phiên hiện tại.');
});
