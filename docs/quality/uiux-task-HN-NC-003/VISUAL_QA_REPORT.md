# Notification Center — independent Visual QA

Task `HN-NC-UIUX-003`; owner S00#3; date 2026-10-27 UTC+07. Tested source `78752811af4b0434c958d604dc52ca445cdbeede` on DEV. Requested fallback GPT-6.1 Sol/high; authoritative ACTUAL_MODEL/ACTUAL_REASONING telemetry unavailable.

## Discovery and environment

Actual application route `#/preview/S15` → shared header `.hn-notifications` → native `dialog.hn-notification-center`. Owner components: `src/shared/ShellHeader.tsx`, `src/notifications/PreviewNotificationCenter.tsx`, `notifications.css`, shared GlobalModal. Local Vite: `http://127.0.0.1:5233/`; local source is pinned above. Hosted deployed SHA was not independently certified, so no public-preview provenance PASS is claimed.

Normal test-account authentication, confirmation and PublicDemo setup were used in fresh isolated contexts. No user storage or production data was changed. Data is browser-local MOCK. Each source screenshot retains the real application's shell; only the modal crop is used in difference metrics because shell is separately LOCKED.

## Capture profiles and evidence

References: Desktop `1.png` SHA256 `fa1a5615926a3a15b4cdf72d3482f53f4755931f9b881f8f34874a35233ae22c`,1774×887; Tablet `2.png` SHA256 `65606c1c19e7124340cdf18f41d201b136be755059275dd2b777847b268569f4`,992×1586. Immutable copies are `visual/wall-clock/*-reference.png`.

Native raster comparison used same-size CSS viewports/DPR1. This is a declared diagnostic normalization; the PNG alone does not certify source device DPR. Full screenshots, modal screenshots, actual/reference crops,50% overlay,3× amplified diff, traces and computed geometry are in `visual/wall-clock/`. No reference was changed, resampled or stretched. Diagnostic1920×1080 and800×1280 captures are also present; the latter retained DPR1 and does not claim canonical800@2x certification.

| Native profile | Source modal bounds (raster estimate) | Actual bounds CSS px | Mean absolute RGB channel difference | Pixels any channel delta>10 |
|---|---|---|---:|---:|
| Desktop1774×887 | x390,y113,w1087,h728 | x391,y113.5,w1088,h728 | 9.538 |13.44%|
| Tablet992×1586 | x61,y261,w881,h1262 | x56,y162,w880,h1262 |22.517|34.95%|

These metrics include different sample dates and raster/font rendering. No approved pixel tolerance is present; the figures are diagnostic and cannot be converted into a visual PASS. Desktop content is already close in topology and geometry. Tablet has a large absolute placement difference, dependent on the accepted viewport/normalization decision.

## Defect and gap register

| ID | Severity | Evidence | Disposition / bounded correction |
|---|---|---|---|
| VQ-NC003-01 | P2 / normalization authority | Tablet actual y162 vs reference y261; x56 vs61; same1262-height | Exact99px vertical difference verified under native992@1 recipe; Design Guardian must determine whether source placement or canonical viewport normalization controls. Do not blindly translate every portrait viewport. |
| VQ-NC003-02 | P2 visual | Tablet close glyph dark-pixel bbox10×10 vs reference19×19; target itself44×44 | Scoped notification portrait icon/padding correction, retaining44px target and shared modal mechanics. Current GlobalModal close Icon size18 plus10px button padding explains undersized artwork. Desktop reference glyph12×12 vs actual10×10 is minor. |
| DG-NC003-01 | DESIGN_GAP | Current Public Sans,650-weight text; source exact font/weight not specified | Optical text differences observed, but font substitution/weight/line-height is not authorized by screenshot alone. Preserve approved family until Design Guardian decision. |
| SCENARIO-NC003-01 | Not a product defect | Actual27/10 and26/10 vs reference25/10 and24/10 | User expressly says sample data is not a business constant. Preserve seed rules; declare date difference in comparison. |
| HARNESS-NC003-01 | Test-environment failure | Initial fixed-clock setup attempts both exceeded180s and displayed recoverable retry page, no console error | Retained root `visual/*-failure.png` and traces. Independent wall-clock runs reached actual app and captured both views. No runtime defect inferred solely from backdating clock before auth/setup. |

Close glyph pixel measurement: grayscale threshold<200 in40×40 windows; reference Tablet window(875,295)–(915,335) bbox(11,8)–(30,27); actual window(861,195)–(901,235) bbox(15,15)–(25,25). Source artwork geometry is optical evidence, not CSS provenance.

## Executed interaction/robustness evidence

- Both actual real-app profiles captured with zero console/page errors and zero failed/error HTTP responses.
- Search `in nhan` →1 row; unread filter →2 rows.
- Desktop read →1 unread, mark unread →2; no business document mutation made.
- Tablet item→detail→Back restored row focus.
-16 Tab presses stayed inside native modal for each profile; Escape restored bell focus.
- No modal/page horizontal overflow in native or diagnostic captures.
- Desktop2-column and portrait1-column/default-detail-hidden anatomy observed; detail actions/footer remain contained.
- Dark/EN/ZH/loading/error/empty/offline/accessibility matrix is assigned to independent Functional QA. This report does not infer approved pixel equality from VI/light art for those states.
- Toast stack/CTA occlusion was not deterministically injected in this capture; retain NOT_RUN for that specific visual collision check pending Functional QA evidence. No blanket a11y PASS is asserted from keyboard checks alone.

## Verdict before correction

**PARTIAL / VISUAL ACCEPTANCE BLOCKED.** Real-app capture and quantitative comparison completed; current Desktop is close, Tablet placement and close glyph require disposition/retest. Missing exact typography and comparison tolerance remain explicit gaps. Source images, actual captures, overlays/diffs and metrics are reviewable; no baseline refresh or runtime edit by S00#3.

## Independent final retest — source 76059cc

Tested source and ended source both `76059cce616543356c623ec248c6350ddd07cdf5`; `src/` clean before and throughout captures. Local real application, fresh authenticated browser-local MOCK contexts, VI/light. References retain their original hashes above. All original before evidence remains under `visual/wall-clock/`; final evidence is `visual/after-76059cc/`, with one isolated environment retry under `visual/after-76059cc-retry-desktop/`. Runner `visual/capture-after.mjs` requires an exact expected SHA and clean runtime source. No source, reference or baseline edits were made by Visual QA.

Main run completed six profile captures and one environment failure. During initial 1920×1080 application bootstrap, Chromium reported `net::ERR_NETWORK_CHANGED` for local modules and the login field never mounted. This is preserved as FAIL with screenshot/trace/network records, not removed or counted as a product PASS. An isolated retry of only that profile on the same clean SHA completed with zero errors. Thus seven distinct profiles have successful final evidence, with the initial failed attempt retained separately. No stability guarantee is inferred from this retry.

| Final profile | Modal x/y/width/height CSS px | Result of executed geometry/interaction checks |
|---|---|---|
| 1774×887 DPR1 | 391 / 113.5 /1088 /728 | PASS within tested scope |
| 992×1586 DPR1 | 61.456 /261.125 /880 /1262 | PASS within tested scope |
| 1920×1080 DPR1 | 464 /210 /1088 /728 | PASS isolated retry; initial network failure retained |
| 800×1280 DPR2 | 30 /110 /740 /1060 | PASS safety; actual1600×2560 raster, no reference pixel approval |
| 900×1440 DPR1 | 24 /154 /852 /1262 | PASS; bottom edge guard24px |
| 900×1100 DPR1 | 24 /24 /852 /1052 | PASS; all edge guards24px |
| 801×1100 DPR1 | 24 /24 /753 /1052 | PASS; all edge guards24px |

Every successful profile: search `in nhan` returned1 item; unread filter returned2; 16 Tab presses stayed in the modal; Escape restored bell focus; all modal bounds remained inside the viewport; modal/document horizontal overflow absent; zero console/page/network errors. Portrait item→detail→Back restored the triggering item focus. Desktop read/unread updated count1→2. Inspected the actual 801×1100 detail screenshot: back/action/card/footer/navigation remained visible and contained. These are executed bounded checks, not full feature or accessibility certification; independent S00#4 owns the broader matrix.

### Retested four bounded visual corrections

| Finding | Actual final evidence | Disposition |
|---|---|---|
| VQ-NC003-01 portrait placement | 992 modal moved +5.456px/+99.125px from before; source estimate x61/y261, actual61.456/261.125 | VERIFIED FIX for approved native-raster recipe; width880 vs raster estimate881 retained as optical tolerance gap |
| VQ-NC003-02 close artwork | Hit target44×44 on every profile. Native992 artwork threshold<200 gives21×21 raster envelope at fractional placement; integer900/801 profiles give20×20, source19×19. Before artwork10×10 | VERIFIED correction of undersized icon; no claim of exact glyph match |
| Adjacent portrait unread separation | First unread row y739.125,h116; second y857.125,h115:2px gap. Native reference fill gap2px | VERIFIED FIX of separation; remaining row positions/insets remain open below |
| Desktop reading footer divider | Final top764.5 vs source estimate765; previous769.5. Desktop footer bottom824.5, navigation/buttons y784.5 and CTA y688.5 unchanged against before geometry | VERIFIED bounded divider correction |

The light-only placeholder/status contrast patch is a Design Guardian scoped accessibility candidate using existing shared status colors; it is not a new approved visual baseline. Visual QA captured the final candidate. S00#4 owns computed contrast/accessibility acceptance.

### Final image differences, retained without new threshold

Same immutable modal crops and native-raster method as before:

| Profile | Before mean absolute RGB error | After error | Before pixels delta>10 | After pixels delta>10 |
|---|---:|---:|---:|---:|
| Desktop |9.538|9.540|13.44%|13.38%|
| Tablet |22.517|10.617|34.95%|14.49%|

Artifacts include final actual/reference crops,50% overlays,3× display diffs, before→after raster diffs, computed styles/all notification row/title/icon/time bounds, close artwork crops, traces and `geometry-paint-summary.json`. Mean differences include dates, glyphs/fonts and nonidentical rasterization. A lower metric does not certify design acceptance. No approved tolerance exists.

### Remaining visible differences — not silently excluded

`visual/reference-landmarks.json` records recoverable native-raster landmarks with estimated±2px uncertainty; text ink coordinates are not equivalent to CSS line boxes. The following remain visible after the four corrections:

| ID / severity / class | Reference vs final actual | Required disposition |
|---|---|---|
| VQ-NC003-05 / P2 / IMPLEMENTATION_DEVIATION | Tablet search top431 vs422.125 (~9px high); filter bottom574 vs557.125 (~17px high); first icon top661 vs645.125 (~16px high); search/list left94 vs98.456 (~4.5px inset); icon left112 vs116.456 (~4.5px inset) | OPEN composition/spacing mismatch. Existing scoped fixes do not close this. Design Guardian must map remaining geometry to authorized tokens/values before further implementation. |
| VQ-NC003-06 / P2 / IMPLEMENTATION_DEVIATION | Tablet unread fill1 reference y752–865 vs actual739.125–855.125; fill2 reference867–980 vs857.125–972.125. Gap is corrected, but row placement/height remain different. Unread title ink reference x247 vs actual ink~238; list footer divider source1439 vs actual1453.125 (~14px low) | OPEN row composition/content-inset mismatch; do not declare all tablet row fidelity PASS from corrected2px gap. |
| DG-NC003-01 / DESIGN_GAP with visible discrepancy | Desktop heading ink reference top~146 vs actual~141 (~5px high), header icon source135 vs133 (~2px high). Tablet header/icon/text optical size, font shape/weight, list glyph style/stroke and some border/fill raster appearance differ visibly. Current computed font family Public Sans, h2 desktop22px/30px and portrait32px/42px; exact source font/vector/raster provenance absent | OPEN. Preserve approved typography/icon system pending authority. This records visible discrepancy rather than excluding it from review. No pixel-perfect font/icon PASS. |
| DG-NC003-02 / DESIGN_GAP | No approved comparison tolerance; source PNG alone does not certify original DPR or all UI-state behavior | BLOCKS overall visual acceptance; request design authority/tolerance through S00#1, not an arbitrary new snapshot. |

The parent may map these local visual IDs into its consolidated defect register. No additional arbitrary typography, glyph, global shell or business changes are requested by this report. Shell remains excluded from metrics because separately LOCKED. Dates27/10 and26/10 remain legitimate current sample data, not business constants to rewrite.

## Final Visual QA verdict

### Handoff for coordinated residual disposition

Parent requested Design Guardian review before closing the task with residual P2 findings. `visual/residual-geometry-76059cc.json` supplies exact owning selectors, actual CSS bounding boxes, source raster estimates/method limitations and a coordinated correction proposal. This report is a current-source handoff, not final task acceptance.

Proposed bounded composition work: retain the verified modal/close fixes; first align header divider/search/filter as one stack (header bottom~405, search top431, filter bottom574; horizontal toolbar/group inset~32px rather than36px), then align group divider~643 and row geometry while preserving auto height for long text and the2px unread separation. The reference unread fill extends~13px beyond the group/search right edge, so row-width mapping needs explicit DG disposition. Coordinate footer height~83px vs current69px to bring its boundary1453→1439 while keeping label/action/scroll containment. These values are candidates derived from the native raster, not recovered approved global tokens. Do not implement piecemeal offsets, global font replacement or sample-ID row heights. The artifact details dependency/order and required same-source retest profiles.

**PARTIAL.** Four bounded visual corrections independently verified; seven real-app profiles have successful final captures/checks, with the one failed host-network attempt preserved. **Overall visual fidelity remains BLOCKED** by the open P2 composition discrepancies and missing exact typography/icon/tolerance authority. Do not interpret local geometry checks, improved Tablet diff, component build or independent functional PASS as whole-screen visual PASS. Hosted preview exact SHA, CI/release and full functional/a11y acceptance remain owned by their respective agents; this report makes no production or rollout claim.

## Superseding final independent retest — source 830f83d

Source `830f83d48eac84c3e2467de7f41c388439cc7eb2` supersedes the historical76059cc disposition above. S00#6 approved the coordinated portrait composition and uniform113px row minimum, with112px compensation only for the adjacent-unread2px border. Original references, original before,76059cc after and their reports/metrics remain unchanged. Final successful actual/reference/overlay/diff/trace evidence is in `visual/after-830f83d-recovery-ignored-temp/`. Start/end SHA match830f83d and runtime source was clean throughout.

### Environment failures and bounded recovery

The initial830f83d capture attempt retained a Desktop bootstrap `net::ERR_NETWORK_CHANGED`/login timeout and subsequently aborted at `tracing.stop: ENOSPC: no space left on device, write`. Its Tablet screenshots exist, but incomplete tracing/provenance does not certify that namespace as a completed run. Disk audit recorded C:1.69GB free versus E:234.99GB free. Default Playwright temporary files were on C:. A first process-only E: scratch attempt was interrupted when S00#1 requested ignored scratch. The completed bounded recovery used only process `TEMP`/`TMP` pointing at `output/hn-nc-003-visual-temp-830/`; no global settings changed. Both incomplete namespaces remain separate.

`visual/environment-events-830f83d.json` retains the error, disk audit and recovery details. Automatic policy review blocked the proposed own-scratch cleanup/process-stop command; no deletion occurred. `visual/.gitignore` excludes that aborted temporary browser scratch; final scratch is under ignored `output/`. No other user directory was touched. Do not derive repeated stability PASS from this environment recovery.

### Completed affected-profile batch

Six successful real-app VI/light profiles on830f83d:1774×887 DPR1,992×1586 DPR1,800×1280 DPR2,900×1440 DPR1,900×1100 DPR1 and801×1100 DPR1. Unaffected1920 was not repeated.801×802 was not independently captured on this final SHA; the shorter profiles independently exercised24px containment at900×1100 and801×1100. All six had zero console/page/network errors, modal/document horizontal overflow absent, in-viewport modal bounds,44×44 close target, search1/unread2,16 Tab containment and Escape→bell focus. Each portrait exercised detail, read→Back, unread→Back and focus restoration with computed row bounds at every stage. Detail screenshots retain visible/contained card, actions and footer. Only safe browser-local MOCK state was changed.

### Coherent landmark correction and residual row density

| Tablet native landmark | Reference raster estimate | Final CSS measurement |
|---|---:|---:|
| Search x/y/right |94 /431 /909|94.456 /431.125 /908.456|
| Filter bottom |574|574.125|
| Today group divider |643|643.125|
| Yesterday group top /bottom divider |1125 /1191|1125.125 /1192.125|
| List row x/right |94 /922|94.456 /922.456|
| Footer x/divider y/right |94 /1439 /909|94.456 /1439.125 /908.456|

These are optical raster estimates with±2px uncertainty, not newly approved all-pixel tolerances. Group/search/footer and row width now form one coordinated composition. Final icon Y deltas against the six source estimates are **+3.625,+5.625,+4.125,+0.625,+1.625,−0.375px**. Maximum5.625px remains **VQ06 P3 OPEN**, alongside visible unread text inset/optical glyph differences; no extra severity entry is counted for each manifestation.

Strict all-row-bounds equality across read/unread is **false** for the801..1100 portrait profiles: marking the second item read changes only its following unread neighbor from native y872.125,h112 to y871.125,h113; restoring unread returns y872.125,h112. All other native row anchors and the footer remain unchanged. This is the measured1px adjacent-unread border compensation, not a new broad selection jump or evidence of exact invariance.800×1280 DPR2 has exact all-row equality. Raw stages and boolean results are retained in `geometry-paint-summary.json`; S00#6 confirms EXPECTED_STATE_BOUNDARY_COMPENSATION: the containing li slot remains2+112=1+113=114 and later rows/footer stay fixed. The strict button-equality assertion remains false; this expected boundary state does not create a second defect count.

The earlier owner characterization of the superseded108px candidate as a measured selection jump was inaccurate: its raw normal detail/Back bounds were identical. Reject that candidate because the Design Guardian superseded its state-dependent density rule; do not report it as a reproduced browser defect. This is separate from the current measured1px border compensation described above.

### Final comparison and traceable defect count

Immutable reference modal crops, no resampling: Tablet mean absolute RGB difference **22.517 before →10.617 interim →8.503 final**; pixels with any channel delta>10 **34.95%→14.49%→10.78%**. Desktop stays **9.540 /13.38%** and its entire final actual raster has identical pixels to the76059cc actual capture. Geometry/interaction checks do not establish all-pixel acceptance.

Canonical visual mapping for consolidated reporting: **VQ01–VQ05 CLOSED/VERIFIED (5); VQ06 PARTIALLY_CORRECTED, P3 OPEN (1)**. Historical P2 row/toolbar findings above are superseded by this mapping and must not be double-counted. VQ06 carries the residual icon/row optical offset and1px border-compensation disposition. Typography/icon source authority and missing comparison tolerance remain **DESIGN_GAP**, not extra counted runtime defects. Independent Functional QA owns canonical FQ01–FQ05; this report neither duplicates nor certifies their verdicts.

### Final Visual QA handoff

**PARTIAL; overall pixel fidelity acceptance BLOCKED by missing typography/icon/tolerance authority; VQ06 remains P3 OPEN.** Final evidence, all executed outcomes and exact source provenance are reviewable; no baseline was replaced or business implementation changed by S00#3. No visual all-PASS, repeated stability guarantee, hosted preview provenance or rollout approval is claimed.

Local real-app preview remains running for user review at `http://127.0.0.1:5233/#/preview/S15` on source830f83d, Vite tool process session53084. Open the shared bell after safe demo login. This is a local source preview, not the public deployed candidate and not proof of hosted SHA.


Final evidence freeze:45 files in the completed recovery namespace, including6 trace ZIPs with CRC validation successful. Manifest `visual/final-artifact-integrity-830f83d.json`; incomplete/aborted namespaces and ignored browser scratch excluded. Design Guardian disposition of the1px read boundary is EXPECTED_STATE_BOUNDARY_COMPENSATION, not an additional bug or all-button-invariance PASS. No further captures/calibration performed after this freeze.
