# Functional QA report — HN-WARRANTY-PARTS-UIUX-001

**Area:** S09 warranty cases and S10 parts issue slips  
**Checkout:** `DEV`, commit `93371f4da9b6659d320a7c66d9b0862f89744a0d`  
**Run date:** 2026-10-28 (Asia/Bangkok)  
**Execution:** local Vite preview only; no production endpoint or customer data used. Legacy list checks are **MOCK** fixture adapters. Operational checks in `tests/warranty-parts` are browser-preview **MOCK** service/repository checks, not REAL_API certification.

## Results

| Area / assertion | Status | Evidence |
|---|---|---|
| S09 initial list, identity and source counts | **PASS** | `createWarrantyFixtureAdapter().read(DEFAULT_WARRANTY_QUERY)` returned `ready`, 7 visible detail rows, aggregate total 186, source `S09-P01-r02-detail`. |
| S10 initial list, identity and source counts | **PASS** | `createPartsFixtureAdapter().read(DEFAULT_PARTS_QUERY)` returned `ready`, 7 visible detail rows, aggregate total 84, source `S10-P01-r02-detail`. |
| Search | **PASS** | Exact case/slip search returned one row for each adapter; `ZZZ_NO_MATCH` returned a ready model with zero rows. Search fields are S09 case/identity and S10 slip/case/component. |
| Status / identity / due filters | **PASS** | S09 status filter accepted; S09 invalid due option and S10 invalid status returned `blocked` without publishing a model. S10 status filter is exposed. |
| Reset | **PASS** | Controllers reset with the UI's explicit defaults (`controller.reset({...DEFAULT_*_QUERY})`) and restored page 1, empty search, all filters and descending sort. |
| Pagination | **NOT_RUN / DESIGN_GAP** | Both source detail sets contain 7 rows and default page size is 10, therefore `pageCount=1`; no next-page interaction is reachable. A synthetic page-size-2 query is correctly rejected as `INVALID_QUERY` because supported options are 10/15/25/50. |
| Date filtering | **NOT_RUN / DESIGN_GAP** | S09 has only a “Tình trạng hạn” (due-status) filter; S10 has no date filter. No approved date-range contract exists for these screens. Date sorting is exercised by adapter projection only. |
| Detail identity / stale identity | **PASS (MOCK)** | S09 binding tests reject equal IDs from another session/generation/epoch; S10 reader tests reject stale generation and missing FK relationships. Operational detail tests retain exact case/issue IDs through refresh/reset fencing. |
| Refresh / loading / error / session | **PASS (MOCK)** | `s09-operational-binding.test.ts` covers read loss, retry/recovery, revoked session, stale versions and reset fencing. `s10-operational-binding.test.ts` covers read failure clearing detail, recovery, expired session, navigation fencing and coherent revision retries. |
| Empty / no-result / not-found | **PASS (MOCK)** | Legacy no-result models render zero rows; operational components provide “Chưa có hồ sơ…” / “Chưa có phiếu…” empty content and `record-not-found` PageState for a stale selected record. |
| Forbidden / unavailable | **PASS (MOCK contract)** | Operational adapter with `available=false` throws `COMMAND_UNAVAILABLE` (403); components map `COMMAND_UNAVAILABLE`, `SESSION_EXPIRED`, `MOCK_COMMAND_FORBIDDEN` and `CONFIRMATION_REQUIRED` to unavailable/session messaging. REAL_API permission behavior is not certified. |
| Copy controls | **PASS (source/static; browser NOT_RUN)** | Current legacy and operational S09/S10 details expose `data-s09-copy` / `data-s10-copy`, call shared `copyText`, and render success/error feedback. Browser clipboard click verification remains blocked by the local setup/harness issue below. |
| Linked warranty navigation | **PASS for S10 (source/static); PARTIAL for reverse S09** | Legacy `PartsSlipDetail` and operational `OperationalPartsIssues` expose `href="#/preview/S09"` / `data-s10-related="warranty-case"` plus the operational S17 link. `WarrantyDetailDialog` and `OperationalWarranty` still have no parts-slip relation link; legacy relation data is explicitly unavailable. |
| Explicit legacy route parsing | **PASS (MOCK/unit)** | `resolvePreviewRoute` accepts exactly `#/preview/S09?catalog=legacy` and `#/preview/S10?catalog=legacy`, rejects extra query keys/fragments, and registry canonical routes remain `#/preview/S09` / `#/preview/S10`. |
| Public browser flow | **BLOCKED** | Existing `node tests/warranty-ui/browser.mjs` now fails with Playwright `Execution context was destroyed, most likely because of a navigation` while its catch path evaluates the page. The harness still expects obsolete `.s08-confirm`/`.ov-result-count`; current auth uses `Bắt đầu làm việc`. A direct local attempt reached the PublicDemoGate but could not complete setup reliably. No OOM signal was observed and no production mutation occurred. |

## Unit/contract execution

Command: `npx tsx --test tests/warranty-ui/*.test.ts tests/warranty-parts/*.test.ts`  
Result: **43 PASS / 2 FAIL / 45 total**.

The former two failures were public-demo fixture-isolation assertions in `tests/warranty-parts/public-demo-flow.test.ts`. Git history confirms they were stale expectations, not a source defect:

* commit `4a6142b` introduced the approved 26-tray workspace and its canonical `scenario.seed-approved` transaction;
* `createApprovedTraySeed()` intentionally defines 9 SKUs, 27 boxes/receipts and 9 linked trays; `public-demo-setup.ts` intentionally adds those records to the existing scenario;
* commit `feea1fe` explicitly migrates existing scenarios additively, preserving the seed across upgrades.

The test now imports the approved manifest and asserts the public-demo subset **plus** all 27 approved seed receipts, SKU balances, box/tray links and confirmed putaways. Rerun result: `tests/warranty-parts/public-demo-flow.test.ts` **2 PASS / 0 FAIL** (99.5s). The S09/S10 operational binding subset was independently rerun at **22 PASS / 0 FAIL**. These remain **MOCK** setup checks, not REAL_API failures.

## Confirmed defects / follow-up

1. **P1/P2 — copy is absent.** Add scoped copy actions for stable case/slip IDs (and any approved identity fields), with clipboard success/error feedback and an accessible label. No source change was made in this QA task.
2. **P2 — S09 lacks linked parts-slip navigation.** Add only when an approved relation key exists; the legacy contract currently says relation data is unavailable, so do not infer a join from codes.
3. **P2 — public-demo test harness is stale.** Update selectors and setup synchronization (`Bắt đầu làm việc`, current overview readiness) in a separately owned test packet; do not loosen fixture assertions without an authority decision.


## Post-fix correction and final disposition

The first table above is the pre-fix registration run at 93371f4 and intentionally preserves its historical failures. On the corrected candidate 73bf351083efb48af360f3ad2512addb8b028560:

- Public-demo flow: 2/2 PASS after updating stale expectations to assert the intentional approved tray seed.
- S09/S10 operational binding subset: 22/22 PASS.
- Copy controls: source/static PASS for legacy and operational S09/S10; browser click remains NOT_RUN because the setup harness is blocked.
- Explicit legacy route parsing: PASS for both catalog=legacy routes and rejection of extra parameters.
- S10 to S09/S17 links: PASS when relation data exists; reverse S09 parts-slip link remains PARTIAL because the current contract has no relation key.
- Browser E2E, REAL_API RBAC and hosted CI: BLOCKED/NOT_RUN, not promoted to PASS.
