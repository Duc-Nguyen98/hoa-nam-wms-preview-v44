# Hoa Nam WMS — Preview v44

Bản bàn giao mã nguồn Preview v44 cho DEV và Test, kèm báo cáo đối chiếu Desktop/Tablet và ảnh toàn bộ luồng S01 → S12/S15.

## Xem trực tiếp trên web

- [Giao diện Preview](https://duc-nguyen98.github.io/hoa-nam-wms-preview-v44/)
- [Báo cáo giao diện Desktop/Tablet](https://duc-nguyen98.github.io/hoa-nam-wms-preview-v44/review/DOCUMENT_FLOW_VISUAL_COMPARISON.html)

GitHub Actions tự build và triển khai GitHub Pages khi có commit mới trên `main`. Có thể chạy lại bằng workflow **Deploy Preview to GitHub Pages** trong tab Actions.

## Chạy trên máy

Yêu cầu Node.js >=22.12.0 và npm.

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:5182/. Tài khoản Preview: **demo**, mật khẩu **HoaNamDemo@2026**. Đây là tài khoản mẫu trong mã nguồn Preview.

Báo cáo giao diện: http://127.0.0.1:5182/review/DOCUMENT_FLOW_VISUAL_COMPARISON.html

Cũng có thể mở trực tiếp [báo cáo HTML](public/review/DOCUMENT_FLOW_VISUAL_COMPARISON.html) sau khi clone; ảnh và dữ liệu kiểm tra đều nằm cùng repo.

## Kiểm tra và build

```sh
npm run typecheck
npm run build
npm run preview
```

Bản build ở `dist/`; preview build tại http://127.0.0.1:4182/. Repo gồm giao diện và dữ liệu mẫu phục vụ kiểm thử, không phải hệ thống backend production.

## Phạm vi bàn giao

- Source v44: `af8148d248048fa3a2319428774a38425fd76288`.
- Luồng nhập: S01 → PN-0005 → S12, 3 dòng hàng / 11 serial.
- Luồng xuất: S01 → PX-0004 → S15, 1 dòng hàng / 3 serial.
- [Kết quả chụp 4 luồng Desktop/Tablet](public/review/v44-document-flow-review-20261026/results.json).
- [Thông tin bản bàn giao](HANDOFF.json). Build mới có thêm tài liệu review nên hash có thể khác hash Preview đã phát hành.
- Không bao gồm thay đổi S09/S10/S22 và thông báo chưa phát hành sau v44.

## Làm việc với main

Sau khi clone repo, dùng `git pull origin main` để lấy bản mới. DEV nên tạo branch riêng cho thay đổi và mở pull request về `main`.
