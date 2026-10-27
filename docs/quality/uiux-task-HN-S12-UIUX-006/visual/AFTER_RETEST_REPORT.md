# S12 independent visual retest

Task HN-S12-UIUX-006 · S00#3 · 2026-10-28 UTC+07

**V01 FIXED / VERIFIED. Scoped regression PASS; overall visual verdict PARTIAL.** Both actual-route profiles now render all31source receipts, in source order, and display `31 phiếu trong phiên hiện tại.` No horizontal overflow, unreachable modal footer or new console/network error was observed. Exact eight-reference fidelity remains blocked by source-profile/scenario gaps; P2 V02 tablet density remains open.

## Exact candidate

- Actual URL: `http://127.0.0.1:5290/#/preview/S12`, normal local preview MOCK via fresh real login/confirmation. No synthetic harness substituted.
- HEAD/base `bfec7060cdf422a112ec5e644bf0b51401d9bda2` plus uncommitted `src/features/S12/OperationalReceipts.tsx` allowlist removal.
- SHA-256 of raw `git diff --binary HEAD -- src`: **`c522fe5b3d7f69cd37320846095c950030e4737238d2d2b94d2abae5f0e79778`**.
- Working-tree OperationalReceipts bytes SHA-256: **`ac13b0f446e9bb2a7590f4dc2051cf9126244e17b9a55094fdbcd7278f196656`**.
- HEAD src tree `4360e98244c6308d14de19d50301fb0945c231f6` is the base tree, not a committed fix tree. Test status `?? tests/s12/` was recorded but those tests are not certified by this visual run.
- Capture2026-10-27T17:57:35.069Z–17:58:50.800Z; source diff/file hashes stable at start/end of both profiles. Chromium156.0.8078.4; VI/light; Asia/Ho_Chi_Minh; desktop1920×1080CSS/DPR1/no touch and tablet800×1280CSS/DPR2/touch.

## Eight AFTER and before/after diff sets

| Ref/state | AFTER actual | BEFORE actual | Diff/review |
|---|---|---|---|
| REF01 desktop create | [AFTER](after-normal-v01-workingtree-retry/desktop-create.png) | [BEFORE](before-normal-bfec706/desktop-create.png) | [diff](retest-v01-workingtree/desktop-create/diff-x3.png) · [board](retest-v01-workingtree/desktop-create/review-board.png) |
| REF02 desktop populated | [AFTER](after-normal-v01-workingtree-retry/desktop-list.png) | [BEFORE](before-normal-bfec706/desktop-list.png) | [diff](retest-v01-workingtree/desktop-list/diff-x3.png) · [board](retest-v01-workingtree/desktop-list/review-board.png) |
| REF03 desktop detail | [AFTER](after-normal-v01-workingtree-retry/desktop-detail.png) | [BEFORE](before-normal-bfec706/desktop-detail.png) | [diff](retest-v01-workingtree/desktop-detail/diff-x3.png) · [board](retest-v01-workingtree/desktop-detail/review-board.png) |
| REF04 tablet populated | [AFTER](after-normal-v01-workingtree-retry/tablet-list.png) | [BEFORE](before-normal-bfec706/tablet-list.png) | [diff](retest-v01-workingtree/tablet-list/diff-x3.png) · [board](retest-v01-workingtree/tablet-list/review-board.png) |
| REF05 tablet detail | [AFTER](after-normal-v01-workingtree-retry/tablet-detail.png) | [BEFORE](before-normal-bfec706/tablet-detail.png) | [diff](retest-v01-workingtree/tablet-detail/diff-x3.png) · [board](retest-v01-workingtree/tablet-detail/review-board.png) |
| REF06 tablet create | [AFTER](after-normal-v01-workingtree-retry/tablet-create.png) | [BEFORE](before-normal-bfec706/tablet-create.png) | [diff](retest-v01-workingtree/tablet-create/diff-x3.png) · [board](retest-v01-workingtree/tablet-create/review-board.png) |
| REF07 tablet validation | [AFTER](after-normal-v01-workingtree-retry/tablet-validation.png) | [BEFORE](before-normal-bfec706/tablet-validation.png) | [diff](retest-v01-workingtree/tablet-validation/diff-x3.png) · [board](retest-v01-workingtree/tablet-validation/review-board.png) |
| REF08 desktop validation | [AFTER](after-normal-v01-workingtree-retry/desktop-validation.png) | [BEFORE](before-normal-bfec706/desktop-validation.png) | [diff](retest-v01-workingtree/desktop-validation/diff-x3.png) · [board](retest-v01-workingtree/desktop-validation/review-board.png) |

[Capture receipt](after-normal-v01-workingtree-retry/results.json) · [before/after comparison and31-ID equality proofs](retest-v01-workingtree/COMPARISON.json) · [8AFTER/reference registrations](after-normal-v01-workingtree-retry-isotropic/registration.json).

## Results and limits

- **Data pool PASS:** desktop31/31rendered IDs equal source snapshot IDs, in original source order; tablet31/31likewise. BEFORE4/31. No status/type/count fabricated to resemble reference3draft/zero-code rows.
- **Modal regression PASS in observed scope:** all six dialog width/height pairs unchanged; tablet detail/create/validation component crops pixel-identical. Desktop crops differ by tiny raster edge values: grayscale difference>10 on8/390400create pixels,2/460800detail pixels,2/435200validation pixels; these are disclosed, not declared pixel-identical. Visual review found no content/layout regression.
- **Responsive safety PASS:** desktop table and tablet cards retained; no page or modal horizontal overflow across8states; all modal footers reachable and existing44CSSpx targets retained. More rows extend normal document scroll; full screenshots/diffs retain the entire list. Boards show only top2400rasterpx when a list is very long and are explicitly labeled.
- **Validation PASS in observed scope:** real submit yields3invalid controls,3-field summary,201/200 counter and first-invalid mode focus; same errors/values retained. Raw `validation.referenceLength` scalar has the documented selector caveat from BEFORE; use full invalid reference value + counter. No CRUD success, backend validation or RBAC gate is inferred.
- **Console/network PASS:** zero pageerror/console warning/error; zero request failure/HTTP≥400 on successful desktop/tablet retry. All contexts closed; credentials/session never persisted.
- **Environment failure retained:** first [after-normal-v01-workingtree/results.json](after-normal-v01-workingtree/results.json) has0captures and connection-refused errors because local Vite was terminated by interruption. Server restarted; fresh successful retry is the acceptance receipt. Failed evidence was not overwritten.
- **Reference fidelity PARTIAL:** original source CSS viewport/DPR unknown. Tablet3-card density V02 remains open; artwork empty illustration, missing type and draft actions remain registered scenario/design gaps. Synthetic BEFORE harness remains diagnostic only; no synthetic AFTER is needed to verify this actual-data fix.

No implementation/source/test/reference file was edited by Visual QA. This is exact working-tree evidence; a later committed candidate requires source-equivalence registration or fresh retest before claiming that commit's acceptance. Hosted CI/deployment status is outside this report.
