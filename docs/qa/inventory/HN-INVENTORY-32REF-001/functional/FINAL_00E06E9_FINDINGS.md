# Final-candidate findings — 00e06e9 (superseded for repair)

Owner: independent functional QA · tested source `00e06e9a4336729b6244a1cf453ad3fd6f7bbf4f` · 2026-10-29.

**Disposition: HOLD / REPAIR REQUIRED.** The original six defect groups passed their targeted retest, but the requested non-DRV coverage probe and newly introduced filtering paths confirmed additional correctness gaps. The parent paused browser work and authorized a bounded repair under a new source SHA. Do not treat this document as final candidate acceptance.

## Executed evidence

| Evidence | Actual result |
|---|---|
| `final-00e06e9/edges/results.json` | **6 PASS / 0 FAIL**: original INV-F-001..006 reproduced fixes, including10/0/10 forA01-09, missing saved-scope ID rejection,44×44 Tablet controls and locale pagination/date presentation |
| `final-00e06e9/injected/results.json` | **4 PASS / 0 FAIL**: retry persistent failure/recovery, immutable120/118/−2 saved result while live240,12-row pagination/sorting, long-code exact clipboard/wrapping |
| `final-00e06e9/core/progress.json` | **30 completed PASS groups**: Desktop19 and Tablet11. One raw failure is classified **INVALID_RUN / environment interruption** after `ERR_INSUFFICIENT_RESOURCES` and a blank root. The process exited before final JSON; remaining checks are **NOT_RUN** |
| `final-00e06e9/core/after-desktop-S16/S11/S20/S21.png` | Four actual normal-auth Desktop default-route after captures,1920×1080 DPR1. Default row populations remain11/9/35/11 without opt-in. Tablet after captures are pending the new candidate |
| `final-00e06e9/new-filter-edges/results.json` | **6 PASS / 4 confirmed FAIL**, zero console/page errors, isolated same-source component with original fixture; these are UI projection assertions, not API/auth tests |
| `round2/unit-regression.tap` + `unit-custody.txt` | Prior candidate956672b1: **19 PASS / 0 FAIL**. Only workspaceTSX/CSS changed through00e06e9; imported adapter/bindings/API inputs remained unchanged. No fabricated new-SHA unit rerun is claimed |

The Desktop completed checks include normal login/confirmation/setup, all ten refreshed views, search/reset/warehouse scope/empty, SKU→BOX→tray/back, BOX movement, reconciliation/BOX totals, scoped history→saved result, date validation, stale IDs, direct semantic scenarios, exact clipboard, pagination/sort, locale titles/theme, selected Light/Dark primary contrast, four canonical route regressions, and unchanged canonical operational snapshot revision69. Tablet completed the analogous flows through stale-ID checks before the resource interruption. Full Tablet locale/state/reflow/session checks remain pending; no product defect is inferred from the blank-page interruption.

## Additional confirmed defects

| ID | Severity / trigger | Observed / expected | Evidence |
|---|---|---|---|
| INV-F-007 | **P1 — allocation coverage presented as zero.** Open SKU/allocation forHN-PSU-002 | Known stock340, held50, available290. Overview assertsBOX/tray/location counts0 and both overview/allocation show allocation totals0/0/0. OnlyDRV BOX records are supplied; absent allocation coverage must be Unknown/Unavailable rather than a verified zero. This contradicts the known340 header and can mislead stock interpretation | `new-filter-edges/psu-allocation-observation.json`, `failure-4.png` |
| INV-F-008 | **P2 — shared no-result handling omitted from new filters.** Movement searchZX-999; or savedHN02+match result then chooseShortage(0) | Both yield empty tables/zero footer without the shared `no-results` state. Retain the query/result filter and provide the shared reset/change guidance. These are related-screen paths ofINV-F-001; history and reconciliation fixes remain closed | `new-filter-edges/failure-1.png`, `failure-2.png`, JSON checks7/8 |
| INV-F-009 | **P2 — current reconciliation detail ignores propagated warehouse context.** Direct `view=difference&warehouse=HN02&sku=HN-DRV-001` | HN01 DRV record renders while scope isHN02. The saved-result branch correctly rejects the same mismatch. The current branch must also retain comparison scope or return not-found. This is a UI context defect; production permission bypass is **not** asserted | `new-filter-edges/failure-3.png`, JSON check9 |

## Scope and remaining gates

Every result here is `MOCK`/fixture evidence. Real reconciliation APIs, warehouse/tenant authorization and production RBAC remain **BLOCKED / NOT_RUN**. The isolated component harness is explicitly separate from the normal App gate and is never used as final32-image capture evidence.

Next candidate requires independent retest ofINV-F-007..009, the original6edge guards, the injected4contracts, completion of pending Tablet locale/state/focus/reflow/session checks, and final default-route after captures/source custody. Parent owns capture/build/release gates and source repair. QA changed only its leased functional evidence and test files.
