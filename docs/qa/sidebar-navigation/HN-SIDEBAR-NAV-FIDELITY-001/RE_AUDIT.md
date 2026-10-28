# HN-SIDEBAR-NAV-FIDELITY-001 — route/menu/RBAC re-audit

**Audit mode:** read-only source and evidence review  
**Checkout:** `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
**Branch:** `DEV`  
**Current HEAD:** `ce691861c02ca14f61dcc930751981cb6a18ff24` (`docs(sidebar): record preview deployment evidence`)  
**Scoped source revision:** `a617604dc722f5e34fd528940c865a4fec2db109` (`feat(shell): apply approved premium sidebar`)  
**Prior static baseline:** `0ce1b528d328c51955c5cb9fac04afa1a20684e5`  
**Date:** 2026-10-29 (Asia/Bangkok)

This re-audit checks the current S00 navigation implementation against the S01–S29 registry and the sidebar evidence package. It does not modify source, call a production API, or certify server authorization.

## Evidence and check classification

| Evidence | Classification | What it proves |
| --- | --- | --- |
| `src/app/registry.ts`, `src/app/App.tsx` | **STATIC** | Hash registry, route dispatch, auth redirect, non-menu subroutes, and component wiring. |
| `src/shared/s00-navigation.ts`, `src/shared/s01-shell-navigation.ts`, `src/shared/s03-shell-navigation.ts` | **STATIC** | Menu tree, labels, hrefs, icon metadata, parent/child relationships. |
| `src/shared/GlobalShell.tsx`, `src/shared/shell-locale.ts`, `src/shared/Icon.tsx` | **STATIC** | Localization, search filtering, rendered icon selection, and icon-path candidates. |
| `src/data/http/api-contract.ts`, `business-adapters.ts`, `admin-adapters.ts`, `api-client.ts` | **STATIC** | Current client resource paths, envelope validation, credentials, and error transport. |
| `src/account/AccountCenterContext.tsx` and `src/account/account-http.ts` | **STATIC** | Session state/redirect behavior and `SESSION_EXPIRED` invalidation. |
| `docs/qa/sidebar-premium/SIDEBAR_VISUAL_QA.md` | **BROWSER / LOCAL PREVIEW** | One desktop S10 route and one tablet drawer run; search, hover, width, Escape and scroll lock. |
| `docs/qa/sidebar-premium/SIDEBAR_FUNCTIONAL_RBAC_QA.md`, `FINAL_SIDEBAR_VERDICT.md` | **BROWSER + STATIC** | Presentation checks pass; backend capability filtering remains `NOT_RUN`/`BLOCKED`. |
| `docs/qa/sidebar-premium/SIDEBAR_RELEASE_REPORT.md` | **DEPLOYMENT EVIDENCE** | Preview version 62/build-info provenance; not a production RBAC result. |

The existing browser run is not an exhaustive S01–S29 traversal: it used local Preview mock data at S10 and only exercised a searched S12 result plus drawer behavior. All route/RBAC conclusions below remain static unless explicitly marked browser evidence.

## Exact route and menu mapping

`Menu` is the current Vietnamese S00 tree. S07/S08 are auth registry entries and intentionally have no menu leaf. The resource column is the current client contract; it is not a proof that the deployed server exposes or authorizes the path.

| Key | Hash route | Component / client resource | Current menu placement | Check |
| --- | --- | --- | --- | --- |
| S01 | `#/preview/S01` (also `#/`, empty hash) | `OverviewScreen` / `overview` | Tổng quan | **STATIC MATCH** |
| S02 | `#/preview/S02` | `DefectsScreen` / `defects` | Danh mục → Bệnh / lỗi | **STATIC MATCH** |
| S03 | `#/preview/S03` | `ProductsScreen` / `products` | Danh mục → Sản phẩm | **STATIC MATCH** |
| S04 | `#/preview/S04` | `SkusScreen` / `skus` | Danh mục → SKU | **STATIC MATCH** |
| S05 | `#/preview/S05` | `RecipientsScreen` / `recipients` | Danh mục → Đại lý & nơi nhận | **STATIC MATCH** |
| S06 | `#/preview/S06` | `PvProductsScreen` / `pv-products` | Quản lý mã SKU → Sản phẩm trên App PV | **STATIC MATCH** |
| S07 | `#/preview/S07` | `LoginScreen` / `auth/login` | — auth registry only | **STATIC INTENTIONAL** |
| S08 | `#/preview/S08` | `SessionScreen` / `auth/session`, `auth/confirm` | — auth registry only | **STATIC INTENTIONAL** |
| S09 | `#/preview/S09`; legacy `?catalog=legacy` | `WarrantyCasesScreen` / `warranty-cases` | Bảo hành & sửa chữa → Hồ sơ bảo hành | **STATIC MATCH** |
| S10 | `#/preview/S10`; legacy `?catalog=legacy` | `PartsSlipsScreen` / `parts-slips` | Bảo hành & sửa chữa → Phiếu xuất linh kiện | **STATIC MATCH**; browser active-route evidence exists |
| S11 | `#/preview/S11` | `TraysScreen` / `trays` | Xếp khay → Danh sách khay | **STATIC MATCH** |
| S12 | `#/preview/S12` | `ReceiptsScreen` / `receipts` | Nhập kho → **Phiếu nhập kho** | **STATIC MATCH**; label is now source metadata |
| S13 | `#/preview/S13` | `PutawayQueueScreen` / `putaway-queue` | Xếp khay → Hàng chờ xếp khay | **STATIC MATCH** |
| S14 | `#/preview/S14` | `PutawayOrdersScreen` / `putaway-orders` | Xếp khay → Lệnh xếp khay | **STATIC MATCH** |
| S15 | `#/preview/S15` | `OutboundSlipsScreen` / `outbound-slips` | Xuất kho → Phiếu xuất kho | **STATIC MATCH** |
| S16 | `#/preview/S16` | `InventoryScreen` / `inventory` | Tồn kho & đối soát → Tra cứu tồn & đối soát | **STATIC MATCH** |
| S17 | `#/preview/S17` | `ReversalSlipsScreen` / `reversals` | Tồn kho & đối soát → Phiếu đảo tồn kho | **STATIC MATCH** |
| S18 | `#/preview/S18` | `InboundReportScreen` / `reports/inbound` | Báo cáo → Báo cáo nhập kho | **STATIC MATCH** |
| S19 | `#/preview/S19` | `OutboundReportScreen` / `reports/outbound` | Báo cáo → Báo cáo xuất kho | **STATIC MATCH** |
| S20 | `#/preview/S20` | `MovementHistoryScreen` / `reports/movements` | Báo cáo → Lịch sử nhập - xuất - tồn kho | **STATIC MATCH** |
| S21 | `#/preview/S21` | `InventoryReportScreen` / `reports/inventory` | Báo cáo → Báo cáo tồn kho & đối soát | **STATIC MATCH** |
| S22 | `#/preview/S22` | `WarrantyPartsReportScreen` / `reports/warranty` | Báo cáo → Báo cáo bảo hành linh kiện | **STATIC MATCH** |
| S23 | `#/preview/S23` | `LabelReportScreen` / `reports/labels` | Báo cáo → Nhãn, đóng gói & in lại | **STATIC MATCH** |
| S24 | `#/preview/S24` | `DataQualityScreen` / `reports/data-quality` | Báo cáo → Nhập liệu, đối chiếu & lỗi dữ liệu | **STATIC MATCH** |
| S25 | `#/preview/S25` | `DealerExportScreen` / `reports/dealer-exports` | Báo cáo → Xuất theo người nhận đại lý | **STATIC MATCH** |
| S26 | `#/preview/S26` | `GoodsTraceScreen` / `reports/goods-trace` | Báo cáo → Truy vết hàng hóa | **STATIC MATCH** |
| S27 | `#/preview/S27` | `SystemAuditScreen` / `admin/system-audit` | Nhật ký hệ thống | **STATIC MATCH** |
| S28 | `#/preview/S28` | `WarehouseConfigScreen` / `admin/warehouse-config` (read; PUT command) | **Cấu hình hệ thống** | **STATIC MATCH**; capability still host/API-owned |
| S29 | `#/preview/S29` | `UsersRbacScreen` / `admin/users-rbac/users`, `admin/users-rbac/roles` | **Người dùng & phân quyền** | **STATIC MATCH**; permission matrix unavailable |

Additional non-leaf routes remain outside the menu: `#/preview/S14/history` (Preview-only putaway history), `#/account/profile`, `#/account/security`, `#/account/settings`, `#/account/notifications`, `#/setup`, QA/harness hashes, and validated document/notification deep links. `S14/history` is not in `screenRegistry`; `App.tsx` handles it only when `IS_BROWSER_PREVIEW` is true.

## Label and search findings

- The scoped revision corrected all four requested Vietnamese labels in `src/shared/s00-navigation.ts`: `Phiếu nhập kho`, `Phiếu xuất kho`, `Người dùng & phân quyền`, and `Cấu hình hệ thống` (S15 was already exact).
- The registry intentionally still carries older page labels for S12 (`Danh sách phiếu nhập`), S28 (`Cấu hình kho Hoa Nam`), and S29 (`Người dùng & RBAC`). `App.tsx` uses the registry label for the document title/setup list, while the sidebar uses S00 metadata. This creates a static terminology split between sidebar, page title, and setup/registry surfaces; it is not a route mismatch, but should be either aligned or documented as a page-title distinction.
- The inbound **group** and its S12 **leaf** now both use `Phiếu nhập kho`. This is a terminology duplication candidate: the browser evidence shows a no-diacritic query (`phieu nhap kho`) returning the visible inbound group and its leaf. Decide whether the group should remain a category label (`Nhập kho`) while the leaf carries the requested document label, or explicitly accept the duplicate as the approved wording.
- `shell-locale.ts` still has `nav.inbound-management: 'Nhập kho'`, `nav.settings: 'Cấu hình'`, and `nav.users: 'Người dùng & phân quyền'`; Vietnamese rendering intentionally returns metadata fallback, so the new S00 labels win in VI. English/Chinese continue to localize by remapped keys (`S28`, `S29`) and should be checked for long-label expansion. This is **STATIC**, not a full locale browser result.
- Function search is local-only. `matchShellDestinations()` normalizes diacritics, but it has no capability or route authorization input. Search therefore filters presentation metadata, not authorized destinations.

## Icon conflict candidates (static candidates; no icon defect is declared)

`GlobalShell.tsx` renders a nested item as a dot when `nested && !item.leafIcon`; therefore metadata `icon` values on nested groups are not displayed as icons. The following candidates should be resolved against the approved icon reference or explicitly accepted:

| Candidate | Current declarations / rendered behavior | Why review is needed |
| --- | --- | --- |
| Nested group icon metadata is inert | `inbound-management`, `outbound-management`, `putaway-management`, `warranty-management`, `inventory-management`, and `sku-management` declare icons, but nested group rows render `hn-navigation__dot`, not those icons. | Source metadata can imply an icon contract that the UI never paints; verify whether the dot is intentional for all group rows. |
| Inbound/outbound leaf glyph collision | S12 and S15 both use `icon: 'documents'`; their parent groups use download/upload, but the leaves themselves are visually the same document icon. | A user comparing adjacent operational destinations may not get directional recognition from the leaf glyph. Candidate only; no approved replacement inferred. |
| Report glyph repetition | Every S18–S26 report leaf uses `icon: 'chart'`. | Nine report destinations share one glyph, so distinctions rely entirely on labels; confirm this matches the approved sidebar reference. |
| Catalog parent/leaf repetition | The `catalog` group uses `catalog`; S02 also uses `catalog`. | Expanded catalogue can show the same document/list glyph at parent and leaf levels; confirm hierarchy treatment. |
| Audit/document visual family | S27 uses `audit`; S09 and other leaves use `documents`, both rectangular text-document glyphs in `Icon.tsx`. | Similar silhouette may be intentional, but should be checked in the approved icon context rather than inferred from semantic names. |

No icon conflict was browser-measured in the current package. The existing screenshots establish geometry/colour states only; they do not provide an icon-by-icon acceptance matrix.

## Permission and data-scope re-audit

### Authentication boundary — static PASS

`AccountCenterContext` obtains the session via `auth/session`. `App.tsx` redirects signed-out sessions to S07, confirmation-required sessions to S08, and active sessions away from S07/S08 to S01. `api-client.ts` sends credentials and invalidates the session on a `401 SESSION_EXPIRED`. This is an authentication boundary, not per-module authorization.

### Route/menu filtering — BLOCKED / static gap

- `resolvePreviewRoute()` matches the hash against the registry; it does not accept actor, role, capability, or warehouse scope.
- `GlobalShell` receives the complete `S00_SHELL_NAVIGATION` tree for each active session. Menu items have `key`, `label`, `href`, `icon`, and expansion metadata only; there is no `requiredCapability`, `visibleWhen`, or data-scope field.
- The new function search filters the complete local tree and has no policy input. A user can search to any registered leaf even if a backend would later deny the resource.
- Direct hashes and menu clicks therefore do not share a server-authoritative visibility decision. This remains **BLOCKED** by the absent capability contract, unchanged by `a617604`/`ce691861`.

### Feature/API capability signals — static inventory

- S12–S26 use business resource adapters. Preview reports (S18–S22, S24–S26) mount local fixtures under `IS_BROWSER_PREVIEW`; this does not certify production warehouse/report permissions.
- S27–S29 use admin HTTP adapters. S29’s contract has `permissionsAvailable: false`; its “Xem quyền” action remains blocked, and displayed role/scope rows do not grant effective permission.
- S28 computes `canView` from `warehouse.view` and `canEdit` from `warehouse.manage`; the write seam requires `warehouse.manage`, fixed entity `warehouse-hn-01`, actor/epoch/version/replay checks. These are feature/host contracts, not an app route guard.
- `api-client.ts` preserves 403 status/code but no shared 403 route boundary exists. A denied resource can still be reached from a visible menu/direct hash and feature-specific error rendering decides the result.
- Putaway history is a separate `putaway-history` API route under S14. Its explicit forbidden panel is feature-owned; no shared capability decision controls the S14 history URL.

### Browser versus static status

| Check | Status | Evidence / limit |
| --- | --- | --- |
| S10 active leaf route and shell rendering | **BROWSER PASS (local Preview)** | `SIDEBAR_VISUAL_QA.md`; one route only. |
| No-diacritic function search | **BROWSER PASS (local Preview)** | `phieu nhap kho` showed the requested S12 label; duplicate parent/leaf behavior is visible in the captured run. |
| Tablet drawer open, Escape, body scroll lock | **BROWSER PASS (local Preview)** | `SIDEBAR_VISUAL_QA.md`; one tablet profile. |
| All S01–S29 direct routes and refresh | **NOT_RUN** | No exhaustive browser matrix in this task. |
| VI/EN/zh-CN × light/dark × zoom | **NOT_RUN** | Static locale keys inspected only. |
| Icon-by-icon fidelity | **NOT_RUN** | Candidate conflicts listed above; no approved icon matrix. |
| Server RBAC, tenant/warehouse scope, 401/403 isolation | **BLOCKED** | No server-authoritative capability contract or REAL_API evidence. |
| Build/typecheck/quality gates | **PASS in existing release evidence** | `SIDEBAR_REGRESSION_REPORT.md`; evidence belongs to the scoped sidebar task, not this re-audit. |

## Recommendations

1. Keep route keys and hrefs unchanged, but join `S00_SHELL_NAVIGATION` to a server-authoritative policy that returns visibility, read-only state, allowed actions, and warehouse/period scope. Apply the same policy to direct hashes and function search.
2. Decide the inbound group wording explicitly. If the requested label is reserved for the S12 document leaf, restore the category label to `Nhập kho`; if both rows are intentionally `Phiếu nhập kho`, record that as an approved duplicate and test search/active-state clarity.
3. Align or explicitly register the S12/S28/S29 registry/page-title labels against the approved sidebar wording so `document.title`, setup list, and menu do not disagree silently.
4. Register an icon acceptance matrix for group rows and report leaves. In particular, decide whether nested groups should retain the dot treatment and whether S12/S15 and S18–S26 may share glyphs.
5. Add independent 403 coverage for S12, S15, S27, S28, S29, and `S14/history`, asserting no unauthorized rows, counts, options, or aggregates are exposed.
6. Treat current browser checks as local Preview presentation evidence only. Before release, run direct-route/refresh and role/scope checks against an authorized backend or keep the RBAC gate `BLOCKED`.

## Re-audit verdict

- **Route/menu mapping:** `PASS` for static S01–S29 mapping at current HEAD; S07/S08 and non-menu routes are intentionally separate.
- **Requested labels:** `PASS` in current Vietnamese S00 metadata; duplicate inbound group/leaf wording is an open terminology candidate.
- **Icons:** no confirmed defect; five static conflict candidates require approved-reference or browser icon review.
- **Authentication:** client session boundary is present.
- **RBAC/data scope:** `BLOCKED / NOT CERTIFIED`; the scoped sidebar revision does not add route capability filtering, and existing Preview browser evidence cannot certify server authorization.
