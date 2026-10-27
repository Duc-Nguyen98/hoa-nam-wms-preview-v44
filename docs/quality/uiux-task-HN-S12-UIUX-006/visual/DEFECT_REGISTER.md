# S12 Visual / data discrepancy register

## Latest retest status

**V01 FIXED / VERIFIED** on base bfec706 plus source diff SHA-256 `c522fe5b3d7f69cd37320846095c950030e4737238d2d2b94d2abae5f0e79778`. Both profiles render31/31adapter records in source order and show count31. Eight actual AFTER states and eight actual before/after diff sets complete; no observed visual regression. See [AFTER_RETEST_REPORT](AFTER_RETEST_REPORT.md) and [comparison receipt](retest-v01-workingtree/COMPARISON.json). V02/G01–G04 remain OPEN; exact fidelity remains PARTIAL/BLOCKED by normalization/scenario gaps. The table below preserves base BEFORE findings and does not override this latest status. Parent requested this update; historical BEFORE manifest hashes represent the pre-update reports.

## Historical BEFORE findings

Task HN-S12-UIUX-006 · base bfec7060cdf422a112ec5e644bf0b51401d9bda2 · S00#3

| ID | Severity / class | State / evidence | Finding, root-cause candidate and disposition |
|---|---|---|---|
| V01 | **P1 OPEN · data integrity / IMPLEMENTATION_DEVIATION** | Actual desktop+tablet normal list, [receipt](before-normal-bfec706/results.json) | Actual adapter snapshot has31receipts; only4visible/count4. `OperationalReceipts.tsx` filters through `REFERENCE_RECEIPT_CODES`/`LIVE_DEMO_RECEIPT_CODES`/PV-PN prefix before search/status, hiding other real source rows such as HN-PN. No source contract authorizes artwork-specific receipt exclusion. Reported to S00#1; S00#2/functional must remove unauthorized concealment without inventing data and retest count/selection/search. No source fix by Visual QA. |
| V02 | P2 OPEN · geometry / DESIGN_GAP pending normalization | Synthetic tablet3-card list [review board](before-synthetic-bfec706-isotropic/tablet-list/review-board.png), [registration](before-synthetic-bfec706-isotropic/registration.json) | At800CSS/DPR2, same3-row fixture list scope is1310CSSpx high; width-normalized reference projects1069.71, residual+240.29. Cards752×314CSSpx; current tablet typography/min-height cascade is not scaled by container width. No overflow; content is scroll-reachable. Source CSS viewport/DPR is unknown, so this is a measured density candidate, not approved exact CSS correction. Resolve QA profile/reference normalization before geometry change; no auto-pass. |
| G01 | DESIGN_GAP OPEN · exact fidelity | All8references, Design Guardian manifest/matrix | Source images do not establish CSS viewport/DPR/font scale/icon/color values. Canonical QA profiles declared1920×1080DPR1 /800×1280DPR2. Comparison uniform-width/padded only. Exact fidelity BLOCKED, no numeric pixel threshold PASS. |
| G02 | DATA_CONTRACT_GAP / SCENARIO_DISCREPANCY OPEN | Normal populated/detail vs REF02/03/04/05 | Normal PN0012/11/10/09 are POSTED with1code, reference3receipts DRAFT/zero. Truthful actual captures preserved. Existing read-only3draft fixture supplies diagnostic composition, not app acceptance. Missing artwork type is not permission to replace PRODUCT/COMPONENT with fake `—`. |
| G03 | DESIGN_GAP / integration disposition | REF02 separate empty illustration | Artwork has a separately titled empty illustration under populated data; normal live UI must not assert a false zero-row result. Design Guardian registered illustration separately. S00#1 disposition required before treating omission as a deviation. |
| G04 | SCENARIO/ACTION_GAP OPEN | Synthetic draft detail | Actual eligible draft exposes `Sửa thông tin`; artwork footer has refresh/close. Preserve existing permitted edit behavior until contract decision. No source-removal instruction inferred. |

## Verified non-defects on base capture

- Eight normal-route states captured; fresh UI login works. Zero console errors/warnings and failed network responses in actual capture.
- Desktop table → tablet cards works. No horizontal page/modal overflow. Modal footers reachable. All modal buttons/copy targets≥44CSSpx.
- Actual invalid submit produces3errors,201/200 counter, associated errors and first-invalid focus. No red-border-only acceptance claim.
- Actual data status/type/count preserved. Existing fixture0commands is recorded separately.

AFTER status: **NOT_RUN**. Visual verdict **PARTIAL**, data-integrity gate **FAIL** while V01 remains open. This register is an independent QA result, not release approval.
