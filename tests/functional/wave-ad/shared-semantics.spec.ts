import {test, expect, type Page} from '@playwright/test';
import path from 'node:path';

// Provision axe-core 4.14.0 in the QA runtime, or point QA_AXE_SCRIPT at its script.
// A missing scanner fails this check; it is never silently skipped.
const scanner = path.resolve(process.env.QA_AXE_SCRIPT ?? 'output/hn-nc-003-axe-runtime/node_modules/axe-core/axe.min.js');

async function openApplicationNotifications(page: Page, width: number, height: number) {
  await page.setViewportSize({width, height});
  await page.addInitScript(() => {
    localStorage.setItem('hn-wms.s00.language.v1', 'vi');
    localStorage.setItem('hn-wms.s00.theme.v1', 'light');
  });
  await page.goto('/#/preview/S01');
  await page.locator('#s07-username').fill('demo');
  await page.locator('#s07-password').fill('HoaNamDemo@2026');
  await page.locator('.s07-submit').click();
  await page.locator('.s08-confirm').click();
  await page.getByRole('button', {name: 'Tiếp tục', exact: true}).click();
  await expect(page.locator('.ov-result-count')).toBeVisible({timeout: 90000});
  await page.locator('.hn-notifications').click();
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  return dialog;
}

for (const [width, height] of [[1920, 1080], [800, 1280]]) {
  test(`shared semantics: dialog has a heading without a nested page banner at ${width}`, async ({page}) => {
    const dialog = await openApplicationNotifications(page, width, height);
    await expect(dialog).toHaveAccessibleName(/Trung tâm thông báo/);
    await expect(dialog.getByRole('heading', {name: /Trung tâm thông báo/})).toBeVisible();
    await expect(dialog.getByRole('banner')).toHaveCount(0);
    await page.addScriptTag({path: scanner});
    const violations = await page.evaluate(async () => {
      const {violations} = await (window as any).axe.run({include: [['dialog[open]']]}, {
        runOnly: {type: 'rule', values: ['landmark-banner-is-top-level', 'aria-prohibited-attr']},
      });
      return violations.map((v: any) => ({id: v.id, nodes: v.nodes.map((n: any) => n.target)}));
    });
    expect(violations).toEqual([]);
    await expect(dialog.locator('.hn-global-modal__close')).toHaveAccessibleName(/.+/);
    await dialog.locator('.hn-global-modal__close').focus();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('.hn-notifications')).toBeFocused();
  });

  test(`shared semantics: named feedback group preserves live status and dismiss at ${width}`, async ({page}) => {
    const dialog = await openApplicationNotifications(page, width, height);
    const feedback = page.getByRole('group', {name: 'Thông báo tạm thời', exact: true, includeHidden: true});
    await expect(feedback).toHaveCount(1);
    await dialog.getByRole('button', {name: 'Đánh dấu tất cả đã đọc', exact: true}).click();
    await expect(page.locator('.hn-notifications__count')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.locator('.hn-notifications')).toBeFocused();
    await expect(feedback).toBeVisible();
    const status = feedback.getByRole('status');
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute('aria-atomic', 'true');
    await expect(status).toContainText('Thao tác thành công');
    await status.getByRole('button', {name: 'Đóng thông báo', exact: true}).click();
    await expect(feedback.getByRole('status')).toHaveCount(0);
    await expect(page.locator('#main-content')).toBeFocused();
  });
}
