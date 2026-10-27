# Defect register — HN-S01-UIUX-004

Owner: S00#1. Base `06954a99885f7c9e808bf9a5556c7dd6c0d6b9a2`, src `65ac25d235682469452f60d50664b3e6acb3a753`. Initial triage from actual native S00#3/#4 messages and S00#6 artifacts. Remediation round1 assigned to `s01_implementation`; no CLOSED/PASS until independent candidate retest.

**Latest disposition:** source `e18305b1e3b09c4402317d507d7008967284341b`, src `edd34681bf20a5281188e9da49cdc91876a0845d`. The assignment rows below retain initial chronology; the final table at the end is authoritative. Overall PARTIAL / fidelity FAIL, release BLOCKED.

| ID / severity | Verified observation / scope | Acceptance / status |
|---|---|---|
| V01 / P2 | Desktop PX-0007 icon→field text offset40px vs approximately98 native-reference px after modal-local comparison. Owning detail CSS column gap. | Increase independently measured local spacing toward reference; preserve portrait layout, identity/actions and44CSS hit targets. ASSIGNED round1. |
| V02 / P2 | Tablet diagnostic modal710×1402 vs reference-local710×1330; repeated field pitch119px vs approximately111–115px accumulates excess height. Canonical body-scroll is not a missing-ID defect. | Correct repeated row spacing at owning rule; compare relative anchors and test top/middle/end scroll/footer independently. ASSIGNED round1. |
| V03 / P2 | Tablet diagnostic KPI grid322px vs reference310px; KPI top+7.5 and attention/quick/activity approximately+22.5px after reference-local comparison. | Correct intrinsic KPI grid/feature heading spacing, retain2×2/all content and locked shell. ASSIGNED round1. |
| V04 / P2 | Native Desktop activity/footer bottom962 vs reference933; wrapper/control/table density contributes excess height. | Inspect owning wrapper excess, correct independently supported spacing; no control-target shrink, data hiding or row removal. ASSIGNED round1; any irreconcilable44CSS-vs-artwork density remains reported. |
| F-PAGING / P1 | Source default4 and runtime option4 contradict recovered shared lock `HN_UI_SHARED_v1.1.2` default10/options10,15,25,50 and current isolated-scenario boundary. | Normal app defaults10 and offers locked options; source-backed isolated comparison4 remains test-only. Same16docs/KPI/unknown/PX identity. ASSIGNED round1. |
| QA-HARNESS / P1 evidence infrastructure | Existing `tests/s01/harness.tsx` requests internal pageSize100, rejected by shared query; empty/long/missing cases never reach intended state. Independent QA reproduced. | Use supported internal25 to read all16source documents; genuine synthetic states reachable, no runtime/business data change. ASSIGNED round1. |
| F-TARGETS / P2 | Implementation reproduced feature overrides reducing selects36, table links/actions32 and sort controls36CSS below recovered44CSS target minimum. | Correct measured feature-scoped targets in owning CSS, preserve all actions/data. Independent bounding-box/keyboard retest required. Authorized within existing lease. |
| FQA-001 / P2 | Independent normal-app computed white on orange Desktop attention badge contrast1.879:1 at12px700. Tablet existing warning pair4.714:1. Raw evidence `functional/before-accessibility/results.json`. | Remove inaccessible Desktop override and reuse existing accessible warning pair; no new sampled color. Check light/dark and unchanged aggregate count. ASSIGNED round1; implementation smoke reports4.714/6.539, independent retest pending. |
| FQA-002 / P1 | Independent AFTER on committed `60b76b9` found actual normal application still offers4/trang. `src/preview-mock/readers.ts` hardcodes4 and domain validator admits it; local controller policy tests did not cover this real App→HTTP MOCK chain. Failed browser screenshot/log retained. | Repair round2 of F-PAGING; unify actual S01 reader with runtime policy and remove S01 domain exception for4, retain isolated adapter4. Add real-reader/domain regression and independent actual-app dropdown retest. Source edit waits for active capture freeze release. |
| V08 / P2 regression | Independent VQA candidate1 measured activity card number/type text intersections7px@800 and8px@992 after44CSS target enlargement. `display:contents` heading, centered44-high button text and absolute type baseline collide. Actual crop/DOM ranges retained in `visual/after-reference/`. | Feature-owned number text alignment/gap repair, preserving44CSS hit area and all metadata. Assigned bounded first repair of this root cause within round2 batch; final independent text-range/visual retest required. |
| V09-D / P2 | Final2 independent computed Desktop modal footer99px (24+24 padding with50px buttons) vs source5footer82native≈82.5CSS at declared modal-width transform. Most of remaining Desktop modal height drift is actionable whitespace. | S00#6 decision `DG-S01-004-FOOTER-01` authorizes desktop>1100-only16px block padding trial, same inline24/button50/Tablet24. Bounded final repair assigned; new source commit and targeted independent QA required. Exact font/tolerance gaps remain. |

## Design/scenario limits, separate from product defect counts

- V05 / DESIGN_GAP: exact typography/palette/glyph metrics and accepted numeric visual tolerance unresolved. Preserve local font assets/tokens; [Guardian gaps](DESIGN_GAP_REPORT.md) define limits. No guessed-token fixes or pixel-perfect PASS.
- V06 / SCENARIO_MISMATCH: artwork badge3 vs actual aggregate5 with three visible attention rows. Preserve source5; do not equate visible count with aggregate, delete source records or hardcode a screenshot value.
- Reference6 source raster ratio differs from canonical Tablet; use documented isotropic modal-local diagnostic and separate physical-profile safety evidence. Do not stretch.
- September is existing fixture coverage. No approved new production DatePicker default/min/max/preset policy; preserve behavior.

## Failed attempts retained

Initial Functional browser attempts contain timing/selector/offline-cleanup harness failures. They remain in `functional/` with their raw logs/screenshots and are classified by the independent owner. A later corrected harness run is a retest, not first-pass success. No product defect is inferred solely from those harness failures.

## Final source-qualified disposition

| Root finding | Final state | Independent evidence / remaining scope |
|---|---|---|
| F-PAGING / FQA-002, P1 (one root cause) | CLOSED after round2 | Actual HTTP reader/domain locked10/options10,15,25,50;4rejected. Final34Node suite and e183 real-app visual receipts; f56 full functional and exact unchanged-code transfer. Local-controller-only false confidence was caught by independent QA. |
| V01, P2 Desktop field offset | CLOSED for measured alignment | Final field text modal-local x98; counterpart Tablet x139 retained. Typography/glyph and remaining overall modal-height difference are not waived. |
| F-TARGETS, P2 | CLOSED in tested scope | Final visual6profiles: no visible controls<44; final12modal cases intended and active hit-tested descendants meet44. Prior f56 independent112page targets/20modal controls remain qualified by one-property footer-only change. |
| FQA-001, P2 contrast | CLOSED in tested scope | Existing warning pair4.714light/6.539dark independently measured at f56; unchanged by final footer property. No sampled new color or baseline change. |
| V08, P2 Tablet text overlap | CLOSED | Final e183 profiles have0number/type text-overlap pairs;44CSS hit areas preserved. Earlier −7/−8px overlap and repair evidence retained. |
| V09-D, P2 Desktop footer whitespace | CLOSED for bounded repair | Final independent footer99→83, modal723→707, block16/inline24/buttons50; Tablet unchanged. Width-aligned full modal remains+5px and exact type/glyph/normalization limits remain. |
| V02 including Tablet footer composition, P2 | OPEN / improved | Field pitch119→111; native modal1402→1346. Width-aligned actual1342 vs reference1331, +11px. Actual footer105 vs reference-local130 and button geometry differ; usable/reachable but fidelity not accepted. |
| V03, P2 Tablet section accumulation | OPEN / improved | KPI grid322→310; native KPI top288.5, attention614.5, quick883.5, activity1025.5. Full scoped crop remains+24px; no invented tolerance approves it. |
| V04, P2 Desktop density | OPEN / contract conflict | Reference-aligned Dashboard crop933 vs853, +80px. Preserving shared44CSS targets increases control/table density. Shrinking targets, hiding rows or changing a locked compact variant is not authorized. |
| QA-HARNESS, P1 test infrastructure | CLOSED | Internal supported25read replaces rejected100; intended empty/long/missing states verified. Not a production warehouse bug. |
| V05 | DESIGN_GAP | Exact font scale/weights, glyphs, palette, original CSS/DPR and accepted tolerance incomplete. Do not turn observed CSS into approved tokens or replace baselines. |
| V06 | RESOLVED as explicit separate scenario | Test-only QA_SYNTHETIC3 comparison declared consistently; original SOURCE_FIXTURE5 and verified PX CTA preserved. The canonical app is not relabeled pending3. |

Known product root count: **9** (1P1 +8P2), counting FQA-002 under F-PAGING and Tablet footer residual under V02. **6 closed scoped repairs, 3 open P2**; known open product P0=0/P1=0. Test infrastructure and design-authority gaps are reported separately; absence of known P0/P1 does not make fidelity or release PASS.

## Final execution limits

Final e18334Node/12modal checks PASS after retained recovery. Earlier all-descendant assertion reported19.4375px without preserving button identity; its trigger remains unresolved and is not assigned a named product defect. The corrected run records every descendant identity/geometry/hit-test/inert state and reports0active undersized descendants, with explicit dialog/feedback cleanup. All failed scripts/logs/screenshots remain; no source behavior changed for that recovery. See Functional report for exact chronology and limits.
