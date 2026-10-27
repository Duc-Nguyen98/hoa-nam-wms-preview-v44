# Quyết định Owner — mục tiêu Web UI tĩnh

Thời điểm chỉ thị: **08/10/2026 16:38:10 UTC+7**.
Nguồn: tin nhắn Owner trong cuộc hội thoại đang xử lý.

Owner chọn:
> Dựng Web UI/UX tĩnh có tương tác theo thiết kế được Owner chốt, dùng dữ liệu mẫu đã đối chiếu và chuẩn bị cấu trúc bàn giao để DEV kết nối API về sau.

Owner yêu cầu:
> Tôi cần setup và khóa contract theo như này

## Phạm vi khóa của r2

- Target là static_interactive_ui; được viết code frontend cho preview riêng khi chạy SETUP/S01–S05.
- Dữ liệu nguồn qua fixture adapter; component/view model tách khỏi integration.
- Bản dựng là baseline để DEV nối API sau; không phải API đã tích hợp hoặc production-ready.
- Năm màn, phiên bản tham chiếu, shell, responsive, field/action có nguồn được bảo toàn.
- Không tự nâng quyết định này thành phê duyệt r03 Đại lý, mọi state/form, API/RBAC hay dữ liệu còn thiếu.
- Không tự chạy năm màn chỉ vì soạn lại bộ prompt.

Bản r1 trước đây mặc định REVIEW_P01_AND_CONTRACT và implementation_authorized=false nên chưa đáp ứng mục tiêu này.
R2 thay chế độ mặc định bằng STATIC_UI_IMPLEMENTATION và cấp quyền đúng phạm vi preview riêng. Các file lịch sử giữ nguyên làm nguồn, không điều khiển thực thi r2.

