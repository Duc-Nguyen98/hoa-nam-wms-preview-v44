# HN-S01-UIUX-004 — independent Visual QA

Status: **BEFORE_AND_AFTER_CAPTURE_COMPLETE / VISUAL_FAIL / EXACT_ACCEPTANCE_BLOCKED**. Final candidate `e18305b1e3b09c4402317d507d7008967284341b`; current conclusions are in the last section below. Role S00#3; requested fallback Sol/high, actual model telemetry UNVERIFIED.

## Source and capture custody

- Repository: `E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026`; branch DEV, HEAD `06954a99885f7c9e808bf9a5556c7dd6c0d6b9a2`, source tree `65ac25d235682469452f60d50664b3e6acb3a753`.
- All required BEFORE captures use the actual app `http://127.0.0.1:5271/#/preview/S01`, discovered from registry and source. Fresh Chromium contexts, normal configured test authentication through S07 → S08 → setup. No auth bypass, network response replacement, fixture mutation or production write. Vite5271 started in the explicit E: checkout. TEMP/TMP point to ignored `output/hn-s01-004-visual-temp`.
- `visual/before/capture-results.json` records start/end source identity, no dirty source, screenshot SHA256, computed styles/geometry, exact modal identity, console/network observations and timestamps. Desktop1920×1080 CSS DPR1 fine pointer; tablet800×1280 CSS DPR2 coarse touch; VI/light, timezone Asia/Ho_Chi_Minh. Fonts loaded before screenshots. No clock override.
- **Four-before gate COMPLETE:** `visual/before/desktop-dashboard.png`, `tablet-dashboard.png`, `desktop-px0007.png`, `tablet-px0007.png`. Dashboard full-page, modal-local, browser trace and geometry accompany the four viewport captures. Root notified before any source editing was authorized.
- Exact target `p12-stock-PX-0007` was found in attention by exact data attribute, clicked and asserted against `data-overview-detail-id`. It is outbound PX-0007; Cửa hàng An Bình; quantity2; Lan Nguyễn; 19/09/2026 · 14:35; pending Web. No first-row assumption.
- Additional `visual/before-native/` captures use **declared diagnostic harness profiles**, D1672×941@1, T992×1586@1, T-modal793×1983@1. These configurations are not claims about original screenshot CSS viewport/DPR. All source start/end receipts remain clean/base.
- Originals3/4/5/6 were opened, copied byte-for-byte into `visual/references/`; originals remain unchanged. State mapping and manual reference anchors are owned by `DESIGN_ACCEPTANCE_MATRIX.md`. `visual/artifact-manifest.json` records hashes/sizes. `visual/compare.py` creates derived crops only.

## Scenario receipt and environment observations

The real source fixture provides Kho Hoa Nam, September2026, inbound8/outbound8/open warranty4/documents16/unknown stock (`—`, helper visible). Actual pending total is **5**, with three displayed attention rows. The artwork pending3 scenario is not identical. This is a scenario mismatch, not authorization to hide two source records, change a business aggregate or hardcode3. Normal current default pageSize4 is separately identified by Design/Functional as conflicting with locked shared default10; implementation correction and isolated page4 comparison must remain distinct.

Canonical and all three native diagnostic captures: **zero page errors, console warnings/errors, failed requests or HTTP≥400**. Canonical document scroll width equals viewport width1920/800. Tablet content scrolls vertically. Additional `visual/before-reachability/` uses a fresh normally authenticated tablet context, scrolls the modal body to its end and verifies **idReachable=true**; its screenshot shows system ID with footer actions retained. Desktop native941-height viewport clips the longer current pagination at bottom; full-page image preserves it. No failed browser attempt occurred. Read-only discovery had two missing-path lookups (`src/screens/Overview*`, absent `OverviewDetailModal.tsx`); actual owning files were subsequently discovered, and these are not product failures.

## Comparison method and limits

Four original/actual/crop/overlay/difference sets are in `visual/comparison-before/`. The metadata records exact source crops, actual crops, declared profiles and transforms. Crops exclude locked shell/header/sidebar; modal comparison excludes its differing backdrop. Actual crops are scaled **isotropically by width**, aligned at crop top-left and padded with magenta where vertical extents differ. No anisotropic stretch, original overwrite, baseline replacement or screenshot-derived CSS token approval.

| Set | Reference crop | Actual native crop | Width scale | Residual aligned height |
|---|---|---|---:|---:|
| Dashboard D |1336×853|1336×880|1|+27px|
| Dashboard T (KPI→activity) |901×1247|900×1280|1.00111|+34px|
| PX-0007 D modal |795×698|800×723|0.99375|+20px|
| PX-0007 T modal |708×1331|710×1402|0.997183|+67px|

These are diagnostics, not accepted tolerances. Manual reference anchors have ±2 raster-pixel measurement uncertainty. Source DPR, exact source viewport, original font rendering environment and pixel tolerance are unknown. Reference6 aspect ratio differs from the canonical tablet profile; no whole-raster tablet PASS is possible from a stretch. Missing font weight/size, palette and exact icon source approval remain DESIGN_GAP. Shared Public Sans family / brand / control authority does not approve every local feature value.

## Consolidated correction batch

All proposed implementation changes require S00#1's bounded runtime lease. Content-local CSS owns the following; no GlobalShell, Notification Center, shared token or shared control edits are authorized by this report.

| ID / priority | Evidence and defect | Bounded correction / acceptance |
|---|---|---|
| V01 / P2 | Desktop detail field labels/values start modal-local x65; ref5 ~98. Icons and text are too close. Both document and system columns affected. | In desktop `.ov-detail-field`, adjust feature grid column/gap so text follows reference relative alignment (~+33px native); preserve existing tablet modal-local x~142, field ordering and44CSS targets. Compare modal-local crops again. |
| V02 / P2 | T modal793×1983 diagnostic: actual710×1402 vsref~708×1331; header241 vsref239; repeated row pitch119 vsref~111–115 causes accumulated height drift. | Reduce owning tablet repeated field spacing based on relative row/divider anchors; ~8px pitch reduction is a starting diagnostic, not a new locked token. Recheck full content/body, system ID and footer. Canonical initially scrolled-off ID is not a missing-field defect if reachable. |
| V03 / P2 | T992 native: KPI top296.5 vsref289; KPI grid322 vsref309; attention top634.5 vs612; quick903.5 vs881; activity1045.5 vs1021. Actual metric rows154 despite148 min. | Resolve intrinsic metric row/min-height accumulation and feature heading spacing. Aim for reference relative KPI→attention→quick→activity anchors. Preserve unknown helper/full labels; do not shrink text or change shell positions. Canonical800 wrapping and scroll are separate safety checks. |
| V04 / P2 | D native activity bottom962 vsref933. Filter search renders44px while adjacent selects36px; table/filter/footer cumulative density exceeds reference, and bottom pagination falls outside native941 viewport. | Correct owning filter-wrapper alignment and unnecessary row spacing. Retain shared44CSS interaction minimum; do not enforce36px target simply because artwork has smaller controls. If exact fit conflicts with locked44, record conflict and retain accessibility. Final default10 scenario naturally differs from artwork4; compare isolated4 separately. |
| V05 / P2 / DESIGN_GAP | Content title/body text, icon optical sizes/glyphs and local action/copy colors visibly differ. D detail number/system ID spacing and document icons differ from originals. | Guardian must supply exact scoped typography/palette/icon authority before new exact tokens/glyphs. Existing approved Public Sans family remains. Geometry repairs supported by anchors may proceed separately; no invented sampled hex or synthetic font weight. |
| V06 / scenario BLOCKED | Actual source total waiting5 vs artwork3, despite exact same three displayed top items. | Preserve truthful source5; obtain an explicit isolated scenario fixture if exact semantic3 comparison is required. Never derive total from slice(0,3). |
| V07 / required policy fix | Normal production default/options4 conflict with shared default10/options10,15,25,50 (Design authority). | Correct runtime defaults/policy; retain artwork4 only through existing isolated real-OverviewScreen harness, documented as QA scenario. Capture final normal10 and comparison4 separately. |

## BEFORE verdict (historical)

Four-before gate COMPLETE. Visual differences are verified and correction batch delivered. Exact four-state fidelity remains **BLOCKED** by authority/normalization/scenario gaps and unresolved measured defects; it is not PASS. AFTER, final source-qualified geometry, immutable-byte audit and final independent functional/regression evidence are NOT_RUN here. No source, baseline, shell or Notification Center edit was made by S00#3.

## Superseded candidate AFTER attempt:60b76b9

Candidate `60b76b91764644996d9c69c9c08833ed76036a89`, source tree `c8046fc38e251eeda1964da55531462b137c0554`, test tree `c15efb1db9d378e4b4fa9d70b9cac54dc152e340`. Source start/end clean. Attempts are retained in `visual/attempts.md` and their original folders. This is **not final-candidate acceptance**.

- `after-normal`: all five profiles navigation ENV_FAIL (local server stopped; ERR_CONNECTION_REFUSED).
- `after-normal-r2`: normal app canonical desktop/tablet and native desktop captured; remaining native tablet profiles ENV_FAIL due asset `ERR_NETWORK_CHANGED` → login timeout. No overwritten attempt.
- `after-reference`: all five profiles captured after normal auth then test-only `/tests/s01/harness.html?state=reference`, using real OverviewScreen/GlobalShell and source-fixture identity/CTA. All five zero console/network errors, exact ID and footer reachable, CTA enabled, no small dashboard buttons found.
- Actual normal app still offers4 alongside10/15/25/50, matching Functional QA's runtime policy defect; root is preparing the next candidate. Isolated4 does not excuse normal app4.
- Independently observed native992 grid310px/KPIy288.5, attention614.5, quick883.5, activity1025.5; native tablet-modal1346px tall, repeated field pitch111px. These improve V02/V03, with residuals still visible.
- **V08/P2 text collision:** canonical800/mobile native992 number and type text ranges overlap7–8px after44px target enlargement. Native992 PX-0011 text number y1253.5–1277.5, type y1269.5–1289.5. Screenshot `after-reference/tablet-native-activity-crop-2x.png` shows touching type/number. Preserve44px target but align its number text toward row top and leave a positive text gap above the absolute-positioned type. Reported to root before next candidate. `layoutDiagnostics.mobileTextOverlaps` retains all measured pairs; this geometric detector is a diagnostic, with crop inspection used to verify the visible issue.

## Previous candidate: f56e25c — executed AFTER result

**Capture/reachability/overflow gates PASS within the tested profiles. Visual fidelity FAIL; exact pixel acceptance BLOCKED.** No unqualified four-state visual PASS is issued.

Candidate HEAD `f56e25cfc119f5a758f0cd48ebdc6a96e78f8a09`, `src` tree `72189a9c0bdb2aff13a0294fd2b66929b157273e`, `tests/s01` tree `6155c0a2cea64a5df6c52e08fc46681e92f3328e`. The enclosing `tests` tree is separately `3a61cae4bffcbda3f9e614eaaa02a38e637f3e64`; these are distinct paths, not an identity conflict. Every final capture records the same clean start/end source custody. No source edits by Visual QA.

### State-to-scenario evidence mapping

All paths below are relative to `docs/quality/uiux-task-HN-S01-004/visual/`.

| Evidence purpose | Route / truthful scenario | Canonical actuals | Native diagnostics / diff inputs |
|---|---|---|---|
| Four normal real-app AFTER states | Normal auth → `#/preview/S01`; SOURCE_FIXTURE, page10, pending5 | `final-normal/desktop-dashboard.png`, `tablet-dashboard.png`, `desktop-px0007.png`, `tablet-px0007.png` | Same folder includes D1672×941, T992×1586, T-modal793×1983; full-page/modal-local/scrolled screenshots and traces |
| Dashboard D/T artwork comparison | Normal auth → test-only `/tests/s01/harness.html?state=reference-pending3`; real OverviewScreen/GlobalShell, **QA_SYNTHETIC**, page4/pending3 | `final-pending3/desktop-dashboard.png`, `tablet-dashboard.png` | `final-pending3/desktop-native-dashboard-full.png`, `tablet-native-dashboard-full.png` |
| Exact PX-0007 D/T artwork comparison | Normal auth → test-only `/tests/s01/harness.html?state=reference`; real source snapshot identity, SOURCE_FIXTURE, page4/pending5, verified CTA enabled | `final-reference/desktop-px0007.png`, `tablet-px0007.png` | `final-reference/desktop-native-px0007.png`, `tablet-modal-native-px0007.png`; comparison excludes backdrop |

QA_SYNTHETIC dashboard scenario `isolated-s01-reference-pending3-v1` retains all16 original record IDs and derives8 inbound/8 outbound/3 pending/13 posted/4 warranties/unknown stock. Its **declared status mutations** are `p12-stock-PN-0006` and `fixture-inbound-0005`, waiting→posted, in test-only adapter code. Original fixture remains pending5. Synthetic source does not gain the original source CTA authority; this capture deliberately contains dashboards only. Its two-record status projection and badge3 are not production data or proof of a source pending3 aggregate. The source-backed modal set is a separate capture with the unchanged5 source, not a fabricated synthetic-enabled CTA.

`final-measurements.json` aggregates **14/14 profile captures**: normal5 + source reference5 + synthetic dashboard4. All14 source receipts stable; **0 console warnings/errors, 0 failed/HTTP≥400 requests, 0 horizontal page overflow profiles, 0 mobile text-overlap pairs**. All ten source-backed modal captures have exact `p12-stock-PX-0007`, body-scrolled ID reachable, footer reachable and CTA enabled. No dashboard or modal button smaller than44×44CSS was found in these captured states. Final normal page-size choices are exactly10/15/25/50; page10 displays1–10 of16. Test-only reference variants explicitly offer4. V07 runtime policy defect is closed on this candidate.

V08 text collision is closed within all tested tablet profiles: text-range diagnostic finds0 intersecting pairs, and `final-normal/tablet-native-activity-crop-2x.png` was opened to verify the visible number/type separation. Each normal/source-reference modal has an explicit `*-px0007-scrolled.png` screenshot and computed ID/footer receipt; the system ID being initially below the canonical tablet body viewport is not a missing-field defect.

### Final four comparison sets

`comparison-final/comparison-metadata.json` provides scenario, exact source custody, original/actual paths, crop coordinates, scale and uncertainty per set. Each prefix below has **`-reference-crop.png`, `-actual-crop.png`, `-actual-aligned.png`, `-overlay.png`, `-diff-3x.png`, `-side-by-side.png`**. All four side-by-side images were opened and inspected.

| Prefix under `comparison-final/` | Reference | Actual source | Isotropic scale | Ref / aligned actual height | Residual |
|---|---|---|---:|---:|---:|
| `dashboard-desktop` |original3|QA_SYNTHETIC pending3/page4 D native|1|853 /933|+80px|
| `dashboard-tablet` |original4|QA_SYNTHETIC pending3/page4 T native|1.001111|1247 /1271|+24px|
| `px0007-desktop` |original5|SOURCE_FIXTURE pending5 modal D native|0.99375|698 /718|+20px|
| `px0007-tablet` |original6|SOURCE_FIXTURE pending5 modal T-modal native|0.997183|1331 /1342|+11px|

These residuals use top-left content/modal crops with width-only isotropic normalization. They do not measure full-frame shell position, source CSS pixels, physical-device size or an accepted pixel tolerance. Reference6 is never stretched into the canonical1280-height tablet raster. Magenta padding marks unmatched vertical extent. Exact typography/palette/icon and normalization/tolerance gaps remain open.

### Consolidated final residuals and disposition

| Defect | Independent AFTER measurement | Final disposition / action |
|---|---|---|
| V01 desktop field alignment | First document/system value modal-local x98, before65; tablet offset139 retained. | Intended left-column alignment correction verified. Overall detail does not pass exact fidelity: right-column spacing, typography/icons and modal height still differ in side-by-side. Obtain scoped geometry/type/icon authority for any remaining exact correction. |
| V02 tablet repeated spacing | Native793 modal710×1346 (before710×1402); field pitch111 (before119); normalized residual+11px. | Improvement verified; residual remains. Compare header/section/system/footers separately rather than approving merely similar outer height. |
| V03 tablet dashboard accumulation | Native992 KPIy288.5/grid310; attention614.5; quick883.5; activity1025.5/bottom1558.5. Ref anchors289/grid309,612,881,1021/bottom1536. | Main KPI accumulation reduced. Activity still ends22.5px below reference native anchor; width-normalized crop residual+24px. Feature heading/filter/row/footer alignment still needs scoped correction/decision; ±2px manual uncertainty is not acceptance tolerance. |
| V04 desktop density /44 target conflict | QA4 native activityy597/bottom1015 vsref594/933; normalized whole-content height+80px, versus BEFORE+27px. | **OPEN P2 / DESIGN_GAP**. Enlarging the verified undersized controls to locked44CSS increased density drift; keep44. Resolve compact visual treatment or explicit scoped exception with the shared/design owners before claiming fidelity. Do not shrink click targets just to hit the raster bottom. Normal production10 rows are correctly a separate layout from artwork4. |
| V05 typography, glyphs, palette | Side-by-side still shows title/value color, glyph/optical size, body weight/spacing and footer-label scale differences. Tablet button text16/24CSS visibly differs from artwork's relative scale. | **OPEN P2 / DESIGN_GAP**. Exact font-scale/weight, local palette and icon path authority unresolved; no sampled hex or synthetic weight introduced by QA. |
| V06 scenario count | Normal/source fixture remains truthful5; dedicated QA_SYNTHETIC dashboard renders3 with the two declared status projections. | Original source mismatch preserved in normal data; artwork dashboard comparison scenario now supplied and clearly labeled. This gap no longer prevents the synthetic dashboard comparison, and never approves a production total3. |
| V07 pagination policy | All5 normal profiles options10/15/25/50; normal page10, isolated page4. | CLOSED within final visual captures; Functional owns broader behavior. |
| V08 number/type collision | All14 captures0 mobile text-overlap pairs; magnified final crop visually separates text. | CLOSED in tested profiles.44CSS minimum retained. |
| V09 tablet modal footer composition | Native modal-local footer top1240/height105; ref6 local top1201/height130. Actual button boxes241.5/402.5 wide×56high at localx25/282.5; ref approximate260/353×77 at localx37/319. Footer text16/24CSS. | **OPEN P2** measured composition residual, discovered in final side-by-side. Actual footer remains fully usable/reachable. If another correction is authorized, use the owning tablet `.ov-detail-modal` footer variant to align content edges, column ratio and footer geometry; resolve exact type scale through Design Guardian and preserve44 targets. Do not rely on the outer+11px result to hide this internal drift. |

Final Visual QA is **FAIL for reference fidelity / BLOCKED for exact acceptance**, with no P0/P1 visual issue observed in the captured states. Capture completeness, source custody, tested horizontal overflow, tested text overlap, console/network and modal ID/footer reachability have the bounded passing evidence above. Missing locales/themes/physical devices/other states do not inherit visual PASS; broader functional/accessibility/regression and release gates belong to their owners. No extra optional capture is required by this visual packet after the completed14-profile bundle.

### Artifact freeze

`visual/artifact-manifest.json` freezes files under `visual/**`, excluding itself. This report is outside that scope and is intentionally excluded; it remains the human-readable verdict. All earlier failed/superseded attempts remain listed and hashed. Original source reference hashes are verified against `C:/Users/Admin/Desktop/HN_Astra/3.png` through6.png. No baseline replacement, source edit, deployment or production write was performed by Visual QA.

## FINAL SOURCE e18305b — authoritative latest Visual QA verdict

**Capture, source custody, tested horizontal overflow/text overlap, console/network and modal reachability: PASS. Reference fidelity: FAIL. Exact visual acceptance: BLOCKED.** This section supersedes earlier candidate conclusions while preserving their executed evidence.

- Candidate `e18305b1e3b09c4402317d507d7008967284341b`; `src` tree `edd34681bf20a5281188e9da49cdc91876a0845d`; `tests/s01` remains `6155c0a2cea64a5df6c52e08fc46681e92f3328e` (`tests` parent tree `3a61cae4bffcbda3f9e614eaaa02a38e637f3e64`). All six new profiles record exact clean start/end custody.
- Exactly one source insertion from f56e25c: desktop-only feature modal footer `padding-block:16px`. It preserves button sizing and tablet rules. Visual QA made no source edit.
- `visual/e18305b-measurements.json` records **6/6 captured**, all source stable, **0 console warnings/errors, 0 failed/HTTP≥400 requests, 0 horizontal page-overflow profiles and 0 mobile text-overlap pairs**. All four source-backed modal captures have exact PX-0007 ID, reachable body-scrolled system ID and footer, enabled verified CTA. No captured dashboard or modal button is below44×44CSS. Normal canonical options are10/15/25/50, with pending5; synthetic comparison dashboards are page4/pending3 as explicitly declared above.

### Current final evidence mapping

All paths in this table are relative to `docs/quality/uiux-task-HN-S01-004/visual/`. Four normal AFTER viewport screenshots are distinct from the four reference comparison inputs.

| State/purpose | Current actual path | Scenario/profile |
|---|---|---|
| Normal Dashboard D |`e18305b-normal/desktop-dashboard.png`|Real app SOURCE_FIXTURE, page10/pending5;1920×1080 CSS DPR1|
| Normal Dashboard T |`e18305b-normal/tablet-dashboard.png`|Real app SOURCE_FIXTURE, page10/pending5;800×1280 CSS DPR2|
| Normal exact PX-0007 D |`e18305b-normal/desktop-px0007.png`|Normal app accepted source row; same desktop profile|
| Normal exact PX-0007 T |`e18305b-normal/tablet-px0007.png`|Normal app accepted source row; same tablet profile|
| Dashboard D comparison input |`e18305b-pending3/desktop-native-dashboard-full.png`|Test-only QA_SYNTHETIC page4/pending3;1672×941 CSS DPR1 diagnostic|
| Dashboard T comparison input |`e18305b-pending3/tablet-native-dashboard-full.png`|Test-only QA_SYNTHETIC page4/pending3;992×1586 CSS DPR1 diagnostic|
| PX-0007 D comparison input |`e18305b-reference/desktop-native-px0007.png`|Test-only source-preserving page4/pending5, verified CTA enabled;1672×941 CSS DPR1 diagnostic; backdrop excluded|
| PX-0007 T comparison input |`e18305b-reference/tablet-modal-native-px0007.png`|Same unchanged SOURCE_FIXTURE;793×1983 CSS DPR1 diagnostic; backdrop excluded|

Each phase folder includes its immutable `capture-results.json` source/style/geometry/console/network receipt and browser traces. Modal phase folders also include `*-px0007-modal.png` and `*-px0007-scrolled.png` for local composition and ID/footer reachability. Synthetic dashboard captures do not pretend to have the original source CTA authority.

The current four original/actual/crop/overlay/diff sets are **`visual/comparison-e18305b/`**, with prefixes `dashboard-desktop`, `dashboard-tablet`, `px0007-desktop`, `px0007-tablet` and the six suffixes listed above. **`visual/comparison-e18305b/comparison-metadata.json`** is the current transform/source/scenario receipt. All four current side-by-side renders were opened. Source DPR is still unknown; native-size diagnostic captures do not infer original CSS viewport/DPR. Exact tolerance/font/palette/icon/normalization gaps remain unchanged.

### Latest repair verification and remaining residuals

Desktop canonical and native modal are independently **800×707**, footer **83px** with `16px 24px` padding, compared with f56e25c's800×723/footer99/padding24. Buttons remain50px high. Width-normalized D modal comparison is795×703 against reference795×698: residual **+5px**, improved from+20px. This measured footer repair is verified separately from unresolved typography/glyph differences.

Tablet canonical modal remains710×1248 with footer105/padding24. Native tablet-modal remains710×1346, footer105/padding24, field pitch111, first value modal-local x139. Thus the desktop override did not alter tablet footer padding or native modal height. Source-backed IDs and footer actions remain reachable in both profiles.

| Final comparison | Aligned reference / actual height | Current residual / disposition |
|---|---:|---|
| Dashboard D, QA3/page4 |853 /933|**+80px**, OPEN V04 density/44CSS target conflict. Keep44; shared/design decision required before shrinking or approving compact treatment.|
| Dashboard T, QA3/page4 |1247 /1271|**+24px**, OPEN V03 remaining activity/filter/footer accumulation. KPI native y288.5/grid310; attention614.5; quick883.5; activity1025.5/bottom1558.5.|
| PX-0007 D, source5 |698 /703|**+5px**, desktop footer correction verified; remaining internal alignment/type/icon differences prevent exact PASS.|
| PX-0007 T, source5 |1331 /1342|**+11px**, OPEN V02/V09 internal footer composition and exact-type/glyph gaps. Native footer local top1240/height105 vsref1201/height130; buttons241.5/402.5×56 vsreference approximate260/353×77. Actual footer is usable/reachable; no new geometry trial was performed.|

V01 left-field x98 correction, V07 normal policy and V08 text collision remain verified closed within the tested scope. V05 scoped typography/palette/icon authority and exact comparison normalization/tolerance remain DESIGN_GAP. QA3 supplies the honest isolated dashboard comparison scenario; the original source pending5 remains correct. The listed residuals were delivered as one final batch; none are silently relabeled PASS.

No new environment failure occurred on e18305b. Earlier failures remain in the attempt ledger and evidence. Root subsequently reported Functional QA found Vite watchers observing `output/**` temporary HTML and causing reload/transport issues; active successful visual captures were not reconfigured mid-run. No extra optional state capture or geometry trial was run after the agreed six profiles.

The previous f56e25c bundle remains independently frozen by `visual/f56e25c-manifest.json` (107 artifacts including its report snapshot). The final `visual/artifact-manifest.json` freezes **all `visual/**` files except itself**, including earlier attempts and both candidates. This mutable parent report is outside that manifest scope and deliberately excluded. Original3–6 hashes match their original C: inputs. Visual QA work is complete; release readiness must continue to treat fidelity FAIL/exact acceptance BLOCKED independently from the bounded passing execution checks.
