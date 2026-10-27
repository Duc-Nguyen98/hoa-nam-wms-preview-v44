# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shared-regression.spec.ts >> F-NC-003-SHARED-1920-light actual app modal semantics, collision-safe mark-all feedback and contrast spot checks
- Location: docs\quality\uiux-task-HN-NC-003\functional\shared-regression.spec.ts:7:67

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 318

- Array []
+ Array [
+   Object {
+     "background": Array [
+       255,
+       255,
+       255,
+       1,
+     ],
+     "effective": Array [
+       126,
+       141,
+       155.25,
+       1,
+     ],
+     "fontSize": "14px",
+     "fontWeight": "400",
+     "foreground": "rgb(83, 103, 122)",
+     "index": 0,
+     "layers": Array [
+       Object {
+         "class": "",
+         "color": "rgba(0, 0, 0, 0)",
+         "image": "none",
+         "opacity": "1",
+         "tag": "INPUT",
+       },
+       Object {
+         "class": "hn-notification-search",
+         "color": "rgb(255, 255, 255)",
+         "image": "none",
+         "opacity": "1",
+         "tag": "LABEL",
+       },
+     ],
+     "opacity": 0.75,
+     "pseudo": "::placeholder",
+     "ratio": 3.402425246505855,
+     "required": 4.5,
+     "selector": ".hn-notification-search input",
+     "status": "FAIL",
+     "text": "Tìm thông báo…",
+     "uncertainties": Array [],
+     "view": "initial-list/default-detail",
+   },
+   Object {
+     "background": Array [
+       255,
+       240,
+       216,
+       1,
+     ],
+     "effective": Array [
+       198,
+       106,
+       0,
+       1,
+     ],
+     "fontSize": "14px",
+     "fontWeight": "400",
+     "foreground": "rgb(198, 106, 0)",
+     "index": 0,
+     "layers": Array [
+       Object {
+         "class": "hn-notification-business-status hn-notification-business-status--warning",
+         "color": "rgb(255, 240, 216)",
+         "image": "none",
+         "opacity": "1",
+         "tag": "SPAN",
+       },
+     ],
+     "opacity": 1,
+     "pseudo": "",
+     "ratio": 3.4245665189326573,
+     "required": 4.5,
+     "selector": ".hn-notification-business-status",
+     "status": "FAIL",
+     "text": "Chờ kiểm tra",
+     "uncertainties": Array [],
+     "view": "initial-list/default-detail",
+   },
+   Object {
+     "background": Array [
+       255,
+       255,
+       255,
+       1,
+     ],
+     "effective": Array [
+       126,
+       141,
+       155.25,
+       1,
+     ],
+     "fontSize": "14px",
+     "fontWeight": "400",
+     "foreground": "rgb(83, 103, 122)",
+     "index": 0,
+     "layers": Array [
+       Object {
+         "class": "",
+         "color": "rgba(0, 0, 0, 0)",
+         "image": "none",
+         "opacity": "1",
+         "tag": "INPUT",
+       },
+       Object {
+         "class": "hn-notification-search",
+         "color": "rgb(255, 255, 255)",
+         "image": "none",
+         "opacity": "1",
+         "tag": "LABEL",
+       },
+     ],
+     "opacity": 0.75,
+     "pseudo": "::placeholder",
+     "ratio": 3.402425246505855,
+     "required": 4.5,
+     "selector": ".hn-notification-search input",
+     "status": "FAIL",
+     "text": "Tìm thông báo…",
+     "uncertainties": Array [],
+     "view": "detail-0",
+   },
+   Object {
+     "background": Array [
+       255,
+       240,
+       216,
+       1,
+     ],
+     "effective": Array [
+       198,
+       106,
+       0,
+       1,
+     ],
+     "fontSize": "14px",
+     "fontWeight": "400",
+     "foreground": "rgb(198, 106, 0)",
+     "index": 0,
+     "layers": Array [
+       Object {
+         "class": "hn-notification-business-status hn-notification-business-status--warning",
+         "color": "rgb(255, 240, 216)",
+         "image": "none",
+         "opacity": "1",
+         "tag": "SPAN",
+       },
+     ],
+     "opacity": 1,
+     "pseudo": "",
+     "ratio": 3.4245665189326573,
+     "required": 4.5,
+     "selector": ".hn-notification-business-status",
+     "status": "FAIL",
+     "text": "Chờ kiểm tra",
+     "uncertainties": Array [],
+     "view": "detail-0",
+   },
+   Object {
+     "background": Array [
+       255,
+       255,
+       255,
+       1,
+     ],
+     "effective": Array [
+       126,
+       141,
+       155.25,
+       1,
+     ],
+     "fontSize": "14px",
+     "fontWeight": "400",
+     "foreground": "rgb(83, 103, 122)",
+     "index": 0,
+     "layers": Array [
+       Object {
+         "class": "",
+         "color": "rgba(0, 0, 0, 0)",
+         "image": "none",
+         "opacity": "1",
+         "tag": "INPUT",
+       },
+       Object {
+         "class": "hn-notification-search",
+         "color": "rgb(255, 255, 255)",
+         "image": "none",
+         "opacity": "1",
+         "tag": "LABEL",
+       },
+     ],
+     "opacity": 0.75,
+     "pseudo": "::placeholder",
+     "ratio": 3.402425246505855,
+     "required": 4.5,
+     "selector": ".hn-notification-search input",
+     "status": "FAIL",
+     "text": "Tìm thông báo…",
+     "uncertainties": Array [],
+     "view": "detail-1",
+   },
+   Object {
+     "background": Array [
+       255,
+       240,
+       216,
+       1,
+     ],
+     "effective": Array [
+       198,
+       106,
+       0,
+       1,
+     ],
+     "fontSize": "14px",
+     "fontWeight": "400",
+     "foreground": "rgb(198, 106, 0)",
+     "index": 0,
+     "layers": Array [
+       Object {
+         "class": "hn-notification-business-status hn-notification-business-status--warning",
+         "color": "rgb(255, 240, 216)",
+         "image": "none",
+         "opacity": "1",
+         "tag": "SPAN",
+       },
+     ],
+     "opacity": 1,
+     "pseudo": "",
+     "ratio": 3.4245665189326573,
+     "required": 4.5,
+     "selector": ".hn-notification-business-status",
+     "status": "FAIL",
+     "text": "In chưa thành công",
+     "uncertainties": Array [],
+     "view": "detail-1",
+   },
+   Object {
+     "background": Array [
+       255,
+       255,
+       255,
+       1,
+     ],
+     "effective": Array [
+       126,
+       141,
+       155.25,
+       1,
+     ],
+     "fontSize": "14px",
+     "fontWeight": "400",
+     "foreground": "rgb(83, 103, 122)",
+     "index": 0,
+     "layers": Array [
+       Object {
+         "class": "",
+         "color": "rgba(0, 0, 0, 0)",
+         "image": "none",
+         "opacity": "1",
+         "tag": "INPUT",
+       },
+       Object {
+         "class": "hn-notification-search",
+         "color": "rgb(255, 255, 255)",
+         "image": "none",
+         "opacity": "1",
+         "tag": "LABEL",
+       },
+     ],
+     "opacity": 0.75,
+     "pseudo": "::placeholder",
+     "ratio": 3.402425246505855,
+     "required": 4.5,
+     "selector": ".hn-notification-search input",
+     "status": "FAIL",
+     "text": "Tìm thông báo…",
+     "uncertainties": Array [],
+     "view": "detail-2",
+   },
+   Object {
+     "background": Array [
+       255,
+       240,
+       216,
+       1,
+     ],
+     "effective": Array [
+       198,
+       106,
+       0,
+       1,
+     ],
+     "fontSize": "14px",
+     "fontWeight": "400",
+     "foreground": "rgb(198, 106, 0)",
+     "index": 0,
+     "layers": Array [
+       Object {
+         "class": "hn-notification-business-status hn-notification-business-status--warning",
+         "color": "rgb(255, 240, 216)",
+         "image": "none",
+         "opacity": "1",
+         "tag": "SPAN",
+       },
+     ],
+     "opacity": 1,
+     "pseudo": "",
+     "ratio": 3.4245665189326573,
+     "required": 4.5,
+     "selector": ".hn-notification-business-status",
+     "status": "FAIL",
+     "text": "Có chênh lệch",
+     "uncertainties": Array [],
+     "view": "detail-2",
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=e1]:
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
          - button "Thông báo · 0" [ref=e142] [cursor=pointer]
          - 'button "Ngôn ngữ: Tiếng Việt" [ref=e145] [cursor=pointer]':
            - generic [aria-hidden] [ref=e151]: VI
          - 'button "Giao diện: Sáng" [ref=e152] [cursor=pointer]'
          - button "Tài khoản Đức Quang" [ref=e156] [cursor=pointer]:
            - generic [aria-hidden] [ref=e157]: DQ
            - generic "Đức Quang" [ref=e158]
      - main [ref=e161]:
        - generic [ref=e162]:
          - generic [ref=e163]:
            - generic [ref=e164]:
              - generic [ref=e165]: Kho Hoa Nam
              - heading "Tổng quan vận hành" [level=1] [ref=e169]
              - paragraph [ref=e170]: Theo dõi kho và công việc cần xử lý.
            - generic [ref=e171]:
              - generic [ref=e172]:
                - generic [ref=e173]:
                  - generic [ref=e174]: Kho
                  - combobox "Kho" [ref=e175] [cursor=pointer]:
                    - option "Kho Hoa Nam" [selected]
                - generic [ref=e176]:
                  - generic [ref=e177]: Kỳ thời gian
                  - 'button "Kỳ thời gian: 01/09/2026 – 30/09/2026" [ref=e179] [cursor=pointer]':
                    - generic [ref=e180]: tháng 9 năm 2026
              - paragraph [ref=e184]: 01/09/2026 – 30/09/2026
          - generic [ref=e185]:
            - region "Tồn kho hiện tại" [ref=e186]:
              - heading "Tồn kho hiện tại" [level=2] [ref=e188]
              - strong [ref=e193]: —
              - generic [ref=e194]:
                - generic [ref=e195]: Chưa có số liệu xác nhận
                - generic [ref=e196]: Hiện tại
            - region "Phiếu nhập" [ref=e197]:
              - heading "Phiếu nhập" [level=2] [ref=e199]
              - generic [ref=e203]:
                - strong [ref=e204]: "8"
                - generic [ref=e205]: phiếu
              - generic [ref=e206]:
                - generic [ref=e207]: Tất cả trạng thái
                - generic [ref=e208]: Trong kỳ
            - region "Phiếu xuất" [ref=e209]:
              - heading "Phiếu xuất" [level=2] [ref=e211]
              - generic [ref=e215]:
                - strong [ref=e216]: "8"
                - generic [ref=e217]: phiếu
              - generic [ref=e218]:
                - generic [ref=e219]: Tất cả trạng thái
                - generic [ref=e220]: Trong kỳ
            - region "Bảo hành đang mở" [ref=e221]:
              - heading "Bảo hành đang mở" [level=2] [ref=e223]
              - generic [ref=e228]:
                - strong [ref=e229]: "4"
                - generic [ref=e230]: hồ sơ
              - generic [ref=e231]:
                - generic [ref=e232]: Không áp dụng kỳ chứng từ
                - generic [ref=e233]: Hiện tại
          - generic [ref=e234]:
            - region [ref=e235]:
              - generic [ref=e236]:
                - generic [ref=e241]:
                  - heading "Cần xử lý 5" [level=2] [ref=e242]:
                    - text: Cần xử lý
                    - generic [ref=e243]: "5"
                  - paragraph [ref=e244]: Các phiếu đang chờ xử lý, cần theo dõi và hoàn tất.
                - button "Xem danh sách" [ref=e245] [cursor=pointer]
              - generic [ref=e248]:
                - generic [ref=e249]:
                  - button "PX-0010" [active] [ref=e253] [cursor=pointer]
                  - generic [ref=e254]: Phiếu xuất chờ xử lý
                  - button "Xem phiếu PX-0010" [ref=e255] [cursor=pointer]:
                    - generic [ref=e256]: Xem phiếu
                - generic [ref=e259]:
                  - button "PN-0009" [ref=e263] [cursor=pointer]
                  - generic [ref=e264]: Phiếu nhập chờ xử lý
                  - button "Xem phiếu PN-0009" [ref=e265] [cursor=pointer]:
                    - generic [ref=e266]: Xem phiếu
                - generic [ref=e269]:
                  - button "PX-0007" [ref=e273] [cursor=pointer]
                  - generic [ref=e274]: Phiếu xuất chờ xử lý
                  - button "Xem phiếu PX-0007" [ref=e275] [cursor=pointer]:
                    - generic [ref=e276]: Xem phiếu
            - region [ref=e279]:
              - heading [level=2] [ref=e280]
              - generic [ref=e284]:
                - button "Báo cáo tồn kho" [ref=e285] [cursor=pointer]
                - button "Truy vết hàng hóa" [ref=e292] [cursor=pointer]
                - button "Lịch sử nhập – xuất" [ref=e300] [cursor=pointer]
          - region [ref=e308]:
            - generic [ref=e309]:
              - generic [ref=e314]:
                - heading "Hoạt động nhập – xuất" [level=2] [ref=e315]
                - paragraph [ref=e316]: Danh sách phiếu nhập và xuất trong kỳ.
              - generic [ref=e317]:
                - generic [ref=e318]: 16 phiếu trong kỳ
                - button "Xem tất cả" [ref=e319] [cursor=pointer]
            - paragraph [ref=e322]: Kho và kỳ áp dụng cho chỉ số chứng từ, công việc cần xử lý và biểu đồ. Tìm kiếm và bộ lọc bên dưới chỉ áp dụng cho danh sách.
            - generic [ref=e323]:
              - search "Tìm phiếu nhập và xuất" [ref=e324]:
                - generic [ref=e325]: Tìm mã phiếu, người thực hiện
                - generic [ref=e326]:
                  - generic [ref=e327]: Tìm mã phiếu, người thực hiện
                  - searchbox "Tìm mã phiếu, người thực hiện" [ref=e331]
              - generic [ref=e332]:
                - generic [ref=e333]: Loại phiếu
                - combobox "Loại phiếu" [ref=e334] [cursor=pointer]:
                  - option "Tất cả" [selected]
                  - option "Nhập kho"
                  - option "Xuất kho"
              - generic [ref=e335]:
                - generic [ref=e336]: Trạng thái
                - combobox "Trạng thái" [ref=e337] [cursor=pointer]:
                  - option "Tất cả" [selected]
                  - option "Đã ghi sổ"
                  - option "Chờ xử lý trên Web"
            - region [ref=e339]:
              - table [ref=e340]:
                - caption [ref=e341]: Danh sách phiếu nhập và xuất
                - rowgroup [ref=e342]:
                  - row [ref=e343]:
                    - columnheader "STT" [ref=e344]
                    - columnheader "Sắp xếp theo Mã phiếu Kích hoạt để xếp A đến Z." [ref=e345]:
                      - button "Sắp xếp theo Mã phiếu" [ref=e346] [cursor=pointer]:
                        - text: Mã phiếu
                        - generic [aria-hidden] [ref=e347]: ↕
                      - generic [ref=e348]: Kích hoạt để xếp A đến Z.
                    - columnheader "Sắp xếp theo Loại phiếu Kích hoạt để xếp A đến Z." [ref=e349]:
                      - button "Sắp xếp theo Loại phiếu" [ref=e350] [cursor=pointer]:
                        - text: Loại phiếu
                        - generic [aria-hidden] [ref=e351]: ↕
                      - generic [ref=e352]: Kích hoạt để xếp A đến Z.
                    - columnheader "Sắp xếp theo Thời gian Đang xếp mới đến cũ. Kích hoạt để xếp cũ đến mới." [ref=e353]:
                      - button "Sắp xếp theo Thời gian" [ref=e354] [cursor=pointer]:
                        - text: Thời gian
                        - generic [aria-hidden] [ref=e355]: ↓
                      - generic [ref=e356]: Đang xếp mới đến cũ. Kích hoạt để xếp cũ đến mới.
                    - columnheader "Sắp xếp theo Người thực hiện Kích hoạt để xếp A đến Z." [ref=e357]:
                      - button "Sắp xếp theo Người thực hiện" [ref=e358] [cursor=pointer]:
                        - text: Người thực hiện
                        - generic [aria-hidden] [ref=e359]: ↕
                      - generic [ref=e360]: Kích hoạt để xếp A đến Z.
                    - columnheader "Sắp xếp theo Số lượng Kích hoạt để xếp nhỏ đến lớn." [ref=e361]:
                      - button "Sắp xếp theo Số lượng" [ref=e362] [cursor=pointer]:
                        - text: Số lượng
                        - generic [aria-hidden] [ref=e363]: ↕
                      - generic [ref=e364]: Kích hoạt để xếp nhỏ đến lớn.
                    - columnheader "Sắp xếp theo Trạng thái Kích hoạt để xếp A đến Z." [ref=e365]:
                      - button "Sắp xếp theo Trạng thái" [ref=e366] [cursor=pointer]:
                        - text: Trạng thái
                        - generic [aria-hidden] [ref=e367]: ↕
                      - generic [ref=e368]: Kích hoạt để xếp A đến Z.
                    - columnheader "Thao tác" [ref=e369]
                - rowgroup [ref=e371]:
                  - row [ref=e372]:
                    - cell "1" [ref=e373]
                    - cell [ref=e374]:
                      - button "PX-0011" [ref=e375] [cursor=pointer]
                    - cell "Xuất kho" [ref=e376]
                    - cell "27/09/2026 · 09:20" [ref=e380]
                    - cell "Lan Nguyễn" [ref=e382]
                    - cell "7" [ref=e383]
                    - cell "Đã ghi sổ" [ref=e384]
                    - cell [ref=e386]:
                      - button "Xem phiếu PX-0011" [ref=e387] [cursor=pointer]
                  - row [ref=e390]:
                    - cell "2" [ref=e391]
                    - cell [ref=e392]:
                      - button "PN-0011" [ref=e393] [cursor=pointer]
                    - cell "Nhập kho" [ref=e394]
                    - cell "26/09/2026 · 09:20" [ref=e398]
                    - cell "Lan Nguyễn" [ref=e400]
                    - cell "2" [ref=e401]
                    - cell "Đã ghi sổ" [ref=e402]
                    - cell [ref=e404]:
                      - button "Xem phiếu PN-0011" [ref=e405] [cursor=pointer]
                  - row [ref=e408]:
                    - cell "3" [ref=e409]
                    - cell [ref=e410]:
                      - button "PX-0010" [ref=e411] [cursor=pointer]
                    - cell "Xuất kho" [ref=e412]
                    - cell "25/09/2026 · 14:35" [ref=e416]
                    - cell "Lan Nguyễn" [ref=e418]
                    - cell "8" [ref=e419]
                    - cell "Chờ xử lý" [ref=e420]
                    - cell [ref=e422]:
                      - button "Xem phiếu PX-0010" [ref=e423] [cursor=pointer]
                  - row [ref=e426]:
                    - cell "4" [ref=e427]
                    - cell [ref=e428]:
                      - button "PN-0010" [ref=e429] [cursor=pointer]
                    - cell "Nhập kho" [ref=e430]
                    - cell "24/09/2026 · 09:20" [ref=e434]
                    - cell "Minh Anh" [ref=e436]
                    - cell "15" [ref=e437]
                    - cell "Đã ghi sổ" [ref=e438]
                    - cell [ref=e440]:
                      - button "Xem phiếu PN-0010" [ref=e441] [cursor=pointer]
            - navigation "Phân trang bảng" [ref=e444]:
              - status [ref=e445]: Hiển thị 1–4 trên 16 phiếu
              - generic [ref=e446]:
                - generic [ref=e447]:
                  - generic [ref=e448]: Số dòng mỗi trang
                  - combobox "Số dòng mỗi trang" [ref=e449] [cursor=pointer]:
                    - option "4 / trang" [selected]
                    - option "10 / trang"
                    - option "15 / trang"
                    - option "25 / trang"
                    - option "50 / trang"
                - button "Trang trước" [disabled] [ref=e450]
                - button "Trang 1" [ref=e453] [cursor=pointer]: "1"
                - button "Trang 2" [ref=e454] [cursor=pointer]: "2"
                - button "Trang 3" [ref=e455] [cursor=pointer]: "3"
                - button "Trang 4" [ref=e456] [cursor=pointer]: "4"
                - button "Trang sau" [ref=e457] [cursor=pointer]
  - generic:
    - group "Thông báo tạm thời"
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import fs from 'node:fs/promises';
  3  | import path from 'node:path';
  4  | import {execFileSync} from 'node:child_process';
  5  | import {createHash} from 'node:crypto';
  6  | const evidence=path.resolve(process.env.QA_SHARED_EVIDENCE_DIR??'docs/quality/uiux-task-HN-NC-003/functional/shared-after');
  7  | for(const width of [1920,800])for(const theme of ['light','dark'])test(`F-NC-003-SHARED-${width}-${theme} actual app modal semantics, collision-safe mark-all feedback and contrast spot checks`,async({page},info)=>{
  8  |  const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree=execFileSync('git',['rev-parse','HEAD:src'],{encoding:'utf8'}).trim();
  9  |  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>errors.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));
  10 |  await page.setViewportSize({width,height:width===1920?1080:1280});await page.addInitScript(theme=>{localStorage.setItem('hn-wms.s00.language.v1','vi');localStorage.setItem('hn-wms.s00.theme.v1',theme);},theme);
  11 |  await page.goto('/#/preview/S01');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await expect(page.locator('.ov-result-count')).toBeVisible({timeout:90000});
  12 |  await page.locator('.hn-notifications').click();const d=page.locator('dialog[open]');await expect(d.locator('.hn-notification-item')).toHaveCount(6);await expect(d).toHaveAccessibleName(/Trung tâm thông báo/);await expect(d.getByRole('heading',{name:/Trung tâm thông báo/})).toBeVisible();await expect(d.getByRole('banner')).toHaveCount(0);await page.evaluate(()=>document.fonts.ready);
  13 |  const sampleContrast=()=>d.evaluate(dialog=>{
  14 |   const selectors=['.hn-global-modal__heading h2','.hn-global-modal__heading p','.hn-notification-heading-badge','.hn-notification-search input','.hn-notification-tabs button','.hn-notification-tabs button span','.hn-notification-mark-all','.hn-notification-item-copy strong','.hn-notification-item-copy>span','.hn-notification-item>time','.hn-notification-group h3','.hn-notification-detail-title','.hn-notification-category','.hn-notification-detail-body','.hn-notification-business-card dt','.hn-notification-business-card dd','.hn-notification-business-status','.hn-notification-primary','.hn-notification-toggle-read','.hn-notification-reading-notice','.hn-notification-list-footer'];
  15 |   const rgb=(value:string)=>{const n=value.match(/[\d.]+/g)?.map(Number);return n&&n.length>=3?[n[0],n[1],n[2],n[3]??1]:null;};
  16 |   const over=(f:number[],b:number[])=>{const a=f[3]+b[3]*(1-f[3]);return [...f.slice(0,3).map((v,i)=>(v*f[3]+b[i]*b[3]*(1-f[3]))/(a||1)),a];};
  17 |   const lum=(c:number[])=>{const l=c.slice(0,3).map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;});return .2126*l[0]+.7152*l[1]+.0722*l[2];};
  18 |   const records:any[]=[];
  19 |   for(const selector of selectors)for(const [index,element]of [...dialog.querySelectorAll<HTMLElement>(selector)].entries()){
  20 |    if(!element.getClientRects().length||getComputedStyle(element).visibility!=='visible')continue;
  21 |    for(const pseudo of selector==='.hn-notification-search input'?['::placeholder']:['']){
  22 |     const s=getComputedStyle(element,pseudo||null),layers:any[]=[],uncertainties:string[]=[];let node:HTMLElement|null=element,bg=[0,0,0,0],opacity=Number(s.opacity);
  23 |     while(node){const st=getComputedStyle(node),color=rgb(st.backgroundColor);layers.push({tag:node.tagName,class:node.className,color:st.backgroundColor,image:st.backgroundImage,opacity:st.opacity});
  24 |      if(st.backgroundImage!=='none')uncertainties.push('background-image');
  25 |      for(const p of ['::before','::after']){const ps=getComputedStyle(node,p);if(ps.content!=='none'&&ps.content!=='normal'&&ps.display!=='none'&&ps.visibility!=='hidden')uncertainties.push(`${node.className}${p}`);}
  26 |      if(color)bg=over(bg,color);if(bg[3]>=.999)break;node=node.parentElement;
  27 |     }
  28 |     for(let parent=element.parentElement;parent;parent=parent.parentElement)if(Number(getComputedStyle(parent).opacity)!==1)uncertainties.push('ancestor-opacity');
  29 |     if(bg[3]<.999)uncertainties.push('unresolved-opaque-background');const fg=rgb(s.color);if(!fg)uncertainties.push('unparsed-foreground');
  30 |     const effective=fg?over([fg[0],fg[1],fg[2],fg[3]*opacity],bg):null,ratio=effective?(Math.max(lum(effective),lum(bg))+.05)/(Math.min(lum(effective),lum(bg))+.05):null;
  31 |     const size=parseFloat(s.fontSize),weight=Number(s.fontWeight)||400,required=size>=24||(size>=18.6667&&weight>=700)?3:4.5;
  32 |     records.push({selector,index,pseudo,text:pseudo?element.getAttribute('placeholder'):element.textContent?.trim(),foreground:s.color,opacity,fontSize:s.fontSize,fontWeight:s.fontWeight,background:bg,effective,ratio,required,uncertainties,layers,status:uncertainties.length?'INCOMPLETE':ratio!==null&&ratio>=required?'PASS':'FAIL'});
  33 |    }
  34 |   }return records;
  35 |  });
  36 |  await fs.mkdir(evidence,{recursive:true});const contrast=(await sampleContrast()).map(r=>({...r,view:'initial-list/default-detail'}));for(let i=0;i<3;i++){await d.locator('.hn-notification-item').nth(i).click();await expect(d.locator('[data-notification-detail]')).toBeVisible();const status=d.locator('.hn-notification-business-status');if(await status.count())await status.first().scrollIntoViewIfNeeded();contrast.push(...(await sampleContrast()).map(r=>({...r,view:`detail-${i}`})));await page.screenshot({path:`${evidence}/${width}-${theme}-detail-${i}.png`});if(width===800)await d.getByRole('button',{name:'Quay lại danh sách',exact:true}).click();}
  37 |  const hashes=[];for(const file of ['src/notifications/notifications.css','src/shared/GlobalModal.tsx','src/toast/GlobalToastProvider.tsx'])hashes.push({file,sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex')});await fs.writeFile(`${evidence}/contrast-${width}-${theme}.json`,JSON.stringify({sha,tree,sourceAtSampling:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingSourceDiff:execFileSync('git',['diff','HEAD','--','src'],{encoding:'utf8'}),hashes,contrast},null,2));
  38 |  const group=page.getByRole('group',{name:'Thông báo tạm thời',exact:true,includeHidden:true});await expect(group).toHaveCount(1);
  39 |  await d.getByRole('button',{name:'Đánh dấu tất cả đã đọc',exact:true}).click();await expect(page.locator('.hn-notifications__count')).toHaveCount(0);
  40 |  await expect.poll(async()=>Number(await page.locator('.hn-global-toast-region').getAttribute('data-queued-count'))+await page.locator('.hn-global-toast').count()).toBe(1);await expect(d.getByRole('button',{name:'Đóng trung tâm thông báo',exact:true})).toBeEnabled();
  41 |  const beforeClose=await page.locator('.hn-global-toast-region').evaluate(e=>{const rect=(el:Element)=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const toast=[...e.querySelectorAll<HTMLElement>('.hn-global-toast')].filter(x=>x.getClientRects().length&&getComputedStyle(x).visibility!=='hidden');const controls=[...document.querySelectorAll<HTMLElement>('dialog[open] button,dialog[open] a,dialog[open] input')].filter(x=>!e.contains(x)&&x.getClientRects().length&&getComputedStyle(x).visibility!=='hidden');return {queued:e.getAttribute('data-queued-count'),suspended:e.getAttribute('data-suspended'),visibleToasts:toast.length,toastRects:toast.map(rect),controlRects:controls.map(rect),collisions:toast.flatMap(t=>controls.filter(c=>{const a=rect(t),b=rect(c);return a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;}).map(c=>c.getAttribute('aria-label')??c.textContent))};});expect(beforeClose.collisions).toEqual([]);
  42 |  await fs.mkdir(evidence,{recursive:true});await page.screenshot({path:`${evidence}/${width}-${theme}-modal-queued.png`});await page.keyboard.press('Escape');await expect(d).toHaveCount(0);await expect(page.locator('.hn-notifications')).toBeFocused();const status=group.getByRole('status');await expect(status).toBeVisible();await expect(status).toHaveAttribute('aria-atomic','true');await expect(status).toContainText('Thao tác thành công');
  43 |  const afterClose=await status.boundingBox();await page.screenshot({path:`${evidence}/${width}-${theme}-feedback.png`});await status.getByRole('button',{name:'Đóng thông báo',exact:true}).focus();await page.keyboard.press('Enter');await expect(group.getByRole('status')).toHaveCount(0);await expect(page.locator('#main-content')).toBeFocused();
  44 |  const otherOpener=page.locator('[data-overview-detail-opener]:visible:not(:disabled)').first();await expect(otherOpener).toBeVisible();const otherId=await otherOpener.getAttribute('data-overview-detail-opener');await otherOpener.click();const other=page.locator('dialog[open].ov-detail-modal');await expect(other).toHaveAccessibleName(/Chi tiết phiếu/);await expect(other.getByRole('heading',{name:/Chi tiết phiếu/})).toBeVisible();await expect(other.getByRole('banner')).toHaveCount(0);await expect(other.locator('[data-overview-detail-id]')).toHaveAttribute('data-overview-detail-id',otherId!);for(let i=0;i<16;i++){await page.keyboard.press(i<8?'Tab':'Shift+Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('dialog[open].ov-detail-modal'))).toBe(true);}await page.screenshot({path:`${evidence}/${width}-${theme}-s01-detail.png`});await page.keyboard.press('Escape');await expect(other).not.toBeVisible();await expect(otherOpener).toBeFocused();
  45 |  const sourceEnd={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree:execFileSync('git',['rev-parse','HEAD:src'],{encoding:'utf8'}).trim(),diff:execFileSync('git',['diff','HEAD','--','src'],{encoding:'utf8'})};
  46 |  const record={sha,tree,sourceEnd,profile:{width,theme},errors,beforeClose,afterClose,otherGlobalModalConsumer:{route:'#/preview/S01',component:'AcceptedRowDetail',recordId:otherId,titleFocusEscapeReturn:'PASS'},contrast,contrastScope:'Computed solid-background visible NC text spot checks, WCAG AA normal4.5/large3.0. Not comprehensive WCAG/contrast certification; pseudo/gradient uncertainties remain INCOMPLETE.'};await fs.writeFile(`${evidence}/${width}-${theme}.json`,JSON.stringify(record,null,2));await info.attach('shared-regression',{body:JSON.stringify(record),contentType:'application/json'});
> 47 |  expect(sourceEnd).toEqual({sha,tree,diff:''});expect(errors).toEqual([]);expect(contrast.filter(r=>r.status==='FAIL')).toEqual([]);
     |                                                                                                                         ^ Error: expect(received).toEqual(expected) // deep equality
  48 | });
  49 | 
```