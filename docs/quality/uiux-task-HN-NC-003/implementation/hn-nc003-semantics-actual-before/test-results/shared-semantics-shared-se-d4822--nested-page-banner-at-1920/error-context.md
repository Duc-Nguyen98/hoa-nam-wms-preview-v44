# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shared-semantics.spec.ts >> shared semantics: dialog has a heading without a nested page banner at 1920
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
          - button "Xuất kho" [ref=e36] [cursor=pointer]
          - button "Xếp khay" [ref=e42] [cursor=pointer]
          - button "Bảo hành & sửa chữa" [ref=e48] [cursor=pointer]
          - button "Tồn kho & đối soát" [ref=e54] [cursor=pointer]
      - generic [ref=e59]:
        - button "Danh mục" [expanded] [ref=e60] [cursor=pointer]
        - generic [ref=e67]:
          - link "SKU" [ref=e69] [cursor=pointer]:
            - /url: "#/preview/S04"
          - link "Sản phẩm" [ref=e75] [cursor=pointer]:
            - /url: "#/preview/S03"
          - link "Đại lý & nơi nhận" [ref=e79] [cursor=pointer]:
            - /url: "#/preview/S05"
          - link "Bệnh / lỗi" [ref=e84] [cursor=pointer]:
            - /url: "#/preview/S02"
      - button "Quản lý mã SKU" [ref=e88] [cursor=pointer]
      - button "Báo cáo" [ref=e95] [cursor=pointer]
      - link "Người dùng & RBAC" [ref=e102] [cursor=pointer]:
        - /url: "#/preview/S29"
      - link "Cấu hình" [ref=e108] [cursor=pointer]:
        - /url: "#/preview/S28"
      - link "Nhật ký hệ thống" [ref=e114] [cursor=pointer]:
        - /url: "#/preview/S27"
    - generic [ref=e119]: Kho Hoa Nam
    - generic "Thông tin phiên bản" [ref=e124]: © 2006 Hoa Nam. Bảo lưu mọi quyền.
  - generic [ref=e126]:
    - banner [ref=e128]:
      - button "Tìm màn hình" [ref=e129] [cursor=pointer]:
        - generic [ref=e133]: Tìm màn hình…
        - generic [aria-hidden] [ref=e134]: Ctrl K
      - generic [ref=e135]:
        - button "Truy cập nhanh" [ref=e136] [cursor=pointer]
        - button "Thông báo · 2" [expanded] [ref=e142] [cursor=pointer]:
          - generic [aria-hidden] [ref=e145]: "2"
        - 'button "Ngôn ngữ: Tiếng Việt" [ref=e146] [cursor=pointer]':
          - generic [aria-hidden] [ref=e152]: VI
        - 'button "Giao diện: Sáng" [ref=e153] [cursor=pointer]'
        - button "Tài khoản Đức Quang" [ref=e157] [cursor=pointer]:
          - generic [aria-hidden] [ref=e158]: DQ
          - generic "Đức Quang" [ref=e159]
      - dialog [ref=e162]:
        - generic [ref=e163]:
          - banner [ref=e164]:
            - generic [ref=e165]:
              - heading "Trung tâm thông báo 2 chưa đọc" [level=2] [ref=e166]:
                - generic [ref=e167]:
                  - generic [ref=e171]: Trung tâm thông báo
                  - generic [ref=e172]: 2 chưa đọc
              - paragraph [ref=e173]: Theo dõi cập nhật và xử lý công việc
            - button "Đóng trung tâm thông báo" [active] [ref=e174] [cursor=pointer]
          - generic [ref=e178]:
            - region "Danh sách thông báo" [ref=e179]:
              - generic [ref=e180]:
                - searchbox "Tìm trong thông báo" [ref=e185]
                - generic [ref=e186]:
                  - tablist "Danh sách thông báo" [ref=e187]:
                    - tab "Tất cả 6" [selected] [ref=e188] [cursor=pointer]:
                      - text: Tất cả
                      - generic [ref=e189]: "6"
                    - tab "Chưa đọc 2" [ref=e190] [cursor=pointer]:
                      - text: Chưa đọc
                      - generic [ref=e191]: "2"
                  - button "Đánh dấu tất cả đã đọc" [ref=e192] [cursor=pointer]
              - tabpanel "Tất cả 6" [ref=e196]:
                - generic [ref=e197]:
                  - generic [ref=e198]:
                    - heading "Hôm nay" [level=3] [ref=e199]
                    - list [ref=e200]:
                      - listitem [ref=e201]:
                        - button "Phiếu xuất kho cần kiểm tra PX-0021 · Đại lý Hoàng Minh 10:30" [ref=e202] [cursor=pointer]:
                          - generic [ref=e206]:
                            - strong [ref=e207]: Phiếu xuất kho cần kiểm tra
                            - generic "PX-0021 · Đại lý Hoàng Minh" [ref=e208]
                          - time [ref=e209]: 10:30
                      - listitem [ref=e210]:
                        - button "Chưa đọc In nhãn chưa thành công LBH0012343 · Máy in kho A 09:45" [ref=e211] [cursor=pointer]:
                          - generic [ref=e215]:
                            - strong [ref=e216]:
                              - generic "Chưa đọc" [ref=e217]
                              - text: In nhãn chưa thành công
                            - generic "LBH0012343 · Máy in kho A" [ref=e218]
                          - time [ref=e219]: 09:45
                      - listitem [ref=e220]:
                        - button "Chưa đọc Đối soát phát hiện chênh lệch Kho A · Cần kiểm tra số lượng 09:15" [ref=e221] [cursor=pointer]:
                          - generic [ref=e226]:
                            - strong [ref=e227]:
                              - generic "Chưa đọc" [ref=e228]
                              - text: Đối soát phát hiện chênh lệch
                            - generic "Kho A · Cần kiểm tra số lượng" [ref=e229]
                          - time [ref=e230]: 09:15
                      - listitem [ref=e231]:
                        - button "Phiếu nhập kho đã hoàn tất PN-0042 · 24 sản phẩm 08:40" [ref=e232] [cursor=pointer]:
                          - generic [ref=e236]:
                            - strong [ref=e237]: Phiếu nhập kho đã hoàn tất
                            - generic "PN-0042 · 24 sản phẩm" [ref=e238]
                          - time [ref=e239]: 08:40
                  - generic [ref=e240]:
                    - heading "Hôm qua" [level=3] [ref=e241]
                    - list [ref=e242]:
                      - listitem [ref=e243]:
                        - button "Hồ sơ bảo hành được cập nhật BH-0018 · Đang sửa chữa 26/10 · 16:20" [ref=e244] [cursor=pointer]:
                          - generic [ref=e248]:
                            - strong [ref=e249]: Hồ sơ bảo hành được cập nhật
                            - generic "BH-0018 · Đang sửa chữa" [ref=e250]
                          - time [ref=e251]: 26/10 · 16:20
                      - listitem [ref=e252]:
                        - button "Xếp khay hoàn tất TRAY-0012 · Kho A 26/10 · 14:05" [ref=e253] [cursor=pointer]:
                          - generic [ref=e257]:
                            - strong [ref=e258]: Xếp khay hoàn tất
                            - generic "TRAY-0012 · Kho A" [ref=e259]
                          - time [ref=e260]: 26/10 · 14:05
            - region "Chi tiết thông báo" [ref=e261]:
              - article [ref=e262]:
                - generic [ref=e263]:
                  - paragraph [ref=e264]: Xuất kho
                  - heading "Phiếu xuất kho cần kiểm tra" [level=3] [ref=e265]
                  - generic [ref=e266]:
                    - time [ref=e271]: 27/10/2026 · 10:30
                    - generic [ref=e272]: Đã đọc
                  - paragraph [ref=e276]: Phiếu PX-0021 đang chờ kiểm tra thông tin trước khi tiếp tục xử lý. Vui lòng đối chiếu người nhận và danh sách hàng hóa.
                  - region "Thông tin nghiệp vụ" [ref=e277]:
                    - heading "Thông tin phiếu xuất" [level=4] [ref=e278]
                    - generic [ref=e281]:
                      - generic [ref=e282]:
                        - term [ref=e283]: Mã phiếu
                        - definition [ref=e284]: PX-0021
                      - generic [ref=e285]:
                        - term [ref=e286]: Người nhận
                        - definition [ref=e287]: Đại lý Hoàng Minh
                      - generic [ref=e288]:
                        - term [ref=e289]: Kho xuất
                        - definition [ref=e290]: Kho A
                      - generic [ref=e291]:
                        - term [ref=e292]: Số lượng
                        - definition [ref=e293]: 12 sản phẩm
                      - generic [ref=e294]:
                        - term [ref=e295]: Trạng thái
                        - definition [ref=e296]:
                          - generic [ref=e297]: Chờ kiểm tra
                  - generic [ref=e301]:
                    - link "Mở phiếu xuất kho" [ref=e302] [cursor=pointer]:
                      - /url: "#/preview/S15?source=notification&recordId=notification-document%3Aoutbound%3A0021&notificationId=PREVIEW-DESIGN-1&snapshotId=notification-design-documents%3A2026-10-26%3Av1"
                    - button "Đánh dấu chưa đọc" [ref=e305] [cursor=pointer]
                - generic [ref=e306]:
                  - generic [ref=e307]: Đánh dấu đã đọc không thay đổi trạng thái phiếu.
                  - navigation "Chi tiết thông báo" [ref=e311]:
                    - generic [ref=e312]: Thông báo 1 / 6
                    - button "Thông báo trước" [disabled] [ref=e313]
                    - button "Thông báo tiếp theo" [ref=e316] [cursor=pointer]
        - generic:
          - generic "Thông báo tạm thời"
    - main [ref=e319]:
      - generic [ref=e320]:
        - generic [ref=e321]:
          - generic [ref=e322]:
            - generic [ref=e323]: Kho Hoa Nam
            - heading "Tổng quan vận hành" [level=1] [ref=e327]
            - paragraph [ref=e328]: Theo dõi kho và công việc cần xử lý.
          - generic [ref=e329]:
            - generic [ref=e330]:
              - generic [ref=e331]:
                - generic [ref=e332]: Kho
                - combobox "Kho" [ref=e333] [cursor=pointer]:
                  - option "Kho Hoa Nam" [selected]
              - generic [ref=e334]:
                - generic [ref=e335]: Kỳ thời gian
                - 'button "Kỳ thời gian: 01/09/2026 – 30/09/2026" [ref=e337] [cursor=pointer]':
                  - generic [ref=e338]: tháng 9 năm 2026
            - paragraph [ref=e342]: 01/09/2026 – 30/09/2026
        - generic [ref=e343]:
          - region "Tồn kho hiện tại" [ref=e344]:
            - heading "Tồn kho hiện tại" [level=2] [ref=e346]
            - strong [ref=e351]: —
            - generic [ref=e352]:
              - generic [ref=e353]: Chưa có số liệu xác nhận
              - generic [ref=e354]: Hiện tại
          - region "Phiếu nhập" [ref=e355]:
            - heading "Phiếu nhập" [level=2] [ref=e357]
            - generic [ref=e361]:
              - strong [ref=e362]: "8"
              - generic [ref=e363]: phiếu
            - generic [ref=e364]:
              - generic [ref=e365]: Tất cả trạng thái
              - generic [ref=e366]: Trong kỳ
          - region "Phiếu xuất" [ref=e367]:
            - heading "Phiếu xuất" [level=2] [ref=e369]
            - generic [ref=e373]:
              - strong [ref=e374]: "8"
              - generic [ref=e375]: phiếu
            - generic [ref=e376]:
              - generic [ref=e377]: Tất cả trạng thái
              - generic [ref=e378]: Trong kỳ
          - region "Bảo hành đang mở" [ref=e379]:
            - heading "Bảo hành đang mở" [level=2] [ref=e381]
            - generic [ref=e386]:
              - strong [ref=e387]: "4"
              - generic [ref=e388]: hồ sơ
            - generic [ref=e389]:
              - generic [ref=e390]: Không áp dụng kỳ chứng từ
              - generic [ref=e391]: Hiện tại
        - generic [ref=e392]:
          - region [ref=e393]:
            - generic [ref=e394]:
              - generic [ref=e399]:
                - heading "Cần xử lý 5" [level=2] [ref=e400]:
                  - text: Cần xử lý
                  - generic [ref=e401]: "5"
                - paragraph [ref=e402]: Các phiếu đang chờ xử lý, cần theo dõi và hoàn tất.
              - button "Xem danh sách" [ref=e403] [cursor=pointer]
            - generic [ref=e406]:
              - generic [ref=e407]:
                - button "PX-0010" [ref=e411] [cursor=pointer]
                - generic [ref=e412]: Phiếu xuất chờ xử lý
                - button "Xem phiếu PX-0010" [ref=e413] [cursor=pointer]:
                  - generic [ref=e414]: Xem phiếu
              - generic [ref=e417]:
                - button "PN-0009" [ref=e421] [cursor=pointer]
                - generic [ref=e422]: Phiếu nhập chờ xử lý
                - button "Xem phiếu PN-0009" [ref=e423] [cursor=pointer]:
                  - generic [ref=e424]: Xem phiếu
              - generic [ref=e427]:
                - button "PX-0007" [ref=e431] [cursor=pointer]
                - generic [ref=e432]: Phiếu xuất chờ xử lý
                - button "Xem phiếu PX-0007" [ref=e433] [cursor=pointer]:
                  - generic [ref=e434]: Xem phiếu
          - region [ref=e437]:
            - heading [level=2] [ref=e438]
            - generic [ref=e442]:
              - button "Báo cáo tồn kho" [ref=e443] [cursor=pointer]
              - button "Truy vết hàng hóa" [ref=e450] [cursor=pointer]
              - button "Lịch sử nhập – xuất" [ref=e458] [cursor=pointer]
        - region [ref=e466]:
          - generic [ref=e467]:
            - generic [ref=e472]:
              - heading "Hoạt động nhập – xuất" [level=2] [ref=e473]
              - paragraph [ref=e474]: Danh sách phiếu nhập và xuất trong kỳ.
            - generic [ref=e475]:
              - generic [ref=e476]: 16 phiếu trong kỳ
              - button "Xem tất cả" [ref=e477] [cursor=pointer]
          - paragraph [ref=e480]: Kho và kỳ áp dụng cho chỉ số chứng từ, công việc cần xử lý và biểu đồ. Tìm kiếm và bộ lọc bên dưới chỉ áp dụng cho danh sách.
          - generic [ref=e481]:
            - search "Tìm phiếu nhập và xuất" [ref=e482]:
              - generic [ref=e483]: Tìm mã phiếu, người thực hiện
              - generic [ref=e484]:
                - generic [ref=e485]: Tìm mã phiếu, người thực hiện
                - searchbox "Tìm mã phiếu, người thực hiện" [ref=e489]
            - generic [ref=e490]:
              - generic [ref=e491]: Loại phiếu
              - combobox "Loại phiếu" [ref=e492] [cursor=pointer]:
                - option "Tất cả" [selected]
                - option "Nhập kho"
                - option "Xuất kho"
            - generic [ref=e493]:
              - generic [ref=e494]: Trạng thái
              - combobox "Trạng thái" [ref=e495] [cursor=pointer]:
                - option "Tất cả" [selected]
                - option "Đã ghi sổ"
                - option "Chờ xử lý trên Web"
          - region [ref=e497]:
            - table [ref=e498]:
              - caption [ref=e499]: Danh sách phiếu nhập và xuất
              - rowgroup [ref=e500]:
                - row [ref=e501]:
                  - columnheader "STT" [ref=e502]
                  - columnheader "Sắp xếp theo Mã phiếu Kích hoạt để xếp A đến Z." [ref=e503]:
                    - button "Sắp xếp theo Mã phiếu" [ref=e504] [cursor=pointer]:
                      - text: Mã phiếu
                      - generic [aria-hidden] [ref=e505]: ↕
                    - generic [ref=e506]: Kích hoạt để xếp A đến Z.
                  - columnheader "Sắp xếp theo Loại phiếu Kích hoạt để xếp A đến Z." [ref=e507]:
                    - button "Sắp xếp theo Loại phiếu" [ref=e508] [cursor=pointer]:
                      - text: Loại phiếu
                      - generic [aria-hidden] [ref=e509]: ↕
                    - generic [ref=e510]: Kích hoạt để xếp A đến Z.
                  - columnheader "Sắp xếp theo Thời gian Đang xếp mới đến cũ. Kích hoạt để xếp cũ đến mới." [ref=e511]:
                    - button "Sắp xếp theo Thời gian" [ref=e512] [cursor=pointer]:
                      - text: Thời gian
                      - generic [aria-hidden] [ref=e513]: ↓
                    - generic [ref=e514]: Đang xếp mới đến cũ. Kích hoạt để xếp cũ đến mới.
                  - columnheader "Sắp xếp theo Người thực hiện Kích hoạt để xếp A đến Z." [ref=e515]:
                    - button "Sắp xếp theo Người thực hiện" [ref=e516] [cursor=pointer]:
                      - text: Người thực hiện
                      - generic [aria-hidden] [ref=e517]: ↕
                    - generic [ref=e518]: Kích hoạt để xếp A đến Z.
                  - columnheader "Sắp xếp theo Số lượng Kích hoạt để xếp nhỏ đến lớn." [ref=e519]:
                    - button "Sắp xếp theo Số lượng" [ref=e520] [cursor=pointer]:
                      - text: Số lượng
                      - generic [aria-hidden] [ref=e521]: ↕
                    - generic [ref=e522]: Kích hoạt để xếp nhỏ đến lớn.
                  - columnheader "Sắp xếp theo Trạng thái Kích hoạt để xếp A đến Z." [ref=e523]:
                    - button "Sắp xếp theo Trạng thái" [ref=e524] [cursor=pointer]:
                      - text: Trạng thái
                      - generic [aria-hidden] [ref=e525]: ↕
                    - generic [ref=e526]: Kích hoạt để xếp A đến Z.
                  - columnheader "Thao tác" [ref=e527]
              - rowgroup [ref=e529]:
                - row [ref=e530]:
                  - cell "1" [ref=e531]
                  - cell [ref=e532]:
                    - button "PX-0011" [ref=e533] [cursor=pointer]
                  - cell "Xuất kho" [ref=e534]
                  - cell "27/09/2026 · 09:20" [ref=e538]
                  - cell "Lan Nguyễn" [ref=e540]
                  - cell "7" [ref=e541]
                  - cell "Đã ghi sổ" [ref=e542]
                  - cell [ref=e544]:
                    - button "Xem phiếu PX-0011" [ref=e545] [cursor=pointer]
                - row [ref=e548]:
                  - cell "2" [ref=e549]
                  - cell [ref=e550]:
                    - button "PN-0011" [ref=e551] [cursor=pointer]
                  - cell "Nhập kho" [ref=e552]
                  - cell "26/09/2026 · 09:20" [ref=e556]
                  - cell "Lan Nguyễn" [ref=e558]
                  - cell "2" [ref=e559]
                  - cell "Đã ghi sổ" [ref=e560]
                  - cell [ref=e562]:
                    - button "Xem phiếu PN-0011" [ref=e563] [cursor=pointer]
                - row [ref=e566]:
                  - cell "3" [ref=e567]
                  - cell [ref=e568]:
                    - button "PX-0010" [ref=e569] [cursor=pointer]
                  - cell "Xuất kho" [ref=e570]
                  - cell "25/09/2026 · 14:35" [ref=e574]
                  - cell "Lan Nguyễn" [ref=e576]
                  - cell "8" [ref=e577]
                  - cell "Chờ xử lý" [ref=e578]
                  - cell [ref=e580]:
                    - button "Xem phiếu PX-0010" [ref=e581] [cursor=pointer]
                - row [ref=e584]:
                  - cell "4" [ref=e585]
                  - cell [ref=e586]:
                    - button "PN-0010" [ref=e587] [cursor=pointer]
                  - cell "Nhập kho" [ref=e588]
                  - cell "24/09/2026 · 09:20" [ref=e592]
                  - cell "Minh Anh" [ref=e594]
                  - cell "15" [ref=e595]
                  - cell "Đã ghi sổ" [ref=e596]
                  - cell [ref=e598]:
                    - button "Xem phiếu PN-0010" [ref=e599] [cursor=pointer]
          - navigation "Phân trang bảng" [ref=e602]:
            - status [ref=e603]: Hiển thị 1–4 trên 16 phiếu
            - generic [ref=e604]:
              - generic [ref=e605]:
                - generic [ref=e606]: Số dòng mỗi trang
                - combobox "Số dòng mỗi trang" [ref=e607] [cursor=pointer]:
                  - option "4 / trang" [selected]
                  - option "10 / trang"
                  - option "15 / trang"
                  - option "25 / trang"
                  - option "50 / trang"
              - button "Trang trước" [disabled] [ref=e608]
              - button "Trang 1" [ref=e611] [cursor=pointer]: "1"
              - button "Trang 2" [ref=e612] [cursor=pointer]: "2"
              - button "Trang 3" [ref=e613] [cursor=pointer]: "3"
              - button "Trang 4" [ref=e614] [cursor=pointer]: "4"
              - button "Trang sau" [ref=e615] [cursor=pointer]
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