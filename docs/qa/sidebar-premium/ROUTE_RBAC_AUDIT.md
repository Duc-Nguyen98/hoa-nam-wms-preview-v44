# S00 sidebar route/RBAC/data-scope audit

**Audit:** S00#2 sidebar-premium audit  
**Checkout:** `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
**Branch / revision:** `DEV` / `0ce1b528d328c51955c5cb9fac04afa1a20684e5`  
**Date:** 2026-10-29 (Asia/Bangkok)  
**Mode:** source inspection only; no source implementation, API calls, browser run, or production/RBAC certification.

## Scope and evidence

The audit covers the S01–S29 registry, S00 shell navigation metadata, hash routing, session handling, API-resource mapping, feature contracts, and explicit permission/data-scope signals. Primary evidence is:

- `src/app/registry.ts` — S01–S29 and auth route registry plus `resolvePreviewRoute`.
- `src/app/App.tsx` — route dispatch, session redirects, and S14 history subroute.
- `src/shared/s00-navigation.ts`, `src/shared/s03-shell-navigation.ts`, `src/shared/s01-shell-navigation.ts` — menu tree and leaf metadata.
- `src/shared/shell-locale.ts` — rendered Vietnamese/English/Chinese navigation labels.
- `src/data/http/api-contract.ts`, `src/data/http/api-client.ts`, `src/data/http/business-adapters.ts`, `src/data/http/admin-adapters.ts` — resource URLs, response validation, credentials, and preview fixture selection.
- `src/account/AccountCenterContext.tsx`, `src/account/account-http.ts` — session boundary and 401/session-expiry behavior.
- `src/contracts/*`, `src/controllers/*`, and feature screens — source scope, read-only/blocked states, and command capability checks.

The source tree identifies preview hashes, not a production router or server-side authorization policy. `API_VERSION` envelopes and HTTP status handling are transport contracts; they are not evidence that the deployed backend enforces every permission listed below.

## Cross-cutting route and permission findings

| Finding | Evidence | Audit result / recommendation |
| --- | --- | --- |
| One global session gate | `App.tsx` reads `useAccountCenter()`. Signed-out hashes redirect to `#/preview/S07`; confirmation-required hashes redirect to `#/preview/S08`; an active account visiting S07/S08 is sent to S01. | **CONFIRMED client gate.** Keep this as the authentication boundary. It does not distinguish module capabilities. |
| No shared per-route RBAC guard | `resolvePreviewRoute` only matches a hash against the registry; after the session branch, `App.tsx` dispatches S01–S29 directly. `GlobalShell` receives the complete `S00_SHELL_NAVIGATION` tree for every active session. | **DESIGN_GAP / P1 concern.** Direct links and visible menu leaves are not filtered by role, warehouse, or capability in this checkout. Add a server-authoritative route/capability policy before production exposure; hide or disable menu leaves from the same policy and retain a distinct 403 screen. |
| API session expiry | `createApiClient()` uses `withCredentials:true`; a `401` with `SESSION_EXPIRED` notifies `AccountCenterContext`, which invalidates the session and returns to signed-out. | **CONFIRMED transport behavior.** 401/session-expiry handling is separate from 403 capability denial; test both independently. |
| 403 is mostly feature-owned | `ApiRequestError` preserves status/code, but there is no app-level 403 route boundary. Individual screens/adapters decide whether to render forbidden, blocked, error, or unavailable. | **DESIGN_GAP.** Establish a shared mapping for `401`, `403`, `404`, and scope-empty responses so a denied route cannot look like a network error or an empty dataset. |
| Data scope is source/adapter-defined | List contracts carry `source` (`id`, `scope`, `completeness`, `detailTotal`); several contracts explicitly set `backendMapping`, `endpoint`, and `permissionKeys` to `null`. | **PROVISIONAL preview scope.** Production must return warehouse/period/actor scope from the service and apply scope before counts, pagination, or aggregates. Do not infer scope from a label or fixture row. |
| Preview report data | `business-adapters.ts` mounts local fixture adapters for S18–S22 and S24–S26 when `IS_BROWSER_PREVIEW`; production uses HTTP adapters. | **CONFIRMED preview seam; NOT production evidence.** Keep fixture provenance outside product UI and run route/RBAC tests against the real API before release. |
| Auth routes are intentionally not menu leaves | `authScreenRegistry` contains S07/S08; `S00_SHELL_NAVIGATION` does not. | **CONFIRMED.** Keep login/session outside CMS navigation. |
| Non-menu operational subroute | `App.tsx` handles `#/preview/S14/history` separately; it is not in `screenRegistry` or menu children. | **CONFIRMED route.** Give this subroute the same capability as history API and ensure a 403 result has an explicit forbidden state with no count/row leak. Current screen only renders its designed denial branch for the literal `PUTAWAY_HISTORY_FORBIDDEN`; other adapter errors leave the filter shell without a clear error state. |
| Account and QA routes | `#/account/*`, `#/setup`, `#/qa/*`, and `#/harness/*` are resolved outside the menu. | **CONFIRMED.** Keep them out of production navigation and classify them as non-business/QA routes in route policy. |

## S01–S29 route and scope registry audit

`Route` is the actual hash route. `API/resource` is the current client contract. `Menu` names the current parent/leaf from `S00_SHELL_NAVIGATION`; `—` means intentionally not a menu leaf. `Guard/scope` records what the source actually enforces or declares, not an inferred production permission.

| Key | Current label / component | Route | API/resource or source | Menu | Guard / data-scope concern |
| --- | --- | --- | --- | --- | --- |
| S01 | Tổng quan vận hành / `OverviewScreen` | `#/preview/S01` (also `#/`, empty hash) | `overview` | Tổng quan | Session gate only. Overview contract has source snapshot, warehouse label, period, and `permissionKeys:null`; fixture scope is not production authorization. |
| S02 | Danh mục bệnh/lỗi / `DefectsScreen` | `#/preview/S02` | `defects` | Danh mục → Bệnh / lỗi | Session gate; feature contract supports explicit blocked reasons/status 401/403/404 for reads/commands. Production permission mapping remains unbound. |
| S03 | Danh mục sản phẩm / `ProductsScreen` | `#/preview/S03` | `products` | Danh mục → Sản phẩm | Session gate; source contract marks backend mapping/permission keys as unbound. Create/update command policy is feature-owned and preview-authorized only. |
| S04 | Danh mục SKU / `SkusScreen` | `#/preview/S04` | `skus` | Danh mục → SKU | Session gate; source rows and query scope are explicit, but no shared route capability or warehouse policy is enforced. |
| S05 | Danh mục đại lý & nơi nhận / `RecipientsScreen` | `#/preview/S05` | `recipients` | Danh mục → Đại lý & nơi nhận | Source contract is provided-source scoped; update adapter checks the approved preview actor/entity and returns 403 for disallowed rows. This is not a general production RBAC grant. |
| S06 | Quản lý sản phẩm PV / `PvProductsScreen` | `#/preview/S06` | `pv-products` | Ứng dụng PV → Sản phẩm trên App PV | Scope is `source-detail` or QA synthetic; no route-level capability guard. PV command/audit flows retain host capability checks. |
| S07 | Đăng nhập / `LoginScreen` | `#/preview/S07` | `auth/login` | — (auth) | Signed-out entry. Credentials stay in the form; session response must be `confirmation-required` or `active`. |
| S08 | Xác nhận phiên làm việc / `SessionScreen` | `#/preview/S08` | `auth/session`, `auth/confirm` | — (auth) | Confirmation-required entry. App prevents active users from remaining on this route. |
| S09 | Quản lý hồ sơ bảo hành / `WarrantyCasesScreen` | `#/preview/S09` (legacy fixture variant `?catalog=legacy`) | `warranty-cases` | Bảo hành & sửa chữa → Hồ sơ bảo hành | Read-only list/source fixture in preview. Detail/API/RBAC outcomes remain unassigned; production must apply warranty/warehouse scope before aggregate totals. |
| S10 | Quản lý phiếu xuất linh kiện / `PartsSlipsScreen` | `#/preview/S10` (legacy fixture variant supported) | `parts-slips` | Bảo hành & sửa chữa → Phiếu xuất linh kiện | Read-only list/source fixture in preview. Production detail and mutation permissions are not bound. |
| S11 | Danh sách khay / `TraysScreen` | `#/preview/S11` | `trays` | Xếp khay → Danh sách khay | Source-backed tray scope; operational preview adapter is separately scoped `S11`. No shared route guard. Counts must remain in the authorized warehouse scope. |
| S12 | Danh sách phiếu nhập / `ReceiptsScreen` | `#/preview/S12` | `receipts` | Nhập kho → **Danh sách phiếu nhập** | Source list is read-only by default; operational create/edit is capability guarded by state/command seam. API permission and warehouse scope are not certified. The requested sidebar wording “Phiếu nhập kho” is not the current Vietnamese fallback. |
| S13 | Hàng chờ xếp khay / `PutawayQueueScreen` | `#/preview/S13` | `putaway-queue` | Xếp khay → Hàng chờ xếp khay | Operational adapter scope `S13`; visible-row selection/create guarded. Server capability and warehouse scope remain external. |
| S14 | Lệnh xếp khay / `PutawayOrdersScreen` | `#/preview/S14` | `putaway-orders` | Xếp khay → Lệnh xếp khay | Operational adapter scope `S14`; transitions use feature command/recovery contracts. Direct route has no capability gate. History is a separate subroute. |
| S15 | Phiếu xuất kho / `OutboundSlipsScreen` | `#/preview/S15` | `outbound-slips` | Xuất kho → Phiếu xuất kho | Operational adapter scope `S15`; read/command errors distinguish some forbidden/expired states, but route visibility is global. |
| S16 | Tra cứu tồn & đối soát / `InventoryScreen` | `#/preview/S16` | `inventory` | Tồn kho & đối soát → Tra cứu tồn & đối soát | Contract exposes warehouse/reconciliation fields and nullable quantities; local source rows are not a warehouse authorization proof. |
| S17 | Phiếu đảo tồn kho / `ReversalSlipsScreen` | `#/preview/S17` | `reversals` | Tồn kho & đối soát → Phiếu đảo tồn kho | Reversal command/open actions are guarded by feature state; production capability and original-document scope are unbound. |
| S18 | Báo cáo nhập kho / `InboundReportScreen` | `#/preview/S18` | `reports/inbound` (fixture in browser preview) | Báo cáo & thống kê → Báo cáo nhập kho | Preview fixture supplies one accepted period; production report permission, date policy, and warehouse scope must be server enforced before KPI/page totals. |
| S19 | Báo cáo xuất kho / `OutboundReportScreen` | `#/preview/S19` | `reports/outbound` (fixture in browser preview) | Báo cáo & thống kê → Báo cáo xuất kho | Same report scope concern as S18; unsupported dates are UI blockers, not authorization. |
| S20 | Lịch sử nhập - xuất - tồn kho / `MovementHistoryScreen` | `#/preview/S20` | `reports/movements` (fixture in browser preview) | Báo cáo & thống kê → Lịch sử nhập - xuất - tồn kho | This is movement history, distinct from S14 putaway history. Apply event-level warehouse/period/actor scope before totals. |
| S21 | Báo cáo tồn kho & đối soát / `InventoryReportScreen` | `#/preview/S21` | `reports/inventory` (fixture in browser preview) | Báo cáo & thống kê → Báo cáo tồn kho & đối soát | Fixture exposes a bounded period; production reconciliation visibility and row-level warehouse scope remain unbound. |
| S22 | Báo cáo bảo hành linh kiện / `WarrantyPartsReportScreen` | `#/preview/S22` | `reports/warranty` (fixture in browser preview) | Báo cáo & thống kê → Báo cáo bảo hành linh kiện | Detail can be blocked by `BLOCKED_SOURCE_CONFLICT`; this is source availability, not RBAC. Do not expose aggregate/detail counts from an unauthorized service response. |
| S23 | Nhãn, đóng gói & in lại / `LabelReportScreen` | `#/preview/S23` | `reports/labels` | Báo cáo & thống kê → Nhãn, đóng gói & in lại | Read uses HTTP; print adapter is preview-available and separately guarded. Production print/reprint capability must be checked server-side. |
| S24 | Nhập liệu, đối chiếu & lỗi dữ liệu / `DataQualityScreen` | `#/preview/S24` | `reports/data-quality` (fixture in browser preview) | Báo cáo & thống kê → Nhập liệu, đối chiếu & lỗi dữ liệu | Fixture data quality scope is local. Production quality/error visibility can contain sensitive records; require explicit report capability and warehouse/period scope. |
| S25 | Xuất theo người nhận đại lý / `DealerExportScreen` | `#/preview/S25` | `reports/dealer-exports` (fixture in browser preview) | Báo cáo & thống kê → Xuất theo người nhận đại lý | Dealer/recipient aggregates need scope before count/page. No route-level or recipient-level capability policy is present. |
| S26 | Truy vết hàng hóa / `GoodsTraceScreen` | `#/preview/S26` | `reports/goods-trace` (fixture in browser preview) | Báo cáo & thống kê → Truy vết hàng hóa | Trace data may expose serial/lot/location. Source contract is preview-only; production must enforce row-level warehouse and trace permission. |
| S27 | Nhật ký hệ thống / `SystemAuditScreen` | `#/preview/S27` | `admin/system-audit` | Nhật ký hệ thống | Admin HTTP adapter only validates versioned envelope. Operational/PV audit sources are distinct and bounded snapshots; no shared admin capability guard is applied before route render. |
| S28 | Cấu hình kho Hoa Nam / `WarehouseConfigScreen` | `#/preview/S28` | `admin/warehouse-config` (read; PUT for command) | Current leaf fallback “Cấu hình” → S28 | Controller computes `canView` from `warehouse.view` and `canEdit` from `warehouse.manage`; write target is fixed `warehouse-hn-01`, actor/epoch/version/replay checks are host-owned. Default adapter read is `source-unselected`; this is not a route gate. |
| S29 | Người dùng & RBAC / `UsersRbacScreen` | `#/preview/S29` | `admin/users-rbac/users`, `admin/users-rbac/roles` | Current leaf fallback “Người dùng & RBAC” → S29 | Contract has `permissionsAvailable: false`; “Xem quyền” is deliberately blocked. User/role rows include scope (`SYSTEM`, `WAREHOUSE`, `FUNCTION`) but do not grant or prove effective permissions. Require admin capability and server-filtered scope before exposing this route. |

## High-priority recommendations

1. Introduce a single server-authoritative route capability policy consumed by both `App` and `S00_SHELL_NAVIGATION`. It should return `visible`, `readOnly`, `allowedActions`, and `scope` for the active session; direct hashes must receive the same decision as menu clicks.
2. Keep authentication (`S07/S08`) and authorization (`403`) separate. A 401/session expiry should invalidate the session; a 403 should render an explicit forbidden state without rows, counts, aggregates, or filter options from the denied resource.
3. Define capability keys and data-scope claims for every leaf, at minimum the four requested destinations: `receipts.read` (S12), `outbounds.read` (S15), `users.read`/`roles.read` (S29), and `warehouse.view`/`warehouse.manage` (S28). Include warehouse IDs, permitted periods, and actor/role where applicable.
4. Make report and trace adapters apply authorization scope before summary/KPI, pagination, and option catalogue generation. Fixture `source.detailTotal` and local report adapters cannot substitute for this ordering.
5. Resolve the S14 history error mapping: map API `403`/`FORBIDDEN` to the existing forbidden panel, map 401 to session expiry, and render a retryable error for other failures. Do not leave a blank filter shell when the adapter rejects.
6. Keep `S29.permissionsAvailable:false` visible as a blocked capability until RBAC-DATA-01 (or equivalent server contract) is supplied. Do not infer effective grants from `roleLabel`, role code, or visible row scope.
7. Keep S07/S08, account, setup, harness, QA, and notification-document routes outside production sidebar policy and enumerate them in a non-menu route registry.

## Audit verdict

- **Menu mapping:** source-consistent for all S01–S29 leaves; S07/S08 are intentionally outside the menu.
- **Requested-label fidelity:** S15 has the exact Vietnamese fallback; S12 currently renders “Danh sách phiếu nhập”, while S29 and S28 do not currently render the requested “Người dùng & phân quyền” and “Cấu hình hệ thống” labels (see `MENU_MAPPING.md`).
- **Authentication:** client session boundary is implemented and identifiable.
- **Route-level RBAC/data scope:** **NOT CERTIFIED / DESIGN_GAP**. No production backend, role matrix, or deployed API evidence was inspected. Treat this audit as a routing and contract inventory, not an authorization pass.
