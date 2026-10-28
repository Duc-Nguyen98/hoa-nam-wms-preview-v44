# Design authority report — HN-WARRANTY-PARTS-FIDELITY-001

**Owner:** S00#6 Design Guardian  
**Scope:** S09 warranty cases and S10 parts slips, references BH-01…BH-14  
**Checkout / branch:** `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026` / `DEV`  
**Audit base:** `135ea2054035e99069cdb3d2eaa7c928a67bfdff`  
**Disposition:** `DESIGN_READY_FOR_SCOPED_COMPARISON`; exact fidelity remains `BLOCKED` by undeclared capture profiles, the Tablet table/card conflict, and unresolved S10 detail metadata variants.

## Authority decision

The 14 custody-verified images establish scoped composition and hierarchy for S09 warranty-case and S10 parts-slip lists/details. They do not approve a new baseline, token, breakpoint, fixture or business-data projection. Shared shell, modal, table, pagination, control, token and state ownership remains with the existing repository contracts and components.

Route ownership is source-confirmed:

- `#/preview/S09` resolves to `WarrantyCasesScreen`; its list owns search/status/date controls, table/list rendering and detail selection, while `WarrantyDetailDialog` owns legacy read-only detail. The operational cohort is owned by `OperationalWarranty` and can expose table/cards and a guarded detail view.
- `#/preview/S10` resolves to `PartsSlipsScreen`; its list owns search/status/date controls, table/list rendering and detail selection, while `PartsSlipDetail` owns legacy read-only detail. The operational cohort is owned by `OperationalPartsIssues` and can expose table/cards and guarded detail.

These route facts do not make every artwork field source-backed. Current legacy detail rows intentionally omit S09 timeline/diagnostic/defect relations and S10 component-line/related-document data; explicit unavailable states remain truthful until an approved projection exists.

## Reference interpretation

| Refs | Route / composition | Authority finding |
|---|---|---|
| BH-04, BH-07 | S09 list, desktop and portrait table | Populated list hierarchy: heading, search/status/date filters, rows, statuses, dates and view action. Portrait raster shows a table-like composition. |
| BH-12, BH-14 | S09 portrait list/card candidates | Same apparent card/list family, distinct hashes and no visible state discriminator. Treat as unresolved duplicate/profile/state candidates; do not collapse. |
| BH-01, BH-02, BH-05, BH-08 | S09 detail, desktop/portrait | Completed/returned and in-check visual states with timeline and diagnostic/defect content that is not in the current legacy `WarrantyRow`. |
| BH-03, BH-09 | S10 list, desktop table and portrait card/list | Populated list with slip/case/date/component-count hierarchy. BH-09 is a card/list candidate; current source has separate legacy DataTable and operational table/card modes. |
| BH-06, BH-13 | S10 sparse detail, desktop/portrait | Slip/case/date plus component rows; no actor/reason/created-at visible. |
| BH-10, BH-11 | S10 enriched detail, desktop/portrait | Same named slip family but adds actor, reason, created-at and richer component-line metadata. |

## Tablet table-vs-card conflict

The portrait references do not describe one unambiguous Tablet topology:

- BH-07 depicts S09 as a portrait table/list with repeated row columns and a view action.
- BH-12 and BH-14 depict S09 as a portrait card/list with stacked case metadata and a view action.
- BH-09 depicts S10 as a portrait card/list, while the legacy S10 source path renders `DataTable` and the operational path contains both table and card DOM branches.

No supplied capture metadata identifies CSS viewport, breakpoint, device class, cohort (`legacy` versus `scenario`), or interaction state. Therefore this is a **DESIGN_GAP**, not permission to choose a breakpoint or rewrite the source. Visual QA must declare route, cohort, state, viewport, DPR and browser, then compare each candidate against the matching authority family. A single portrait screenshot cannot settle the conflict.

## S10 detail metadata variants

BH-06/BH-13 and BH-10/BH-11 are retained as two candidate S10 detail variants:

- **Sparse:** slip code, related warranty case, issue date and component rows; actor, reason and creation timestamp are absent.
- **Enriched:** the sparse identity plus actor, reason, creation timestamp and richer component-line heading/content.

`PartsRow` and `PartsSlipDetail` currently expose summary fields (`slipCode`, `warrantyCaseCode`, component summary, quantity/tracking, status, updated label) and explicitly mark component lines and related documents unavailable. They do not contain an approved `detailVariant` or metadata projection for actor/reason/created-at. The variants cannot be silently merged, and artwork values must not be hardcoded into fixtures. Exact fidelity is blocked until S00#1/S00#4 obtain a source-backed decision or retain an explicit unavailable state.

## Shared/global-state authority

The prior Outbound Global State standard is available and is the semantic reference for this packet: [`GLOBAL_STATE_DESIGN_CONTRACT.md`](../../outbound-global-states/HN-OUTBOUND-GSTATE-001/design/GLOBAL_STATE_DESIGN_CONTRACT.md) and [`SCREEN_STATE_MATRIX.md`](../../outbound-global-states/HN-OUTBOUND-GSTATE-001/design/SCREEN_STATE_MATRIX.md). S09/S10 may use the existing shared `PageState` vocabulary (`loading`, `empty`, `no-results`, `error`, `forbidden`, `unauthorized`, `stale`, `record-not-found`, `ready/populated`, `detail`). The standard does not provide S09/S10 artwork, and this report adds no invented global-state visuals.

## Acceptance boundary

- Custody and route/component ownership: **CONFIRMED**.
- Exact raster-to-CSS profile: **DESIGN_GAP** until S00#3 records viewport, DPR, browser, zoom, locale, theme and fixture.
- Tablet table/card topology: **DESIGN_GAP / BLOCKED** pending declared cohort/profile and owner decision.
- S09 history/diagnostic/defect data: **DESIGN_GAP**; retain unavailable semantics unless source-backed.
- S10 sparse/enriched metadata: **DESIGN_GAP / BLOCKED** pending variant/source decision.
- Browser visual comparison, functional/accessibility/RBAC, production API and CI: **NOT_RUN** by S00#6.

No source, token, baseline or business-logic files were changed by this packet.
