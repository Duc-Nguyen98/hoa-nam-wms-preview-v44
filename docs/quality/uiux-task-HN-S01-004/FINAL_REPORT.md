# HN-S01-UIUX-004 — bàn giao S01 và PX-0007

## Kết luận: PARTIAL — chưa đạt gate Design Fidelity, chưa được release

Đã audit ứng dụng thật, sửa các lỗi được xác minh, chạy vòng FAIL→FIX→RETEST bằng native agents và bàn giao đủ4bộ BEFORE/AFTER/diff. Functional QA trong phạm vi local MOCK đạt yêu cầu đã kiểm thử. **Visual fidelity vẫn FAIL / exact acceptance BLOCKED**; CI và public preview chưa đủ điều kiện release. Không công bố DONE/PASS toàn màn hình, không merge hoặc deploy production.

## 1. Repository, route và phiên bản

| Mục | Giá trị đã xác minh |
|---|---|
| Checkout đang dùng |`E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026`|
| Branch |`DEV`; lưu source lên remote GitHub `Duc-Nguyen98/hoa-nam-wms-preview-v44` bằng normal fast-forward|
| Base / src tree |`06954a99885f7c9e808bf9a5556c7dd6c0d6b9a2` / `65ac25d235682469452f60d50664b3e6acb3a753`|
| Source cuối được QA |**`e18305b1e3b09c4402317d507d7008967284341b`**|
| Source tree cuối |**`edd34681bf20a5281188e9da49cdc91876a0845d`**|
| Tests / tests/s01 tree |`3a61cae4bffcbda3f9e614eaaa02a38e637f3e64` / `6155c0a2cea64a5df6c52e08fc46681e92f3328e`|
| Route |`#/preview/S01`|
| Modal được mở |Overlay của S01, exact ID **`p12-stock-PX-0007`**, được tìm bằng ID và xác nhận trong DOM; không mặc định dòng đầu|
| Commits source |`60b76b9` → `f56e25c` → `e18305b`; failed candidate60b được giữ nguyên bằng chứng|
| PR của task |Không tạo; chỉ lưu source/evidence DEV theo quyền đã có, không merge main/production. Draft PR cũ không phải PR nghiệm thu task này.|

Commit chứa bộ báo cáo/evidence có thể mới hơn source commit vì không thay đổi runtime/test tree. Không gọi SHA của commit tài liệu là source đã được browser test; source/source-tree ở bảng trên là căn cứ nghiệm thu.

## 2. Component được tự phát hiện

| Concern | Owning source |
|---|---|
| Dashboard, KPI Metric, Attention, Quick Access, activity |`src/features/S01/OverviewScreen.tsx`|
| S01 và detail geometry |`src/features/S01/overview.css`|
| PX-0007 detail |`src/features/S01/AcceptedRowDetail.tsx`; selection/link helpers cùng thư mục|
| Shell / modal mechanics |`src/shared/GlobalShell.tsx`, `GlobalModal.tsx` — giữ nguyên bytes|
| Table / pagination / dates |`src/shared/DataTable.tsx`, `Pagination.tsx`, `DatePicker.tsx` và shared controls — giữ nguyên bytes|
| Query/runtime |`src/contracts/overview.ts`, `src/controllers/overview-runtime.ts`|
| Đường dữ liệu app thật |App→HTTP preview adapter→`src/preview-mock/readers.ts`/`domain.ts`→source fixture adapter|

Nguồn dữ liệu là **MOCK / SOURCE_FIXTURE**; không tuyên bố REAL_API, production RBAC hoặc kết nối kho thật PASS.

## 3. Design authority và kịch bản dữ liệu

Authority: `DESIGN_CONTRACT.md` **v1.2.0-recovery**, user decision **DEC-DG-20261027-01**, task decisions **DG-S01-004-QA-SCENARIO-01** và **DG-S01-004-FOOTER-01**. Originals3/4/5/6 giữ nguyên hash/custody, tương ứng Dashboard Desktop/Tablet và PX-0007 Desktop/Tablet. Shell/header/sidebar trong backdrop không được dùng để thay chuẩn shell đã khóa riêng.

Original dimensions:3/5=1672×941;4=992×1586;6=793×1983. Đây là kích thước raster, **không tự suy ra CSS viewport/DPR**. Canonical QA:1920×1080@1 và800×1280@2. Các native-size diagnostic dùng crop/scale đồng tỷ lệ có metadata, không phải bằng chứng source DPR hay Tablet vật lý.

| Scenario | Kết quả / provenance |
|---|---|
| Normal app |Kho Hoa Nam, tháng09/2026 theo coverage fixture đang có;8nhập/8xuất/4bảo hành/16phiếu; stockUnknown; tổng chờ5/hiển thị3; default10/options10,15,25,50|
| Reference page4 |Test-only real OverviewScreen + unchanged SOURCE_FIXTURE5; giữ snapshot/ID và CTA PX được xác minh|
| Reference pending3 |Test-only **QA_SYNTHETIC**, snapshot`isolated-s01-reference-pending3-v1`;16phiếu/8nhập/8xuất/4bảo hành/3chờ/13posted/stockUnknown được tính từ cùng cohort; CTA chưa có resolver hợp lệ nên disabled theo guard hiện có|

QA3 chỉ thay trạng thái hai bản sao `p12-stock-PN-0006` và `fixture-inbound-0005` waiting→posted. Không sửa fixture gốc hoặc dữ liệu production, không đổi September thành default production mới, không biến Unknown thành0. Đối chiếu Dashboard dùng QA3; modal/CTA dùng SOURCE_FIXTURE5, loại backdrop khỏi authority. Hai receipt được ghi rõ, không giả cùng provenance.

PX-0007 được xác nhận: Xuất kho; Kho Hoa Nam; Cửa hàng An Bình; quantity2; Lan Nguyễn;19/09/2026·14:35; Chờ xử lý trên Web; exact ID`p12-stock-PX-0007`. Thời gian là source display trong môi trường test Vietnam; chưa suy ra mapping timezone của backend thật.

## 4. Ảnh và số đo

**[Mở toàn bộ4bộ ảnh BEFORE/AFTER/overlay/diff](EVIDENCE_INDEX.md).** Có4normal AFTER trên đúng source cuối và4comparison sets riêng đúng scenario. Originals không bị thay thế. Root đã mở kiểm tra trực quan ảnh actual và các bảng song song cuối.

| Bản sửa có số đo | Trước → Sau |
|---|---|
| Desktop detail field text offset |40px →98px modal-local|
| Tablet KPI grid |322px →310px; native top296.5→288.5|
| Tablet modal repeated pitch |119px →111px; native height1402→1346|
| Tablet activity number/type overlap |−7/−8px →khoảng cách dương; final0overlap pairs|
| Desktop footer |99px →83px, modal723→707; buttons50px giữ nguyên|
| Badge contrast |1.879:1 →4.714light/6.539dark, dùng warning pair có sẵn|

Fidelity còn mở: aligned height residual DashboardD **+80px**, DashboardT **+24px**, modalD **+5px**, modalT **+11px**. Desktop density xung đột shared44CSS minimum; Tablet còn khác filter/activity/footer và detail footer composition. Typography/icon/palette, source normalization và tolerance chưa đủ authority. Không giảm target/font, giấu dữ liệu hoặc đổi baseline để ép PASS.

## 5. Kết quả kiểm thử — phân biệt đúng source

| Gate | Kết quả thực tế / nguồn |
|---|---|
| Local `quality:pr` trên e183 |**PASS exit0**: typecheck, contract, build,4putaway tests; `integration/e18305b/`|
| Scoped independent Node trên e183 |**34/34 PASS**; có actual HTTP-chain policy/reject4 và QA3/source5/CTA guard/data consistency|
| Modal affected matrix trên e183 |**12/12 PASS**, VI/EN/ZH×light/dark×Desktop/Tablet; copycode/ID, exactCTA, close/ESCfocus, keyboard, body start/middle/end scroll, footer/nooverlap,44targets; errors[]|
| Independent Visual capture checks trên e183 |**6/6 profiles captured**, clean source start/end;0console/network/overflow/text-overlap; đúngPX/ID/footer reachable, sourceCTA enabled|
| Full broader functional trên f56 |**29unique checks PASS** sau recovery: auth, KPI, date, search/filter/sort/page, states, locale/theme, navigation/data. Không ghi là chạy lại toàn bộ trên e183.|
| Shared/a11y trên f56 |**21groups PASS**,112page targets +20modal controls≥44; contrast/keyboard/shell/NC/drawer/quick routes. Không phải chứng nhận WCAG toàn diện.|
| Transfer f56→e183 |Independent byte/hash/diff chứng minh chỉ thêm1desktop footer declaration; tests và logic khác giữ nguyên. Gate không bị ảnh hưởng được chuyển có impact analysis; modal chịu ảnh hưởng đã chạy lại trên source cuối.|
| Reference fidelity |**FAIL**; exact acceptance **BLOCKED** bởi residual/authority gaps, không gọi là PASS|
| REAL_API / production RBAC / external warehouse |**NOT_RUN / NOT_CONNECTED**|
| Screen reader / comprehensive contrast |**NOT_RUN** ngoài sampled audit đã nêu|

Các lỗi Vite/server/network, harness100, offline cleanup và test sequencing đều được giữ raw attempt. Vite từng watch HTML trong output gây reload; lần modal cuối dùng compiled normal app source-pinned trong thư mục QA riêng, có asset hashes. Một all-descendant assertion cũ trả19.4375px không ghi identity nên trigger còn chưa xác định; không gán bug sản phẩm tùy tiện. Matrix sửa ghi đủ name/class/geometry/hit-test/inert, cleanup dialog/feedback; không phát hiện active undersized descendant. Không đổi source/toast behavior để đạt PASS.

## 6. Defects và9file đã thay đổi

**[Defect register chi tiết](DEFECT_REGISTER.md)**:9product root findings (1P1+8P2),6scoped repairs closed; **3P2 còn mở** V02/V03/V04; known open P0/P1=0. FQA-002 là cùng root F-PAGING, không đếm hai lần. QA infrastructure và design gaps tách riêng. Không có P0/P1 đã biết không đồng nghĩa được release.

Runtime5file:

- `src/contracts/overview.ts`
- `src/controllers/overview-runtime.ts`
- `src/features/S01/overview.css`
- `src/preview-mock/readers.ts`
- `src/preview-mock/domain.ts`

Tests4file:

- `tests/overview-detail.test.ts`
- `tests/s01/fidelity-policy.test.ts`
- `tests/s01/harness.tsx`
- `tests/s01/reference-scenario.tsx`

Không viết lại toàn S01; không sửa AcceptedRowDetail business logic, GlobalShell, GlobalModal, Notification hoặc fixture gốc.100protected files giữ nguyên SHA256.

## 7. Agent đã thực thi thật

| Role | Native target / deliverable |
|---|---|
| S00#1 |`/root`: packet/lease, dispatch, review/integration/commits, acceptance|
| S00#2 |`/root/s01_implementation`:9file scoped repair/tests, implementation report, bounded fix loops|
| S00#3 |`/root/s01_visual_qa`:browser discovery/capture/geometry/diff, độc lập với implementation|
| S00#4 |`/root/s01_functional_qa`:independent HTTP/data/browser/a11y/regression, bắt lỗi reader còn sót và kiểm lại|
| S00#5 |`/root/s01_release_audit`:authenticated GitHub/CI/provenance và frozen artifact integrity|
| S00#6 |`/root/s01_design_guardian`:reference custody, design matrix/gaps và scoped decisions|

Đã dùng native spawn/send/followup và nhận artifact thật; không giả định6chat sidebar tự giao tiếp. [Handoff trace](AGENT_TRACE.md) ghi rõ FAIL→FIX→RETEST và quyền sửa file. Preferred6.1Terra không nằm trong supported list; đã request supported Sol/high fallback (S00#5medium). **ACTUAL_MODEL/ACTUAL_REASONING=UNVERIFIED** vì runtime không xuất telemetry; không tuyên bố MODEL_ROUTING_ACTIVE hay AUTONOMOUS PASS toàn kiến trúc.

## 8. GitHub, CI và preview

Source cuối đã lưu GitHub DEV bằng normal fast-forward sau kiểm tra exactHEAD/remote/ancestry, quyền và branch unprotected/rulesets[]. `main` không đổi; không push Sites, không merge/deploy production.

**Exact source CI [run40492867184](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40492867184): BLOCKED_ENVIRONMENT.** Critical check122150892604 bị billing lock trước runner,0steps; visual122150911155 skipped0steps **NOT_RUN**. Local PASS không được gọi CI PASS. Workflow visual còn unconditional failure placeholder; branch chưa có required-check enforcement được xác minh. Không bypass các gate này.

**Local preview đang phục vụ build e183:** [S01 local](http://127.0.0.1:5284/#/preview/S01), MOCK. Root đã đối chiếu16build files với exact-source build receipt và HTTP index SHA256`70d30ee6451b1dfca40fde07a2e1edf61fb600d73697f9481fe3a34943f57434` lúc2026-10-27T11:16:05Z; managed preview session58103. Đây là endpoint trên máy này, không phải public deployment; đăng nhập theo luồng app thông thường. Build-info writer hiện copy historical provenance nên không dùng riêng manifest đó để chứng minh source.

**[Domain công khai](https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S01): deployed candidate SHA UNVERIFIED.** Served manifest khai historical MOCK d254757, không phải trustedHEAD attestation;13/15asset match và2HTMLserved khác được lưu audit. Không tuyên bố domain đã cập nhật e183.

## 9. Artifact integrity và lệnh thực tế

S00#5 final frozen-owner audit **PASS**: **508files /291,267,710bytes**,334PNG decoded,69JSON parsed,41ZIP CRC,64other hashes;0invalid.297/297VQAmanifest +107/107historicalf56 match;100protected vàoriginal/custody/visual3–6match. Đủ4BEFORE/4normalAFTER/4latestdiff/4aligned sets.

Receipt: [final-frozen-integrity.json](release/final-frozen-integrity.json), SHA256`8e7663ad388c05857030e57f12e6e8b0d9cd8b15b1a95854aa076fbd29d73884`. Scope/exclusions được ghi rõ: mutable root control reports, release collector outputs và post-freeze preview metadata không tự nhận là đã nằm trong508fileaudit. Git commit lưu bộ tài liệu cuối riêng, giữ nguyên rawbytes theo task`.gitattributes`.

Major executed commands/scripts và raw results:

- Git status/branch/rev-parse/diff/hash/ls-remote/merge-base; explicit source commits và normal GitHubDEV push, khôngforce.
- `verify-candidate.ps1 -ExpectedSha e18305b…` →`npm.cmd run quality:pr` exit0; command/build-byte log trong`integration/e18305b/`.
- `tsx --test` scoped suites: implementation15/15; independent final34/34, raw test logs trong`functional/`.
- Playwright normal auth/S01/PX plus test-only scenario scripts: `visual/capture-real-app.mjs`, independent browser/a11y/footer scripts và từng executed revision/log/trace.
- Read-only authenticated GitHub REST/check/annotation, HTTP public manifest/assets và PNG/JSON/ZIP/hash collectors trong`release/`.
- Local managed `npm.cmd run preview -- --host127.0.0.1 --port5284 --strictPort` và HTTP/build hash verification. Một detached helper launch bị tool policy chặn, không chạy; dùng managed exec preview thành công, không đổi quyền hoặc né gate.

## 10. Việc còn chặn nghiệm thu/rollout

1. **P2 visual V02/V03/V04:** xử lý trong bounded design-approved packet; riêng density cần quyết định compact geometry tương thích44CSS, không tự giảm target hoặc giấu dữ liệu.
2. **Design gaps:** phục hồi/export đúng source normalization, typography/icon/variant và tolerance trước khi ký exact fidelity. Không yêu cầu người dùng chụp lại hiện trạng; actual/diffs đã có đầy đủ.
3. **CI billing + incomplete browser gate/enforcement:** người có quyền xử lý billing; S00#5 cần packet riêng để nối automation thật vào workflow và required checks, rồi chạy đúng source candidate.
4. **Public preview provenance:** build attestation từ actualHEAD, deploy candidate được cấp quyền và smoke đúng deployedSHA. Chưa được production release.
5. Backend/RBAC/warehouse thật và screen-reader/comprehensive accessibility cần môi trường/contract tương ứng; không dùng MOCK PASS để thay.

**Không đề xuất ROLLOUT_READY.** Các sửa và evidence đã bàn giao có thể review; toàn màn S01/detail chưa đạt nghiệm thu thiết kế hoặc release.
