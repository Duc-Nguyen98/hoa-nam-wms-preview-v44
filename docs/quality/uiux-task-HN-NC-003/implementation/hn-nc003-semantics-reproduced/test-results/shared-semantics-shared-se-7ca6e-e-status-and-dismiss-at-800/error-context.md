# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shared-semantics.spec.ts >> shared semantics: named feedback group preserves live status and dismiss at 800
- Location: tests\functional\wave-ad\shared-semantics.spec.ts:28:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('group', { name: 'Thông báo tạm thời', exact: true, includeHidden: true })
Expected: 1
Received: 0
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" getByRole('group', { name: 'Thông báo tạm thời', exact: true, includeHidden: true }) with timeout 5000ms
  - waiting for getByRole('group', { name: 'Thông báo tạm thời', exact: true, includeHidden: true })
    14 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "Bỏ qua điều hướng" [ref=e4] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e5]:
    - banner [ref=e7]:
      - button "Mở trình đơn điều hướng" [ref=e8] [cursor=pointer]
      - link "HOA NAM WMS" [ref=e11] [cursor=pointer]:
        - /url: "#/preview/S01"
      - button "Tìm màn hình" [ref=e15] [cursor=pointer]
      - generic [ref=e19]:
        - button "Truy cập nhanh" [ref=e20] [cursor=pointer]
        - button "Thông báo" [ref=e26] [cursor=pointer]
        - 'button "Ngôn ngữ: Tiếng Việt" [ref=e29] [cursor=pointer]'
        - 'button "Giao diện: Sáng" [ref=e35] [cursor=pointer]'
    - main [ref=e39]:
      - heading "Phiếu xuất kho" [level=1] [ref=e40]
      - paragraph [ref=e41]: Theo dõi tình trạng xuất kho và quản lý chứng từ
      - button "Open notifications" [ref=e42] [cursor=pointer]
      - button "Storage error" [ref=e43] [cursor=pointer]
      - button "Recover" [ref=e44] [cursor=pointer]
      - button "Refresh hold" [ref=e45] [cursor=pointer]
      - status [ref=e46]: "2"
      - dialog [ref=e47]:
        - generic [ref=e48]:
          - generic [ref=e49]:
            - generic [ref=e50]:
              - heading "Trung tâm thông báo 2 chưa đọc" [level=2] [ref=e51]:
                - generic [ref=e52]:
                  - generic [ref=e56]: Trung tâm thông báo
                  - generic [ref=e57]: 2 chưa đọc
              - paragraph [ref=e58]: Theo dõi cập nhật và xử lý công việc
            - button "Đóng trung tâm thông báo" [active] [ref=e59] [cursor=pointer]
          - region "Danh sách thông báo" [ref=e64]:
            - generic [ref=e65]:
              - searchbox "Tìm trong thông báo" [ref=e70]
              - generic [ref=e71]:
                - tablist "Danh sách thông báo" [ref=e72]:
                  - tab "Tất cả 6" [selected] [ref=e73] [cursor=pointer]:
                    - text: Tất cả
                    - generic [ref=e74]: "6"
                  - tab "Chưa đọc 2" [ref=e75] [cursor=pointer]:
                    - text: Chưa đọc
                    - generic [ref=e76]: "2"
                - button "Đánh dấu tất cả đã đọc" [ref=e77] [cursor=pointer]
            - tabpanel "Tất cả 6" [ref=e81]:
              - generic [ref=e82]:
                - generic [ref=e83]:
                  - heading "25 tháng 10, 2026" [level=3] [ref=e84]
                  - list [ref=e85]:
                    - listitem [ref=e86]:
                      - button "Phiếu xuất kho cần kiểm tra PX-0021 · Đại lý Hoàng Minh 25/10 · 10:30" [ref=e87] [cursor=pointer]:
                        - generic [ref=e91]:
                          - strong [ref=e92]: Phiếu xuất kho cần kiểm tra
                          - generic "PX-0021 · Đại lý Hoàng Minh" [ref=e93]
                        - time [ref=e94]: 25/10 · 10:30
                    - listitem [ref=e98]:
                      - button "Chưa đọc In nhãn chưa thành công LBH0012343 · Máy in kho A 25/10 · 09:45" [ref=e99] [cursor=pointer]:
                        - generic [ref=e103]:
                          - strong [ref=e104]:
                            - generic "Chưa đọc" [ref=e105]
                            - text: In nhãn chưa thành công
                          - generic "LBH0012343 · Máy in kho A" [ref=e106]
                        - time [ref=e107]: 25/10 · 09:45
                    - listitem [ref=e111]:
                      - button "Chưa đọc Đối soát phát hiện chênh lệch Kho A · Cần kiểm tra số lượng 25/10 · 09:15" [ref=e112] [cursor=pointer]:
                        - generic [ref=e117]:
                          - strong [ref=e118]:
                            - generic "Chưa đọc" [ref=e119]
                            - text: Đối soát phát hiện chênh lệch
                          - generic "Kho A · Cần kiểm tra số lượng" [ref=e120]
                        - time [ref=e121]: 25/10 · 09:15
                    - listitem [ref=e125]:
                      - button "Phiếu nhập kho đã hoàn tất PN-0042 · 24 sản phẩm 25/10 · 08:40" [ref=e126] [cursor=pointer]:
                        - generic [ref=e130]:
                          - strong [ref=e131]: Phiếu nhập kho đã hoàn tất
                          - generic "PN-0042 · 24 sản phẩm" [ref=e132]
                        - time [ref=e133]: 25/10 · 08:40
                - generic [ref=e137]:
                  - heading "24 tháng 10, 2026" [level=3] [ref=e138]
                  - list [ref=e139]:
                    - listitem [ref=e140]:
                      - button "Hồ sơ bảo hành được cập nhật BH-0018 · Đang sửa chữa 24/10 · 16:20" [ref=e141] [cursor=pointer]:
                        - generic [ref=e145]:
                          - strong [ref=e146]: Hồ sơ bảo hành được cập nhật
                          - generic "BH-0018 · Đang sửa chữa" [ref=e147]
                        - time [ref=e148]: 24/10 · 16:20
                    - listitem [ref=e152]:
                      - button "Xếp khay hoàn tất TRAY-0012 · Kho A 24/10 · 14:05" [ref=e153] [cursor=pointer]:
                        - generic [ref=e157]:
                          - strong [ref=e158]: Xếp khay hoàn tất
                          - generic "TRAY-0012 · Kho A" [ref=e159]
                        - time [ref=e160]: 24/10 · 14:05
            - generic [ref=e164]: 6 thông báo
        - generic:
          - generic "Thông báo tạm thời"
```

# Test source

```ts
  1  | import {test, expect, type Page} from '@playwright/test';
  2  | 
  3  | async function openNotifications(page: Page, width: number, height: number) {
  4  |   await page.setViewportSize({width, height});
  5  |   await page.addInitScript(() => {
  6  |     localStorage.setItem('hn-wms.s00.language.v1', 'vi');
  7  |     localStorage.setItem('hn-wms.s00.theme.v1', 'light');
  8  |   });
  9  |   await page.goto(`/tests/visual/notification.html?run=semantics-${Date.now()}-${width}`);
  10 |   await page.locator('#open-center').click();
  11 |   await expect(page.locator('dialog[open]')).toBeVisible();
  12 |   await expect(page.locator('#persisted-unread')).toHaveText('2');
  13 |   return page.locator('dialog[open]');
  14 | }
  15 | 
  16 | for (const [width, height] of [[1920, 1080], [800, 1280]]) {
  17 |   test(`shared semantics: dialog has a heading without a nested page banner at ${width}`, async ({page}) => {
  18 |     const dialog = await openNotifications(page, width, height);
  19 |     await expect(dialog).toHaveAccessibleName(/Trung tâm thông báo/);
  20 |     await expect(dialog.getByRole('heading', {name: /Trung tâm thông báo/})).toBeVisible();
  21 |     await expect(dialog.getByRole('banner')).toHaveCount(0);
  22 |     await dialog.getByRole('button', {name: 'Đóng trung tâm thông báo', exact: true}).focus();
  23 |     await page.keyboard.press('Escape');
  24 |     await expect(dialog).toHaveCount(0);
  25 |     await expect(page.locator('#open-center')).toBeFocused();
  26 |   });
  27 | 
  28 |   test(`shared semantics: named feedback group preserves live status and dismiss at ${width}`, async ({page}) => {
  29 |     const dialog = await openNotifications(page, width, height);
  30 |     const feedback = page.getByRole('group', {name: 'Thông báo tạm thời', exact: true, includeHidden: true});
> 31 |     await expect(feedback).toHaveCount(1);
     |                            ^ Error: expect(locator).toHaveCount(expected) failed
  32 |     await dialog.getByRole('button', {name: 'Đánh dấu tất cả đã đọc', exact: true}).click();
  33 |     await expect(page.locator('#persisted-unread')).toHaveText('0');
  34 |     await page.keyboard.press('Escape');
  35 |     await expect(page.locator('dialog[open]')).toHaveCount(0);
  36 |     await expect(feedback).toBeVisible();
  37 |     const status = feedback.getByRole('status');
  38 |     await expect(status).toBeVisible();
  39 |     await expect(status).toHaveAttribute('aria-atomic', 'true');
  40 |     await expect(status).toContainText('Thao tác thành công');
  41 |     await status.getByRole('button', {name: 'Đóng thông báo', exact: true}).click();
  42 |     await expect(feedback.getByRole('status')).toHaveCount(0);
  43 |     await expect(page.locator('#open-center')).toBeFocused();
  44 |   });
  45 | }
  46 | 
```