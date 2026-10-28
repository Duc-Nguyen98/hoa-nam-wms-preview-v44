# Screen/state matrix — HN-WARRANTY-PARTS-FIDELITY-001

**Owner:** S00#6 Design Guardian · **Branch:** `DEV`  
This matrix maps each registered image to the local preview route, source owner, visual state and open authority. Raster dimensions are source pixels; each future capture must declare CSS viewport, DPR, browser, zoom, locale, theme, cohort and fixture.

| Ref / state | Route and cohort | Source owner | Profile | Visual evidence | Matrix disposition |
|---|---|---|---|---|---|
| BH-04 · S09 populated list | `#/preview/S09` · legacy/reference list | `WarrantyCasesScreen` / `DataTable` | Desktop raster 1672×941 | Search, status/date filters, populated rows, status badges and view actions | Route/component confirmed; exact profile and row data are design gaps |
| BH-07 · S09 populated list | `#/preview/S09` · legacy/reference list | `WarrantyCasesScreen` / responsive list | Portrait raster 992×1586 | Portrait table-like rows and view actions | Candidate Tablet table topology; breakpoint/cohort metadata missing |
| BH-12 · S09 populated list | `#/preview/S09` · legacy/reference list | `WarrantyCasesScreen` / responsive list | Portrait raster 992×1586 | Stacked case cards with status/date/expected-finish and view actions | Candidate Tablet card topology; no semantic discriminator from BH-14 |
| BH-14 · S09 populated list | `#/preview/S09` · legacy/reference list | `WarrantyCasesScreen` / responsive list | Portrait raster 992×1586 | Same apparent card/list family as BH-12 | Separate hash retained; duplicate/profile/state disposition open |
| BH-01 · S09 completed detail | `#/preview/S09` · legacy/reference detail | `WarrantyDetailDialog` | Desktop raster 1672×941 | Completed/returned identity, status, product/SKU, dates, defect and timeline | Composition confirmed; timeline/defect values are not in current `WarrantyRow` |
| BH-02 · S09 in-check detail | `#/preview/S09` · legacy/reference detail | `WarrantyDetailDialog` | Desktop raster 1672×941 | In-check status, shorter history, unknown expected finish and empty diagnostic/defect content | Composition confirmed; event/diagnostic projection is a source gap |
| BH-05 · S09 completed detail | `#/preview/S09` · legacy/reference detail | `WarrantyDetailDialog` | Portrait raster 992×1586 | Stacked completed/returned detail, processing content, defect chip and timeline | Composition/profile candidate; source data gap remains |
| BH-08 · S09 in-check detail | `#/preview/S09` · legacy/reference detail | `WarrantyDetailDialog` | Portrait raster 992×1586 | Stacked in-check detail, two-step timeline and diagnostic/defect empty states | Composition/profile candidate; source data gap remains |
| BH-03 · S10 populated list | `#/preview/S10` · legacy/reference list | `PartsSlipsScreen` / `DataTable` | Desktop raster 1672×941 | Search/date/reload controls, slip/case relation, component count and updated date | Route/component confirmed; artwork row values are illustrative |
| BH-09 · S10 populated list | `#/preview/S10` · legacy/reference list | `PartsSlipsScreen` / responsive candidate | Portrait raster 992×1586 | Stacked parts-slip cards with slip/case/date/count and view actions | Candidate Tablet card topology; current legacy path does not select an approved card mode |
| BH-06 · S10 sparse detail | `#/preview/S10` · legacy/reference detail candidate | `PartsSlipDetail` composition | Desktop raster 1672×941 | Slip/case/date and component rows; no actor/reason/created-at | Sparse variant candidate; component rows are unavailable in current legacy source |
| BH-13 · S10 sparse detail | `#/preview/S10` · legacy/reference detail candidate | `PartsSlipDetail` composition | Portrait raster 992×1586 | Sparse stacked modal with slip/case/date and component rows | Same sparse variant; portrait geometry/profile unresolved |
| BH-10 · S10 enriched detail | `#/preview/S10` · legacy/reference detail candidate | `PartsSlipDetail` composition | Desktop raster 1672×941 | Sparse identity plus actor, reason, created-at and richer component lines | Enriched variant candidate; no approved metadata projection/variant key |
| BH-11 · S10 enriched detail | `#/preview/S10` · legacy/reference detail candidate | `PartsSlipDetail` composition | Portrait raster 992×1586 | Enriched stacked modal with actor/reason/created-at and component lines | Enriched variant candidate; same source gap as BH-10 |

## Shared state coverage matrix

| Route | State | Entry/fixture | Expected shared owner/action | Reference status |
|---|---|---|---|---|
| S09 list | `loading` | No snapshot while controller reads | `InitialReadState`/shared `PageState`; no destructive action | No direct BH artwork; semantic standard inherited from Outbound |
| S09 list | `empty` | Valid snapshot, zero cases, no filters | Shared empty state; read/refresh where supplied | `DESIGN_REFERENCE_MISSING` |
| S09 list | `no-results` | Valid snapshot, active query/filter returns zero | `DataTable emptyStateKind="no-results"`; clear filters | `DESIGN_REFERENCE_MISSING` |
| S09 list/detail | `error` / `forbidden` / `unauthorized` / `stale` | Read, capability or session failure | Shared semantic state; retry, overview or reconcile according to cause | Semantic standard available; direct S09 visual not registered |
| S09 detail | `record-not-found` | Selected case removed or fence invalid | Operational detail `PageState`; close/return to list | Semantic standard available; direct S09 visual not registered |
| S10 list | `loading` | No snapshot while controller reads | `InitialReadState`/shared `PageState`; no destructive action | No direct BH artwork; semantic standard inherited from Outbound |
| S10 list | `empty` | Valid snapshot, zero slips, no filters | Shared empty state; read/refresh where supplied | `DESIGN_REFERENCE_MISSING` |
| S10 list | `no-results` | Valid snapshot, active query/status returns zero | `DataTable emptyStateKind="no-results"`; clear filters | `DESIGN_REFERENCE_MISSING` |
| S10 list/detail | `error` / `forbidden` / `unauthorized` / `stale` | Read, capability or session failure | Shared semantic state; retry, overview or reconcile according to cause | Semantic standard available; direct S10 visual not registered |
| S10 detail | `record-not-found` | Selected slip removed or fence invalid | Operational detail `PageState`; close/return to list | Semantic standard available; direct S10 visual not registered |

## Conflict and variant gates

- **Tablet table-vs-card conflict:** BH-07 (S09 table-like) conflicts with BH-12/BH-14 (S09 cards) and BH-09 (S10 cards) as a single undocumented portrait topology. Compare only after route/cohort/state/profile metadata is declared; do not infer a breakpoint or replace a source branch from artwork.
- **S10 detail metadata variants:** BH-06/BH-13 sparse versus BH-10/BH-11 enriched. Keep both candidate families and require source-backed actor/reason/created-at/line-item authority before exact fidelity.
- **Global state reference:** prior Outbound standard is available and linked from `REFERENCE_MANIFEST.md`; no new state illustration is created here. Missing direct S09/S10 state artwork remains `DESIGN_REFERENCE_MISSING`/`NOT_RUN`.

## Ownership and gates

S00#6 owns custody, route/state registration and design authority. S00#3 owns browser captures, overlays and visual diffs. S00#4 owns functional/accessibility/RBAC evidence. S00#1 integrates gate status. No source, token, baseline or business-logic edits are authorized by this matrix.
