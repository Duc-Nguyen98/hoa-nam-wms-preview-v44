# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: focus-repro.spec.ts >> F-NC-003-TOAST-FOCUS actual mark-all feedback dismiss restores visible focus after owning dialog closes
- Location: docs\quality\uiux-task-HN-NC-003\functional\focus-repro.spec.ts:6:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "main-content"
Received: ""
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
                  - button "PX-0010" [ref=e253] [cursor=pointer]
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
  5  | const evidence=path.resolve(process.env.QA_SHARED_EVIDENCE_DIR??'docs/quality/uiux-task-HN-NC-003/functional/focus-before');
  6  | test('F-NC-003-TOAST-FOCUS actual mark-all feedback dismiss restores visible focus after owning dialog closes',async({page},info)=>{
  7  |  const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8'}).trim();const start={sha:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD:src'),diff:git('diff','HEAD','--','src')};
  8  |  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>errors.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));await page.setViewportSize({width:1920,height:1080});await page.addInitScript(()=>{localStorage.setItem('hn-wms.s00.language.v1','vi');localStorage.setItem('hn-wms.s00.theme.v1','light');});
  9  |  await page.goto('/#/preview/S01');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await expect(page.locator('.ov-result-count')).toBeVisible({timeout:90000});await page.locator('.hn-notifications').click();const d=page.locator('dialog[open]');await expect(d.locator('.hn-notification-item')).toHaveCount(6);await d.getByRole('button',{name:'Đánh dấu tất cả đã đọc',exact:true}).click();await expect(page.locator('.hn-notifications__count')).toHaveCount(0);await page.keyboard.press('Escape');await expect(d).toHaveCount(0);await expect(page.locator('.hn-notifications')).toBeFocused();
  10 |  const close=page.getByRole('status').getByRole('button',{name:'Đóng thông báo',exact:true});await expect(close).toBeVisible();await close.focus();const before=await page.evaluate(()=>({active:{tag:document.activeElement?.tagName,id:document.activeElement?.id,class:document.activeElement?.className},origin:{connected:document.querySelector('.hn-notification-mark-all')?.isConnected,rects:document.querySelector('.hn-notification-mark-all')?.getClientRects().length},dialogOpen:document.querySelector('#hn-preview-notification-center')?.hasAttribute('open')}));
> 11 |  await fs.mkdir(evidence,{recursive:true});await page.screenshot({path:`${evidence}/toast-close-focused.png`});await page.keyboard.press('Enter');await expect(page.locator('.hn-global-toast')).toHaveCount(0);const after=await page.evaluate(()=>({active:{tag:document.activeElement?.tagName,id:document.activeElement?.id,class:document.activeElement?.className,connected:document.activeElement?.isConnected,rects:document.activeElement?.getClientRects().length},main:{exists:!!document.getElementById('main-content'),tabIndex:document.getElementById('main-content')?.tabIndex}}));await page.screenshot({path:`${evidence}/after-toast-dismiss.png`});const end={sha:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD:src'),diff:git('diff','HEAD','--','src')};const record={start,end,before,after,errors,environment:'LOCAL authenticated Preview mock; keyboard-only toast dismiss; fresh browser context',expected:'Visible #main-content fallback when the origin is hidden in closed dialog'};await fs.writeFile(`${evidence}/focus-repro.json`,JSON.stringify(record,null,2));await info.attach('focus-repro',{body:JSON.stringify(record),contentType:'application/json'});expect(start).toEqual(end);expect(end.diff).toBe('');expect(errors).toEqual([]);expect(after.active.id).toBe('main-content');
     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ^ Error: expect(received).toBe(expected) // Object.is equality
  12 | });
  13 | 
```