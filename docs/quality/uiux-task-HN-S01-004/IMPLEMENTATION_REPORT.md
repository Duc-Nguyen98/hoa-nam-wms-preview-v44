# HN-S01-UIUX-004 — Implementation receipt

Owner: S00#2. Date: 2026-10-27. Explicit checkout: `E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026`. Base `06954a99885f7c9e808bf9a5556c7dd6c0d6b9a2`, base source tree `65ac25d235682469452f60d50664b3e6acb3a753`. Root integrated the seven supplied source/test files as `60b76b91764644996d9c69c9c08833ed76036a89`, final source tree `c8046fc38e251eeda1964da55531462b137c0554`; this role made no commit. Requested fallback Sol/high; actual model/reasoning telemetry UNVERIFIED.

**Implementation supplied; independent AFTER acceptance is owned by S00#3/S00#4. Exact fidelity remains BLOCKED.** Four actual BEFORE states and clean-base source receipts were read before edits. Read repository AGENTS, task packet, acceptance matrix, gap report, independent visual report, raw native/canonical geometry, owning CSS, controller and source-adapter contracts. No baseline, source fixture, shared component, shell, Notification, font, icon or palette file changed.

**Round2 supersedes the initial F-PAGING completion assumption below:** independent actual-app QA found FQA-002 on `60b76b9`: HTTP browser MOCK still exposed option4 from a separate reader/validator. Initial local factory tests did not cover that path. Additional reader/domain correction and direct domain tests are recorded at the end; a new root commit and independent actual-app retest are required before calling this gate complete.

**The later explicit pending3 projection section supersedes the earlier blanket scenario mismatch blocker:** original source5 remains truthful, while the additional test-only `reference-pending3` state supplies the artwork's3 as an openly synthetic, separately identified comparison scenario. Its unverified document CTA is disabled. The original source-backed modal recipe remains separate with its verified CTA.

## Changed files

- `src/features/S01/overview.css`: owning feature spacing, minimum target sizes and removal of the inaccessible Desktop badge override.
- `src/contracts/overview.ts`: default page size now derives from shared `DEFAULT_PAGE_SIZE` (10); existing September period unchanged.
- `src/controllers/overview-runtime.ts`: production options now exactly `PAGE_SIZE_OPTIONS` (10,15,25,50).
- `tests/s01/reference-scenario.tsx` (new): pure test helper supplying explicit initial page4 and isolated options4,10,15,25,50 to the real controller and unchanged source fixture adapter.
- `tests/s01/harness.tsx`: `state=reference` uses that helper and real OverviewScreen. Existing synthetic robustness states use supported internal size25 instead of invalid100; no synthetic100 policy option remains.
- `tests/s01/fidelity-policy.test.ts` (new): normal/default/lock and rejected4 checks; isolated4 source/counts/unknown/PX-0007/CTA checks.
- `tests/overview-detail.test.ts` (explicit additional lease from root): existing four-page coverage now explicitly uses the isolated four-row query/policy. Assertions and complete-record coverage retained.

Comparison URL is `/tests/s01/harness.html?state=reference`. This is the existing unbundled test entry, not a product route or production query flag. Adapter results retain `SOURCE_FIXTURE`, the original snapshot ID, all source records, attention aggregate5 and three displayed attention items. The verified PX-0007 document CTA remains available. The synthetic long/empty/missing states keep their separate `QA_SYNTHETIC` identity.

## Corrections and implementation measurements

These smoke measurements are diagnostics, not independent AFTER QA or accepted tolerances. Full data: `implementation/smoke-results.json`; reproducible browser script: `implementation/smoke.mjs`. No reference pixels were rewritten or stretched.

| Finding | Owning correction | Smoke result / remaining limit |
|---|---|---|
| V01 / Desktop modal field alignment | Desktop-only field column gap12→45. Icon column28 retained. Tablet column60/gap42 retained. | Desktop text modal-local x65→98; reference≈98. Icon-to-label delta40→73 is a separate metric from modal-local x98. Tablet local text139 and icon-to-label102 remain unchanged; manual reported≈142 is not relabeled an exact CSS token. |
| V02 / Tablet field pitch | Existing tablet field padding-bottom22→14; row gap22 and typography unchanged. | Repeated pitch119→111. Declared793×1983 diagnostic full modal710×1402→710×1346. Reference≈708×1331; width-isotropic comparison still has about11px excess, native heights differ15px. Remaining header/section/text residuals require independent review; no further guessed compaction. Canonical800×1280 body scroll exposes ID and footer; ID is not missing. |
| V03 / Tablet Dashboard accumulation | Feature heading grid gap10→2. Existing metric padding16→13 vertically. Intrinsic foot remains intact. | At992: heading/KPI top296.5→288.5 (ref289); metric rows154→148 and grid322→310 (ref≈309–310); attention634.5→614.5 (ref612); quick903.5→883.5 (ref881); activity1045.5→1025.5 (ref1021). At800, unknown helper wraps fully and card grows to172 rather than clipping. |
| V04 / Desktop controls/density | Search wrapper vertical padding0 and input margin-block−1 align the44px input with44px selects. Shared minimum governs all interactive rows. | Search/select bottoms and44px heights align. Isolated4 Desktop activity height369→418; top593→597 and bottom962→1015. Extra height follows minimum target correction; artwork bottom933 cannot be pursued by shrinking targets/hiding rows. Exact density fit remains BLOCKED. |
| F-PAGING | Default uses shared10; runtime only shared options. Page4 is test-injected. | Normal10 rows; isolated4 rows/four pages/16 total. Normal request4 is blocked with `PAGE_SIZE_UNCONFIRMED` while last accepted10 remains. Source/summary/chart/attention equal unchanged adapter values. |
| FQA-001 / badge contrast | Removed Desktop orange/white override; existing warning pair and dark-theme rules apply. | BEFORE white on orange≈1.879:1 at12px700. Smoke light `rgb(164,94,9)` / `rgb(255,247,232)` =4.714093:1; dark `rgb(240,189,114)` / `rgb(73,56,32)` =6.539172:1. No sampled replacement palette added. |

### A11 / F-TARGETS

Root explicitly extended the CSS correction to measured feature targets. BEFORE native Desktop computed bounds include period trigger40px, attention link34.5px, attention action32px, sort36px and filter selects36px; Tablet filter selects42px. Modal copy/close already met44 and were preserved.

Corrected existing owning rules for document links/actions, table sort/rows, filter inputs/selects, Desktop period controls and mobile action hit areas. Tablet attention action grid cells now reserve44px. The implementation scan of every visible S01 button/input/select at1920,800,1672,992 and793 found zero dimensions below44. Document scroll width equals viewport width in these smoke profiles. This is targeted implementation evidence; independent keyboard, touch, contrast, focus and impacted regression gates remain with S00#4.

## Verification

| Exact command / check | Result |
|---|---|
| `npx tsx --test tests/s01/fidelity-policy.test.ts tests/s01/document-navigation.test.ts` | 6/6 PASS. |
| `npx tsx --test tests/s01/*.test.ts` | 6/6 PASS after contrast correction. |
| `npx tsx --test tests/overview-detail.test.ts tests/s01/*.test.ts` | 12/12 PASS after explicitly migrating the legacy four-row scenario. |
| `npm run build` | PASS twice, including typecheck; final runtime build assets CSS `index-D33OJozD.css`, JS `index-B3wVe3wM.js`, build ID `48fb397feb888c06ac7b6854da2aa4d58cbd09b1da0cdb1a49dcb5aa461cc49d`. Vite reports its existing >500kB chunk warning. |
| `npm run typecheck` | PASS again after the test-only migration. |
| `npm run quality:contract` | PASS:13 states/26 references/immutable source policy. |
| `git diff --check` | PASS. |
| `node docs/quality/uiux-task-HN-S01-004/implementation/smoke.mjs` with per-process TEMP/TMP under ignored E output | Five source-backed reference profiles; zero page errors, zero small visible S01 targets, zero horizontal document overflow, exact PX-0007, reachable system ID, CTA available; light/dark badge contrast recorded. |
| Synthetic harness states empty/long/missing | 0/60/16 result totals,0/10/10 table rows, zero page errors. Raw `implementation/harness-smoke-results.json`. |

Implementation Vite5273 was launched from this E checkout with `npm run dev -- --host 127.0.0.1 --port 5273 --strictPort`. Parent notified source-ready before independent AFTER capture. No further source correction is planned. First remediation batch only; no three-round loop or baseline update occurred.

## Retained failed attempts and limits

1. Initial browser smoke attempted existing5271 and received `net::ERR_CONNECTION_REFUSED`; no product conclusion follows. Started role-specific5273 and reran successfully. Initial successful profiles used1672×1080/992×1280; preserved as `implementation/smoke-initial-profiles.json`, then reran declared diagnostic heights941/1586 and added793×1983.
2. Initial `npx tsx --test tests/overview*.test.ts` yielded5 PASS/1 FAIL: legacy first test asserted default4 at line15, actual10. Root granted the test lease; converted it to explicit isolated4 without weakening four-page coverage. Subsequent combined12/12 PASS above.
3. Read-only `rg` with a Windows wildcard path `src/shared/*dark*` returned path syntax error; accessible dark badge was then resolved and measured in the browser. No conclusion relies on that failed lookup.
4. The first synthetic harness smoke command omitted task-specific TEMP/TMP; preserve its receipt separately and rerun with the required E process environment. No W path was used by this role.

Unresolved exact typography, glyph paths, scoped palette approval, source DPR/viewport and pixel tolerance remain the Design Guardian gaps. Pending source5 versus artwork3 remains an explicit scenario mismatch. Normal10 density intentionally differs from the isolated artwork4. V02 residual height and V04 accessibility-versus-artwork density prevent unqualified fidelity PASS. Independent final source-qualified visual/functional/release results supersede this implementation smoke for gate decisions.

## Round2 — FQA-002 actual HTTP browser MOCK paging

### Independent failure and authorization

S00#4's independent AFTER actual-app capture on `60b76b91764644996d9c69c9c08833ed76036a89` found normal default10 but dropdown options `[4,10,15,25,50]`. The application injects its HTTP controller; browser MOCK reads `baselineReaders.S01`, which independently instantiated the fixture adapter with hardcoded4. `decodeBusinessQuery` also explicitly allowed4 for S01. The initial runtime-factory test passed while this real application path failed. That failed browser evidence remains owned and preserved by S00#4; it is not overwritten by the local successful factory checks.

Root extended the lease to `src/preview-mock/readers.ts`, `src/preview-mock/domain.ts` and `tests/s01/fidelity-policy.test.ts`. Read-only diagnosis occurred while independent QA was finishing. Source edits began only after root's explicit `FREEZE_RELEASE` on base60b76b9. This is remediation round2 for F-PAGING; it changes no CSS or scenario fixture.

### Three-file correction

- `src/preview-mock/readers.ts`: S01 now passes `OVERVIEW_RUNTIME_POLICY` into its adapter, removing the separate production options declaration. Other screen readers remain unchanged.
- `src/preview-mock/domain.ts`: S01 validates page size against shared `PAGE_SIZE_OPTIONS`; other screens retain their existing10,15,25,50 literal. The common size list is typed `readonly number[]` for runtime numeric query validation. Date policy, sort/filter validation, permission and request handling remain unchanged.
- `tests/s01/fidelity-policy.test.ts`: adds direct `baselineReaders.S01.read` and `readPreviewDomain` coverage. Verifies default10, exact options10/15/25/50, all four allowed sizes, source provenance/16total and rejection of4 in both reader and domain. `_scenario=reference` does not enable4 in the product HTTP domain. Existing isolated-controller test still proves4 accepted through the separate test injection.

The generic fixture and `queryOverviewRows` retain explicit4 support for isolated QA. No source data, unknown stock, September defaults, DatePicker behavior or verified CTA is changed. Cumulative source/test files across both rounds: **9 unique files** (initial7 plus the two preview MOCK files).

### Verification and retained compiler failure

1. `npx tsx --test tests/overview-detail.test.ts tests/s01/*.test.ts`: **14/14 PASS**, including the two real browser MOCK path tests and unchanged isolated4 coverage.
2. Initial round2 `npm run build` stopped at typecheck with `src/preview-mock/domain.ts(52,121): TS2345: number is not assignable to 10 | 15 | 25 | 50`. This was a TypeScript literal-tuple inference issue in `.includes`, not a runtime policy rejection. Added an explicit readonly numeric-list variable; no query semantics were weakened.
3. Repeated combined14/14 tests: **PASS**. Repeated `npm run build`: **PASS**, including `tsc --noEmit`. CSS `index-D33OJozD.css`, JS `index-C5EeRRaA.js`, local build ID `3f3c3516585cf07392663668b1122fd7768f0b3df7214144e6bb95ec5bf3363c`. Existing >500kB Vite warning remains.
4. `git diff --check`: **PASS**; Git noted ordinary LF→CRLF normalization for the test file, with no whitespace error.

Root notified round2 source-ready after all checks. This role did not commit or run independent final QA. Actual-app F-PAGING acceptance remains pending the new exact source commit and S00#4's independent browser retest; no source-ready message is a final product PASS. Existing V02/V04/exact-design limitations remain open.

## Additional V08 repair — Tablet number/type overlap

Before root committed round2, S00#3 reported a newly introduced regression on60b76b9:44px document buttons vertically centered the number text while the existing type text remained positioned6px from the card bottom. With the heading using `display:contents`, those text ranges overlapped7px at800 and8px at992. Root extended the existing feature CSS lease to repair this bounded regression; this is V08 round1.

Reproduced all four source-backed reference rows at800/992 before editing. Raw DOM Range geometry and full metadata are retained in `implementation/mobile-row-before.json`. The reference crop `visual/after-reference/tablet-native-activity-crop-2x.png` was inspected. Changed the **existing**561–1100px rule for `.ov-mobile-row .ov-document-link` to `display:flex; align-items:flex-start`, aligning number text to the top inside its unchanged44px button. No font size, row data, type position, card height or responsive breakpoint was changed.

`implementation/mobile-row-after.json` records positive text gaps for every row: **+2px at800, +1px at992**. Buttons remain44px high and145/190px wide respectively. Type/date/actor/quantity/status/action text is retained. The targeted smoke script `implementation/mobile-row-smoke.mjs` exits unsuccessfully for a nonpositive gap or a button dimension below44. This is implementation diagnosis and verification; independent AFTER Visual QA retains acceptance ownership.

### Combined source-ready receipt

Relative to60b76b9, the combined candidate changes exactly four files: `src/preview-mock/readers.ts`, `src/preview-mock/domain.ts`, `tests/s01/fidelity-policy.test.ts` and `src/features/S01/overview.css`. Existing source fixture and isolated4 injection remain unchanged. Root notified combined source-ready; this role makes no further source edits without another bounded repair.

- `V08_PHASE=after node docs/quality/uiux-task-HN-S01-004/implementation/mobile-row-smoke.mjs`, with per-process E TEMP/TMP: PASS at800 and992; before/after evidence retained.
- `npx tsx --test tests/overview-detail.test.ts tests/s01/*.test.ts`: **14/14 PASS** again after V08.
- `npm run build`: **PASS**, including typecheck. Combined build CSS `index-rMwZXeMz.css`, JS `index-D1SLZCxT.js`, local build ID `dc6f111b63246f77ecbffa4806f6b7e2decfdd379e09e0ef357bf9cb54a54609`. Prior round2 build listed above is an intermediate artifact preceding V08.
- `git diff --check`: PASS with only the previously recorded LF→CRLF informational warning.

Root must attach the final commit/source tree and repeat independent actual-app/visual checks. FQA-002's failed60b browser gate and V08's before overlap are retained, and neither is described as a final PASS by this role. Exact-design/V02/V04 limits remain unchanged.

## Explicit test-only pending3 comparison projection

Before final commit, S00#1 relayed S00#6's confirmed authority: the current user request permits a separately labeled synthetic pending3 scenario. No additional permission was required. The lease extends the existing `tests/s01/reference-scenario.tsx`, `tests/s01/harness.tsx` and `tests/s01/fidelity-policy.test.ts`; no application/resolver/business source change is made for this recipe.

| Recipe | Entry | Data identity / use |
|---|---|---|
| Normal application | Actual app S01 HTTP path | Original SOURCE_FIXTURE; waiting5; default10/shared options; verified PX-0007 CTA. |
| Source-backed reference4 | `/tests/s01/harness.html?state=reference` | Original SOURCE_FIXTURE; waiting5; isolated page4; verified CTA. Use for exact PX-0007 modal comparison where backdrop is excluded. |
| Explicit synthetic pending3 | `/tests/s01/harness.html?state=reference-pending3` | QA_SYNTHETIC; snapshot `isolated-s01-reference-pending3-v1`; waiting3; isolated page4; unverified document CTA disabled. Use for Dashboard artwork comparison. |

The synthetic adapter reads all16 original rows via supported source size25, copies each row, and applies exactly the declared changes below. It then runs the normal table query pipeline over those copied rows; counts, filtered totals, paging, chart and attention are derived from that same projection. Warranty4 and unknown stock remain the original source's distinct scopes. All16 original IDs, types, quantities, partners, actors and timestamps remain.

| Mutated ID | Original status | Synthetic status |
|---|---|---|
| `p12-stock-PN-0006` | waiting / Chờ xử lý trên Web | posted / Đã ghi sổ |
| `fixture-inbound-0005` | waiting / Chờ xử lý trên Web | posted / Đã ghi sổ |

The three remaining waiting IDs are `p12-stock-PX-0010`, `p12-stock-PN-0009`, `p12-stock-PX-0007`, in that order. `REFERENCE_PENDING3_SCENARIO` exports the distinct snapshot ID, preserved waiting IDs and explicit mutation records for independent QA. No total3 is derived from slicing the original attention array, and no source record is deleted.

The synthetic source is explicitly `QA_SYNTHETIC`, with a snapshot distinct from the original custody. Existing `acceptedOverviewDocumentHref` returnsnull for this provenance, so the UI disables the unverified document CTA through its existing guard. The original `reference` recipe and normal application retain their SOURCE_FIXTURE identity and verified CTA. PX-0007's number/type/Kho Hoa Nam/Cửa hàng An Bình/quantity2/Lan Nguyễn/19 September14:35/waiting fields are unchanged in both projections.

### Final combined checks and source-ready

`npx tsx --test tests/overview-detail.test.ts tests/s01/*.test.ts`: **15/15 PASS**. The new test proves16 preserved IDs,8in/8out/3waiting/13posted/warranty4/stockUnknown, declared two status changes only, exact unchanged PX-0007, matching chart, attention3, filtered totals3waiting/13posted, synthetic CTA unavailable, and original source5 still byte-equivalent at the mapped model boundary with its CTA available.

Initial added-test build failed at `fidelity-policy.test.ts(143,11)` with TS7022 inferred local `before`; adding explicit `OverviewRow` typing resolved the compiler issue. Repeated15/15 tests and `npm run build` including typecheck **PASS**. Production assets/build ID remain exactly the combined V08 build above (`dc6f111b…a54609`), confirming this extra test recipe is outside the production bundle. `git diff --check` PASS, with ordinary CRLF informational warnings only.

Final source-ready relative to60b76b9 includes exactly six files: `src/features/S01/overview.css`, `src/preview-mock/readers.ts`, `src/preview-mock/domain.ts`, `tests/s01/harness.tsx`, `tests/s01/reference-scenario.tsx`, `tests/s01/fidelity-policy.test.ts`. Cumulative unique source/test files remain9. Root notified for commit; no further edits are planned by this role. Independent QA must use and record the two different comparison receipts explicitly. Exact visual acceptance remains bounded by Design gaps and the V02/V04 residuals; synthetic scenario consistency does not itself prove visual PASS.

## Final source custody

S00#1 committed the combined candidate as **`f56e25cfc119f5a758f0cd48ebdc6a96e78f8a09`**, source tree **`72189a9c0bdb2aff13a0294fd2b66929b157273e`**, test tree **`3a61cae4bffcbda3f9e614eaaa02a38e637f3e64`**. `git status --porcelain -- src tests` was empty after commit. Final implementation verification is15/15 scoped tests, build/typecheck and diffcheck PASS. V08 before text gaps−7/−8 became+2/+1 at800/992 while retaining44px buttons. The synthetic pending3 recipe derives its counts from the declared16-row projection; original source5 and its CTA remain unchanged. Independent final visual/functional/release evidence is dispatched and owned by the respective roles; this implementation receipt issues no final visual PASS. Role complete, documentation only after final source freeze.

## Subsequent bounded V09-D footer geometry repair

After f56 QA processes finished and root released the source freeze, S00#1 routed a final geometry correction independently confirmed by S00#3/S00#6 under A09/A14. This is Desktop footer whitespace only; the existing16px spacing step is a trial supported by measured footer anchors, not a new typography/token/DPR approval. The sole runtime lease is `src/features/S01/overview.css`.

Reproduced the f56 source-backed PX-0007 modal at declared native diagnostic1672×941. Before: modal723px, footer99px, padding24px on both axes, both buttons50px high. Added exactly one rule in the **existing** `@media(min-width:1101px)` owning block:

```css
.hn-global-modal.ov-detail-modal .hn-global-modal__footer { padding-block:16px; }
```

After: modal707px, footer83px, padding-block16px, padding-inline24px, both buttons50px. The original reference footer≈82px corresponds to≈82.5px under the already declared modal-width transform; no source-DPR inference is made. Actual modal707×0.99375≈702.58px against reference698 leaves≈4.58px residual rather than the prior≈20px. This is improvement evidence, not an invented accepted tolerance or unqualified fidelity PASS.

Tablet800×1280 preservation check before/after: modal1248px (viewport constrained), footer105px, padding24px on both axes, buttons56px; all unchanged. No header/body padding, target, font, shared modal, GlobalShell, Notification, data or test source changed. No mirror unit test was added for the CSS declaration.

Reproducible measurement script and raw receipts: `implementation/footer-measure.mjs`, `implementation/footer-before.json`, `implementation/footer-after.json`. Per-process TEMP/TMP remained under ignored E output. Initial attempt to reuse5273 received `ERR_CONNECTION_REFUSED`; retained here as environment failure. Restarted `npm run dev -- --host 127.0.0.1 --port 5273 --strictPort` in the E checkout and successfully measured before and after.

Verification: `npm run build` **PASS**, including `tsc --noEmit`; `git diff --check` **PASS**. Source diff exactly one insertion in `overview.css`. Build CSS `index-Bn2ITLDh.css`, JS `index-Du0xhpXO.js`, build ID `ec968e1d011428db4aed1b5288e60bc34eabf960d0c2ffbc2c1ece239a7233e5`; existing large-chunk warning remains. Source-ready sent to root for a new commit. No source/test edits beyond this bounded rule are made.

Earlier full QA remains qualified to f56 and its recorded source identity. The new candidate requires root's exact commit plus S00#3's new four-state visual captures/diffs and S00#4's targeted modal-padding impact checks. This role does not relabel f56 QA as verification of the new source or issue a final four-state PASS.

Root committed V09-D as **`e18305b1e3b09c4402317d507d7008967284341b`**, source tree **`edd34681bf20a5281188e9da49cdc91876a0845d`**, unchanged test tree **`3a61cae4bffcbda3f9e614eaaa02a38e637f3e64`**. Source/tests were clean after root's commit. This role is complete; independent new-source QA owns the remaining acceptance gate.
