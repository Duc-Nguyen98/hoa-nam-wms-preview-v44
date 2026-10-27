# S27 — ảnh và bằng chứng bàn giao

Task HN-S27-UIUX-005. BEFORE source `bde0e4292ae4a7db569c7a5d56bce0c7ffa8e703`; AFTER source **`ebcf0d360e52bf2036c5a3c531563675ebf3580c`**. Đây là browser capture trên ổ E, dữ liệu **MOCK**, không phải domain đã deploy đúng SHA.

## Bốn bộ đối chiếu có dữ liệu cố định

Ảnh BEFORE/AFTER dưới đây dùng **QA_SYNTHETIC có sẵn**, render chính OperationalAudit/AuditDetail và fixture3sự kiện ngày25Oct. Không giả là dữ liệu phiên thật hoặc đúng toàn bộ nội dung reference. Fixture thứ hai là inbound.post, khác reference; ID/actor/stock/FK cũng khác và được giữ nguyên. Chuẩn hóa theo chiều rộng đồng tỷ lệ, thêm khoảng trống canvas; không kéo giãn chiều cao để che sai lệch.

| State / reference | BEFORE | AFTER | Reference/Before/After | Overlay / visual diff |
|---|---|---|---|---|
| Desktop list / [9](design/references/9.png) |[Trước](visual/before-synthetic/desktop-list-full.png)|[Sau](visual/final-synthetic-ebcf0d3/desktop-list-full.png)|[So sánh](visual/final-review-ebcf0d3/desktop-list/reference-before-after.png)|[Overlay](visual/final-review-ebcf0d3/desktop-list/reference-after-overlay.png) / [Diff](visual/final-review-ebcf0d3/desktop-list/reference-after-diff-x3.png)|
| Tablet list / [10](design/references/10.png) |[Trước](visual/before-synthetic/tablet-list-full.png)|[Sau](visual/final-synthetic-tablet-retry-ebcf0d3/tablet-list-full.png)|[So sánh](visual/final-review-ebcf0d3/tablet-list/reference-before-after.png)|[Overlay](visual/final-review-ebcf0d3/tablet-list/reference-after-overlay.png) / [Diff](visual/final-review-ebcf0d3/tablet-list/reference-after-diff-x3.png)|
| Desktop modal / [11](design/references/11.png) |[Trước](visual/before-synthetic/desktop-modal.png)|[Sau](visual/final-synthetic-ebcf0d3/desktop-modal.png)|[So sánh](visual/final-review-ebcf0d3/desktop-modal/reference-before-after.png)|[Overlay](visual/final-review-ebcf0d3/desktop-modal/reference-after-overlay.png) / [Diff](visual/final-review-ebcf0d3/desktop-modal/reference-after-diff-x3.png)|
| Tablet modal / [12](design/references/12.png) |[Trước](visual/before-synthetic/tablet-modal.png)|[Sau](visual/final-synthetic-tablet-retry-ebcf0d3/tablet-modal.png)|[So sánh](visual/final-review-ebcf0d3/tablet-modal/reference-before-after.png)|[Overlay](visual/final-review-ebcf0d3/tablet-modal/reference-after-overlay.png) / [Diff](visual/final-review-ebcf0d3/tablet-modal/reference-after-diff-x3.png)|

Mỗi thư mục comparison còn có `before-after-diff-x3.png`, `before-after-overlay.png`, ảnh đã căn và reference-before diff. [Thông số căn chỉnh, SHA, residual](visual/final-review-ebcf0d3/registration.json).

## Ứng dụng thật của phiên demo — nguồn62sự kiện

| State | AFTER exact source ebcf0d3 |
|---|---|
| Desktop list |[Ảnh](visual/final-normal-ebcf0d3/desktop-list-full.png)|
| Tablet list |[Ảnh](visual/final-normal-ebcf0d3/tablet-list-full.png)|
| Desktop event detail |[Ảnh](visual/final-normal-ebcf0d3/desktop-modal.png)|
| Tablet event detail |[Ảnh](visual/final-normal-ebcf0d3/tablet-modal.png)|

Ngày26Oct được chọn bằng DatePicker thật; list62sự kiện, tìm `stock-profiles.create` có2kết quả, mở đúng ID và xác minh cả4mã với source/proof. [Receipt source/DOM/CSS/geometry](visual/final-normal-ebcf0d3/results.json). Raw IDs thay đổi giữa các browser context; không chép ID trong ảnh vào nguồn.

**Normal BEFORE ready modal: BLOCKED/NOT_RUN.** Trên base, mặc định25Oct hiển thị0hợp lệ; chọn26Oct thì projection lỗi integrity và không có opener. [Ảnh và receipt trạng thái trước sửa](visual/before-eventdate/results.json) giữ nguyên. Không tái dựng modal BEFORE bằng source đã sửa. Bốn ảnh fixture ở bảng trên là bằng chứng bổ sung, không thay thế sự thiếu hụt này.

## Kiểm thử, authority và release

- [Visual QA](VISUAL_QA_REPORT.md), [visual defects và lịch sử](VISUAL_DEFECT_REGISTER.md), [visual manifest](visual/FINAL_CAPTURE_MANIFEST.json).
- [Functional QA](FUNCTIONAL_QA_REPORT.md), [Audit Integrity](AUDIT_INTEGRITY_REPORT.md), [RBAC](RBAC_REPORT.md), [13 trạng thái](functional/STATE_COVERAGE.md).
- [Final transfer/custody](functional/ebcf0d3/FINAL_TRANSFER_RECEIPT.md), [functional manifest](functional/FINAL_EVIDENCE_MANIFEST.json).
- [Design Acceptance Matrix](DESIGN_ACCEPTANCE_MATRIX.md), [Design Authority](DESIGN_AUTHORITY_REPORT.md), [Design gaps](DESIGN_GAP_REPORT.md).
- [Defect register cuối](DEFECT_REGISTER.md), [Regression](REGRESSION_REPORT.md), [agent trace](AGENT_EXECUTION_TRACE.md), [CI/preview](CI_RELEASE_REPORT.md).
- [Exact final build/gates](integration/ebcf0d3/candidate-results.json), [local HTTP build receipt](integration/ebcf0d3/local-preview-receipt.json).
- [Báo cáo bàn giao](FINAL_REPORT.md). Local build: [S27](http://127.0.0.1:5288/#/preview/S27); không phải public deployment.

Canonical QA:1920×1080 CSS/DPR1 và800×1280 CSS/DPR2. Native1672/992 DPR1 là diagnostic, các ảnh d80255b không được đổi nhãn thành finalSHA. Màu/font/icon và CSS viewport/DPR gốc chưa đủ authority; bố cục canonical vẫn khác đáng kể. Không dùng board/diff để tự kết luận pixel-perfect PASS.
