# Independent functional QA — inventory round 1

Owner: independent functional QA. Candidate `candidate/inventory-32ref-20261029`, base `57b9f399a55d41d43ecad7a31e1b279da2cda717`. Run 2026-10-29 against `http://127.0.0.1:5340/?inventoryDesign=20261029#/preview/S16?view=stock`.

**Disposition: FUNCTIONAL PARTIAL / OPEN DEFECTS.** Core flows pass; six confirmed edge groups remain. These results are MOCK fixture evidence. No application source, auth guard, backend permission or deployment was edited by QA.

## Valid evidence and scope

| Evidence | Result / interpretation |
|---|---|
| `fixture-contract-round1.tap` | **4/4 PASS**: nine SKUs across HN01/HN02/HN03 with 3/3/3 results; wire1200−200=1000; DRV120/20/100 across nine locations and count118/−2; oneBOX inKH001; saved rows and BOX objects are separate frozen copies |
| `round1-serial/browser-results.json` | **17/17 PASS, 0 console/page errors**, stable source hashes. Full authenticated app at Desktop1920×1080 DPR1. Normal S07→S08→setup; no auth bypass. Tests include ten refreshed view projections, search/reset/warehouse/empty, links/back/BOX movement, reconciliation/BOX totals, scoped history→saved result, saved result→difference→back, date range/reverse/future validation, invalid IDs, six direct semantic scenarios, exact clipboard copy, pagination boundaries, sorting, locale titles/themes, and canonical read-only snapshot equality |
| `injected-contract/results.json` | **4/4 PASS, 0 errors**. Isolated same-source component with approved adapter injection: retry failure→error and later success; saved result remains120/118/−2 while live SKU is240; twelve-row pagination9→3→9 plus global sorting; long IDs copy exactly and wrap within Desktop/Tablet widths |
| `edge-contract/results.json` and failure1..6PNG | **6 confirmed FAIL groups, 0 console/page errors**. Isolated same-source component with original fixture, Tablet800×1280 DPR2. Detailed defect register below |
| `round1/browser-results.json` | Earlier exploratory full-app Desktop/Tablet observations. Preserve for custody, but its 12 failed assertions are **invalid harness isolation/label assumptions**, not product defects. Safe positive observations include protected-route login, BOX/tray links/back, BOX movement, exact copy, invalid-ID rejection, no overflow across ten projections, and preserved canonical snapshot |
| `round1-corrected-harness/` | **INVALID_RUN / ABORTED** after network/resource failures during repeated reloads. Blank pages are not product-defect evidence and are excluded from the verdict |

The aggregate locale test in the17-pass run proves translated titles, theme selection and fixed-label observations; it does **not** certify all localization. Its recorded English pagination labels are an open defect, repeated independently by the edge test.

## Confirmed defect register

| ID / severity | Trigger and observed behavior | Expected / evidence | Owner / state |
|---|---|---|---|
| INV-F-001 · P2 | History view, search `ZX-999`: zero rows and a zero footer, no `no-results` PageState | Show the no-result semantic state with retained query/reset; shared states must apply to related screens. `edge-contract/failure-1.png` + JSON check1 | S00#2 · OPEN |
| INV-F-002 · P2 | Reconciliation view with warehouseHN04: zero rows and zero metrics, no `empty` PageState | Show valid scoped empty state; do not restrict shared empty handling to stock tab. `edge-contract/failure-2.png` + check2 | S00#2 · OPEN |
| INV-F-003 · P1 | Stock filter locationA01-09 returns DRV with120 actual,20held,100available and nine-location label | Approved scope requires BOX009 location10actual,0held,10available (or an explicit source-backed whole-SKU search mode that is not presented as a location-scoped balance). `edge-contract/failure-3.png`; assertion observed120/20/100 against expected10/0/10; fixture invariants independently prove BOX009 quantities | S00#2 · OPEN |
| INV-F-004 · P2 | Deep link saved difference with warehouseHN02, skuHN-DRV-001 (HN01), source=snapshot, valid snapshot ID still renders the HN01 record | Retain the propagated history scope and reject an out-of-context record, rather than silently traversing outside filtered saved results. This is a **UI context defect**, not evidence of a production RBAC bypass. `edge-contract/failure-4.png` + check4 | S00#2 · OPEN |
| INV-F-005 · P2 | Tablet original component: copy32×32; view approximately34×22; pagination approximately30×36 CSSpx | Approved Tablet control target minimum44×44. `edge-contract/results.json` stores exact bounding boxes and accessible names; `failure-5.png` | S00#2 / CSS owner · OPEN |
| INV-F-006 · P2 | Previous/next pagination accessible labels stay English under VI and zh-CN. History dates remain`2026-10-28 14:25` in all three locales | Localize accessible labels and date presentation through shared infrastructure. `edge-contract/locale-observation.json`, `failure-6.png`, and normal-app locale details in round1-serial JSON | S00#2 · OPEN |

## Known risk disposition

- Decorative pagination: **closed by executed contract check**. Nine-row normal fixture disables both boundaries; twelve-row injected fixture moves9→3→9 and sorts globally.
- Sort control: **PASS** for actual SKU order reversal in the app and global sort across injected pages.
- Ignored history warehouse/result/date filters: **closed for tested core paths**. HN02+match opens the same saved ID with two rows; date27–28 filters to two saved results, reversed/future ranges reject. Out-of-scope direct detail remainsINV-F-004.
- Snapshot/live mixing: **PASS isolated contract**. Live240 does not replace saved120/118/−2 on snapshot or its BOX difference. Production immutable snapshot retrieval is still BLOCKED.
- Missing copy: **PASS** for exact current SKU and long ID clipboard writes; touch size remainsINV-F-005.
- False successful timestamp on error: **PASS**. Error/loading/forbidden/empty/no-result/not-found scenarios omit heading success timestamp, and retry remains error after a persistent adapter failure.
- Unknown-ID first-row fallback: **PASS** for unknown SKU, BOX, snapshot and mismatched SKU/BOX links; no row/table data is exposed in tested not-found outcomes.

## API, RBAC, regression and remaining gates

**REAL_API / backend RBAC / tenant or warehouse permission enforcement: BLOCKED / NOT_RUN.** Normal preview login is a MOCK session authority, not production data-scope certification. Explicit fixture forbidden proves its UI state only. The isolated harness deliberately tests component contracts and is not an auth/API test or source for final32 visual captures.

All normal-app fixture reads/navigation preserve canonical operational snapshot revision69 exactly. Existing S16/S21/approved putaway regression was15/15PASS on base; no business-source changes were made by QA. That baseline is not a substitute for a final candidate regression after remediation.

Still pending: independent retest ofINV-F-001..006, full final Tablet functional run, session-expiry interaction on the integrated candidate, zoom/contrast checks, final source custody/commit binding, and approved32-image visual acceptance. Request-race/HTTP/RBAC guarantees for the new read-only fixture model cannot be represented as real API integration.
