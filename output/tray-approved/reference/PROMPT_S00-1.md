# S00#1 — TRIỂN KHAI UI/UX XẾP KHAY ĐÃ DUYỆT | HOA NAM WMS

Tôi duyệt bộ thiết kế gồm 26 ảnh riêng (13 màn/trạng thái × Desktop và Tablet dọc) trong ZIP đính kèm. S00#1 chủ trì, phối hợp S00#2 và các chat S phụ trách để triển khai giao diện Premium Enterprise WMS theo bộ này.

## 1. Phạm vi và phân công
- S00#1: khóa thông số UI chung, quản lý shared components, review visual, tích hợp, QA tổng và cập nhật Preview.
- S00#2: đối chiếu nghiệp vụ/API/RBAC, điều phối các màn, CRUD và trạng thái tương tác.
- Xác định đúng route, mã S, source, branch/worktree và ownership; không suy đoán mã S từ tên màn.
- Tối đa 3 tác vụ thực thi song song trên toàn dự án; không sửa chồng file.
- Triển khai trên Candidate riêng, giữ baseline/commit để rollback.

## 2. Đọc đủ 26 ảnh trước khi sửa
Các cặp ảnh được đánh số 01–13:
01 Hàng chờ; 02 Lệnh xếp khay; 03 Danh sách khay; 04 Lịch sử có dữ liệu;
05 Xác nhận tạo lệnh; 06 Tạo lệnh thành công; 07 Chi tiết lệnh đã xác nhận;
08 Lệnh nháp và validation; 09 Chi tiết khay; 10 Đang xác nhận;
11 Dữ liệu thay đổi; 12 Không có khay; 13 Không có quyền xem Lịch sử.

Lập bảng đối chiếu ảnh → route/component → state → owner → kiểm thử.
Không chỉ làm trang Default. Không ghép nhiều màn vào một ảnh nghiệm thu.
Nếu môi trường chat không nhận được ZIP/ảnh, ghi rõ thiếu đầu vào và yêu cầu chuyển đúng bộ; không tự nhận đã xem thiết kế.

## 3. Khóa thiết kế để triển khai nhất quán
Giữ bố cục và phân cấp của mẫu đã duyệt, nhận diện Hoa Nam, sidebar navy, header ocean blue, nền trung tính, typography rõ và mật độ phù hợp dữ liệu nghiệp vụ.

Các ảnh còn sai khác nhỏ về tab, header Dialog, icon và dữ liệu nền. S00#1 phải chuẩn hóa thành một bộ component/tokens chung trước khi nhân rộng:
- Một mẫu tab cho mỗi breakpoint, đồng nhất active/focus/disabled.
- Một mẫu header/body/footer Dialog; thống nhất nút đóng, vị trí CTA, radius và border.
- Kế thừa logo, icon và shell đã được duyệt trong hệ thống; không sao chép logo biến thể hoặc menu nền do ảnh minh họa sinh ra.
- Dùng spacing scale 8px; mốc triển khai: lề trang Desktop 32px, Tablet 24px; padding card/Dialog 24px; khoảng cách nhóm 16–24px; nhãn–trường 8px; vùng chạm Tablet tối thiểu 44×44 CSS px.
- Căn chung trục trái breadcrumb, tiêu đề, tab, filter và content; số căn phải, nhãn/chữ căn trái; header cột thẳng với dữ liệu.
- Dành chỗ cho helper/error; lỗi validation không đè trường hoặc đẩy CTA ra ngoài.
- Dialog giới hạn theo viewport, body cuộn khi cần, footer luôn tiếp cận được; không co chữ để nhét tất cả dữ liệu.
- Không tràn ngang toàn trang. Bảng rộng phải thích ứng có chủ đích; mã dài, tên hàng dài và bản dịch dài vẫn đọc được.
- Giữ filters, trang và vị trí cuộn khi đóng chi tiết; focus trap, trả focus, khóa cuộn nền và hỗ trợ bàn phím.

Ảnh dùng để duyệt giao diện, không phải bản đo CSS. Ghi rõ viewport CSS và DPR khi QA. Kiểm tra Desktop 1920×1080 và Tablet dọc với ảnh chụp mục tiêu 1600×2560; không mặc định 1600px là chiều rộng CSS của Tablet.

Chuẩn hóa chi tiết trong phạm vi mẫu đã duyệt được chủ động thực hiện. Thay đổi lớn về bố cục hoặc luồng nghiệp vụ phải trình bổ sung; các việc độc lập đã duyệt tiếp tục.

## 4. Dữ liệu và quy tắc nghiệp vụ
- Các danh sách Hàng chờ/Lệnh/Khay/Lịch sử và Chi tiết khay phải có bộ fixture 8–10 bản ghi, ưu tiên 9 bản ghi, để kiểm tra mật độ. Dialog một lệnh hiển thị đúng một lệnh.
- Dữ liệu fixture phải nhất quán giữa BOX, SKU, phiếu nhập, lệnh, khay và lịch sử. Bổ sung tên dài, mã dài và số lượng nhiều chữ số để kiểm tra bố cục.
- Cho phép dữ liệu mẫu trong Candidate/Preview; không đặt tiêu đề, badge hoặc banner “Dữ liệu mock/Dữ liệu demo” trong UI. Phân biệt fixture trong cấu hình/tài liệu QA; không ghi đè dữ liệu thật hoặc đổi mã thật chỉ để bỏ chữ demo.
- Không hard-code 9 bản ghi vào production; tìm kiếm, lọc, số lượng và phân trang phải theo nguồn dữ liệu thực tế.
- BOX chứa 1 SKU; khay có thể chứa nhiều BOX; xếp toàn bộ BOX, không thêm thao tác chia nhỏ số lượng.
- Tạo lệnh tạo trạng thái nháp, chưa thay đổi vị trí BOX hay tồn kho. Chọn khay ở bước xác nhận theo contract hiện hành.
- Xác nhận hợp lệ cập nhật vị trí/trạng thái theo contract, không làm tăng/giảm số lượng tồn.
- Phân biệt mã lệnh, mã BOX và phiếu nhập nguồn. Không dùng PN làm mã lệnh; mã XK trong ảnh chỉ là fixture, không tự thay quy tắc sinh mã của hệ thống.
- Phân biệt số lượng khi tạo và tồn hiện tại; tồn hiện tại lấy từ nguồn ledger/API có thẩm quyền.
- Chênh phiên bản BOX không tự động đồng nghĩa sai lệch tồn; xử lý conflict theo contract/API.
- Lệnh đã xác nhận chỉ có thao tác được contract cho phép. Không tự thêm Edit/Delete/Cancel hoặc đổi boundary Web/App vì thấy khoảng trống trên ảnh.

## 5. Lịch sử và phân quyền
- Có quyền: hiển thị lịch sử thật/fixture tương ứng, bộ lọc và kết quả theo Data Scope; không hiển thị “Chưa khả dụng”.
- Thiếu quyền: hiển thị riêng “Không có quyền truy cập”, giải thích tài khoản chưa có quyền xem lịch sử, có đường quay lại màn được phép.
- Bảo vệ cả route và API; không chỉ ẩn tab. Không để dữ liệu lịch sử hoặc số đếm bị lộ khi thiếu quyền.
- Phân biệt thiếu quyền, chưa có dữ liệu, không có kết quả lọc và lỗi tải. Không dùng cùng một màn khóa cho mọi trường hợp.
- Bộ lọc lịch sử tuân thủ contract ngày đã khóa: timezone Asia/Ho_Chi_Minh, không chọn tương lai, khoảng quá khứ tối đa 90 ngày.

## 6. Hoàn thiện tương tác và state
Thực thi đầy đủ tạo lệnh → kết quả nháp → xem lệnh → chọn khay → xác nhận → cập nhật danh sách/chi tiết/lịch sử.
- Thiếu khay đích: lỗi tại trường, giữ dữ liệu và focus tới trường lỗi.
- Đang gửi: khóa submit trùng, phản hồi rõ; quản lý đóng Dialog an toàn theo contract.
- Conflict: giữ ngữ cảnh, đọc lại dữ liệu trước khi xác nhận lại.
- Không có khay: giải thích rõ, cho đọc lại danh sách; không cho xác nhận.
- Timeout/kết quả chưa rõ: kiểm tra trạng thái trước khi thử lại, tránh tạo lệnh hoặc xác nhận hai lần.
- Bổ sung Loading/Empty/No result/Load error/Session expired theo component chung nếu áp dụng.
- Bảo toàn Global Toast và behavior đã khóa; không để thông báo che CTA/Dialog.

## 7. Gate nghiệm thu bắt buộc
- Build/typecheck và kiểm thử phù hợp phải PASS, nhưng chưa đủ để hoàn tất.
- Chụp riêng 26 ảnh kết quả, cùng dữ liệu/ngôn ngữ/theme/viewport với mẫu tương ứng; kèm so sánh và giải thích sai khác do chuẩn hóa.
- Đo computed styles/bounding boxes để chứng minh margin/padding, kích thước control, overflow và trục căn; không kết luận chỉ bằng mắt.
- Kiểm tra VI/EN/zh-CN, Light/Dark, Desktop/Tablet; chữ dài và validation không vỡ bố cục.
- Functional regression: tạo, xem, chọn khay, xác nhận, reload, filter, paging, lịch sử; không double-submit, không biến động tồn sai.
- Kiểm thử quyền có/không, Data Scope, truy cập route trực tiếp, refresh, focus và scroll.
- Kiểm tra các màn khác dùng shared components; chủ động sửa lỗi hồi quy trong phạm vi đã duyệt rồi retest.
- Báo từng mục PASS/FAIL/BLOCKED bằng bằng chứng; không báo “hoàn tất” khi còn lỗi che dữ liệu, CTA không thao tác được hoặc sai nghiệp vụ.

## 8. Cập nhật Preview và bàn giao
Sau khi các gate đạt, cập nhật đúng domain Preview GPT/URL đích hiện hành đã thống nhất trong Release Contract. Xác minh deployment/site/branch trước khi cập nhật; không tự chọn URL cũ hoặc tạo domain thay thế.
Việc duyệt bộ này bao gồm quyền triển khai và cập nhật Preview trong phạm vi này, không cần hỏi lại các thao tác kỹ thuật thông thường. Không mở quyền dữ liệu nghiệp vụ ngoài RBAC.

Kiểm tra bản deploy bằng cửa sổ ẩn danh theo chính sách truy cập Preview, đăng nhập tài khoản QA nếu cần; mở trực tiếp các route, refresh và kiểm tra build đúng phiên bản.
Bàn giao link Preview, Build ID/commit, bảng 13 cặp màn/state, 26 ảnh kết quả, QA/measurement report, các thay đổi chuẩn hóa, lỗi còn tồn tại nếu có và phương án rollback.

Bắt đầu bằng đọc đủ ảnh và lập mapping; sau đó triển khai đến khi đủ bằng chứng nghiệm thu. Nếu bị chặn, nêu blocker cụ thể và tiếp tục phần độc lập được phép.
