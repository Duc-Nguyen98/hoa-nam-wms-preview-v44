# HN_UI_SHARED_v1.1.1 — sửa UX sau R3

Ngày 12/10/2026. Kế thừa HN_UI_SHARED_v1.1.0 và quyết định Owner duyệt control R3. Phạm vi frontend preview; các quyết định nghiệp vụ không đổi. Kết quả kiểm, source/shared/bundle và trạng thái phát hành cuối nằm trong HANDOFF, CHECKPOINT và manifest của gói POST_APPROVAL_UX_AUDIT_2026-10-12.

## Component dùng chung

- Button `aria-disabled=true` khi không loading có cùng màu trạng thái bất khả dụng với `disabled`, không đổi kích thước hoặc phản hồi hover/active như nút khả dụng.
- Giữ focus bàn phím, vùng chạm 44×44, callback giải thích giới hạn và guard nghiệp vụ. CSS không chặn sự kiện. Caller tiếp tục chịu trách nhiệm kiểm điều kiện/chặn gửi lặp.
- Loading giữ cơ chế một spinner, vị trí/kích thước/focus; không làm mờ spinner theo quy tắc aria-disabled.

## Mẫu tương tác cách ly

- Focus trường lỗi và hành động xử lý kết quả phải được đưa vào vùng cuộn nhìn thấy của dialog; giữ nhãn/lỗi khi đủ chỗ. Trả focus về danh sách tiếp tục giữ vị trí cuộn.
- Khóa cuộn khi mở dialog phải giữ chiều rộng nền và hoàn trả style trước đó khi đóng/unmount.
- Kiểm tra kết quả dùng loading của request trong adapter mẫu; dành chỗ cho dòng phản hồi để tránh nhảy bố cục.
- Tiêu đề tab nhận diện phiên bản mẫu; không thêm badge kỹ thuật vào nội dung sản phẩm. Mẫu R2 cổng4416 vẫn là hồ sơ lịch sử, không phải bản hiện hành.

## Kế thừa và hồi quy

Màn dùng Button shared nhận cùng sửa trạng thái, không copy CSS riêng. Không mở CRUD/auth dựa vào mẫu form. Kiểm khi tới hai biên cuộn, guard chỉ giải thích, focus bàn phím, pending/duplicate, disabled và resize. Mẫu form phải kiểm Save tên trống khi thân dialog cuộn xuống, unknown/recheck, đóng/mở draft chưa rõ kết quả, dirty-exit, Escape chỉ đóng picker trước, vòng Tab và quay lại đúng ngữ cảnh. Kết quả harness không thay kết quả màn nghiệp vụ.

Giữ mọi NOT_RUN/BLOCKED đã bàn giao: zoom thật, DPR2, thiết bị cảm ứng thực, native-select fallback, hiệu năng từng thiết bị và workflow chưa đủ nguồn. Chỉ cập nhật khi có bằng chứng mới đúng phiên bản.
