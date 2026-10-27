# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shared-semantics.spec.ts >> shared semantics: named feedback group preserves live status and dismiss at 800
- Location: tests\functional\wave-ad\shared-semantics.spec.ts:48:3

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  locator('#main-content')
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" locator('#main-content') with timeout 5000ms
  - waiting for locator('#main-content')
    13 × locator resolved to <main tabindex="-1" class="hn-main" id="main-content">…</main>
       - unexpected value "inactive"

```

```yaml
- main:
  - heading "Tổng quan vận hành" [level=1]
  - paragraph: Theo dõi kho và công việc cần xử lý.
  - text: Kho
  - combobox "Kho"
  - text: Kỳ thời gian
  - 'button "Kỳ thời gian: 01/09/2026 – 30/09/2026"': tháng 9 năm 2026
  - paragraph: 01/09/2026 – 30/09/2026
  - region "Tồn kho hiện tại"
  - region "Phiếu nhập"
  - region "Phiếu xuất"
  - region "Bảo hành đang mở"
  - region "Cần xử lý 5"
  - region "Truy cập nhanh"
  - region "Hoạt động nhập – xuất"
```

# Test source

```ts
  1  | import {test, expect, type Page} from '@playwright/test';
  2  | import path from 'node:path';
  3  | 
  4  | // Provision axe-core 4.14.0 in the QA runtime, or point QA_AXE_SCRIPT at its script.
  5  | // A missing scanner fails this check; it is never silently skipped.
  6  | const scanner = path.resolve(process.env.QA_AXE_SCRIPT ?? 'output/hn-nc-003-axe-runtime/node_modules/axe-core/axe.min.js');
  7  | 
  8  | async function openApplicationNotifications(page: Page, width: number, height: number) {
  9  |   await page.setViewportSize({width, height});
  10 |   await page.addInitScript(() => {
  11 |     localStorage.setItem('hn-wms.s00.language.v1', 'vi');
  12 |     localStorage.setItem('hn-wms.s00.theme.v1', 'light');
  13 |   });
  14 |   await page.goto('/#/preview/S01');
  15 |   await page.locator('#s07-username').fill('demo');
  16 |   await page.locator('#s07-password').fill('HoaNamDemo@2026');
  17 |   await page.locator('.s07-submit').click();
  18 |   await page.locator('.s08-confirm').click();
  19 |   await page.getByRole('button', {name: 'Tiếp tục', exact: true}).click();
  20 |   await expect(page.locator('.ov-result-count')).toBeVisible({timeout: 90000});
  21 |   await page.locator('.hn-notifications').click();
  22 |   const dialog = page.locator('dialog[open]');
  23 |   await expect(dialog).toBeVisible();
  24 |   return dialog;
  25 | }
  26 | 
  27 | for (const [width, height] of [[1920, 1080], [800, 1280]]) {
  28 |   test(`shared semantics: dialog has a heading without a nested page banner at ${width}`, async ({page}) => {
  29 |     const dialog = await openApplicationNotifications(page, width, height);
  30 |     await expect(dialog).toHaveAccessibleName(/Trung tâm thông báo/);
  31 |     await expect(dialog.getByRole('heading', {name: /Trung tâm thông báo/})).toBeVisible();
  32 |     await expect(dialog.getByRole('banner')).toHaveCount(0);
  33 |     await page.addScriptTag({path: scanner});
  34 |     const violations = await page.evaluate(async () => {
  35 |       const {violations} = await (window as any).axe.run({include: [['dialog[open]']]}, {
  36 |         runOnly: {type: 'rule', values: ['landmark-banner-is-top-level', 'aria-prohibited-attr']},
  37 |       });
  38 |       return violations.map((v: any) => ({id: v.id, nodes: v.nodes.map((n: any) => n.target)}));
  39 |     });
  40 |     expect(violations).toEqual([]);
  41 |     await expect(dialog.locator('.hn-global-modal__close')).toHaveAccessibleName(/.+/);
  42 |     await dialog.locator('.hn-global-modal__close').focus();
  43 |     await page.keyboard.press('Escape');
  44 |     await expect(dialog).toHaveCount(0);
  45 |     await expect(page.locator('.hn-notifications')).toBeFocused();
  46 |   });
  47 | 
  48 |   test(`shared semantics: named feedback group preserves live status and dismiss at ${width}`, async ({page}) => {
  49 |     const dialog = await openApplicationNotifications(page, width, height);
  50 |     const feedback = page.getByRole('group', {name: 'Thông báo tạm thời', exact: true, includeHidden: true});
  51 |     await expect(feedback).toHaveCount(1);
  52 |     await dialog.getByRole('button', {name: 'Đánh dấu tất cả đã đọc', exact: true}).click();
  53 |     await expect(page.locator('.hn-notifications__count')).toHaveCount(0);
  54 |     await page.keyboard.press('Escape');
  55 |     await expect(page.locator('dialog[open]')).toHaveCount(0);
  56 |     await expect(page.locator('.hn-notifications')).toBeFocused();
  57 |     await expect(feedback).toBeVisible();
  58 |     const status = feedback.getByRole('status');
  59 |     await expect(status).toBeVisible();
  60 |     await expect(status).toHaveAttribute('aria-atomic', 'true');
  61 |     await expect(status).toContainText('Thao tác thành công');
  62 |     await status.getByRole('button', {name: 'Đóng thông báo', exact: true}).click();
  63 |     await expect(feedback.getByRole('status')).toHaveCount(0);
> 64 |     await expect(page.locator('#main-content')).toBeFocused();
     |                                                 ^ Error: expect(locator).toBeFocused() failed
  65 |   });
  66 | }
  67 | 
```