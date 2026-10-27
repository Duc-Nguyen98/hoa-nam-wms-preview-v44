# Snapshot nguồn: Tổng quan vận hành

Nguồn: https://chatgpt.com/space/page_d79b0a4265688191a26d6bae9aeed838

Sequence ghi nhận: 3. Ngày đọc: 2026-10-08. Đây là bằng chứng lưu tại thời điểm biên soạn, không phải lệnh giao việc. Lịch sử không tự áp sang phiên bản mới. Các ảnh liên kết cần mở riêng; gói này không chứa byte ảnh.

---

**Owner đã tạm duyệt hướng thiết kế ngày 08/10/2026 lúc 00:53 (UTC+7).** Phiên bản Tổng quan vận hành ngày 08/10/2026 gồm 5 ảnh được giữ nguyên để đối chiếu. Chưa LOCKED toàn bộ state, chưa triển khai code. **Owner xác nhận tạm chốt lại bộ preview hiện hành lúc 03:36 (UTC+7), ngày 08/10/2026, cùng danh sách 5 màn trong thư viện chung.**

[Quay về thư viện preview chung](https://chatgpt.com/space/page_97ca61b8efdc81919ca71c765b4a87ed)

## Tổng quan vận hành đã tạm duyệt

Phiên bản Tổng quan ngày 08/10/2026: Desktop mở rộng, Desktop thu gọn, Tablet ngang, Tablet dọc và Drawer mở. Owner đã tạm duyệt bộ hình này; giữ nguyên các ảnh để đối chiếu.

### Desktop mở rộng

Bố cục Desktop mở rộng. Một route active; các nhóm menu giữ cấp bậc và trạng thái expanded riêng.

![Tổng quan vận hành — Desktop mở rộng — Bản đã tạm chốt 08/10/2026](library-file:fde1_bGliZmlsZV9hZ0V1R1UwSFA3aVVuQWU0ZHVOYnRB_FileDrive_e8cf24a699648191889e56633f866990)

### Desktop thu gọn

Bố cục Desktop thu gọn. Tổng quan active, Báo cáo hover có tooltip; nút mở menu có focus ring. Hình minh họa trạng thái, chưa xác minh tương tác.

![Tổng quan vận hành — Desktop thu gọn — Bản đã tạm chốt 08/10/2026](library-file:fde1_bGliZmlsZV91Vmw4X0ZXZEdJMFR5LVNNWWRxOF9n_FileDrive_e8cf24a699648191889e56633f866990)

### Tablet ngang

Tablet ngang dùng icon rail. Nội dung cuộn dọc tự nhiên; các hàng còn lại và phân trang ở dưới vùng chụp.

![Tổng quan vận hành — Tablet ngang — Bản đã tạm chốt 08/10/2026](library-file:fde1_bGliZmlsZV9sZTZqaTFLaDY1Y0taNVBCblZxai1B_FileDrive_e8cf24a699648191889e56633f866990)

### Tablet dọc

Tablet dọc dùng hamburger, KPI 2×2, bộ lọc xuống dòng. Bảng giữ thứ tự cột, cuộn ngang trong card; các cột phía phải nằm ngoài khung nhìn.

![Tổng quan vận hành — Tablet dọc — Bản đã tạm chốt 08/10/2026](library-file:fde1_bGliZmlsZV9yZ05lcmtULXY3MG9XcFQxaFZ2Ukhn_FileDrive_e8cf24a699648191889e56633f866990)

### Tablet dọc mở Drawer

Drawer phủ lên cùng nội dung và vị trí cuộn. Chỉ Tổng quan active; Nghiệp vụ expanded. Khi triển khai cần giữ focus trong Drawer, hỗ trợ Escape và trả focus về nút mở.

![Tổng quan vận hành — Tablet dọc · Drawer mở — Bản đã tạm chốt 08/10/2026](library-file:fde1_bGliZmlsZV9Na1lfMWJFeTUxbjMyNWx5eFVLSlFn_FileDrive_e8cf24a699648191889e56633f866990)

## Hướng thiết kế đã tạm duyệt

- Sidebar và Header navy phẳng; bỏ ảnh nền kho. Chỉ Tổng quan active, Nghiệp vụ chỉ expanded.

- Dùng nút thu gọn và mở Sidebar có biểu tượng rõ; trạng thái active, hover và focus phải phân biệt.

- Giữ một bộ control và bảng dữ liệu xuyên Desktop và Tablet; Tablet dọc cuộn ngang trong vùng bảng, không thu nhỏ chữ để nhét cột.

- Đề xuất một kỳ chứng từ chung cho KPI phiếu nhập, phiếu xuất, biểu đồ và bảng. Tìm kiếm, loại phiếu, trạng thái chỉ lọc bảng.

- Tồn kho hiện tại và hồ sơ bảo hành đang mở độc lập với kỳ chứng từ.

## Căn cứ dữ liệu

Dùng dữ liệu thiết kế có sẵn trong [ScannerHNApp](https://github.com/Duc-Nguyen98/ScannerHNApp): 16 phiếu nhập xuất trong tháng 09/2026, gồm 8 nhập và 8 xuất; 11 Đã ghi sổ và 5 Chờ xử lý trên Web. Có 4 hồ sơ bảo hành đang mở trong bộ dữ liệu. Đây là số liệu thiết kế, chưa chứng minh dữ liệu vận hành thật hoặc API Web.

Tổng tồn kho chưa có nguồn tổng hợp được xác nhận: hiển thị dấu — và Chưa có số liệu xác nhận; không sử dụng 12.480 từ ảnh cũ như số liệu đã kiểm chứng.

## Trạng thái duyệt

| Hạng mục | Trạng thái |
| --- | --- |
| Foundation | LOCKED theo Owner |
| Tổng quan vận hành ngày 08/10/2026 | Owner tạm duyệt visual lúc 00:53; xác nhận tạm chốt preview lúc 03:36 UTC+7 |
| Phạm vi ngày và định nghĩa KPI trên Web | Chưa khóa contract API |
| Contract API và RBAC Web | Chưa xác nhận từ nguồn Web |
| Triển khai code và runtime verification | Chưa thực hiện |

Sau mỗi lần Owner duyệt, cập nhật đúng trang này với phiên bản, phạm vi đã duyệt, ảnh chuẩn và phần còn mở. Không tự coi việc tạo preview là nghiệm thu và không tự chuyển sang màn tiếp theo.

## Thông số đối chiếu khi bàn giao

Ảnh trong bộ này là preview tạo sinh để duyệt hướng thị giác, chưa phải bản xuất cuối theo pixel. Kích thước ảnh hiện có: Desktop 1672×941; Tablet ngang 1586×992; Tablet dọc 992×1586. Không suy ngược CSS, mã màu hay font chính xác từ PNG. Các thông số dưới đây là mục tiêu đối chiếu; cần chuẩn hóa bản xuất và kiểm tra lại trước khi LOCKED.

| Thành phần | Chuẩn đối chiếu |
| --- | --- |
| Brand | Navy #0A3765 |
| Control và trang phân trang active | #004E74; không tím |
| Font | Public Sans |
| Sidebar Desktop | Expanded khoảng 248px; collapsed khoảng 68px |
| Drawer Tablet dọc | Khoảng 280px |
| Header | Desktop khoảng 72px; Tablet khoảng 64px |
| Control Tablet | Vùng bấm tối thiểu 44×44 CSS px |
| Bảng | Cùng thứ tự cột, sort, fixture và page size giữa các thiết bị |
| Tablet dọc | Bảng cuộn ngang trong card, không thu nhỏ toàn bảng, không tràn trang |
| Responsive Desktop | 1366–1920px trở lên; zoom không tự chuyển sang màn điện thoại |

Nút mở và thu gọn menu cần tên truy cập rõ ràng, tooltip và focus-visible. Nhóm cha dùng trạng thái mở rộng riêng; chỉ leaf hiện hành dùng active. Danh mục và Báo cáo giữ icon khác nhau.

## Định nghĩa dữ liệu đang đề xuất

**REQUIRES_OWNER_CONFIRMATION:** cơ chế ngày và định nghĩa KPI dưới đây là đề xuất cho Web, chưa phải contract API được khóa. Nhãn trạng thái và bản ghi được đối chiếu với Scanner; không suy từ fixture sang API, quyền hay quy tắc ghi sổ.

| Chỉ số hoặc phạm vi | Cách hiểu trong preview |
| --- | --- |
| Kỳ chứng từ | 01/09/2026–30/09/2026; dùng trường ngày của chứng từ trong bộ thiết kế |
| Phiếu nhập trong kỳ | 8 phiếu nhập trong kỳ, tính tất cả trạng thái có nguồn |
| Phiếu xuất trong kỳ | 8 phiếu xuất trong kỳ, tính tất cả trạng thái có nguồn |
| Tồn kho hiện tại | Chưa có tổng tồn được xác nhận; — khác với 0 |
| Bảo hành đang mở | 4 hồ sơ thuộc Đã tiếp nhận, Đang kiểm tra hoặc Chờ bàn giao; không lọc theo kỳ chứng từ |
| Tìm kiếm và lọc ở bảng | Chỉ ảnh hưởng bảng; không tự thay KPI hoặc biểu đồ |
| Số lượng trên dòng | Tổng quantity của các dòng phiếu trong fixture; không phải số lượt quét hoặc số SKU |
| Sort mặc định | Thời gian giảm dần; khi triển khai dùng aria-sort đúng cột và chiều |

Biểu đồ đếm phiếu, không biểu thị lượng tồn hoặc kết quả ghi sổ. Các nhóm trong ảnh có số liệu chuẩn như sau:

| Khoảng ngày tháng 09/2026 | Nhập kho | Xuất kho |
| --- | ---: | ---: |
| 01–07 | 1 | 1 |
| 08–14 | 1 | 1 |
| 15–21 | 3 | 3 |
| 22–30 | 3 | 3 |
| Tổng | 8 | 8 |

Nguồn đối chiếu đã đọc ngày 08/10/2026: [README Scanner](https://github.com/Duc-Nguyen98/ScannerHNApp/blob/main/README.md), [mô hình chứng từ](https://github.com/Duc-Nguyen98/ScannerHNApp/blob/main/docs/flows/documents/document-model.mjs), [fixture Tổng quan Scanner](https://github.com/Duc-Nguyen98/ScannerHNApp/blob/main/docs/flows/home/fixture-adapter.mjs), [hồ sơ bảo hành](https://github.com/Duc-Nguyen98/ScannerHNApp/blob/main/docs/flows/shared/warranty-cases.mjs).

Phiếu gửi từ Scanner lên Web chưa ghi sổ và chưa làm thay đổi tồn chỉ vì đã gửi. Giữ đúng nhãn Chờ xử lý trên Web hoặc Đã ghi sổ theo bản ghi. Không chuyển các thao tác camera, scan hoặc NFC vào Tổng quan Web.

## Quy tắc DataTable giữ xuyên dự án

Tìm kiếm, đổi bộ lọc hoặc đổi page size đưa bảng về trang 1. Đặt lại trả bộ lọc trong bảng về mặc định; đề xuất giữ kỳ chứng từ chung đang chọn. Bảng có tổng bản ghi, số dòng mỗi trang, trạng thái sort và phân trang. Dữ liệu mẫu hiện tại hiển thị 10/16 phiếu ở trang 1, trang 2 còn 6 phiếu.

Khi tải lại, giữ query, filter và ngữ cảnh hợp lệ; không trộn số liệu từ các lần đọc khác nhau hoặc hiển thị 0 thay dữ liệu chưa biết. Chưa gán endpoint, tên permission hay route mới.

## Phạm vi state và nghiệm thu còn lại

Đã có ảnh để review bố cục Default, Sidebar expanded/collapsed, minh họa hover/focus và Drawer mở. Đây chưa phải bộ state đầy đủ để LOCKED toàn bộ màn.

| State | Quy tắc cần giữ | Ảnh nghiệm thu |
| --- | --- | --- |
| Default | Các thiết bị dùng cùng dữ liệu và phạm vi | Owner tạm duyệt visual |
| Starting | Khởi tạo phiên và phạm vi trước khi hiện dữ liệu bảo vệ | Chưa dựng |
| Loading | Skeleton nhất quán; dữ liệu chưa biết không thành 0 | Chưa dựng |
| Empty | Phân biệt bảng không khớp bộ lọc và cả kỳ thật sự rỗng | Chưa dựng |
| Error | Giữ bộ lọc, thông báo tại vùng lỗi, thử lại đọc an toàn | Chưa dựng |
| Success | Chỉ xác nhận tải lại thành công sau kết quả đã xác minh | Chưa dựng |
| Permission denied | Không để lộ nội dung hoặc CTA không có quyền | Chưa dựng |
| Expired session | Gỡ nội dung bảo vệ, hướng dẫn đăng nhập lại | Chưa dựng |
| 500 System error | Thông báo lỗi hệ thống, không biến thành Empty | Chưa dựng |

Kiểm tra runtime chưa thực hiện: Desktop 1366/1920, Tablet ngang/dọc, zoom 125%/200%, keyboard/focus, vùng bấm 44px, overflow, sort/pagination và regression Global Shell. Quy tắc hiển thị điện thoại vẫn theo nội dung Owner đã nêu; không dùng chiều rộng cửa sổ đơn lẻ để nhận diện điện thoại.

Ảnh đã được xem trực quan trước khi đính kèm. Tham chiếu ảnh đã lưu và quyền đọc đã được xác nhận; bố cục trang duyệt trong trình duyệt chưa được kiểm tra trực quan.

## Nhật ký duyệt

| Ngày | Phạm vi | Kết quả |
| --- | --- | --- |
| 08/10/2026 | Tổng quan vận hành, 4 bố cục và Drawer | Tạo bản review |
| 08/10/2026 00:53 UTC+7 | Cùng 5 ảnh Tổng quan | Owner xác nhận: Tôi tạm thời chốt duyệt bản này |
| 08/10/2026 03:36 UTC+7 | Tổng quan vận hành · bộ 5 preview ngày 08/10/2026 | Owner tạm thời chốt preview cùng 5 màn đã liệt kê; giữ nguyên ảnh và phiên bản. Phạm vi là preview, chưa thay bước LOCKED |
| 08/10/2026 · Khôi phục liên kết ảnh | 5 ảnh Tổng quan trong bộ đã tạm chốt | Tham chiếu cũ không đọc được; khôi phục từ PNG gốc cùng phiên thiết kế, đối chiếu nội dung và biến thể cuối theo hồ sơ duyệt. Ảnh có trong website preview, không thiết kế lại |

Khi Owner duyệt, ghi đúng phiên bản, phạm vi được duyệt và ngày duyệt ở đây. Giữ lịch sử các bản đã duyệt; bản mới chưa duyệt không thay thế bản LOCKED. Chỉ cho phép dựng code sau bước xuất bộ thiết kế và khóa phiên bản theo quy trình đã thống nhất.

