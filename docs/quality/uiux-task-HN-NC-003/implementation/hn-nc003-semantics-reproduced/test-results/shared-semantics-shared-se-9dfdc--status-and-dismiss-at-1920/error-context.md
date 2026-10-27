# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shared-semantics.spec.ts >> shared semantics: named feedback group preserves live status and dismiss at 1920
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
  - complementary "Hoa Nam WMS" [ref=e5]:
    - generic "Hoa Nam WMS" [ref=e6]:
      - generic [ref=e9]:
        - text: HOA NAM WMS
        - generic [ref=e10]: Hệ thống quản lý kho
      - button "Thu gọn thanh điều hướng" [expanded] [ref=e11] [cursor=pointer]
    - navigation "Điều hướng chính" [ref=e15]:
      - link "Tổng quan" [ref=e17] [cursor=pointer]:
        - /url: "#/preview/S01"
      - generic [ref=e21]:
        - button "Nghiệp vụ" [expanded] [ref=e22] [cursor=pointer]
        - generic [ref=e28]:
          - button "Nhập kho" [ref=e30] [cursor=pointer]
          - generic [ref=e35]:
            - button "Xuất kho" [expanded] [ref=e36] [cursor=pointer]
            - link "Phiếu xuất kho" [ref=e43] [cursor=pointer]:
              - /url: "#/preview/S15"
          - button "Xếp khay" [ref=e48] [cursor=pointer]
          - button "Bảo hành & sửa chữa" [ref=e54] [cursor=pointer]
          - button "Tồn kho & đối soát" [ref=e60] [cursor=pointer]
      - generic [ref=e65]:
        - button "Danh mục" [expanded] [ref=e66] [cursor=pointer]
        - generic [ref=e73]:
          - link "SKU" [ref=e75] [cursor=pointer]:
            - /url: "#/preview/S04"
          - link "Sản phẩm" [ref=e81] [cursor=pointer]:
            - /url: "#/preview/S03"
          - link "Đại lý & nơi nhận" [ref=e85] [cursor=pointer]:
            - /url: "#/preview/S05"
          - link "Bệnh / lỗi" [ref=e90] [cursor=pointer]:
            - /url: "#/preview/S02"
      - button "Quản lý mã SKU" [ref=e94] [cursor=pointer]
      - button "Báo cáo" [ref=e101] [cursor=pointer]
      - link "Người dùng & RBAC" [ref=e108] [cursor=pointer]:
        - /url: "#/preview/S29"
      - link "Cấu hình" [ref=e114] [cursor=pointer]:
        - /url: "#/preview/S28"
      - link "Nhật ký hệ thống" [ref=e120] [cursor=pointer]:
        - /url: "#/preview/S27"
    - generic [ref=e125]: Kho Hoa Nam
    - generic "Thông tin phiên bản" [ref=e130]:
      - link "Thông tin bản dựng" [ref=e132] [cursor=pointer]:
        - /url: ./release.html
      - generic [ref=e133]: © 2006 Hoa Nam. Bảo lưu mọi quyền.
  - generic [ref=e134]:
    - banner [ref=e136]:
      - button "Tìm màn hình" [ref=e137] [cursor=pointer]:
        - generic [ref=e141]: Tìm màn hình…
        - generic [aria-hidden] [ref=e142]: Ctrl K
      - generic [ref=e143]:
        - button "Truy cập nhanh" [ref=e144] [cursor=pointer]
        - button "Thông báo" [ref=e150] [cursor=pointer]
        - 'button "Ngôn ngữ: Tiếng Việt" [ref=e153] [cursor=pointer]':
          - generic [aria-hidden] [ref=e159]: VI
        - 'button "Giao diện: Sáng" [ref=e160] [cursor=pointer]'
    - main [ref=e164]:
      - heading "Phiếu xuất kho" [level=1] [ref=e165]
      - paragraph [ref=e166]: Theo dõi tình trạng xuất kho và quản lý chứng từ
      - button "Open notifications" [ref=e167] [cursor=pointer]
      - button "Storage error" [ref=e168] [cursor=pointer]
      - button "Recover" [ref=e169] [cursor=pointer]
      - button "Refresh hold" [ref=e170] [cursor=pointer]
      - status [ref=e171]: "2"
      - dialog [ref=e172]:
        - generic [ref=e173]:
          - generic [ref=e174]:
            - generic [ref=e175]:
              - heading "Trung tâm thông báo 2 chưa đọc" [level=2] [ref=e176]:
                - generic [ref=e177]:
                  - generic [ref=e181]: Trung tâm thông báo
                  - generic [ref=e182]: 2 chưa đọc
              - paragraph [ref=e183]: Theo dõi cập nhật và xử lý công việc
            - button "Đóng trung tâm thông báo" [active] [ref=e184] [cursor=pointer]
          - generic [ref=e188]:
            - region "Danh sách thông báo" [ref=e189]:
              - generic [ref=e190]:
                - searchbox "Tìm trong thông báo" [ref=e195]
                - generic [ref=e196]:
                  - tablist "Danh sách thông báo" [ref=e197]:
                    - tab "Tất cả 6" [selected] [ref=e198] [cursor=pointer]:
                      - text: Tất cả
                      - generic [ref=e199]: "6"
                    - tab "Chưa đọc 2" [ref=e200] [cursor=pointer]:
                      - text: Chưa đọc
                      - generic [ref=e201]: "2"
                  - button "Đánh dấu tất cả đã đọc" [ref=e202] [cursor=pointer]
              - tabpanel "Tất cả 6" [ref=e206]:
                - generic [ref=e207]:
                  - generic [ref=e208]:
                    - heading "25 tháng 10, 2026" [level=3] [ref=e209]
                    - list [ref=e210]:
                      - listitem [ref=e211]:
                        - button "Phiếu xuất kho cần kiểm tra PX-0021 · Đại lý Hoàng Minh 25/10 · 10:30" [ref=e212] [cursor=pointer]:
                          - generic [ref=e216]:
                            - strong [ref=e217]: Phiếu xuất kho cần kiểm tra
                            - generic "PX-0021 · Đại lý Hoàng Minh" [ref=e218]
                          - time [ref=e219]: 25/10 · 10:30
                      - listitem [ref=e220]:
                        - button "Chưa đọc In nhãn chưa thành công LBH0012343 · Máy in kho A 25/10 · 09:45" [ref=e221] [cursor=pointer]:
                          - generic [ref=e225]:
                            - strong [ref=e226]:
                              - generic "Chưa đọc" [ref=e227]
                              - text: In nhãn chưa thành công
                            - generic "LBH0012343 · Máy in kho A" [ref=e228]
                          - time [ref=e229]: 25/10 · 09:45
                      - listitem [ref=e230]:
                        - button "Chưa đọc Đối soát phát hiện chênh lệch Kho A · Cần kiểm tra số lượng 25/10 · 09:15" [ref=e231] [cursor=pointer]:
                          - generic [ref=e236]:
                            - strong [ref=e237]:
                              - generic "Chưa đọc" [ref=e238]
                              - text: Đối soát phát hiện chênh lệch
                            - generic "Kho A · Cần kiểm tra số lượng" [ref=e239]
                          - time [ref=e240]: 25/10 · 09:15
                      - listitem [ref=e241]:
                        - button "Phiếu nhập kho đã hoàn tất PN-0042 · 24 sản phẩm 25/10 · 08:40" [ref=e242] [cursor=pointer]:
                          - generic [ref=e246]:
                            - strong [ref=e247]: Phiếu nhập kho đã hoàn tất
                            - generic "PN-0042 · 24 sản phẩm" [ref=e248]
                          - time [ref=e249]: 25/10 · 08:40
                  - generic [ref=e250]:
                    - heading "24 tháng 10, 2026" [level=3] [ref=e251]
                    - list [ref=e252]:
                      - listitem [ref=e253]:
                        - button "Hồ sơ bảo hành được cập nhật BH-0018 · Đang sửa chữa 24/10 · 16:20" [ref=e254] [cursor=pointer]:
                          - generic [ref=e258]:
                            - strong [ref=e259]: Hồ sơ bảo hành được cập nhật
                            - generic "BH-0018 · Đang sửa chữa" [ref=e260]
                          - time [ref=e261]: 24/10 · 16:20
                      - listitem [ref=e262]:
                        - button "Xếp khay hoàn tất TRAY-0012 · Kho A 24/10 · 14:05" [ref=e263] [cursor=pointer]:
                          - generic [ref=e267]:
                            - strong [ref=e268]: Xếp khay hoàn tất
                            - generic "TRAY-0012 · Kho A" [ref=e269]
                          - time [ref=e270]: 24/10 · 14:05
            - region "Chi tiết thông báo" [ref=e271]:
              - article [ref=e272]:
                - generic [ref=e273]:
                  - paragraph [ref=e274]: Xuất kho
                  - heading "Phiếu xuất kho cần kiểm tra" [level=3] [ref=e275]
                  - generic [ref=e276]:
                    - time [ref=e281]: 25/10/2026 · 10:30
                    - generic [ref=e282]: Đã đọc
                  - paragraph [ref=e286]: Phiếu PX-0021 đang chờ kiểm tra thông tin trước khi tiếp tục xử lý. Vui lòng đối chiếu người nhận và danh sách hàng hóa.
                  - region "Thông tin nghiệp vụ" [ref=e287]:
                    - heading "Thông tin phiếu xuất" [level=4] [ref=e288]
                    - generic [ref=e291]:
                      - generic [ref=e292]:
                        - term [ref=e293]: Mã phiếu
                        - definition [ref=e294]: PX-0021
                      - generic [ref=e295]:
                        - term [ref=e296]: Người nhận
                        - definition [ref=e297]: Đại lý Hoàng Minh
                      - generic [ref=e298]:
                        - term [ref=e299]: Kho xuất
                        - definition [ref=e300]: Kho A
                      - generic [ref=e301]:
                        - term [ref=e302]: Số lượng
                        - definition [ref=e303]: 12 sản phẩm
                      - generic [ref=e304]:
                        - term [ref=e305]: Trạng thái
                        - definition [ref=e306]:
                          - generic [ref=e307]: Chờ kiểm tra
                  - generic [ref=e311]:
                    - link "Mở phiếu xuất kho" [ref=e312] [cursor=pointer]:
                      - /url: "#/preview/S15?source=notification&recordId=notification-document%3Aoutbound%3A0021&notificationId=PREVIEW-DESIGN-1&snapshotId=notification-design-documents%3A2026-10-26%3Av1"
                    - button "Đánh dấu chưa đọc" [ref=e315] [cursor=pointer]
                - generic [ref=e316]:
                  - generic [ref=e317]: Đánh dấu đã đọc không thay đổi trạng thái phiếu.
                  - navigation "Chi tiết thông báo" [ref=e321]:
                    - generic [ref=e322]: Thông báo 1 / 6
                    - button "Thông báo trước" [disabled] [ref=e323]
                    - button "Thông báo tiếp theo" [ref=e326] [cursor=pointer]
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