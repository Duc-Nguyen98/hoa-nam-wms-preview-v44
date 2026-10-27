# HN-S01-UIUX-004 — Dashboard and PX-0007 fidelity

Owner:S00#1. Date:2026-10-27. Branch DEV. Base06954a99885f7c9e808bf9a5556c7dd6c0d6b9a2, src65ac25d235682469452f60d50664b3e6acb3a753.

## Authority and scope

Explicit user request: auto-discover actual S01 and PX-0007, capture four BEFORE states, measure against originals3/4/5/6.png from C:/Users/Admin/Desktop/HN_Astra, fix verified defects, independent Visual/Functional/Regression and release audit.3=DashboardDesktop,4=DashboardTablet,5=PX0007Desktop,6=PX0007Tablet (verify image identity/dimensions/hash). Existing Design Contract1.2 recovery limits these images to page/modal content. Preserve separately locked GlobalShell/header/sidebar and Notification Center bytes. No production writes/merge/deploy, no baseline replacement, no hardcoding scenario into business defaults.

Safe comparison scenario: Kho Hoa Nam, September2026, inbound8/outbound8/warranty4/pending3/documents16, stockUnknown (notzero). PX-0007 /p12-stock-PX-0007, Cửa hàng An Bình, quantity2,Lan Nguyễn,19/09/2026 14:35,pending Web. Verify actual source/identity before asserting counts. Use existing test fixture through normal app if possible; isolate scenario safely if not. Preserve DatePicker contract/defaults; no fixed September production default.

Discovery qualification (2026-10-27): actual source fixture has five waiting documents and the attention section shows three rows. The artwork's badge3 cannot authorize changing the aggregate5 or deleting source records. Preserve aggregate semantics; record a scenario mismatch. Existing source also already defaults to September/page4; this is observed behavior, not new authority. Recovered shared pagination lock is default10/options10,15,25,50; page4 belongs only to the explicit isolated visual scenario. Any correction needs a bounded implementation packet and independent retest.

## Serialized ownership

|Role|Lease|Deliverable|
|---|---|---|
|S00#6 native s01_design_guardian|DESIGN_ACCEPTANCE_MATRIX.md,DESIGN_GAP_REPORT.md only in this task folder|Reference hashes/authority,4-state mapping,measurable scoped design acceptance,normalization/gaps|
|S00#3 native s01_visual_qa|visual/**,VISUAL_QA_REPORT.md|Four actual BEFORE real-app captures,computed geometry/reference overlays/diffs,actionable visual defects; AFTER on final source|
|S00#4 native s01_functional_qa|functional/**,DATA_SCENARIO.md,DATA_CONSISTENCY_MATRIX.md,FUNCTIONAL_QA_REPORT.md|Deterministic safe scenario,identity/counts,actual functional/impacted regression and limitations|
|S00#2|No runtime lease until confirmed defects + four BEFORE captures|Bounded owning component correction,leased later|
|S00#5|release/**,CI_RELEASE_REPORT.md after serialized dispatch|Git/CI/provenance/artifact audit|
|S00#1|This packet,AGENT_TRACE,DEFECT_REGISTER,REGRESSION_REPORT,FINAL_REPORT,integration|Evidence-backed routing/scope/verdict|

### Implementation lease — round1

Four BEFORE gate satisfied by `visual/before/capture-results.json` at unchanged base. Native S00#2 `s01_implementation` owns only `src/features/S01/overview.css`, `AcceptedRowDetail.tsx` if required, `src/contracts/overview.ts`, `src/controllers/overview-runtime.ts`, `tests/s01/harness.tsx`, optional new `tests/s01/reference-scenario.{html,tsx}`, new `tests/s01/fidelity-policy.test.ts`, and task-local `implementation/**` / `IMPLEMENTATION_REPORT.md`. Root owns integration/commit. No other source/shared/baseline leases.

Bounded repair: V01 desktop detail icon-to-text offset, V02 tablet repeated field pitch, V03 tablet KPI intrinsic height/downstream section offsets, V04 desktop filter/table wrapper excess while preserving44CSS targets; use Visual QA measured transforms and Guardian A02–A11. F-PAGING restores recovered shared default10/options10,15,25,50; comparison4 only in isolated real-component source-fixture test entry. Preserve September coverage/default behavior, aggregate waiting5/three visible, unknown stock and exact PX identity. Typography/palette/glyph gaps are not permission to guess. Independent QA follows a committed candidate; max3rounds/rootcause.

Round1 scope clarification: confirmed existing synthetic harness internal page100 is unsupported; correct internal read to supported25 without runtime data changes. F-TARGETS adds measured feature controls below recovered44CSS minimum (select36/table links-actions32/sort36); fix only via owning overview CSS within this lease. V04 exact artwork density may remain unresolved if44CSS targets require more height; accessibility/data integrity are not waived to force native933px fit.

### Implementation lease — round2 of paging root cause

Independent FQA found FQA-002 on committed round1 `60b76b91764644996d9c69c9c08833ed76036a89`: actual App→HTTP MOCK reader/domain retained option4. Source was frozen until both QA owners finished active runs and explicitly released it. Same native implementation owner now additionally leases `src/preview-mock/readers.ts`, `src/preview-mock/domain.ts` and the existing new policy test for this bounded repair. Reuse canonical production paging policy, remove S01-specific HTTP4 exception, keep other screen semantics and isolated source-adapter4 intact. Add actual-reader/domain coverage; no fixture/date/shared/global edits. Commit and independent final-source retest required. Initial failed candidate evidence remains immutable.

V08 added to round2 batch: independent VQA candidate1 verified Tablet activity number/type visible text overlap7–8px introduced by44CSS target correction. Same implementation owner may adjust existing feature number-text alignment in `overview.css`; preserve44CSS target and metadata. This is first remediation of the V08 root cause. No new font/token/row hiding authority.

### Deterministic reference scenario qualification

S00#6 decision `DG-S01-004-QA-SCENARIO-01` confirms the user's request authorizes a separate declared QA_SYNTHETIC pending3 derivative without modifying original/production data. Implementation lease includes existing test-only reference helper/harness/policy test to derive16rows,8/8/4/unknown and all totals/filter/pagination from one consistent cohort. Declare the two lower waiting→posted fixture adjustments and distinct QA snapshot; do not claim new Scanner business statuses. Preserve exact PX fields and original source waiting5. Existing navigation guard must keep synthetic CTA unverified/disabled; no SOURCE_FIXTURE/snapshot spoof or product resolver change. Dashboard comparison may use QA3; modal comparison/CTA uses original source5 with backdrop excluded. Normal application remains truthful source5/default10. Owner receipts must identify each scenario independently.

### Final bounded Desktop footer repair

After f56e25c full independent QA completed (34Node/29browser/21a11y groups), root review and VQA confirmed V09-D: Desktop footer99CSS vs reference-local82.5CSS. S00#6 `DG-S01-004-FOOTER-01` authorizes a feature-local existing16px whitespace step. Implementation lease for this repair is **only** `overview.css`: desktop>1100 footer padding-block16, preserve inline24/button50/Tablet24/shared bytes. No new font/color/token or acceptance threshold. Commit before independent final four-state evidence and targeted modal regression. Preserve all f56 evidence and transfer unaffected regression only through explicit one-property impact analysis.

## Closure receipt

Final tested source `e18305b1e3b09c4402317d507d7008967284341b`, src `edd34681bf20a5281188e9da49cdc91876a0845d`; tests `3a61cae4bffcbda3f9e614eaaa02a38e637f3e64`. Source/tests clean/frozen; all native role leases complete. Final exact-source34Node/12modal cases/localquality gate PASS,6Visualcapture profiles valid; broader29functional/21a11y groups source-qualified transferred fromf56 through one-property impact audit. Fidelity FAIL/exact acceptance BLOCKED,3P2visual roots remain open, CI billing blocked/visualNOT_RUN/publicdeployedSHAunverified. Frozen owner asset integrity508files/0invalid/100protected unchanged. Final verdict PARTIAL, no rollout/production merge/deploy. Documentation/evidence storage commit may advance DEV without changing tested source/test trees; see task FINAL_REPORT and AGENT_TRACE.

## Environment and execution

Use explicit E: repository workdir. Never write W:. Per-process browser TEMP/TMP must use ignored output/hn-s01-004-<role>-temp on E; do not put browser profiles/cache beneath docs. Do not clean other tasks/userdirs. Existing local Vite5233 may be reused only after exact source verification; use role-specific ports if needed. Fresh browser contexts/normal configured test auth only. All scenarios MOCK unless actual authorized integration verified. Preserve failed attempts; do not erase test history or relabel environment failure as product success.

Native runtime exposes gpt-6.1-sol/high fallback. Requested6.1Terra is not in current supportedmodel list (prior actual rejection retained in policy evidence). Do not label actual model/effort verified unless authoritative telemetry exposed. Use actual native handoffs, not independent chat assumptions.

## Gates

Audit first,no business changes. Capture BEFORE DashboardDesktop/Tablet and exactPX0007Desktop/Tablet before source edits. Source-qualified reports and independent QA after any fix. Max3 consecutive remediation rounds per rootcause; reanalyze/escalate after3 rather than suppress failure. Build/typecheck/contract/criticalfunctional,overflow,console,keyboard/contrast,shared impacted regression. Exact commit plus source-tree custody; NOT_RUN is not PASS. Missing font/vector/sourceDPR/tolerance remains gap, not invented tokens. Sidebar/globalchrome compared only with its own baseline. Deliver all4reference/actual/diff sets and reports; incomplete evidence explicitlyBLOCKED. CI/public preview exactsource provenance separate from localQA. No protectedbranch push or productionmerge/deploy. Source storage to GitHubDEV only after verifiednormalFF/unprotected and authorization carried from user.
