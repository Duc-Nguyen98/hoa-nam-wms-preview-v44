# HN-NC-UIUX-003 — Kết quả thực thi Notification Center

Ngày:27/10/2026. Điều phối:S00#1. **FINAL VERDICT:PARTIAL. RELEASE:BLOCKED. Không công bố DONE hoặc ROLLOUT_READY.**

## 1. Môi trường và màn hình đã tìm được

- Repository làm việc:`E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`, nhánh`DEV`.
- Source cuối:`830f83d48eac84c3e2467de7f41c388439cc7eb2`; src tree:`65ac25d235682469452f60d50664b3e6acb3a753`. Các commit evidence tiếp theo phải giữ nguyên tree này.
- Màn hình là modal toàn cục mở từ chuông trên S01/S15, không phải trang account notification settings. Capture dùng S15 để cùng ngữ cảnh ảnh mẫu: `#/preview/S15` → `.hn-notifications` → `dialog.hn-notification-center`.
- Owner:`src/notifications/PreviewNotificationCenter.tsx`; CSS:`src/notifications/notifications.css`; trigger:`src/shared/ShellHeader.tsx`.
- Preview cục bộ đã kiểm chứng và giữ chạy: [S15 + Notification Bell](http://127.0.0.1:5233/#/preview/S15), Vite session53084. Cần phiên đăng nhập test; không thay dữ liệu production.
- Môi trường kiểm thử:LOCAL_PREVIEW_MOCK/isolated fixture. REAL_API/STAGING/server RBAC/realtime chưa được chứng nhận.

## 2. Design Reference Version

Hai ảnh người dùng cung cấp ngày27/10 được đăng ký BL-NOTIFY-D/T; không tự đặt revisionFigma hoặc dùng actual làm baseline.

|Reference|Raster|SHA256|
|---|---|---|
|BL-NOTIFY-D /1.png|1774×887|fa1a5615926a3a15b4cdf72d3482f53f4755931f9b881f8f34874a35233ae22c|
|BL-NOTIFY-T /2.png|992×1586|65606c1c19e7124340cdf18f41d201b136be755059275dd2b777847b268569f4|

Bản lưu chuẩn:[Desktop](../references/hn-astra-20261027/1.png),[Tablet](../references/hn-astra-20261027/2.png). Hash giữ nguyên. Phạm vi ảnh chỉ Notification Center VI/light; Sidebar/Header riêng không bị thay thế. Nguồn CSS/DPR/export gốc chưa biết: native raster@1 là phép chuẩn hóa diagnostic được ghi rõ;800×1280@2 là profile an toàn bổ sung. Dark/EN/ZH được kiểm tra chức năng/reflow, không tự coi là pixel baseline đã duyệt.

## 3. Before / After / Overlay / Diff

|Profile|Actual trước sửa|Actual cuối|Overlay reference/actual|Visual diff|
|---|---|---|---|---|
|Desktop|[Before](visual/wall-clock/desktop-native-before.png)|[After](visual/after-830f83d-recovery-ignored-temp/desktop-native-after.png)|[Overlay](visual/after-830f83d-recovery-ignored-temp/desktop-native-overlay.png)|[Diff×3](visual/after-830f83d-recovery-ignored-temp/desktop-native-diff-x3.png)|
|Tablet|[Before](visual/wall-clock/tablet-native-before.png)|[After](visual/after-830f83d-recovery-ignored-temp/tablet-native-after.png)|[Overlay](visual/after-830f83d-recovery-ignored-temp/tablet-native-overlay.png)|[Diff×3](visual/after-830f83d-recovery-ignored-temp/tablet-native-diff-x3.png)|

Crop/modal/computed styles/close paint/bounding boxes/traces cùng namespace. Không resample hoặc sửa reference; shell được loại khỏi metric theo phạm vi đã khóa. Diff×3 chỉ khuếch đại để xem. Ngày/dữ liệu mẫu khác ảnh được giữ đúng dữ liệu test, không hard-code để ép diff.

Tablet MAE từ22.517 xuống10.617 rồi**8.503**; tỷ lệ pixel lệch>10 từ34.95% xuống**10.78%**. Desktop cuối9.540/13.38%, bố cục Desktop được giữ. Đây là số đo diagnostic, không phải ngưỡng nghiệm thu mới. Sai lệch trung bình của14anchor hình học từ11.018px xuống1.333px theo owner-local probe; QA độc lập xác nhận các điểm chính, vẫn ghi residual.

## 4. Defect và thay đổi

Canonical11findings theo ID của QA: **10đóng,1P3còn mở**; hiện không có P0/P1/P2 mở trong phạm vi lỗi đã xác minh. [Defect register](DEFECT_REGISTER.md) ghi nguồn, severity gốc, bản sửa và retest. Hai lỗi contrast được đếm riêng theo FQ04/FQ05; success chỉ được đo thực tế sau sửa, không tính thêm lỗi before chưa tái hiện.

Đã sửa vị trí modal/kích thước dấu đóng Tablet, khoảng tách unread, divider footer Desktop, toolbar/list/gutters/group/footer Tablet; semantics modal/toast, focus khi đóng toast, contrast placeholder/status. Giữ business logic, dữ liệu, global shell, font/glyph system và reference bytes.

**VQ06 còn P3:** iconY lệch tối đa5.625px so với raster estimate; không thấy mất nội dung, overlap, hit-target hoặc hỏng luồng trong kiểm tra đã chạy. DG giữ residual thay vì thêm offset theo record/state. Typography/glyph/tolerance còn DESIGN_GAP riêng; không tuyên bố pixel-perfect.

Runtime/test diff từ base7875281:3runtime files +2durable regression files,106insertions/11deletions:

- `src/notifications/notifications.css`
- `src/shared/GlobalModal.tsx`
- `src/toast/GlobalToastProvider.tsx`
- `tests/functional/shared-semantics.config.ts`
- `tests/functional/wave-ad/shared-semantics.spec.ts`

Sáu source commits:3ca0ef2 → e5ba486 →8e40b6a →e57f6ae →76059cc →830f83d. Không merge/deploy production.

## 5. Kết quả test thực tế

|Gate|Kết quả|Source/evidence|
|---|---|---|
|Typecheck/build/contract13states26references/4putaway tests|PASS|830f83d; [receipt](local-quality-pr-830f83d.json),[log](local-quality-pr-830f83d.log)|
|Functional browser baseline|36successful cases|76059cc:27main+4axe+4shared+1focused; [report](FUNCTIONAL_QA_REPORT.md)|
|Node/session/concurrency|24/24PASS|76059cc; raw TAP/receipts trong functional/run-final|
|Final impacted functional|4profile PASS|830f83d:992VI light/dark,900EN,801ZH; [delta retest](functional/FINAL_SOURCE_DELTA_RETEST.md)|
|Visual geometry/interaction|6profile successful|830f83d; [Visual QA](VISUAL_QA_REPORT.md);45final artifacts/6CRC-valid trace ZIP|
|Selection-only list stability|0px row delta|4final functional profiles; read-boundary1px compensation được ghi riêng|
|Default axe automated rules|4profilePASS/0violations|76059cc; full color-contrast vẫnINCOMPLETE do pseudo-content của shell|
|Scoped rendered text contrast|PASS|Placeholder5.851331,warning5.552797,reachable success6.030105:1; [review](functional/CONTRAST_REVIEW.md)|
|Approved whole-image fidelity|BLOCKED/PARTIAL|P3density + thiếu typography/icon/export/tolerance authority|
|Lint|NOT_CONFIGURED|Không có script lint trong project; không giả lậpPASS|
|REAL_API/serverRBAC/realtime/fullWCAG/screen-reader|NOT_RUN/NOT_CONNECTED|Không dùng mockPASS để chứng nhận integration|
|3clean stability / regression ngoài phạm vi|NOT_RUN|Giữ lỗi seed/setup lịch sử; không đóng bằng kết quả scope này|
|HostedCI/deployedSHA|BLOCKED/UNVERIFIED|[CI release report](CI_RELEASE_REPORT.md)|

**Không coi toàn bộ36/24đã chạy lại trên830f83d.** Delta760→830 chỉ CSSportrait; shared/business/colors/fonts giữ byte đã test. Bốn impacted runs gắn đúng SHA mới; các kết quả cũ giữ SHA gốc. [Regression report](REGRESSION_REPORT.md) giải thích ranh giới bằng chứng.

## 6. Agent đã thực thi thật

|Role|Native identifier|Deliverable|
|---|---|---|
|S00#1 Orchestrator|/root|Packet,leases,integration,gate ledger,final verdict|
|S00#2 Implementation|/root/implementation_nc|[Implementation report](IMPLEMENTATION_REPORT.md),6source commits,raw probes|
|S00#3 Visual QA|/root/visual_qa_nc|Actuals/reference/overlay/diff/geometry/traces|
|S00#4 Functional QA|/root/functional_qa_nc|Browser/Node/axe/focus/contrast/impacted regression|
|S00#5 GitHub/CI|/root/release_audit_nc|Actual GitHub push/CI/provenance/integrity receipts|
|S00#6 Design Guardian|/root/design_guardian_nc|[Authority/dispositions](DESIGN_GUARDIAN_REPORT.md)|

[Native trace](AGENT_TRACE.md) ghi giao/nhận và giới hạn tài nguyên thật. Không giả định các chat độc lập tự giao tiếp. Terra không khả dụng trong audit routing trước; fallback requestedSol/high được ghi lại. ACTUAL_MODEL/ACTUAL_REASONING không có telemetry xác minh:UNVERIFIED. Không công bố MODEL_ROUTING_ACTIVE hoặc toàn bộ kiến trúc releasePASS chỉ từ tên model trong prompt.

## 7. GitHub / Preview / Release

Source830f83d đã lưu trên GitHubDEV bằng fast-forward an toàn; [commit](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/commit/830f83d48eac84c3e2467de7f41c388439cc7eb2). Evidence-only commit theo sau giữ cùng src tree; hash cuối xem Git/receipt trong release/.

Exactsource [CI run40461961502](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40461961502) FAIL trước runner/0steps do accountbillinglock; visualjobskipped=NOT_RUN. Workflowbrowser/visual còn unconditionalfailureplaceholder; branchDEV quan sát protected:false/rulesetsrỗng, details401. Không tự thay billing/protection hoặc bypassgate. Không tạoPR cho scope này; PR#1 cũ thuộc CI-governance, không phải bằng chứng PR của bản sửa UI.

[Domain người dùng](https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S01) có HTTPresponse nhưng exactdeployedSHA chưa chứng minh được; build-info dùng historicalSOURCE_PROVENANCE. Không báo domain đã chứa bản sửa và không publish khi releasegate bị chặn. Local5233 là preview được đối chiếu với source của task.

## 8. Evidence integrity và các lượt thất bại

Reference/before/rawfailed evidence được giữ nguyên; final acceptedvisual namespace là `visual/after-830f83d-recovery-ignored-temp/`. Xem `visual/final-artifact-integrity-830f83d.json`, functional/EVIDENCE_MANIFEST.json và final integrity report của S00#5 dưới release/. Browser cache/aborted scratch không thuộc bằng chứng được chấp nhận hoặc Git.

ERR_NETWORK_CHANGED, ENOSPC lúc ghi trace và QA-only selectorZH sai tên setup được giữ riêng; chỉ targetedrecovery, không đổi assertionNotification/baseline để épPASS. Recovery chuyển TEMP/TMP của process sang ignoredEoutput, không thay globalconfig. Cleanup scratch bị automaticpolicyreview chặn nên không xóa; .gitignore loại cache khỏi staging. Không cần người dùng điều phối hoặc cấp phép lại cho việc kiểm tra repo.

Một lời báo owner-local về108candidate selectionjump đã được sửa sau khi đọc raw: before/Backbounds giống nhau, nên chỉ là candidate state-dependent bị supersede, không phải browserbugđã xác nhận. Uniform113 được QA độc lập kiểm tra. Khi read đổi border2→1, button112→113 giữ LI114px; không được nói mọi buttonbbox bất biến.

## 9. Điều kiện còn thiếu

1. Giữ VQ06 P3open và bổ sung nguồn font/icon/normalization cùng tiêu chí visualacceptance được duyệt để chốt fidelity.
2. Account owner giải quyết GitHubbilling; S00#5 nối browser/visual/a11y/overflow gate thật, provisionaxe và cấu hình requiredchecks theo quyền quản trị.
3. Trusted candidate→build→deploymentSHA rồi smoke đúng domain; chỉ deploy sau phê duyệt/gate phù hợp.
4. Kiểm thử backend/RBAC/realtime trên môi trường được cấp và xử lý các historicalblocker nếu mở rộng rollout.

**Kết luận:đã thực thi sửa và QA cục bộ có bằng chứng; toàn taskPARTIAL, releaseBLOCKED.**

## Final frozen integrity receipt

S00#5 checked344raw/supportfiles:186PNG decodevalid,99JSON parsevalid,34ZIP CRCvalid,25LOG/TAP hashes. Functional owner manifest224/224 and finalVisual45/45 independently match. No existing-file format errors were found. Interrupted/ENOSPC namespaces remain explicitly INCOMPLETE; ignored browser scratch is excluded. Evidence:release/final-artifact-integrity.json and CI_RELEASE_REPORT.md.
