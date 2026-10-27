# CONTRACT KHÓA — Hoa Nam WMS, Web UI tĩnh có tương tác

**Contract ID:** HN_WEB_5_SCREEN_STATIC_UI_r2.0  
**Trạng thái:** LOCKED_FOR_STATIC_UI_RUN  
**Chỉ thị Owner:** 08/10/2026 16:38:10 UTC+7, lưu trong references/OWNER_STATIC_UI_DECISION_2026-10-08.md.

> Dựng Web UI/UX tĩnh có tương tác theo thiết kế được Owner chốt, dùng dữ liệu mẫu đã đối chiếu và chuẩn bị cấu trúc bàn giao để DEV kết nối API về sau.

## 1. Phạm vi đã khóa

Năm màn: S01 Tổng quan vận hành; S02 Danh mục bệnh/lỗi; S03 Danh mục sản phẩm; S04 Danh mục SKU; S05 Danh mục đại lý & nơi nhận.

| Hạng mục | Quyết định r2 |
| --- | --- |
| Target | static_interactive_ui |
| Mặc định khi chạy prompt màn | STATIC_UI_IMPLEMENTATION |
| Được viết code | Frontend/component/fixture adapter trong workspace preview riêng |
| Dữ liệu | Fixture có nguồn, qua adapter; không đặt record trong UI component |
| API nghiệp vụ thật | Chưa kết nối; binding chưa rõ giữ null |
| Hệ thống đang chạy | Không sửa Web, Scanner, auth, backend hoặc dữ liệu thật |
| Kết quả mỗi màn | Source chạy được, preview có tương tác, QA thực tế và handoff cho DEV |
| Cách chạy | Setup một lần; mỗi lượt một màn/state; auto_advance=false |
| Production | Không thuộc phạm vi; không tuyên bố production-ready |

Owner đã cho phép dựng preview frontend theo mục tiêu này. **Không giữ lệnh cấm mọi code của r1 và không xin lại quyền dựng preview riêng ở mỗi lượt.**
Quyền đó không tự trở thành phê duyệt API, RBAC, state/form mới hoặc toàn bộ thiết kế production.

Bản dùng để dựng:
- S01: Default 08/10, năm biến thể đã tạm chốt.
- S02/S03/S04: P01 REVIEW 08/10, năm biến thể đã tạm chốt.
- S05: **P01 r02**, năm biến thể đã tạm chốt. Gallery hiện hành r03 vẫn chờ review; mở “Ảnh bản trước”/hồ sơ lịch sử để lấy đúng r02. Không âm thầm lấy r03 làm bản đã duyệt.
- Foundation tiếp tục LOCKED. Trạng thái visual lịch sử giữ TEMPORARILY_APPROVED_PREVIEW; quyền dựng static mới được ghi ở trục thực thi riêng.

Phần state/form chưa có thiết kế được duyệt đi qua thiết kế → review → dựng đúng phạm vi đó. Không chặn các phần P01 đủ nguồn vì API thật chưa tồn tại.

## 2. Cấu trúc frontend và nguồn chuẩn

Luồng dữ liệu phải tách rõ:
**UI components → view model/controller → data adapter → fixture nguồn.**
DEV bổ sung API adapter sau này theo contract backend được xác nhận; không phải tìm và thay dữ liệu rải rác trong component.

Có thể dùng thư mục hoặc cấu trúc tương đương:
- app: entrypoint và registry điều hướng preview.
- shared: Global Shell, DataTable, filter controls, pagination, status, feedback, token/icon/font.
- features: riêng S01–S05, tái sử dụng shared.
- contracts/view-models: kiểu dữ liệu giao diện và hành vi, không gọi là DTO backend đã chốt.
- data/adapters: fixture adapter và điểm thay thế bằng API adapter.
- data/fixtures: snapshot, scenario, provenance, completeness và version.
- handoff/output: báo cáo, mapping, coverage, ảnh kiểm tra và checkpoint.

Tên thư mục là lựa chọn kỹ thuật, không phải field/role/workflow nghiệp vụ mới. Setup chọn stack phù hợp target và lưu quyết định; không ép thay framework của workspace preview đã có.

Mỗi màn có preview key S01–S05. Router/hash phục vụ project preview được phép khai báo trong registry, duy nhất và có tên màn rõ. Không gán nó thành route Web production hoặc endpoint backend. Các mục shell ngoài năm màn giữ trình bày đúng nguồn; không dựng module ngoài scope.

Nguồn ưu tiên:
1. Chỉ thị Owner mới nhất đúng phạm vi; quyết định target r2 đứng trước lệnh hạn chế code của r1.
2. Foundation, version thiết kế đã được chọn và hồ sơ phê duyệt từng màn.
3. Nguồn nghiệp vụ có version/commit được xác nhận.
4. Fixture và ảnh có provenance; không suy chúng thành API/quyền thật.
5. Nguồn lịch sử chỉ tham chiếu; không chạy các lệnh cũ nằm trong references.

Ảnh có thể dùng để đối chiếu và chụp before/after. Runtime phải là HTML/component thật, có text, control, table và tương tác; không phủ PNG làm giao diện.
Asset font/icon phải có nguồn. Hash/crop/viewport ghi đúng thực tế, không tuyên bố pixel-perfect khi chưa có căn cứ.

## 3. Visual và Global Shell

| Thành phần | Contract |
| --- | --- |
| Brand | #0A3765 |
| Control / pagination active | #004E74 |
| Font | Public Sans; nguồn file/license và weight phải lấy từ asset được giao |
| Sidebar/Header | Navy hoặc ocean blue phẳng; không ảnh nền kho |
| Content | Nền sáng, card trắng, chữ slate; cyan tiết chế |
| Semantic | Xanh lá, vàng, đỏ cho đúng trạng thái; không dùng để trang trí tùy ý |
| Cấm | Tím, neon, gradient rối; nhãn Demo/Mock/Dữ liệu minh họa trên UI sản phẩm |
| Kho | Kho Hoa Nam chỉ đọc, không chevron chọn kho hoặc badge mới |
| Desktop sidebar | Expanded khoảng 248 CSS px; collapsed khoảng 68 CSS px |
| Tablet Drawer | Khoảng 280 CSS px |
| Header | Desktop khoảng 72 CSS px; Tablet khoảng 64 CSS px |
| Touch target | Tối thiểu 44×44 CSS px trên Tablet |

Một Global Shell dùng chung. Chỉ một leaf active; group cha chỉ expanded. Active/hover/focus có dấu hiệu riêng. Nút mở lại sidebar có biểu tượng và tên truy cập rõ. Tooltip chỉ xuất hiện theo hover/focus, không mặc định bật ở trạng thái nghỉ; ảnh có tooltip phải ghi rõ trạng thái minh họa.

Drawer có scrim, nút đóng, focus trap, Escape và trả focus khi đóng trong đặc tả tương tác. Keyboard/tab order rõ. Giữ cùng nhãn/icon cho cùng chức năng, không dùng màu là dấu hiệu duy nhất.

Không suy CSS/token/font chính xác từ pixel PNG. Token chưa có nguồn như radius, shadow, spacing scale, glyph ID giữ chưa xác nhận. Menu mới trên r03 không tự trở thành baseline được duyệt của bốn màn trước; ghi delta shell cần chuẩn hóa chung, không tự sửa các ảnh cũ.

## 4. Responsive và điện thoại

- Desktop 1366–1920 px trở lên; có expanded/collapsed.
- Tablet ngang: icon rail, control tối thiểu 44 px.
- Tablet dọc: hamburger + Drawer; không rail cố định hoặc bottom navigation.
- Bảng cuộn ngang trong card khi cần, không gây overflow toàn trang. Có thể gộp cell theo hồ sơ màn nhưng không bỏ trường hoặc action.
- Không co toàn bộ Desktop hoặc giảm chữ để nhét bảng Tablet. Giữ cùng query, fixture, page và thứ tự dữ liệu giữa các thiết bị.
- Không dùng riêng viewport width để kết luận thiết bị là điện thoại. Desktop thu nhỏ/zoom 125% hoặc 200% không được rơi vào phone notice. Chiến lược nhận diện cần được đặc tả và kiểm sau, không tự chốt breakpoint mới.

Nội dung phone notice dùng chung login, deep link, toàn CMS:
- Tiêu đề: **Web quản trị chưa hỗ trợ trên điện thoại**
- Nội dung: **Trong phiên bản này, vui lòng sử dụng máy tính hoặc tablet để truy cập hệ thống Hoa Nam.**
- Nút: **Sao chép liên kết**

Tablet tiếp tục dùng giao diện Tablet. Màn thông báo này không phải CMS mobile.

Ảnh hiện có là preview tạo sinh, không phải export pixel cuối. Mục tiêu export đã ghi trong nguồn: Desktop 1920×1080; Tablet dọc 1600×2560, logical 800×1280 @2x. Kích thước PNG hiện có phải ghi thật. Không kéo giãn/upscale rồi gọi là đạt chuẩn. Kích thước xuất Tablet ngang và quy cách export bổ sung cần ghi rõ từ nguồn hoặc xác nhận, không tự đặt.

## 5. Contract dữ liệu và DataTable

Mỗi bảng có tìm kiếm, bộ lọc đúng nguồn, sort, reset, pagination, page size, tổng bản ghi và state Loading/Empty/Error/Permission. Không tự thêm filter để đủ checklist.

- Search/filter/page-size thay đổi → trang 1. Sort phải có direction rõ và `aria-sort` tương ứng. Chưa chốt sort key/default thì giữ unresolved trong binding; hình mũi tên không chứng minh runtime. Chỉ kiểm case có nguồn đủ theo mục 6.
- Reset theo scope từng màn. Không tự reset filter toàn cục khi nguồn chỉ nói bảng.
- Các option page size, search debounce/on-submit, match mode, timezone, null ordering, stable secondary sort chưa có nguồn thì chưa chốt.
- Số dòng đang thấy trong viewport khác page size. Dòng dưới fold/cuộn thân bảng vẫn cùng trang.
- Tách tổng toàn danh mục, tổng sau filter và số dòng trong viewport. Không suy tổng từ các dòng đang thấy.
- Tổng chưa biết dùng “—”/nội dung được nguồn quy định; khác với 0 thật. Mẫu số 0 không mặc định thành 0%.
- Không trộn dữ liệu giữa các lần tải. Lỗi vùng bảng không tự xóa thành Empty.
- Tên/mã/điện thoại/mã vạch là chuỗi trong fixture; không tự chuyển mã vạch thành ảnh scan hay làm mất số 0 đầu.

### Provenance của từng quyết định

Ghi một trong: CONFIRMED_DECISION, OBSERVED_PREVIEW, SOURCE_FIXTURE, PROPOSED_FIXTURE, UNKNOWN, CONFLICT. Đây là metadata hồ sơ, không phải badge UI.

Mục tiêu dữ liệu sát nghiệp vụ 99% là yêu cầu chất lượng, chưa là kết quả đạt. Cần mapping field/enum/action/relation/query với nguồn có version và xác nhận của Owner/BE. Báo mức đầy đủ của dữ liệu đang có; không gán tỷ lệ khớp khi chưa có tiêu chí và bộ đối chiếu.

## 6. Adapter, fixture và mức độ đầy đủ

### 6.1. Adapter là điểm nối kỹ thuật

Định nghĩa interface frontend để nhận query của màn và trả view model, tổng, pagination, trạng thái tải/lỗi, dữ liệu summary theo scope có nguồn.
Query key nội bộ, scenario key và provenance là metadata kỹ thuật, không phải enum/DTO/permission được backend chấp thuận.

- Component không biết URL API và không truy cập fixture trực tiếp.
- Fixture adapter có thể dùng Promise để mô phỏng contract bất đồng bộ; không thêm độ trễ giả vào luồng mặc định.
- Scenario Loading/Error/Denied… được điều khiển bằng harness phục vụ review nằm ngoài UI sản phẩm.
- API adapter chỉ là điểm mở rộng chưa cấu hình. Không tự viết endpoint/credential, fallback sang production hoặc gọi API thật.
- Không hard-code quyền “Super admin toàn quyền” thành permission thật.
- Fixture write chỉ được làm trong bộ nhớ khi đã có task form/state và contract đủ nguồn; refresh/reset scenario phải khôi phục fixture gốc. Không ghi dữ liệu mẫu vào storage sản phẩm hoặc backend.

### 6.2. Tương tác phải chạy thật trong phạm vi nguồn

Các hành vi shell, search/filter/reset/sort/page size/pagination có thể thực hiện bằng local state và fixture adapter. Click phải thay đúng UI; không chỉ gắn sự kiện rồi không có tác dụng.

Quyết định kỹ thuật thuần frontend được ghi trong IMPLEMENTATION_DECISIONS: quản lý focus, component composition, token plumbing, stable render keys, wiring scenario.
Các lựa chọn có thể làm đổi ý nghĩa dữ liệu như full enum, search semantics, summary scope, date boundaries, default sort hoặc mapping entity phải giữ nguồn hoặc REQUIRES_OWNER_CONFIRMATION. Có thể tạo phương án preview riêng có metadata PROPOSED khi Owner yêu cầu; không gọi đó là contract API đã khóa.

Chưa có form/detail đã duyệt thì chỉ dựng entry point đúng thiết kế và ghi blocker tương tác tương ứng; không tự tạo CRUD để làm nút “hoạt động”. Không báo hoàn tất toàn bộ interaction khi entry point chưa có flow.

### 6.3. Dữ liệu thiếu không được che giấu

Gói hiện có:
| Màn | Record chi tiết đã đóng gói | Tổng thiết kế |
| --- | ---: | ---: |
| Tổng quan | 0; có số tổng và chart | 16 phiếu |
| Bệnh/lỗi | 10 | 10 |
| Sản phẩm | 7 | 326 |
| SKU | 7 | 1.284 |
| Đại lý | 5 dòng đề xuất | 27 theo audit 01/10 |

Trước khi dựng màn, tìm record còn thiếu trong nguồn đã chỉ định, ghi version/commit. Không bịa dòng để đủ tổng hoặc lặp trang 1 khi bấm trang 2.
Tách các mức bằng chứng theo case:
- VISUAL_SNAPSHOT_ONLY: đủ đối chiếu ảnh/số tổng, chưa đủ dataset kiểm mọi truy vấn.
- INTERACTIVE_FIXTURE_VERIFIED: hành vi đã chạy trên fixture đủ cho case, kết quả đối chiếu được.
- BLOCKED_MISSING_FIXTURE: thiếu dữ liệu để kết luận case.

Không tính filteredTotal từ bảy record rồi nói đó là kết quả của toàn bộ 326/1.284. Không đổi footer/summary approved để che thiếu record.
Nếu trang/scenario chưa có fixture, adapter phải trả trạng thái thiếu nguồn có kiểu phân biệt trong harness/report, không trả success/empty giả. Không đưa thông báo kỹ thuật về fixture vào UI sản phẩm. Case này chưa được công bố là tương tác hoàn tất; phần đã có fixture vẫn được triển khai và kiểm.
Không tự vô hiệu hóa control hoặc đổi flow trên UI được duyệt để “xử lý” thiếu nguồn; ghi giới hạn ở báo cáo review, dừng đúng case bị ảnh hưởng.

Dữ liệu source fixture và dữ liệu hư cấu đề xuất phải phân biệt trong hồ sơ. “Khớp nghiệp vụ 99%” là mục tiêu chưa được nghiệm thu, không phải claim đi kèm dữ liệu mẫu.

## 7. State bắt buộc và phạm vi chạy

| State | Yêu cầu đặc tả |
| --- | --- |
| Default | Nội dung nhất quán, đúng phiên bản và scope dữ liệu |
| Starting | Khởi tạo/ngữ cảnh; không lộ dữ liệu bảo vệ trước kiểm tra phù hợp |
| Loading | Vùng loading/skeleton, chưa biết khác 0; nêu initial/refresh khi có nguồn |
| Empty | Phân biệt thực sự chưa có dữ liệu với không khớp tìm/lọc |
| Error | Giữ query hợp lệ, lỗi đúng vùng, retry đọc phù hợp |
| Success | Nêu sự kiện xác nhận và nguồn kết quả; không tự tạo ghi thành công |
| Permission denied | Không lộ dữ liệu hoặc CTA trái quyền; không tự đặt permission key |
| Expired session | Không tiếp tục hiện dữ liệu bảo vệ; xử lý theo contract session được giao |
| 500/System error | Không biến lỗi hệ thống thành Empty |

Tên trên là state UI, không phải enum trạng thái nghiệp vụ. Mọi màn giữ coverage cho đủ chín state; chỉ xử lý state được giao trong lượt hiện tại; state đã duyệt thì dựng và kiểm runtime, state chưa duyệt thì hoàn thiện thiết kế trước khi mở phạm vi code tương ứng. Tên P02–P20 trong nguồn phải đọc mapping gốc, không tự đánh số tương ứng chín state.

## 8. Giữ đúng phạm vi nghiệp vụ

Không thêm field, filter, status, role, permission, API hay workflow chưa có nguồn.
Sản phẩm dùng mô hình Sản phẩm gốc/SKU liên kết, không nhập sản phẩm App PV hoặc tồn theo đơn vị vật lý.
Không tự gán ID SKU sang sản phẩm chỉ vì tên giống nhau.
Danh mục bệnh/lỗi không có SKU/ảnh/priority/import/export/xóa/bulk action.
Đại lý giữ đủ chín field; recipientType=existing của Scanner không phải Loại nơi nhận Web.

Địa giới Web Tỉnh/Phường và Scanner Province/District có version cũ: BLOCKED_BY_SOURCE_CONFLICT cho form/mapping. Danh sách chuỗi địa chỉ vẫn dựng được.
Giữ camera, scan, NFC và vận hành hiện trường ở Scanner. Không sửa repo Scanner.

## 9. QA bắt buộc khi chạy prompt dựng màn

Bản static phải được chạy và kiểm, không chỉ sinh code hoặc ảnh:
- Khởi động/build theo lệnh thật của target; ghi kết quả và lỗi còn lại.
- So sánh render với đúng ảnh/revision từng bố cục; tách lỗi có trong PNG tham chiếu khỏi thay đổi runtime.
- Kiểm Desktop expanded/collapsed, Tablet ngang, Tablet dọc, Drawer; zoom Desktop 125%/200%.
- Keyboard, focus, tooltip, focus trap/Escape/return focus; hit target 44×44 CSS px, overflow của bảng và toàn trang.
- Search/filter/reset/sort/aria-sort/page-size/page-change dựa trên case có fixture đủ; search/filter/page size đưa về trang 1.
- Summary/chart/table cùng scope; thay query nhanh không để kết quả cũ ghi đè; chưa biết không đổi thành 0.
- Chín state chung giữ trong coverage. State chưa có thiết kế/fixture duyệt vẫn NOT_STARTED/BLOCKED đúng lý do; không tự tăng scope để đủ số.
- Regression Global Shell–Tổng quan–màn đang làm và các màn đã dựng trước đó.

Visual, behavior và integration tách riêng. PASS visual/behavior chỉ trong case có bằng chứng runtime.
Integration API thật mặc định NOT_RUN; fixture adapter test không là API integration PASS.
Nếu không mở được runtime hoặc ảnh chuẩn, ghi rõ hạng mục chưa kiểm, không khẳng định giống 100%.

Không viết test chỉ lặp implementation. Ưu tiên case có rủi ro thực: query/page reset, sort và aria-sort, stale response, source mismatch, keyboard/Drawer, phạm vi dữ liệu.

## 10. Bàn giao cho DEV kết nối API

Mỗi màn phải có:
1. Source frontend tái sử dụng, entrypoint và lệnh cài/chạy/build.
2. Preview chạy được hoặc hướng dẫn chạy đã kiểm; không dùng URL gallery ảnh để thay cho runtime.
3. Fixture adapter/scenario có version và provenance; không rải dữ liệu trong component.
4. UI_CONTRACT: fields, columns, filters, summary scope, query, actions, states, responsive.
5. API_MAPPING: UI field → ý nghĩa/nguồn → DTO/endpoint/permission xác nhận hoặc null + issue. Không điền endpoint giả cho đủ bảng.
6. API_ADAPTER_HANDOFF: interface frontend, điểm thay adapter, mapping/normalization, total/page/sort/error/status/unknown cần backend xác nhận.
7. QA report, screenshots thực tế nếu tạo được, source/asset manifest và danh sách case BLOCKED.
8. Checkpoint để tiếp tục đúng màn/state.

“Chuẩn bị để nối API” nghĩa là đã tách điểm tích hợp và mô tả phần cần mapping. Không có nghĩa backend có thể nối không cần thống nhất contract.

Khi được giao tích hợp API sau: giữ component đã review, triển khai API adapter theo contract backend, bỏ fixture khỏi đường chạy sản phẩm, xác minh DTO/enum/RBAC/query/error và chạy regression. Không làm phần này trong lượt dựng static.

## 11. Trạng thái khóa và kiểm soát phiên bản

LOCKED_FOR_STATIC_UI_RUN khóa mục tiêu và cách thực thi r2 theo chỉ thị Owner.
Design approval, business/API/RBAC confirmation, implementation coverage và runtime verification là các trục độc lập.
Không dùng quyết định target r2 để nâng r03 hoặc state/form mới thành đã được duyệt.

R2 thay:
- target_kind=design_contract → static_interactive_ui.
- Mặc định rà soát đặc tả → dựng source UI tĩnh có tương tác.
- Cấm code toàn cục → cho phép frontend preview riêng, vẫn giữ giới hạn production/API.
- Bàn giao chỉ tài liệu → source + runtime QA + fixture adapter + API mapping/handoff.
- Chọn bản hiện hành ở S05 → dựng r02 đã tạm chốt; r03 tiếp tục review.

Giữ lịch sử r1 và nguồn cũ; không sửa quyết định duyệt trước đây. Snapshot ghi “chưa dựng code” mô tả thời điểm chụp hồ sơ, không hủy quyền dựng static mới của r2.
Không tự push/deploy khi lượt chỉ setup/khóa contract. Khi Owner giao xuất bản preview, dùng target preview riêng và giữ nguồn ảnh/phiên bản; không ghi đè hệ thống đang chạy.

## 12. Dừng đúng phạm vi

Hoàn thành phần đủ nguồn, chặn đúng phần thiếu/xung đột. Không chặn UI static chỉ vì endpoint API chưa có.
Mỗi lượt bàn giao kết quả cụ thể, ghi checkpoint rồi dừng. Không tự chuyển màn/state và không tự nối API.

**Tại thời điểm phát hành gói r2:** contract được khóa cho static UI; chưa thực thi setup runtime, chưa dựng năm màn và chưa có kết quả QA ứng dụng mới.
