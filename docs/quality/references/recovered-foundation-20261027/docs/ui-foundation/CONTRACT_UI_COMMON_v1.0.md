> Cập nhật 12/10/2026: control R3 đã được Owner duyệt; xem [contract v1.1](CONTRACT_UI_COMMON_v1.1.md) và lock hiện hành. Phần nghiệp vụ/Foundation không bị thay thế tiếp tục giữ nguyên; lịch sử bên dưới được bảo toàn.

# HN_UI_SHARED_v1.0 — contract UI dùng chung

## Owner khóa contract S00–S06 — 10/10/2026

**OWNER_LOCKED_WITH_RECORDED_EXCLUSIONS**; quyết định `HN_UI_CONTRACT_LOCK_S00_S06_2026-10-10`. Khóa các quyết định đã thống nhất và baseline tích hợp **HN_UI_SHARED_v1.0.2+sha256.58aa9a6cb17f** (source-final2, manifest SHA256 **58aa9a6cb17f0e43cd75c1a79c703e4c90e16c8dfae1890b3c5d55471c8cfc30**). Tham chiếu `output/S00/INTEGRATED_UI_UX_REVIEW_2026-10-10/OWNER_CONTRACT_LOCK_2026-10-10/OWNER_DECISION.md` và OWNER_DECISION.json. Các màn tiếp theo kế thừa cùng component/token/layout/interaction đã chốt; S00 sở hữu shared, chủ S01–S06 giữ hồ sơ màn. Không hỏi lại cùng quyết định từng chat.

Giữ nguyên NOT_RUN, NOT_ASSERTED, N/A, OWNER_REVIEW_PENDING và các đề xuất chưa duyệt; khóa không chuyển chúng thành PASS hoặc nghiệm thu toàn bộ. Runtime/fixture/bundle giữ nguyên; chỉ bổ sung tài liệu ngoài manifest source đã khóa. Lượt này không chuẩn bị S07.

> Mốc đã kiểm hiện hành: **HN_UI_SHARED_v1.0.2+sha256.58aa9a6cb17f**, preview4270, source-final2 tại `output/S00/INTEGRATED_UI_UX_REVIEW_2026-10-10/`. Xem lock và HANDOFF để nhận đúng bản. Sáu màn có kết quả kỹ thuật riêng; visual vẫn chờ Owner duyệt. Bổ sung này chỉ cập nhật mốc bàn giao, không đổi nghiệp vụ hay các quyết định bên dưới.

Owner: S00 / Chat 1. Ngày quyết định: 10/10/2026. Đây là quy ước frontend preview, **không phải API/DTO/RBAC contract**. Trạng thái phát hành và bằng chứng có thẩm quyền nằm trong `UI_FOUNDATION_LOCK.json`. Chỉ READY sau khi kiểm nền đạt. Bản này nối tiếp `HN_SHARED_UI_2026_10_10_R1`, không setup lại Foundation hoặc xây lại S01–S06.

### Bổ sung quy trình shared và focus — patch v1.0.1, 10/10/2026

- S00 sở hữu sửa shared và bàn giao phiên bản. Chủ màn được phép đọc/ghi lỗi, lưu bằng chứng, cung cấp đường dẫn và đưa issue vào hồ sơ bàn giao S00 mà không xin Owner lại cho từng lỗi shared trong phạm vi đã giao.
- Nếu không chuyển trực tiếp giữa chat được, dùng issue trong project và trả đường dẫn. Chỉ ghi đã gửi/đã nhận khi có bằng chứng giao nhận; việc lưu hồ sơ không đồng nghĩa đã nhắn chat khác.
- Gộp các báo cáo cùng nguyên nhân dưới một issue S00, giữ liên kết báo cáo gốc. Trước kết luận phải tái hiện runtime và kiểm computed CSS/state. Mỗi màn chỉ đóng phần lỗi đã kiểm trực tiếp trên mốc source cụ thể; technical PASS không thay Owner visual approval.
- `FilterInput` có một control focusable: wrapper sở hữu vòng focus theo Foundation, input con không vẽ vòng thứ hai. Giữ màu `#004E74`, keyboard focus, semantic disabled/error và kích thước. Không dùng reset rộng hoặc outline toàn cục để che lỗi.
- Màn mới tái sử dụng component đã sửa và ca hồi quy `tests/browser/shared-focus.spec.ts`. Không tạo CSS focus riêng cho cùng loại control nếu chưa có ngoại lệ được chốt. Control độc lập và control ghép nhiều hành động giữ chỉ báo focus của chính chúng.
- Evidence và đối soát `S00-FOCUS-001`: `output/S00/SHARED_FOCUS_FIX_2026-10-10/`. Phạm vi patch chỉ focus shared và ảnh hưởng liên quan trên S01–S06; S04 datepicker N/A, API/form nghiệp vụ ngoài phạm vi. Bản patch chỉ READY khi lock và bằng chứng xác nhận.

## Nguồn và ưu tiên

1. Xác nhận của Owner trong phiên ngày 10/10/2026: mục A–F và bổ sung 1–7 giải quyết các câu hỏi S00/S01–S06. Những mục tương ứng trong hồ sơ cũ được thay bởi bản này.
2. `source-pack/HN_WMS_5_MAN_UI_TINH_r2_2026-10-08/02_CONTRACT_CHUNG_5_MAN.md`, prompt từng màn, source registry, fixture/design snapshot; S06 dùng seed và P01 r02 tại bộ bàn giao của màn.
3. Checkpoint R1 tại `output/S00/SHARED_INTERACTIONS_2026-10-10/`; shell/quick access đã đạt tiếp tục dùng. Các file lịch sử giữ nguyên.
4. [Vuexy Basic Select](https://demos.pixinvent.com/vuexy-vuejs-admin-template/demo-1/forms/select) và [Basic/Range date picker](https://demos.pixinvent.com/vuexy-vuejs-admin-template/demo-1/forms/date-time-picker) là tham chiếu trình bày/tương tác, không phải mã nguồn được sao chép. Basic Select/Basic đã đối chiếu trong R1; Range được đối chiếu runtime trong bản này. Xem `references/OBSERVATIONS.md` của bộ bàn giao.

## Quyền và phạm vi

### Bổ sung audit tích hợp v1.0.2, 10/10/2026

- S00 được Owner giao rà soát trực tiếp S01–S06; chỉ sửa shared trong preview cách ly. Root source đang chạy và các preview lịch sử giữ nguyên. Mốc release/bằng chứng mới tại `output/S00/INTEGRATED_UI_UX_REVIEW_2026-10-10/` và lock; không coi tài liệu tồn tại là đã đạt QA.
- Equivalent CatalogueToolbar/Pagination dùng chung cơ chế reveal focus sau native scroll: vòng focus2px control#004E74, offset3px, không cắt ở mép viewport/sticky header. FilterInput vẫn chỉ có vòng focus do wrapper sở hữu từv1.0.1. Không CSS focus riêng cho cùng control nếu chưa có ngoại lệ được Owner chốt.
- Chỉ reveal khi control còn trong scope, có box, còn được focus, focus-visible và không mở native picker/modal. Hủy callback khi unmount; không đổi selection, focus target, dữ liệu hay kích thước control.
- Sai lệch thuộc file màn được giao owner màn làm patch cách ly; S00 kiểm hash/tích hợp và retest trước khi đóng issue. Ghi issue/lưu ảnh/cung cấp đường dẫn/bàn giao nội bộ đã được phép; không hỏi lại Owner cho từng lỗi shared. Không tuyên bố đã gửi/đã nhận nếu chỉ lưu file.
- Màn mới tái sử dụng phiên bản focus này và kiểm Tab/Shift+Tab, native picker/Escape, Desktop/Tablet và zoom125/200. Technical QA, concept review theo nguồn truy cập được và Owner visual approval là ba kết luận riêng.
- Các khác biệt Premium S06 có hồ sơ được giữ; helper note12/13px hoặc font barcode chưa có quyết định mới không bị tự đổi bằng một thiết kế audit. Đối chiếu pixel ảnh gốc chỉ ghi PASS khi thực sự đọc được đúng ảnh.

- S00 là đầu mối duy nhất sửa component/token/config chung. S01–S06 sửa file màn của mình và tích hợp phiên bản đã bàn giao; không tạo bản sao component hoặc override CSS shared.
- Chỉ preview riêng, cùng React/Vite/TypeScript và dependency hiện có. Không API thật, production, field/role/workflow/nghiệp vụ mới.
- Không nâng duyệt visual hay đánh dấu sáu màn PASS bằng QA S00. Sau bàn giao đủ từng màn, S06 mới tổng hợp bằng chứng và đề xuất khóa cho màn sau.
- Màn mới kế thừa các mặc định này. Không mở lại câu hỏi đã chốt về search, page size, STT, mode ngày, tập fixture nhỏ hoặc quyền tạo QA60. Chỉ dừng phần liên quan khi có xung đột mới hoặc thiếu bàn giao thực sự.

## Foundation và component

- Giữ Public Sans, brand `#0A3765`, control/focus `#004E74`, token hiện hành, không tím. “Kho Hoa Nam” readonly.
- Shell/Header/Sidebar/Drawer/Footer, icon, button, input, BasicSelect/FilterSelect, DatePicker/DateRangePicker, DataTable/Pagination, Catalogue layout, dialog và feedback dùng cùng shared.
- Dialog hiện hành là native modal trong shell (tìm màn hình/Drawer); giữ focus/Escape/return focus. Không thêm form dialog vào nghiệp vụ chưa có nguồn.
- Bốn màn Danh mục S02–S05 cùng CatalogueHeader/Summary/ListHeader/Toolbar/table/pagination; khác field/nghiệp vụ theo nguồn. S01 được có bố cục nội dung riêng; S06 giữ nguồn riêng.
- BasicSelect có label trên ô, outline/chevron, option panel, keyboard native và fallback native. Cùng control dùng cho bộ lọc và số dòng/trang; minimum target 44px.
- `CatalogueToolbar` truyền `applyMode="immediate"`; không nút Áp dụng/draft label/draft dot. Default mới immediate khi không có `onSubmit`; caller legacy có callback submit giữ tương thích tới khi chủ màn tích hợp. Controller xử lý debounce, không đặt timer riêng trong UI.

## Ngày

- Basic chọn một ngày; Range chọn khoảng liên tục; Multiple chỉ khi màn đã có nghiệp vụ ngày rời rạc. Bản này chưa có màn yêu cầu Multiple nên không thêm runtime/field đó.
- Disabled Range chỉ áp dụng quy tắc khóa có nguồn; không dùng thay Range, không sao chép ngày khóa demo và không khóa vì thiếu fixture.
- Frontend hiển thị `dd/MM/yyyy`, timezone `Asia/Ho_Chi_Minh`, hai đầu khoảng được tính bao gồm. Chưa xác nhận ngày/múi giờ contract API.
- Click đầu chỉ là draft trong popup. Click thứ hai hợp lệ mới phát khoảng hoàn chỉnh; chọn ngược thứ tự được chuẩn hóa từ ngày sớm đến muộn. Escape/click ngoài hủy draft. Controlled value đổi hủy draft cũ.
- Adapter xác nhận coverage trước khi áp dụng. Thiếu nguồn giữ accepted query/kết quả, khôi phục control, báo: “Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ …”. Không false zero/Empty và không đặt kết quả cũ dưới nhãn kỳ mới. Empty chỉ cho truy vấn hợp lệ trên phạm vi đủ nguồn thực sự không khớp.
- S01 có nguồn tháng 09/2026; 16 phiếu có ngày hỗ trợ truy vấn bảng trên nguồn này. Tổng tháng không chứng minh mọi KPI/chart có coverage từng ngày. Chủ S01 kiểm nguồn từng vùng; không chia tổng tháng. QA S00 có wrapper coverage chỉ nhận toàn tháng để kiểm nhánh thiếu nguồn; đó không phải policy nghiệp vụ mới cho S01.

## Search và filter

- Chuỗi con, không phân biệt hoa/thường/dấu tiếng Việt, gộp khoảng trắng thừa, `đ/Đ → d`; chỉ chuẩn hóa khi so khớp, không sửa hiển thị. `qua nhiet` khớp `Quá nhiệt`.
- Chỉ các field khai báo; fallback mã/tên. Cấu hình thực thi tại `src/shared/screen-foundation.ts`: S01 number/actor; S02–S04 code/name; S05 code/name/market/area; S06 productName/productCode/sku.
- Debounce search 250ms ở controller; option hoặc khoảng hợp lệ áp dụng ngay và kết hợp search đang gõ mới nhất. Intent mới vô hiệu hóa phản hồi cũ ngay cả trước khi hết debounce và ngay cả khi adapter bỏ qua AbortSignal.
- Filter kết hợp AND. Reset về mặc định của vùng; vùng bảng S01 giữ kỳ dùng chung nếu đó là phạm vi reset đã chốt.
- Option ưu tiên danh mục có nguồn; fallback unique toàn bộ detail fixture của scenario, không lấy từ trang hiện tại hoặc kết quả đã lọc. Giữ giá trị/nhãn nguồn.
- Accepted model điều khiển bảng/count/STT/footer/nhãn kỳ. Intended query điều khiển nhập liệu; blocked/error phục hồi intended về accepted, không ghi đè model bằng kết quả lỗi.

## Table, sort, pagination

- Mặc định 10; chỉ 10/15/25/50. Pipeline: search/filter → sort toàn bộ tập kết quả → paginate.
- Đổi search/filter/sort/page size về trang 1. Chuyển riêng trang giữ điều kiện hiện tại.
- STT `(page−1) × pageSize + index + 1`, từ accepted page; không thay business ID/ordinal nguồn.
- Text dùng collator tiếng Việt; code numeric-natural (`A2 < A10`); number/date dùng giá trị thực. Missing cuối cả hai chiều; tie theo ID ổn định tăng dần, nếu không ID giữ thứ tự nguồn.
- Default sort S01 time desc; S06 updated desc; S02–S05 giữ source order khi chưa sort. Mọi mapping nằm trong screen config. S05 Nơi nhận→name; Thị trường/Khu vực→market; Liên hệ→contact.
- Cột gộp khác dùng trường chính: S02 mã lỗi→code; S03 sản phẩm→name; S04 SKU/sản phẩm→code; S06 sản phẩm→productName. Ngày label được chiếu sang giá trị ngày hợp lệ chỉ cho sort, không đổi dữ liệu hiển thị.
- STT/checkbox/action không sort. Header dùng button keyboard, chỉ báo chiều và `aria-sort`; DataTable không tự sort page đang hiển thị.

## Dữ liệu và tổng

| Màn | Detail mặc định đã đối chiếu | Summary giữ riêng |
| --- | ---: | --- |
| S01 | 16 phiếu tháng 09/2026 | Theo nguồn từng vùng; không suy kỳ nhỏ từ tổng tháng |
| S02 | 10 hồ sơ | 10 / 8 đang sử dụng / 2 ngừng sử dụng |
| S03 | 7 sản phẩm | 326 sản phẩm / 1.284 SKU |
| S04 | 7 SKU | 1.284 / 1.246 / 38 |
| S05 | 5 dòng | 27 và mốc 01/10; provenance 5 dòng vẫn PROPOSED_FIXTURE |
| S06 | 7 hồ sơ | 128 / 116 / 12 / 7 |

Các tập 5/7/10 đủ trong **phạm vi detail đã được Owner chọn**, không tuyên bố catalogue đầy đủ. `queryTable.source={scope:'detail',completeness:'complete',total:rows.length,aggregateTotal}` tách hai phạm vi. Không đổi provenance nguồn hoặc dùng aggregate làm list total. Chú thích ngắn nêu phạm vi; không badge kỹ thuật trong UI sản phẩm. Summary catalogue không đổi theo list filter. Không footer `1–7/1.284`.

QA60 chỉ DEV, schema/enum OverviewRow, 60 ID duy nhất, generator xác định/tái lập. Không source relationship, summary nguồn, UI sản phẩm hoặc fixture tham chiếu bị trộn QA. Adapter/controller/component interface giống nhau. Evidence reference và synthetic riêng; page size50/page2/STT51–60 chỉ là kiểm cơ chế với QA60.

## Bàn giao và nghiệm thu

Xem `INTEGRATION_GUIDE.md`, `UI_FOUNDATION_LOCK.json` và `output/S00/HN_UI_SHARED_v1.0_2026-10-10/{HANDOFF.md,QA_REPORT.md,CHECKPOINT.json}`. Source milestone được định danh bằng SHA-256 vì workspace không có Git. File shared/test/config và bundle có manifest, không restore snapshot đè source màn đang làm song song.

S00 xác nhận nền qua unit, browser runtime Desktop/Tablet, zoom125/200, focus/overflow/BasicSelect/Basic/Range/search/filter/sort/STT/page sizes và missing-source recovery. Mỗi màn vẫn phải tích hợp/kiểm riêng, xuất ảnh runtime và checkpoint riêng. Không coi lỗi ngoài phạm vi biến mất vì scoped typecheck đạt; báo riêng full-project status.
