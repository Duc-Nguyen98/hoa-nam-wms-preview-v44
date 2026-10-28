# Design authority report — HN-WARRANTY-PARTS-UIUX-001

**Owner:** S00#6 Design Guardian  
**Scope:** warranty cases S09 and parts slips S10, supplied `bh-01.png` … `bh-14.png`  
**Checkout:** `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
**Branch / audit base:** `DEV` / `93371f4da9b6659d320a7c66d9b0862f89744a0d`  
**Disposition:** `DESIGN_READY_FOR_SCOPED_COMPARISON`; exact visual acceptance `BLOCKED` until profile, state, source-data and actual-capture gaps are resolved.

## Authority decision

The 14 supplied originals are registered as scoped visual inputs. They establish page topology and visible hierarchy for S09 warranty-case lists/details and S10 parts-slip lists/details, including desktop and portrait compositions. The registration does not approve a new baseline, alter a locked token, or certify the current implementation. Shared shell/navigation, modal mechanics, table/pagination primitives and token precedence remain governed by `docs/quality/DESIGN_CONTRACT.md` v1.2.0-recovery and repository ownership rules.

The evidence supports the following bounded comparison work:

- S09 list: desktop table (BH-04), portrait table (BH-07), and portrait card/list candidates (BH-12, BH-14).
- S09 detail: desktop completed/returned (BH-01), desktop in-check (BH-02), portrait completed/returned (BH-05), portrait in-check (BH-08).
- S10 list: desktop table (BH-03) and portrait card/list (BH-09).
- S10 detail: sparse line-item composition (BH-06, BH-13) and enriched line-item composition (BH-10, BH-11).

These are image observations, not a decision to add missing business data. The current source contracts explicitly describe frontend-only row shapes; S09 detail has unavailable timeline/related-document sections and S10 detail has unavailable component-line/related-document sections. A visual match that fabricates those fields would violate source authority.

## Locked and source-backed constraints inspected

- `AGENTS.md` assigns reference registration, design contract, token and baseline custody to S00#6 and forbids baseline/source mutation to make a comparison pass.
- `docs/quality/DESIGN_CONTRACT.md` v1.2.0-recovery is active for audit. Missing or conflicting reference/profile/token/state information is `DESIGN_GAP`; screenshot values do not promote to exact CSS authority.
- `src/app/registry.ts` and `src/app/App.tsx` bind S09 to `#/preview/S09` / `WarrantyCasesScreen` and S10 to `#/preview/S10` / `PartsSlipsScreen`.
- `src/features/S09/WarrantyCasesScreen.tsx` owns the S09 list, filters, table and detail opener. `WarrantyDetailDialog.tsx` owns a read-only dialog with source-backed identity/date/status/age fields and explicit unavailable history/related-doc sections.
- `src/features/S10/PartsSlipsScreen.tsx` owns the S10 list, filters, table and detail opener. `PartsSlipDetail.tsx` owns a read-only dialog with source-backed row summary fields and explicit unavailable component-line/related-document sections.
- `src/shared/tokens.css` supplies shared Public Sans, semantic colors, spacing, modal/card radii and 44px touch target. Exact scope-specific geometry, breakpoints, raster CSS viewport/DPR and artwork-only values remain provisional until measured under a declared profile.

## Final-image interpretation and ambiguities

1. **Raster profile is undeclared.** Desktop images are 1672×941 and portrait images are 992×1586. No file identifies CSS viewport, DPR, browser zoom, pointer capability, theme or locale. The canonical tray profiles (1920×1080 DPR1 and 800×1280 DPR2) cannot be asserted for this set without capture metadata.
2. **Shell backdrop is not S09/S10 authority.** Images include a dark-blue sidebar, header and blurred backdrop. Shared shell authority remains separate; these bytes do not supersede `GlobalShell` or shell contracts.
3. **S09 detail history is screenshot-only.** BH-01/BH-02/BH-05/BH-08 show timelines and, for the completed state, a linked defect chip and processing content. The current `WarrantyRow` has no event, diagnostic, defect, or linked-document fields. Exact parity therefore needs an approved source projection or must retain an unavailable state.
4. **S10 detail has two apparent variants.** BH-06/BH-13 are sparse (slip, case, date plus nine rows); BH-10/BH-11 add actor, reason, created-at and a richer heading. No approved variant/state enum or source DTO identifies which should be canonical. Treat both as candidate visual variants; do not silently collapse them.
5. **BH-12/BH-14 are separate bytes with the same apparent S09 portrait card-list state.** No visible semantic discriminator was found. Keep both hashes and require owner disposition (duplicate export, theme/profile variant, or state variant) before using one as a replacement baseline.
6. **Visible values are not fixture authority.** IDs, dates, Vietnamese copy, row counts, status badges and actors in artwork are screenshot facts. They must not drive fixture edits, API joins, permissions, current-date policy or hardcoded pagination.
7. **Coverage is light Vietnamese only.** No dark, English, Chinese, error, loading, empty, forbidden, expired, no-result or long-content reference is supplied. Those states remain separate acceptance requirements.

## Gate status

`DESIGN_READY_FOR_SCOPED_COMPARISON` means the references and route/component ownership are reviewable. `EXACT_FIDELITY_ACCEPTANCE_BLOCKED` remains the correct disposition until S00#3 records declared capture profiles and diffs, S00#4 records functional/accessibility/RBAC evidence, and S00#1 resolves the source/variant decisions. This report intentionally makes no source, token, baseline or business-logic change.
