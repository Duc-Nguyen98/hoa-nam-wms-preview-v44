# S00#1 — TRIỂN KHAI UI/UX TỒN KHO & ĐỐI SOÁT ĐÃ DUYỆT

Project: S00_Hoa_Nam_Web / Hoa Nam WMS
Module: Tồn kho & Đối soát → Quản lý Tra cứu tồn & Đối soát
Phê duyệt thiết kế: 29/10/2026
Đầu vào bắt buộc: 32 ảnh PNG trong ZIP này, IMAGE_INDEX.md và MANIFEST.csv.

Tôi xác nhận duyệt bộ 32 ảnh bản cuối: 16 màn/trạng thái × Desktop và Tablet dọc. S00#1 chủ trì phối hợp S00#2 và các chat S phụ trách, triển khai theo bộ này đến khi có bằng chứng nghiệm thu. Không dùng lại các ảnh trung gian ds01–ds11 hoặc bộ thiết kế khác để thay thế ngôn ngữ thiết kế đã chọn.

## 1. Đọc đầu vào, xác minh hiện trạng và phân công

- Đọc đủ 32 ảnh; tự tìm repository, branch, route, component, API và contract hiện hành. Tự mở ứng dụng, chụp hiện trạng và xác định luồng; không yêu cầu tôi chỉ selector hoặc chụp lại những gì có thể tự truy cập.
- Lập bảng: Ảnh → route/tab/component → dữ liệu/API → quyền/Data Scope → owner → test → bằng chứng. Số 01–16 trong tên ảnh là chỉ mục thiết kế, không phải mã S hoặc route đã xác minh.
- S00#1 phụ trách shell, Design System, shared components, visual fidelity, tích hợp, QA tổng và Preview. S00#2 phụ trách đối chiếu nghiệp vụ, adapter dữ liệu/API, RBAC/Data Scope và kiểm thử luồng. Tối đa 3 tác vụ thực thi đồng thời trên toàn dự án; tránh nhiều owner sửa cùng shared component.
- Làm trên Candidate/branch/worktree riêng phù hợp môi trường; ghi baseline commit, có rollback. Không ghi đè công việc đang có của người khác.
- Các màn bổ sung trong bộ ảnh là phương án giao diện đã duyệt; ảnh không chứng minh API, trường dữ liệu hoặc quyền đó đã tồn tại. Đối chiếu trước khi ánh xạ. Không tự tạo quy trình nghiệp vụ mới chỉ để khớp hình.
- Nếu backend chưa hỗ trợ, hoàn thiện phần UI độc lập bằng adapter/fixture trên Candidate; ghi rõ API BLOCKED, không báo INTEGRATED. Bảo toàn trường bắt buộc hiện có. Thay đổi lớn về nghiệp vụ hoặc bố cục phải trình bổ sung; phần độc lập đã duyệt tiếp tục thực hiện.

## 2. Phạm vi 16 màn/trạng thái

01 Tra cứu tồn kho.
02 Tổng quan tồn của SKU.
03 Phân bổ tồn theo BOX.
04 Chi tiết BOX.
05 Chi tiết khay.
06 Lịch sử biến động / Truy vết tồn.
07 Đối soát hiện tại theo SKU.
08 Chi tiết chênh lệch theo BOX.
09 Lịch sử đối soát.
10 Chi tiết kết quả đối soát đã lưu.
11 Loading.
12 Empty — phạm vi kho chưa có bản ghi.
13 No result — có truy vấn/bộ lọc nhưng không khớp.
14 Load error — lỗi tải có thể thử lại.
15 Forbidden — thiếu quyền xem lịch sử đối soát.
16 Not found — không tìm thấy BOX.

Các mục này có thể là trang, tab, Drawer hoặc component tái sử dụng theo kiến trúc hiện hành. Không bắt buộc tạo 16 route riêng. Trạng thái dùng chung phải áp dụng cho các màn liên quan khi thích hợp, không chỉ tạo một trang demo trạng thái. Bảo toàn Session expired và các state toàn hệ thống đã có dù không có ảnh riêng trong ZIP.

## 3. Bám hình thức đã duyệt và chuẩn hóa chi tiết

- Giữ phong cách bộ ảnh: navy, teal, nền sáng nhẹ, card trắng, bảng dữ liệu rõ ràng, Tablet dùng bố cục dễ đọc. Không tự thay bằng dashboard trang trí, KPI lớn hoặc style khác.
- Chuyển các hình thành shared components và tokens nhất quán. Dùng logo/asset Hoa Nam chính thức và Global Shell đang được khóa; không lấy các biến thể logo, ảnh sản phẩm minh họa, avatar hoặc tên người trong ảnh làm asset production bắt buộc.
- Ảnh sinh bằng AI còn sai khác nhỏ về icon, màu xanh Khớp, tên header, label, vị trí card và kiểu tab. Chuẩn hóa bằng Design System thay vì sao chép các sai khác này. Giữ cấu trúc và phân cấp thông tin đã duyệt; dùng tên nhãn nghiệp vụ chính xác từ contract.
- Màu kết quả thống nhất: Khớp xanh lá, Thiếu cam/amber, Thừa xanh dương. Chênh lệch âm có dấu −, dương có dấu +; đi kèm chữ/icon, không chỉ dựa màu. Badge và icon phải cùng nghĩa ở Desktop/Tablet, Light/Dark.
- Mốc spacing nếu contract chưa có giá trị tương ứng: lề trang Desktop 32 CSS px, Tablet 24; padding card 24; khoảng cách nhóm 16–24; nhãn–trường 8; vùng chạm Tablet tối thiểu 44×44 CSS px. Ghi rõ giá trị dùng cuối và lý do nếu khác mốc.
- Căn chung trục breadcrumb, tiêu đề, tab, filter và content. Số lượng căn phải, dùng chữ số cùng độ rộng. Không tràn chữ, che CTA, cắt footer hoặc cuộn ngang toàn trang. Không giảm font để nhét dữ liệu.
- Tablet dọc dùng header gọn và menu có thể mở/đóng; không giữ sidebar cố định chiếm chiều rộng. Thẻ/bảng phải giữ đủ nhãn, đơn vị và đối tượng. Phân trang tách khỏi bản ghi cuối; tất cả nút cần tiếp cận được.
- Tab/menu chọn đúng trang hiện tại. Lịch sử đối soát phải chọn đúng mục Lịch sử; không tô Tra cứu tồn khi đang xem lịch sử hoặc đối soát.
- Mã dài đọc được, sao chép nguyên vẹn. Nút xem có tên truy cập rõ; không chỉ icon không nhãn. Bàn phím/focus, contrast, zoom và screen reader có ngữ nghĩa phù hợp.
- Nếu tái sử dụng Dialog/Drawer, xử lý focus trap, Escape, trả focus, khóa scroll nền và chiều cao theo viewport. Đóng chi tiết giữ bộ lọc, trang và vị trí cuộn của danh sách.
- Bảo toàn Global Toast đã duyệt: top-right, entrance 350ms, display 3000ms, exit 300ms và progress bar; không tạo biến thể toast riêng cho module.

## 4. Luồng và quy tắc tồn kho

- Tra cứu SKU/tên hàng/BOX và lọc kho/vị trí theo khả năng API thực. Tìm kiếm, xóa lọc, sắp xếp nếu hỗ trợ, phân trang và nút xem phải hoạt động, không làm nút trang trí.
- Luồng tham chiếu: Tra cứu tồn → Tổng quan SKU / Phân bổ BOX / Lịch sử → Chi tiết BOX → Chi tiết khay; có điều hướng quay lại đúng ngữ cảnh.
- Phân biệt tồn thực tế, đã giữ và khả dụng theo định nghĩa backend; không tự thay công thức nếu contract có quy tắc khác. Fixture trong ảnh dùng khả dụng = tồn thực tế − đã giữ.
- BOX thuộc một SKU; khay có thể chứa nhiều BOX/SKU. Không gộp mã BOX, khay, SKU, vị trí và phiếu nguồn thành một khái niệm.
- Tổng SKU/BOX/vị trí/khay phải khớp phạm vi lọc và Data Scope. Không cộng số lượng khác đơn vị; số BOX/SKU là số đếm đối tượng, không phải tổng số lượng hàng.
- Mẫu HN-DRV-001 được phân bổ ở 9 vị trí, do đó danh sách ghi “9 vị trí”; mở chi tiết thấy đúng phân bổ. Không ghi một vị trí như thể đại diện toàn bộ 120 cái nếu dữ liệu thật phân bố nhiều nơi.
- Xếp khay giữ tính stock-neutral; confirm chỉ thay mapping theo contract. Không tạo Inventory Movement hoặc tăng/giảm tồn vì mở chi tiết, tải lại, xem lịch sử hay xếp khay.
- Lịch sử biến động hiển thị thời gian, chứng từ, BOX, nghiệp vụ, số lượng, tồn sau và người thực hiện theo dữ liệu thật. Sắp xếp đúng thời gian, liên kết chứng từ chỉ khi tồn tại và đủ quyền.

## 5. Đối soát và lịch sử

- Công thức fixture: chênh lệch = kiểm đếm − tồn hệ thống; 0 Khớp, âm Thiếu, dương Thừa. Dữ liệu thật theo định nghĩa được xác minh.
- Tách phạm vi toàn bộ các kho trong Data Scope với từng kho cụ thể. Bộ mẫu có HN01/HN02/HN03, nên Đối soát hiển thị “Tất cả kho” và kho tương ứng trên mỗi dòng; không gắn toàn bộ bộ mẫu vào HN01.
- Đối soát → chi tiết SKU → phân tích BOX giữ cùng mã đối soát, snapshot, scope và đơn vị. Tồn hệ thống là số liệu tại thời điểm so sánh; không lấy tồn live ghép với kiểm đếm cũ.
- Lịch sử → chi tiết kết quả đã lưu thể hiện rõ thời điểm; không âm thầm thay số liệu snapshot bằng dữ liệu hiện tại. Snapshot chỉ được đọc lại từ dữ liệu lưu có thật; không dựng lịch sử production giả.
- Root cause chưa có phải ghi “Chưa xác định”; không tự suy đoán thất thoát hoặc nguyên nhân lỗi từ chênh lệch.
- Đối soát không tự điều chỉnh tồn. Không tự thêm Tạo/Sửa/Xóa, duyệt, ghi nhận bù trừ, bắt đầu kiểm kê, xuất báo cáo hoặc in nếu contract/quyền hiện hành chưa cho phép. Bảo toàn thao tác hợp lệ đã có.
- Boundary Web là tra cứu, quản trị và theo dõi theo contract. Không đưa camera/NFC/scan-first hoặc thao tác hiện trường của Scanner vào Web.

## 6. State, quyền và ngày tháng

- Loading dùng skeleton, không hiện số 0 như kết quả tải xong. Khi refresh có dữ liệu cũ, thể hiện tình trạng tải phù hợp thay vì mất toàn bộ ngữ cảnh.
- Empty và No result tách biệt. Empty không dẫn tới thao tác nhập kho chưa được cấp quyền; No result giữ truy vấn và có cách xóa/đổi lọc.
- Load error không hiển thị “0 kết quả” hay ngày cập nhật thành công giả; có Thử lại. Nếu giữ dữ liệu cũ, đánh dấu cũ/không đầy đủ theo state contract.
- Forbidden chỉ dành cho tài khoản thiếu quyền; không thay thế màn chưa có dữ liệu, lỗi hoặc chức năng chưa được triển khai. Không lộ số đếm, snapshot hoặc dữ liệu nhạy cảm khi thiếu quyền.
- Not found dành cho đối tượng không tồn tại hoặc không còn truy xuất theo contract; xử lý dữ liệu/URL cũ và cách quay lại.
- Bảo vệ route và API, quan hệ liên kết và Data Scope. Kiểm thử truy cập route trực tiếp, đổi ID và đổi kho. Không chỉ ẩn nút/tab ở frontend.
- Lọc ngày lịch sử/đối soát không chọn tương lai và tối đa 90 ngày quá khứ nếu contract toàn hệ thống đã khóa quy tắc này; kiểm tra ngày bắt đầu ≤ kết thúc, timezone và biên ngày. Không áp dụng giới hạn này tùy tiện vào dữ liệu snapshot đã lưu hoặc trường nghiệp vụ khác.
- Hỗ trợ VI/EN/zh-CN và Light/Dark bằng hạ tầng toàn hệ thống; không thiếu key hoặc hard-code nhãn tiếng Việt. Ngày, số lượng và dấu phân tách theo locale.

## 7. Fixture và dữ liệu nhất quán

- Candidate/Preview được dùng fixture riêng, không ghi banner/tiêu đề “Mock” hoặc “Demo” trên UI. Báo cáo QA phải nêu rõ fixture hay API thật; không sửa mã dữ liệu thật để che nguồn demo.
- Danh sách và phân bổ mẫu có 9 bản ghi. Chi tiết BOX và khay KH-001 chỉ có một BOX theo quan hệ mẫu, không thêm 9 bản ghi giả vào đối tượng này. Production dùng phân trang/dữ liệu thực, không hard-code 9 dòng.
- Các ràng buộc fixture bắt buộc: Dây tín hiệu 1.200 − 200 = 1.000; HN-DRV-001 tổng 120 thực tế − 20 giữ = 100 khả dụng. BOX001–003 mỗi BOX 20/5/15; BOX004 10/5/5; BOX005–009 mỗi BOX 10/0/10.
- Đối soát DRV: 120 hệ thống, 118 kiểm đếm, −2; BOX001 20/18/−2, BOX002–003 mỗi BOX 20/20/0, BOX004–009 mỗi BOX 10/10/0. Tổng phải khớp 120/118/−2.
- 9 SKU trong mẫu đối soát gồm 3 Khớp, 3 Thiếu, 3 Thừa. Mã, tên, kho, đơn vị, ngày và quan hệ phải nhất quán giữa Desktop/Tablet và các màn.
- HN04 trống và từ khóa ZX-999 không có kết quả là tình huống kiểm thử riêng, không phải kết luận về dữ liệu thực.

## 8. Kiểm thử và bằng chứng nghiệm thu

- Ghi viewport CSS và DPR. Mục tiêu chính Desktop 1920×1080 CSS px DPR1; Tablet 800×1280 CSS px DPR2 cho ảnh 1600×2560. Kiểm thêm Tablet 768×1024 CSS px nếu thuộc thiết bị hỗ trợ.
- Ảnh tham chiếu có kích thước/tỷ lệ khác nhau; dùng kích thước gốc trong MANIFEST.csv. Không nhầm pixel ảnh với CSS px, không phóng ảnh thành screenshot nghiệm thu hoặc ép toàn UI thành bitmap. Có thể dùng đối chiếu đã chuẩn hóa tỷ lệ, nhưng phải ghi cách làm và không cắt bỏ vùng lỗi.
- Chụp 32 ảnh kết quả riêng tương ứng 32 mẫu, cùng fixture/ngôn ngữ/theme khi đối chiếu. Kèm trước–sau cho 4 màn nền. Ảnh phải từ ứng dụng thực chạy trên Candidate.
- Đo computed styles/bounding boxes cho gutter, padding, trục căn, chiều cao control/hàng, khoảng cách footer, overflow và vùng chạm. So trực quan typography, số lượng, badge, tab/menu và dữ liệu dài.
- Kiểm thử tìm kiếm, lọc, xóa lọc, phân trang, sao chép mã, xem chi tiết, back/refresh/deep link, truy vết và snapshot lịch sử. Kiểm tra hủy request cũ hoặc phản hồi lệch thứ tự khi đổi lọc nhanh theo kiến trúc ứng dụng.
- Kiểm thử quyền/Data Scope có quyền, thiếu quyền, khác kho, route/API trực tiếp; không ghi số liệu nghiệp vụ khi chỉ đọc.
- Kiểm đủ Loading, Empty, No result, Load error/retry, Forbidden, Not found, Session expired. Test label dài, mã dài, số lớn, bàn phím, focus, scroll và zoom.
- Kiểm VI/EN/zh-CN và Light/Dark; regression các màn dùng shared components và Toast. Sửa lỗi trong phạm vi đã duyệt rồi retest.
- Báo PASS/FAIL/BLOCKED có bằng chứng. Không coi build/typecheck hoặc screenshot trang Default là nghiệm thu; không khai API INTEGRATED khi dùng fixture. Không tuyên bố khớp 100% nếu chưa đo/so đầy đủ.

## 9. Preview và bàn giao

- Sau khi đạt gate áp dụng, cập nhật đúng Preview GPT hiện hành đã khóa trong Release Contract. URL được nhắc trong dự án: https://hoa-nam-wms-wave4-preview.ducnin1998.chatgpt.site/ — phải xác minh site/project/branch/domain hiện hành trước khi deploy; không suy từ URL cũ hoặc tạo domain thay thế.
- Phê duyệt này bao gồm triển khai và cập nhật Preview trong phạm vi thiết kế trên, không cần hỏi lại thao tác kỹ thuật thông thường. Không đổi production, quyền dữ liệu hoặc nghiệp vụ ngoài phạm vi. Gate còn FAIL/BLOCKED thì giữ Candidate và báo đúng blocker, không vượt gate.
- Xác minh public build bằng truy cập mới, mở trực tiếp route và refresh, dùng tài khoản QA phù hợp. So build ID/commit thực với bản vừa kiểm thử.
- Bàn giao link Preview, build ID/commit, bảng route/component, thay đổi chuẩn hóa, 32 ảnh kết quả, bằng chứng đo bố cục, báo cáo visual/functional/regression/RBAC/API, lỗi còn lại và cách rollback.

Bắt đầu bằng đọc đủ bộ ảnh, chụp hiện trạng và lập bảng ánh xạ; sau đó thực thi đến khi có đầy đủ bằng chứng nghiệm thu. Không dừng ở kế hoạch hoặc chỉ xử lý 4 trang Default.
