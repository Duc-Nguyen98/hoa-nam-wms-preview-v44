# HN-WARRANTY-PARTS-UIUX-001 component and route mapping

This map is based on direct inspection of all 14 supplied images and source inspection at audit base `93371f4da9b6659d320a7c66d9b0862f89744a0d`. Route names are local preview routes from `src/app/registry.ts`; they are not production API endpoints.

| Ref | Route / screen | Component or composition | Profile | Visible state / content interpretation | Mapping status and ambiguity |
|---|---|---|---|---|---|
| BH-01 | `#/preview/S09` · S09 Warranty cases | `WarrantyDetailDialog` / desktop detail | Desktop raster | Completed/returned case (`Đã trả khách`), case identity, product/SKU, receipt and expected-finish dates, defect tag, five-step processing timeline | `CONFIRMED` route/component by visual topology; timeline and defect relation are not supplied by current `WarrantyRow`/`WarrantyDetailDialog` source (`DESIGN_GAP`). |
| BH-02 | `#/preview/S09` · S09 Warranty cases | `WarrantyDetailDialog` / desktop detail | Desktop raster | In-check case (`Đang kiểm tra`), two-event processing history, unknown expected-finish, empty diagnostic/defect content | `CONFIRMED` route/component; source has no event-history or diagnostic fields. Exact state projection is `DESIGN_GAP`. |
| BH-03 | `#/preview/S10` · S10 Parts slips | `PartsSlipsScreen` table/list | Desktop raster | Parts-slip list with search, date range, reload, nine rows, slip-to-case relation, export date and component-line counts | `CONFIRMED` route/component; supplied date filter and nine-row dataset are visual facts only and do not replace `DEFAULT_PARTS_QUERY`. |
| BH-04 | `#/preview/S09` · S09 Warranty cases | `WarrantyCasesScreen` table/list | Desktop raster | Warranty-case table with search, status/date filters, nine rows, mixed statuses and view actions | `CONFIRMED` route/component; source list columns differ in places (identity/customer/age/ordinal). Comparison must be scoped to the approved variant. |
| BH-05 | `#/preview/S09` · S09 Warranty cases | `WarrantyDetailDialog` / portrait detail | Portrait/tablet raster | Completed/returned case with product/SKU, processing-content cards, linked defect chip and five-step timeline stacked vertically | `CONFIRMED` route/component/profile; content sections are absent from the current read-only row contract. |
| BH-06 | `#/preview/S10` · S10 Parts slips | Parts-slip detail modal composition (sparse variant) | Desktop raster | Slip `PX-LK-2026-001`, related case, issue date and nine component rows; no actor/reason fields visible | `CONFIRMED` S10 detail; variant unresolved because current `PartsSlipDetail` renders seven summary fields plus unavailable sections, not this line-item composition. |
| BH-07 | `#/preview/S09` · S09 Warranty cases | `WarrantyCasesScreen` responsive table/list | Portrait/tablet raster | Portrait S09 table with search, status/date filters, nine rows and view actions | `CONFIRMED` route/component/profile; breakpoint and CSS viewport are not declared by the image. |
| BH-08 | `#/preview/S09` · S09 Warranty cases | `WarrantyDetailDialog` / portrait detail | Portrait/tablet raster | In-check case with two-step timeline, diagnostic/defect empty states and vertically stacked content cards | `CONFIRMED` route/component; same source data gap as BH-02. |
| BH-09 | `#/preview/S10` · S10 Parts slips | `PartsSlipsScreen` responsive card/list | Portrait/tablet raster | Portrait parts-slip list with nine cards, slip/case/date/count metadata and view actions | `CONFIRMED` route/component/profile; current source uses `DataTable` and does not establish an approved card-mode selector. |
| BH-10 | `#/preview/S10` · S10 Parts slips | Parts-slip detail modal composition (enriched variant) | Desktop raster | Rich detail for `PX-LK-2026-001`: issue date, linked case, actor, creation timestamp, reason and nine component rows | `CONFIRMED` S10 detail; actor/reason/created-at and line items are not in `PartsRow`; variant/state authority is `DESIGN_GAP`. |
| BH-11 | `#/preview/S10` · S10 Parts slips | Parts-slip detail modal composition (enriched variant) | Portrait/tablet raster | Enriched modal stacked vertically with linked case, actor, reason, created-at and nine component rows | `CONFIRMED` route/component/profile; same missing source fields and variant ambiguity as BH-10. |
| BH-12 | `#/preview/S09` · S09 Warranty cases | `WarrantyCasesScreen` responsive card/list | Portrait/tablet raster | Portrait S09 card list with nine cards, status badges, dates, expected-finish and view actions | `CONFIRMED` route/component/profile; exact distinction from BH-14 is not visible as a semantic state. |
| BH-13 | `#/preview/S10` · S10 Parts slips | Parts-slip detail modal composition (sparse variant) | Portrait/tablet raster | Sparse S10 modal with slip/case/date and nine component rows, no enriched metadata | `CONFIRMED` S10 detail; current `PartsSlipDetail` does not contain line-item rows and has no variant key. |
| BH-14 | `#/preview/S09` · S09 Warranty cases | `WarrantyCasesScreen` responsive card/list | Portrait/tablet raster | Same apparent S09 portrait card-list topology and content family as BH-12 | `CONFIRMED` route/component/profile; separate checksum but no visible state discriminator; retain as duplicate/variant candidate pending owner decision. |

## Source anchors

- `src/app/registry.ts:12-13` registers S09 and S10 at `#/preview/S09` and `#/preview/S10`.
- `src/app/App.tsx:165,168` dispatches S09 to `WarrantyCasesScreen` and S10 to `PartsSlipsScreen`.
- `src/features/S09/WarrantyCasesScreen.tsx:136-163` owns the S09 shell/list/table and opens `WarrantyDetailDialog`.
- `src/features/S09/WarrantyDetailDialog.tsx:27-109` owns the read-only S09 detail dialog; its timeline and related-doc sections explicitly render unavailable-data copy.
- `src/features/S10/PartsSlipsScreen.tsx:122-141` owns the S10 shell/list/table and opens `PartsSlipDetail`.
- `src/features/S10/PartsSlipDetail.tsx:26-72` owns the read-only S10 detail modal; it renders summary fields and unavailable component-line/related-document sections.
- `src/features/S09/warranty-cases.css` and `src/features/S10/parts-slips.css` own feature composition; shared dialog, shell, tokens, controls, table and pagination remain shared owners.

No mapping grants a new business route, backend relation, state transition, permission, or exact CSS value.
