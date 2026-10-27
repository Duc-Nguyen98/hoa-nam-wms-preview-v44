# S01 / PX-0007 — ảnh trước, sau và đối chiếu

Task **HN-S01-UIUX-004**. Source AFTER: **e18305b1e3b09c4402317d507d7008967284341b**, src **edd34681bf20a5281188e9da49cdc91876a0845d**. Source BEFORE:06954a9. Đây là bằng chứng ứng dụng local trên ổ E với dữ liệu MOCK; không phải ảnh chụp domain đã deploy đúng SHA.

## Bốn trạng thái ứng dụng thật

Desktop1920×1080 CSS/DPR1; Tablet800×1280 CSS/DPR2. Đăng nhập test bình thường, mở đúng `p12-stock-PX-0007`. BEFORE dùng cấu hình cũ4/trang; AFTER khôi phục10/trang theo contract. Dữ liệu gốc giữ nguyên5phiếu chờ; không sửa thành3 để chụp ảnh. Ảnh full-page và modal scrolled có trong cùng thư mục capture.

| Trạng thái | BEFORE | AFTER e18305b | Thiết kế gốc |
|---|---|---|---|
| Dashboard Desktop |[Trước](visual/before/desktop-dashboard.png)|[Sau](visual/e18305b-normal/desktop-dashboard.png)|[3.png](visual/references/3.png)|
| Dashboard Tablet |[Trước](visual/before/tablet-dashboard.png)|[Sau](visual/e18305b-normal/tablet-dashboard.png)|[4.png](visual/references/4.png)|
| PX-0007 Desktop |[Trước](visual/before/desktop-px0007.png)|[Sau](visual/e18305b-normal/desktop-px0007.png)|[5.png](visual/references/5.png)|
| PX-0007 Tablet |[Trước](visual/before/tablet-px0007.png)|[Sau](visual/e18305b-normal/tablet-px0007.png)|[6.png](visual/references/6.png)|

## Bốn bộ đối chiếu thiết kế

Mỗi bộ có original, crop, actual, ảnh ghép, overlay và diff. Phép căn chỉnh giữ cùng tỷ lệ X/Y theo chiều rộng, loại phần shell/backdrop ngoài phạm vi. Viewport/DPR gốc và ngưỡng pixel được duyệt chưa có; không dùng số pixel khác nhau để tự kết luận PASS.

Dashboard dùng kịch bản riêng **QA_SYNTHETIC3/page4**, giữ16chứng từ/8nhập/8xuất/4bảo hành/stockUnknown và khai báo đúng hai trạng thái dữ liệu được giả lập. Modal dùng **SOURCE_FIXTURE5/page4** để bảo toàn ID, nguồn dữ liệu và CTA được xác minh. Hai kịch bản có receipt riêng; không giả provenance hoặc CTA cho kịch bản QA.

| Bộ | Actual dùng để so sánh | Reference / Actual đã căn | Overlay / Diff / Song song |
|---|---|---|---|
| Dashboard Desktop |[QA3](visual/e18305b-pending3/desktop-native-dashboard-full.png)|[Reference](visual/comparison-e18305b/dashboard-desktop-reference-crop.png) / [Actual](visual/comparison-e18305b/dashboard-desktop-actual-aligned.png)|[Overlay](visual/comparison-e18305b/dashboard-desktop-overlay.png) / [Diff](visual/comparison-e18305b/dashboard-desktop-diff-3x.png) / [Song song](visual/comparison-e18305b/dashboard-desktop-side-by-side.png)|
| Dashboard Tablet |[QA3](visual/e18305b-pending3/tablet-native-dashboard-full.png)|[Reference](visual/comparison-e18305b/dashboard-tablet-reference-crop.png) / [Actual](visual/comparison-e18305b/dashboard-tablet-actual-aligned.png)|[Overlay](visual/comparison-e18305b/dashboard-tablet-overlay.png) / [Diff](visual/comparison-e18305b/dashboard-tablet-diff-3x.png) / [Song song](visual/comparison-e18305b/dashboard-tablet-side-by-side.png)|
| PX-0007 Desktop |[SOURCE5](visual/e18305b-reference/desktop-native-px0007.png)|[Reference](visual/comparison-e18305b/px0007-desktop-reference-crop.png) / [Actual](visual/comparison-e18305b/px0007-desktop-actual-aligned.png)|[Overlay](visual/comparison-e18305b/px0007-desktop-overlay.png) / [Diff](visual/comparison-e18305b/px0007-desktop-diff-3x.png) / [Song song](visual/comparison-e18305b/px0007-desktop-side-by-side.png)|
| PX-0007 Tablet |[SOURCE5](visual/e18305b-reference/tablet-modal-native-px0007.png)|[Reference](visual/comparison-e18305b/px0007-tablet-reference-crop.png) / [Actual](visual/comparison-e18305b/px0007-tablet-actual-aligned.png)|[Overlay](visual/comparison-e18305b/px0007-tablet-overlay.png) / [Diff](visual/comparison-e18305b/px0007-tablet-diff-3x.png) / [Song song](visual/comparison-e18305b/px0007-tablet-side-by-side.png)|

## Báo cáo và bằng chứng máy

- [Visual QA](VISUAL_QA_REPORT.md), [Functional QA](FUNCTIONAL_QA_REPORT.md), [Regression](REGRESSION_REPORT.md).
- [Defects](DEFECT_REGISTER.md), [Design Acceptance Matrix](DESIGN_ACCEPTANCE_MATRIX.md), [Design gaps](DESIGN_GAP_REPORT.md).
- [Data scenario](DATA_SCENARIO.md), [Data consistency](DATA_CONSISTENCY_MATRIX.md), [Implementation](IMPLEMENTATION_REPORT.md).
- [Agent handoff trace](AGENT_TRACE.md), [GitHub/CI/preview](CI_RELEASE_REPORT.md).
- [Final measured geometry](visual/e18305b-measurements.json), [comparison transforms/scenarios](visual/comparison-e18305b/comparison-metadata.json), [frozen visual SHA256 manifest](visual/artifact-manifest.json).
- [Exact source local quality gate/build hash receipt](integration/e18305b/candidate-results.json), [command log](integration/e18305b/quality-pr.log).
- [Báo cáo bàn giao cuối](FINAL_REPORT.md), [frozen artifact integrity508file](release/final-frozen-integrity.json).
- [Local preview build e183](http://127.0.0.1:5284/#/preview/S01): local MOCK;16build-file hashes và HTTP index đã đối chiếu với build receipt. Không phải bản deploy domain công khai.

## Giới hạn nghiệm thu

Visual QA xác minh không overflow ngang, không chồng chữ ở các profile đã chạy, nút tối thiểu44px và modal cuộn tới ID/footer. Fidelity vẫn **FAIL / exact acceptance BLOCKED**: chiều cao crop sau căn lần lượt lệch+80px/+24px/+5px/+11px; typography/icon/palette và chuẩn normalization/tolerance còn thiếu. Không thay baseline để che sai lệch. Xem báo cáo cuối để phân biệt các gate local, CI và deploy.
