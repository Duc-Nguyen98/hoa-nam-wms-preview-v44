# HN-S27-UIUX-005 — bàn giao S27 và Audit Event Detail

## Kết luận: PARTIAL — chưa đủ điều kiện nghiệm thu thiết kế/release

Đã truy cập ứng dụng thật trên ổ E, phát hiện và sửa lỗi đọc nhật ký P1, thực hiện các sửa UI đã được xác minh, chạy FIX→RETEST qua agent độc lập và xuất bốn bộ reference/BEFORE/AFTER/diff. Các kiểm thử đã chạy trong phạm vi local MOCK đạt kết quả bên dưới. **Không công bố pixel-perfect, production Audit Integrity hoặc ROLLOUT_READY.** Còn1P2 geometry, các design/integration gaps, hosted CI billing lock và public deployed SHA chưa xác minh.

## 1. Repository, route, component và source

| Mục | Kết quả đã xác minh |
|---|---|
|Checkout|`E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026`; không ghi ổ W|
|Branch / remote|DEV / GitHub Duc-Nguyen98/hoa-nam-wms-preview-v44; normal fast-forward storage only|
|Base|bde0e4292ae4a7db569c7a5d56bce0c7ffa8e703|
|Final source|**ebcf0d360e52bf2036c5a3c531563675ebf3580c**|
|Source / tests tree|4360e98244c6308d14de19d50301fb0945c231f6 /85450783eeadd34277b48bcc0ebd15bd36e3f8be|
|Source commits|cc030be →d80255b →ebcf0d3; earlier failed/intermediate evidence retained|
|Exact route|`#/preview/S27`; detail overlay belongs to selected exact event ID, not a separate route|
|Owning components|SystemAuditScreen.tsx→OperationalAudit.tsx; AuditDetail in OperationalDetail.tsx; audit-operational-binding.ts; system-audit.css|
|Shared mechanics|GlobalShell/GlobalModal/DataTable/DateRangePicker/Pagination/GlobalToastProvider and navigator.clipboard; shared source unchanged|
|PR / production|Không tạo PR mới, không merge main, không push Sites/origin hoặc deploy production|

Commit lưu báo cáo/evidence có thể mới hơn source commit, nhưng phải giữ nguyên source/tests trees bên trên; không gọi commit tài liệu là source đã được browser test.

## 2. Design authority và dữ liệu đối chiếu

User inputs9/10/11/12 là scoped approved artwork cho Desktop list/Tablet list/Desktop detail/Tablet detail. [Custody manifest](design/REFERENCE_MANIFEST.json) giữ SHA256 original/copy; không thay baseline. DESIGN_CONTRACT v1.2.0-recovery và Design Guardian scope rules áp dụng; shell/backdrop trong ảnh modal không thay shell đã khóa riêng. [Acceptance Matrix](DESIGN_ACCEPTANCE_MATRIX.md), [Authority Report](DESIGN_AUTHORITY_REPORT.md), [gaps](DESIGN_GAP_REPORT.md).

9/11=1672×941,10/12=992×1586 raster; **không tự suy ra CSS viewport/DPR**. Canonical QA1920×1080@1 và800×1280@2 là khai báo harness; native1672/992@1 diagnostic. Profile/source normalization, exact font/icon/palette/variant/tolerance chưa đủ authority để ký exact fidelity.

Ba tình huống được phân biệt:

- Reference mô tả3sự kiện ngày25Oct,2profile create+1scenario reset, actorpreview:ducquang, WEB/QA. ID trong ảnh không tồn tại trong source đang chạy; không tạo ID giả để trông giống ảnh.
- Normal app MOCK: fresh normal login/demo setup sinh62sự kiện thật của phiên demo ngày26Oct, gồm18subaudits theo lô. Current Vietnam today27Oct mặc định0là hợp lệ. Chọn26Oct bằng DatePicker thật→62; tìm profile-create→2; chọn đúng ID và so4raw IDs với canonical source/proof. Không hard-code62 vào runtime.
- Existing isolated QA_SYNTHETIC `tests/s27/harness.html` dùng auditFixture3records ngày25Oct; chính component sản phẩm, không fake DOM/UI. Dữ liệu thứ hai inbound.post, actor/IDs/stock/FK khác reference. Fixture gốc giữ nguyên; không giả đó là reference scenario đã khôi phục đầy đủ.

Audit dữ liệu tại local chứng minh source identity, quan hệ proof/stock/FK/version, actor/source/time và bất biến read model. Không chứng minh database production append-only hoặc RBAC thật. [Audit Integrity](AUDIT_INTEGRITY_REPORT.md), [RBAC](RBAC_REPORT.md), [scenario analysis](design/SCENARIO_SOURCE_ANALYSIS.md).

## 3. Ảnh, sai lệch và bản sửa

**[Mở4bộ ảnh BEFORE/AFTER/reference/overlay/diff và4ảnh ứng dụng thật](EVIDENCE_INDEX.md).** Root đã mở kiểm tra board Desktop modal và Tablet list cuối.

Normal BEFORE ready modal **BLOCKED/NOT_RUN** do P1projection: default25Oct0, chọn26Oct→integrity error. Ảnh/DOM/error trước sửa giữ nguyên; không dựng modal BEFORE bằng source đã sửa. Bộ bốn ready-state BEFORE bổ sung được chụp bằng browser trên actual components với QA3, khai báo riêng.

**11unique roots (1P1+9P2+1P3):10bounded repairs verified,1P2V07 open.** [Final Defect Register](DEFECT_REGISTER.md). Sửa quan hệ audit theo từng entity trong batch, bỏ preview date cố định, khôi phục note, chữ mã Tablet, border/divider,44px targets, footer/modal spacing, reload text-only, short tablet subtitle và label wrap không chồng dữ liệu.

Native diagnostic modal Desktop827→789px, Tablet1196/1197→1156/1157px. Desktop còn khoảng29px; không giảm44px targets để ép khớp. **Canonical comparisons còn khác đáng kể:** width-aligned height residuals listD−106.50/listT+323.20/modalD+28.93/modalT+60.75 CSSpx. Đây là số đo theo giả định profile, không phải tolerance được duyệt. Native near-match không thay thế canonical acceptance. Fonts/glyph/color/component variants và list density chưa được ký nhận; không chỉ dùng tổngpixel để báo PASS.

## 4. Kết quả kiểm thử và giới hạn

| Gate | Kết quả thực tế |
|---|---|
|Exact final quality:pr|PASS exit0: typecheck/contract/build/4putawaytests;577/577protected source hashes unchanged|
|Exact final independent Node|**24/24PASS**|
|Exact final affected800cards|**6/6actual locale/theme profiles PASS**;60cards/300fields,0label intersections,5fields/font preserved, correctsource/filter/detail/focus,0unexpected console/page errors|
|Modal/contrast d80255b|**24/24modal profiles PASS** (12REAL+12LONGsynthetic), **16contrast samples PASS**, minimum4.75884:1. Transferred to final by exact one-property card-label diff; not falsely called fresh rerun.|
|Full behavior cc030be|62/62exact details/reload/rawIDs/FK/stock,18batchsubaudits,8negative controls,7pages62unique,immutable source PASS;23fixtureflow checks PASS. Later business code unchanged; finalfocused actualsource checks rerun.|
|Shared/Notification/S01|23fixture cases+1current-date realS01 case PASS; original24-command suite23/24 obsolete-clock setup failure retained. No all-route regression claim.|
|Final visual checks|Fresh actual62 and QA3 canonical screenshots, Range/overflow/footer/trace/rawID checks PASS in tested scope; exact fidelity PARTIAL/BLOCKED, V07P2open|
|Module filter|BLOCKED_CONTRACT_GAP; no mapping was invented|
|Offline / realHTTP5xx / maintenance|NOT_RUN / NOT_RUN / BLOCKED; [13-state table](functional/STATE_COVERAGE.md)|
|Production API/RBAC/append-only|NOT_CONNECTED / NOT_RUN; scoped MOCK service/reader denials do not prove production roles|
|Full accessibility / physical devices|Full axe/screen reader/physical-device certification NOT_RUN; bounded contrast/keyboard/focus/targets/scroll tested|

See [Functional QA](FUNCTIONAL_QA_REPORT.md), [Visual QA](VISUAL_QA_REPORT.md), [Regression with exact transfer limits](REGRESSION_REPORT.md). Browser network changes, CSS hook/startup failures, wrong automation date/selector assumptions and intermediate alpha-color sample failures remain recorded. A historical Notification JSON overwrite is explicitly disclosed; its failure transcript is retained. No test suppression or baseline updates.

## 5. Files changed

Runtime4files only:

- `src/features/S27/OperationalAudit.tsx`
- `src/features/S27/audit-operational-binding.ts`
- `src/features/S27/audit-ui-copy.ts`
- `src/features/S27/system-audit.css`

Tests2files:

- `tests/s27-audit-integrity.test.ts`
- `tests/s27/copy-border-cascade.mjs`

Other577source files byte-identical, including schema, data providers/source fixture, GlobalShell/Modal, sharedcontrols, S01 and Notification. No rewrite of the Audit Log or business event mutation. Implementation chronology: [round1](IMPLEMENTATION_REPORT.md), [round2](implementation/round2/IMPLEMENTATION_REPORT.md), [round3](implementation/round3/IMPLEMENTATION_REPORT.md).

## 6. Actual agents and governance

| Role | Native target / actual deliverable |
|---|---|
|S00#1|/root; scope/serialized leases/integration/source commits/protected hash/local gates/final acceptance|
|S00#2|/root/s27_implementation; bounded fixes/tests/red→green receipts, no self-approved independentQA|
|S00#3|/root/s27_visual_qa; actual browser discovery/reference comparisons/Range metrics, detected actual-only border and800overlap|
|S00#4|/root/s27_functional_qa; independent actual source62/negativecontrols/browser/contrast/RBAC/immutability/transfer|
|S00#5|/root/s27_release_audit; authenticatedGitHub/CI/provenance/artifact integrity|
|S00#6|/root/s27_design_guardian; immutable reference custody, authority/matrix/gaps|

[Native dispatch/handoff trace](AGENT_EXECUTION_TRACE.md), [task packet](../../agent-handoffs/HN-S27-UIUX-005.md). No sidebar chat communication was assumed. GPT-6.1Terra unavailable in callable runtime; explicit supportedSol/high fallback (S5medium), complex integrity handled bySol. **ACTUAL_MODEL/ACTUAL_REASONING UNVERIFIED** without runtime telemetry; no MODEL_ROUTING_ACTIVE claim. File writes serialized, browser custody closed before each source lease; no shared/global source ownership conflict detected.

## 7. GitHub, CI và preview

GitHubDEV source independently verified at finalSHA. Main unchanged; no new PR, no production merge/deploy. **[Exact final CI run40511952910](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40511952910): BLOCKED_ENVIRONMENT.** Billing lock before runner, critical0steps, visual skipped0steps. Workflow also still has visual placeholder failure/required-check enforcement gap. Local PASS does not replace hosted CI.

**[Local built S27 preview](http://127.0.0.1:5288/#/preview/S27)**:16served files verified byte-for-byte against exact ebcf0d3 build receipt; [HTTP/source receipt](integration/ebcf0d3/local-preview-receipt.json), managed session3818. MOCK, normal login, select26Oct for current demo records; current-day empty is legitimate. Embedded historical SOURCE_PROVENANCE alone is not source attestation.

**[Canonical public URL](https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S27): deployed candidateSHA UNVERIFIED.** No public deployment performed by this task; historical manifest does not attest current HEAD. [Release audit](CI_RELEASE_REPORT.md).

## 8. Review and next gates

Review the complete [evidence index](EVIDENCE_INDEX.md) and open V07 against Design Authority. Recover exact source profile/DPR/font/icon/variant/tolerance before exact fidelity signoff; preserve44px accessibility requirement. Resolve module mapping and backend/permission/append-only/unsupported state contracts in their proper environment. Restore GitHub billing and wire/enforce real browser required checks, then test exact candidate. Candidate deployment requires release readiness and trusted HEAD provenance; production remains unapproved.

All owner assets and final reports are frozen before final integrity audit. The release audit receipt records actual decode/parse/hash counts; integrity success never means visual/functional/release acceptance. Source/evidence storage on E/GitHubDEV is complete only after coordinator verifies final remote commit and clean working tree in the handover. **No ROLLOUT_READY or full DONE declaration.**
