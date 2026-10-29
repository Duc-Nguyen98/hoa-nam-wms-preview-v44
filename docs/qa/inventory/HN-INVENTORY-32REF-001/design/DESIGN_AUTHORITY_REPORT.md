# Design authority — HN-INVENTORY-32REF-001

Owner: S00#6 · DEV audit base `57b9f399a55d41d43ecad7a31e1b279da2cda717` · 2026-10-29 UTC+07

## Decision

The explicit approval in supplied PROMPT_S00-1.md governs: final32 is approved for 16 inventory/reconciliation screens or states on Desktop and portrait Tablet. Indices are not route IDs; implementation may use pages, tabs, drawers or reusable components. User explicitly permits independent Candidate fixture/adapter UI where backend is unavailable, with API BLOCKED in QA reports and no Mock/Demo banners in the product. This permits progress but cannot certify an API or create a stock workflow.

Reference integrity is PASS (32/32 SHA/dimensions/bytes). All32 were inspected. Design composition is ready for scoped implementation/measurement. Visual/product acceptance is NOT_RUN; full data/API integration is BLOCKED by the missing fields and read models described below. This document does not approve source edits; S00#1 owns the implementation lease.

## Observations from all 16 pairs

| Index | Observed Desktop composition | Observed Tablet composition / relationship |
|---|---|---|
| 01 | Lookup tabs, warehouse/location/search controls, nine SKU rows, on-hand/reserved/available columns | Nine stacked SKU rows with all quantity/unit labels; search actions wrap; no fixed sidebar |
| 02 | SKU identity and totals, BOX/tray/location counts, nine location allocations with totals | SKU strip plus three count cards; 3×3 location tiles and total quantities |
| 03 | Same SKU, BOX tab active, nine BOX allocations and footer | BOX tab active; nine BOX cards with tray/location and quantity triads |
| 04 | BOX-001 identity, SKU link, unit/warehouse/tray/location/as-of, 20/5/15 summary, quick links | Same identity/summary/location/links stacked; BOX not conflated with tray |
| 05 | KH-001 identity, warehouse/location/as-of, 1 BOX/1 SKU, exactly one BOX row | Compact context and one BOX row; no nine-row replication of the tray |
| 06 | SKU history tab, date/type/BOX/search filters, nine movement rows newest first | Same movements in labeled cards; signed quantities and resulting stock retained |
| 07 | Reconciliation tab, all-warehouse/date/result/search filters, 9 SKU /3 matched/3 short/3 over, snapshot strip | Compact counters and nine comparison cards; snapshot identity and scope visible |
| 08 | DRV comparison 120 system/118 counted/−2, BOX analysis nine rows, no-auto-adjust warning, cause unknown | Same snapshot quantities, BOX cards, result totals and unknown cause |
| 09 | History tab active, warehouse/from/to/result/id filters, nine saved-run rows | Nine saved-run cards with date/scope/9SKU and 3/3/3 counts |
| 10 | Saved snapshot ID/as-of/scope, 9SKU and 3/3/3, result tabs and detail table | Saved result cards, snapshot notice and summary footer; quantities match07 |
| 11 | Lookup controls + table skeleton and loading affordance; no completed zeros | Compact lookup skeleton; disabled/busy actions, preserved route context |
| 12 | HN04 empty scope, empty treatment, choose warehouse/reload | HN04 retained; empty panel, permitted change/reload actions, real zero record count only after valid read |
| 13 | ZX-999 query retained, no-results panel, clear filters and zero filtered count | Same retained query/no-results semantics; no fake warehouse-empty claim |
| 14 | Failed load, retry panel without success count/date | Same retry failure treatment; no zero-result or fresh-update fiction |
| 15 | History tab/menu selected, permission-denied panel, return-to-lookup action | History tab active and denial; no snapshot/rows/counts leaked |
| 16 | BOX detail context, object-not-found panel, return-to-lookup action | Same BOX not-found semantics, distinct from empty/no-results/forbidden |

## Required normalization (approved by prompt)

AI-generated icon, green badge, header/title, label, card-position and tab variations must be normalized through the existing Design System. Keep information hierarchy and precise contract labels. Logo/product art/avatar/person names are not required production assets; consume the official shell/assets. Locked GlobalShell/sidebar/header and Global Toast (top-right, entrance350/display3000/exit300ms + progress) are preserved. Do not copy their inconsistent raster chrome.

Matched = green, shortage = amber, surplus = blue, each with text/icon; negative uses − and positive uses +. Same badge semantics across Desktop/Tablet and Light/Dark. Quantity columns right aligned with tabular figures; mixed units never summed. Loading skeleton is distinct from a true zero result. All shared states, including session-expired/offline/stale not illustrated, remain supported.

Use existing contract values first. Where absent, the user supplies CSS spacing anchors: Desktop gutter32, Tablet24, card padding24, group gap16–24, label/control8 and Tablet touch>=44×44. These are permitted module measurement anchors, not authority to alter locked shell geometry. Record final deviations and rationale in implementation evidence; do not shrink type or clip content to fit.

Main runtime target profiles: 1920×1080 CSS/DPR1; 800×1280 CSS/DPR2; supported 768×1024. Raster files are neither those viewports nor uniform Tablet size. S00#3 owns declared aspect-preserving registration and full originals/actual/diffs. Do not stretch, invent an original DPR, or clip a defect during normalization.

## Data and architecture conflicts

1. **Different difference formula.** Existing legacy `InventoryRow`/fixture validates `onHand − ledger = difference` and exposes a four-row source. Approved reconciliation is `counted − systemAtSnapshot`, with negative shortage. Operational S16 explicitly has `actual:null,difference:null`. Replacing those fields/formula globally would alter business semantics. Add an explicitly named independent approved projection through the S00#1/S00#2 lease; never convert null to zero or claim count data exists.
2. **Missing allocation/reservation projection.** Legacy S16 has available/onHand/ledger/suggestedLocation but no reserved, BOX/tray allocation, multiwarehouse HN01–HN03, snapshot/run ID or counted field. Operational S16 contains SKU/warehouse/unit ledger balance and pinned events, not approved reserved/available/count data. BOX/putaway read sources elsewhere are candidates, not evidence that final32 joins exist.
3. **Missing saved reconciliation API.** Registry provides S16 inventory, S11 trays, S20 movements, S26 trace. Current API resource inventory is a list view; no saved-reconciliation history/detail endpoint or DTO was found. Indices07–10/15 are approved UI candidates, not proof of real saved runs. API BLOCKED until source/permission/scope contracts are supplied.
4. **Missing detail flow.** Legacy S16 Mở, Truy vết and history are intentionally unavailable. Operational detail shows source-backed ledger/events; this is not final32's full SKU/BOX/tray/snapshot drilldown. Existing components can be reused while preserving accurate unavailable boundaries.
5. **Prompt overrides artwork data inconsistencies.** Normalize fixture HN-DRV-001 to9 locations with120/20/100; BOX001–003=20/5/15, BOX004=10/5/5, BOX005–009=10/0/10. Count comparison120/118/−2 comes only from BOX00120/18/−2, rest matched. Dây tín hiệu1200−200=1000; nine reconciliation SKUs=3/3/3. KH-001 contains one BOX in this fixture. These are approved Candidate fixture requirements, not production writes.
6. **Historical snapshot integrity.** The08/10/09 run ID, scope, time, units and counts must use one immutable saved projection. Never join live balance with old counts or replace a saved result on refresh. Root cause stays Chưa xác định if unavailable. Reconciliation and putaway never adjust stock by viewing/confirming mapping.

## Open gates and permitted progress

Candidate fixture UI can proceed within an approved lease for all16 compositions and six system states; preserve no-mutation Web boundaries and report fixture provenance outside UI. Shared component reuse needs regression and no concurrent shared ownership. Exact visual, keyboard, focus, search/filter/paging, date, back/deep-link, VI/EN/zh-CN, Light/Dark and data-scope evidence remains NOT_RUN here. REAL_API route/ID/warehouse authorization and stored-snapshot integration remain BLOCKED, not INTEGRATED. Missing backend does not justify using Forbidden as an unimplemented marker.

No source, shared shell, locked token, business data or deployment was changed by S00#6.
