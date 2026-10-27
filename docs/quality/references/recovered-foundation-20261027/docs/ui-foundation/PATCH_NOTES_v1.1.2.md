# HN_UI_SHARED_v1.1.2 — Header backdrop

`HN_UI_SHARED_v1.1.2+sha256.e2b9c3e08256` kế thừa v1.1.1. Sửa S00-HEADER-BACKDROP-001 tại s00-shell.css: lớp che/mờ riêng sau card header, gap16/8px, blur8px, fade4px; tôn trọng reduced-transparency và forced-colors. Card/controls giữ nguyên.

[Handoff](../../output/S00/HEADER_BACKDROP_FIX_2026-10-12/HANDOFF.md), [QA](../../output/S00/HEADER_BACKDROP_FIX_2026-10-12/QA_REPORT.md), manifest và lock xác định source được kiểm.16màn dùng GlobalShell kế thừa; Auth S07/S08 N/A. Màn mới dùng đúng shared, không override focus/blur riêng. Không copy CSS của server DEV4454.

Owner yêu cầu sửa lỗi; technical READY không thay duyệt visual, native zoom/DPR2/thiết bị thật và các giới hạn chưa kiểm vẫn giữ nguyên.
