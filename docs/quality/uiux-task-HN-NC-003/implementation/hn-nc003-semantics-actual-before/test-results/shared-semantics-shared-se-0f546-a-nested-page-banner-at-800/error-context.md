# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shared-semantics.spec.ts >> shared semantics: dialog has a heading without a nested page banner at 800
- Location: tests\functional\wave-ad\shared-semantics.spec.ts:37:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('dialog[open]').getByRole('banner')
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" locator('dialog[open]').getByRole('banner') with timeout 5000ms
  - waiting for locator('dialog[open]').getByRole('banner')
    14 × locator resolved to 1 element
       - unexpected value "1"

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
        - button "Thông báo · 2" [expanded] [ref=e26] [cursor=pointer]:
          - generic [aria-hidden] [ref=e29]: "2"
        - 'button "Ngôn ngữ: Tiếng Việt" [ref=e30] [cursor=pointer]'
        - 'button "Giao diện: Sáng" [ref=e36] [cursor=pointer]'
        - button "Tài khoản Đức Quang" [ref=e40] [cursor=pointer]:
          - generic [aria-hidden] [ref=e41]: DQ
      - dialog [ref=e44]:
        - generic [ref=e45]:
          - banner [ref=e46]:
            - generic [ref=e47]:
              - heading "Trung tâm thông báo 2 chưa đọc" [level=2] [ref=e48]:
                - generic [ref=e49]:
                  - generic [ref=e53]: Trung tâm thông báo
                  - generic [ref=e54]: 2 chưa đọc
              - paragraph [ref=e55]: Theo dõi cập nhật và xử lý công việc
            - button "Đóng trung tâm thông báo" [active] [ref=e56] [cursor=pointer]
          - region "Danh sách thông báo" [ref=e61]:
            - generic [ref=e62]:
              - searchbox "Tìm trong thông báo" [ref=e67]
              - generic [ref=e68]:
                - tablist "Danh sách thông báo" [ref=e69]:
                  - tab "Tất cả 6" [selected] [ref=e70] [cursor=pointer]:
                    - text: Tất cả
                    - generic [ref=e71]: "6"
                  - tab "Chưa đọc 2" [ref=e72] [cursor=pointer]:
                    - text: Chưa đọc
                    - generic [ref=e73]: "2"
                - button "Đánh dấu tất cả đã đọc" [ref=e74] [cursor=pointer]
            - tabpanel "Tất cả 6" [ref=e78]:
              - generic [ref=e79]:
                - generic [ref=e80]:
                  - heading "Hôm nay" [level=3] [ref=e81]
                  - list [ref=e82]:
                    - listitem [ref=e83]:
                      - button "Phiếu xuất kho cần kiểm tra PX-0021 · Đại lý Hoàng Minh 10:30" [ref=e84] [cursor=pointer]:
                        - generic [ref=e88]:
                          - strong [ref=e89]: Phiếu xuất kho cần kiểm tra
                          - generic "PX-0021 · Đại lý Hoàng Minh" [ref=e90]
                        - time [ref=e91]: 10:30
                    - listitem [ref=e95]:
                      - button "Chưa đọc In nhãn chưa thành công LBH0012343 · Máy in kho A 09:45" [ref=e96] [cursor=pointer]:
                        - generic [ref=e100]:
                          - strong [ref=e101]:
                            - generic "Chưa đọc" [ref=e102]
                            - text: In nhãn chưa thành công
                          - generic "LBH0012343 · Máy in kho A" [ref=e103]
                        - time [ref=e104]: 09:45
                    - listitem [ref=e108]:
                      - button "Chưa đọc Đối soát phát hiện chênh lệch Kho A · Cần kiểm tra số lượng 09:15" [ref=e109] [cursor=pointer]:
                        - generic [ref=e114]:
                          - strong [ref=e115]:
                            - generic "Chưa đọc" [ref=e116]
                            - text: Đối soát phát hiện chênh lệch
                          - generic "Kho A · Cần kiểm tra số lượng" [ref=e117]
                        - time [ref=e118]: 09:15
                    - listitem [ref=e122]:
                      - button "Phiếu nhập kho đã hoàn tất PN-0042 · 24 sản phẩm 08:40" [ref=e123] [cursor=pointer]:
                        - generic [ref=e127]:
                          - strong [ref=e128]: Phiếu nhập kho đã hoàn tất
                          - generic "PN-0042 · 24 sản phẩm" [ref=e129]
                        - time [ref=e130]: 08:40
                - generic [ref=e134]:
                  - heading "Hôm qua" [level=3] [ref=e135]
                  - list [ref=e136]:
                    - listitem [ref=e137]:
                      - button "Hồ sơ bảo hành được cập nhật BH-0018 · Đang sửa chữa 26/10 · 16:20" [ref=e138] [cursor=pointer]:
                        - generic [ref=e142]:
                          - strong [ref=e143]: Hồ sơ bảo hành được cập nhật
                          - generic "BH-0018 · Đang sửa chữa" [ref=e144]
                        - time [ref=e145]: 26/10 · 16:20
                    - listitem [ref=e149]:
                      - button "Xếp khay hoàn tất TRAY-0012 · Kho A 26/10 · 14:05" [ref=e150] [cursor=pointer]:
                        - generic [ref=e154]:
                          - strong [ref=e155]: Xếp khay hoàn tất
                          - generic "TRAY-0012 · Kho A" [ref=e156]
                        - time [ref=e157]: 26/10 · 14:05
            - generic [ref=e161]: 6 thông báo
        - generic:
          - generic "Thông báo tạm thời"
    - main [ref=e162]:
      - generic [ref=e163]:
        - generic [ref=e164]:
          - generic [ref=e165]:
            - heading "Tổng quan vận hành" [level=1] [ref=e166]
            - paragraph [ref=e167]: Theo dõi kho và công việc cần xử lý.
          - generic [ref=e168]:
            - generic [ref=e169]:
              - generic [ref=e170]:
                - generic [ref=e171]: Kho
                - combobox "Kho" [ref=e172] [cursor=pointer]:
                  - option "Kho Hoa Nam" [selected]
              - generic [ref=e173]:
                - generic [ref=e174]: Kỳ thời gian
                - 'button "Kỳ thời gian: 01/09/2026 – 30/09/2026" [ref=e176] [cursor=pointer]':
                  - generic [ref=e177]: tháng 9 năm 2026
            - paragraph [ref=e181]: 01/09/2026 – 30/09/2026
        - generic [ref=e182]:
          - region "Tồn kho hiện tại" [ref=e183]:
            - heading "Tồn kho hiện tại" [level=2] [ref=e185]
            - strong [ref=e190]: —
            - generic [ref=e191]:
              - generic [ref=e192]: Chưa có số liệu xác nhận
              - generic [ref=e193]: Hiện tại
          - region "Phiếu nhập" [ref=e194]:
            - heading "Phiếu nhập" [level=2] [ref=e196]
            - generic [ref=e200]:
              - strong [ref=e201]: "8"
              - generic [ref=e202]: phiếu
            - generic [ref=e203]: Trong kỳ
          - region "Phiếu xuất" [ref=e205]:
            - heading "Phiếu xuất" [level=2] [ref=e207]
            - generic [ref=e211]:
              - strong [ref=e212]: "8"
              - generic [ref=e213]: phiếu
            - generic [ref=e214]: Trong kỳ
          - region "Bảo hành đang mở" [ref=e216]:
            - heading "Bảo hành đang mở" [level=2] [ref=e218]
            - generic [ref=e223]:
              - strong [ref=e224]: "4"
              - generic [ref=e225]: hồ sơ
            - generic [ref=e226]: Hiện tại
        - generic [ref=e228]:
          - region [ref=e229]:
            - generic [ref=e230]:
              - generic [ref=e235]:
                - heading "Cần xử lý 5" [level=2] [ref=e236]:
                  - text: Cần xử lý
                  - generic [ref=e237]: "5"
                - paragraph [ref=e238]: Các phiếu đang chờ xử lý, cần theo dõi và hoàn tất.
              - button "Xem danh sách" [ref=e239] [cursor=pointer]
            - generic [ref=e242]:
              - generic [ref=e243]:
                - button "PX-0010" [ref=e247] [cursor=pointer]
                - generic [ref=e248]: Phiếu xuất chờ xử lý
                - button "Xem phiếu PX-0010" [ref=e249] [cursor=pointer]
              - generic [ref=e252]:
                - button "PN-0009" [ref=e256] [cursor=pointer]
                - generic [ref=e257]: Phiếu nhập chờ xử lý
                - button "Xem phiếu PN-0009" [ref=e258] [cursor=pointer]
              - generic [ref=e261]:
                - button "PX-0007" [ref=e265] [cursor=pointer]
                - generic [ref=e266]: Phiếu xuất chờ xử lý
                - button "Xem phiếu PX-0007" [ref=e267] [cursor=pointer]
          - region [ref=e270]:
            - heading [level=2] [ref=e271]
            - generic [ref=e275]:
              - button "Báo cáo tồn kho" [ref=e276] [cursor=pointer]
              - button "Truy vết hàng hóa" [ref=e283] [cursor=pointer]
              - button "Lịch sử nhập – xuất" [ref=e291] [cursor=pointer]
        - region [ref=e299]:
          - generic [ref=e300]:
            - generic [ref=e305]:
              - heading "Hoạt động nhập – xuất" [level=2] [ref=e306]
              - paragraph [ref=e307]: Danh sách phiếu nhập và xuất trong kỳ.
            - generic [ref=e308]:
              - generic [ref=e309]: 16 phiếu trong kỳ
              - button "Xem tất cả" [ref=e310] [cursor=pointer]
          - paragraph [ref=e313]: Kho và kỳ áp dụng cho chỉ số chứng từ, công việc cần xử lý và biểu đồ. Tìm kiếm và bộ lọc bên dưới chỉ áp dụng cho danh sách.
          - generic [ref=e314]:
            - search "Tìm phiếu nhập và xuất" [ref=e315]:
              - generic [ref=e316]: Tìm mã phiếu, người thực hiện
              - generic [ref=e317]:
                - generic [ref=e318]: Tìm mã phiếu, người thực hiện
                - searchbox "Tìm mã phiếu, người thực hiện" [ref=e322]
            - generic [ref=e323]:
              - generic [ref=e324]: Loại phiếu
              - combobox "Loại phiếu" [ref=e325] [cursor=pointer]:
                - option "Tất cả" [selected]
                - option "Nhập kho"
                - option "Xuất kho"
            - generic [ref=e326]:
              - generic [ref=e327]: Trạng thái
              - combobox "Trạng thái" [ref=e328] [cursor=pointer]:
                - option "Tất cả" [selected]
                - option "Đã ghi sổ"
                - option "Chờ xử lý trên Web"
          - generic "Danh sách phiếu nhập và xuất" [ref=e329]:
            - article [ref=e330]:
              - generic [ref=e334]:
                - button "PX-0011" [ref=e335] [cursor=pointer]
                - generic [ref=e336]: Đã ghi sổ
              - generic [ref=e337]:
                - generic [ref=e338]: Xuất kho
                - generic [ref=e339]: 27/09/2026 · 09:20
                - generic [ref=e343]: Lan Nguyễn
                - generic [ref=e347]: "7"
              - button "Xem phiếu PX-0011" [ref=e350] [cursor=pointer]
            - article [ref=e353]:
              - generic [ref=e357]:
                - button "PN-0011" [ref=e358] [cursor=pointer]
                - generic [ref=e359]: Đã ghi sổ
              - generic [ref=e360]:
                - generic [ref=e361]: Nhập kho
                - generic [ref=e362]: 26/09/2026 · 09:20
                - generic [ref=e366]: Lan Nguyễn
                - generic [ref=e370]: "2"
              - button "Xem phiếu PN-0011" [ref=e373] [cursor=pointer]
            - article [ref=e376]:
              - generic [ref=e380]:
                - button "PX-0010" [ref=e381] [cursor=pointer]
                - generic [ref=e382]: Chờ xử lý
              - generic [ref=e383]:
                - generic [ref=e384]: Xuất kho
                - generic [ref=e385]: 25/09/2026 · 14:35
                - generic [ref=e389]: Lan Nguyễn
                - generic [ref=e393]: "8"
              - button "Xem phiếu PX-0010" [ref=e396] [cursor=pointer]
            - article [ref=e399]:
              - generic [ref=e403]:
                - button "PN-0010" [ref=e404] [cursor=pointer]
                - generic [ref=e405]: Đã ghi sổ
              - generic [ref=e406]:
                - generic [ref=e407]: Nhập kho
                - generic [ref=e408]: 24/09/2026 · 09:20
                - generic [ref=e412]: Minh Anh
                - generic [ref=e416]: "15"
              - button "Xem phiếu PN-0010" [ref=e419] [cursor=pointer]
          - navigation "Phân trang bảng" [ref=e422]:
            - status [ref=e423]: Hiển thị 1–4 trên 16 phiếu
            - generic [ref=e424]:
              - generic [ref=e425]:
                - generic [ref=e426]: Số dòng mỗi trang
                - combobox "Số dòng mỗi trang" [ref=e427] [cursor=pointer]:
                  - option "4 / trang" [selected]
                  - option "10 / trang"
                  - option "15 / trang"
                  - option "25 / trang"
                  - option "50 / trang"
              - button "Trang trước" [disabled] [ref=e428]
              - button "Trang 1" [ref=e431] [cursor=pointer]: "1"
              - button "Trang 2" [ref=e432] [cursor=pointer]: "2"
              - button "Trang 3" [ref=e433] [cursor=pointer]: "3"
              - button "Trang 4" [ref=e434] [cursor=pointer]: "4"
              - button "Trang sau" [ref=e435] [cursor=pointer]
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
  8  | async function openNotifications(page: Page, width: number, height: number) {
  9  |   await page.setViewportSize({width, height});
  10 |   await page.addInitScript(() => {
  11 |     localStorage.setItem('hn-wms.s00.language.v1', 'vi');
  12 |     localStorage.setItem('hn-wms.s00.theme.v1', 'light');
  13 |   });
  14 |   await page.goto(`/tests/visual/notification.html?run=semantics-${Date.now()}-${width}`);
  15 |   await page.locator('#open-center').click();
  16 |   await expect(page.locator('dialog[open]')).toBeVisible();
  17 |   await expect(page.locator('#persisted-unread')).toHaveText('2');
  18 |   return page.locator('dialog[open]');
  19 | }
  20 | 
  21 | async function openApplicationNotifications(page: Page, width: number, height: number) {
  22 |   await page.setViewportSize({width, height});
  23 |   await page.goto('/#/preview/S01');
  24 |   await page.locator('#s07-username').fill('demo');
  25 |   await page.locator('#s07-password').fill('HoaNamDemo@2026');
  26 |   await page.locator('.s07-submit').click();
  27 |   await page.locator('.s08-confirm').click();
  28 |   await page.getByRole('button', {name: 'Tiếp tục', exact: true}).click();
  29 |   await expect(page.locator('.ov-result-count')).toBeVisible({timeout: 90000});
  30 |   await page.locator('.hn-notifications').click();
  31 |   const dialog = page.locator('dialog[open]');
  32 |   await expect(dialog).toBeVisible();
  33 |   return dialog;
  34 | }
  35 | 
  36 | for (const [width, height] of [[1920, 1080], [800, 1280]]) {
  37 |   test(`shared semantics: dialog has a heading without a nested page banner at ${width}`, async ({page}) => {
  38 |     const dialog = await openApplicationNotifications(page, width, height);
  39 |     await expect(dialog).toHaveAccessibleName(/Trung tâm thông báo/);
  40 |     await expect(dialog.getByRole('heading', {name: /Trung tâm thông báo/})).toBeVisible();
> 41 |     await expect(dialog.getByRole('banner')).toHaveCount(0);
     |                                              ^ Error: expect(locator).toHaveCount(expected) failed
  42 |     await page.addScriptTag({path: scanner});
  43 |     const violations = await page.evaluate(async () => {
  44 |       const {violations} = await (window as any).axe.run({include: [['dialog[open]']]}, {
  45 |         runOnly: {type: 'rule', values: ['landmark-banner-is-top-level', 'aria-prohibited-attr']},
  46 |       });
  47 |       return violations.map((v: any) => ({id: v.id, nodes: v.nodes.map((n: any) => n.target)}));
  48 |     });
  49 |     expect(violations).toEqual([]);
  50 |     await expect(dialog.locator('.hn-global-modal__close')).toHaveAccessibleName(/.+/);
  51 |     await dialog.locator('.hn-global-modal__close').focus();
  52 |     await page.keyboard.press('Escape');
  53 |     await expect(dialog).toHaveCount(0);
  54 |     await expect(page.locator('.hn-notifications')).toBeFocused();
  55 |   });
  56 | 
  57 |   test(`shared semantics: named feedback group preserves live status and dismiss at ${width}`, async ({page}) => {
  58 |     const dialog = await openNotifications(page, width, height);
  59 |     const feedback = page.getByRole('group', {name: 'Thông báo tạm thời', exact: true, includeHidden: true});
  60 |     await expect(feedback).toHaveCount(1);
  61 |     await dialog.getByRole('button', {name: 'Đánh dấu tất cả đã đọc', exact: true}).click();
  62 |     await expect(page.locator('#persisted-unread')).toHaveText('0');
  63 |     await page.keyboard.press('Escape');
  64 |     await expect(page.locator('dialog[open]')).toHaveCount(0);
  65 |     await expect(feedback).toBeVisible();
  66 |     const status = feedback.getByRole('status');
  67 |     await expect(status).toBeVisible();
  68 |     await expect(status).toHaveAttribute('aria-atomic', 'true');
  69 |     await expect(status).toContainText('Thao tác thành công');
  70 |     await status.getByRole('button', {name: 'Đóng thông báo', exact: true}).click();
  71 |     await expect(feedback.getByRole('status')).toHaveCount(0);
  72 |     await expect(page.locator('#open-center')).toBeFocused();
  73 |   });
  74 | }
  75 | 
```