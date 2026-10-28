# S00 sidebar menu mapping

**Checkout:** `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
**Branch / revision:** `DEV` / `0ce1b528d328c51955c5cb9fac04afa1a20684e5`  
**Source:** `src/shared/s00-navigation.ts`, `src/shared/s03-shell-navigation.ts`, `src/shared/s01-shell-navigation.ts`, `src/shared/shell-locale.ts`, `src/app/registry.ts`  
**Audit mode:** static source audit; no source implementation changes.

## Rendered tree (Vietnamese shell)

`S00_SHELL_NAVIGATION` starts from S01/S03 metadata and replaces the operations, reports, catalogue, users, settings, and audit nodes. `GlobalShell` localizes a node by its key; Vietnamese keeps the metadata fallback string. The current Vietnamese tree is:

- **Tổng quan** → `S01` → `#/preview/S01`
- **Nghiệp vụ**
  - **Nhập kho**
    - **Danh sách phiếu nhập** → `S12` → `#/preview/S12`
  - **Xuất kho**
    - **Phiếu xuất kho** → `S15` → `#/preview/S15`
  - **Xếp khay**
    - **Hàng chờ xếp khay** → `S13` → `#/preview/S13`
    - **Lệnh xếp khay** → `S14` → `#/preview/S14`
    - **Danh sách khay** → `S11` → `#/preview/S11`
  - **Bảo hành & sửa chữa**
    - **Hồ sơ bảo hành** → `S09` → `#/preview/S09`
    - **Phiếu xuất linh kiện** → `S10` → `#/preview/S10`
  - **Tồn kho & đối soát**
    - **Tra cứu tồn & đối soát** → `S16` → `#/preview/S16`
    - **Phiếu đảo tồn kho** → `S17` → `#/preview/S17`
- **Báo cáo & thống kê**
  - **Báo cáo nhập kho** → `S18` → `#/preview/S18`
  - **Báo cáo xuất kho** → `S19` → `#/preview/S19`
  - **Lịch sử nhập - xuất - tồn kho** → `S20` → `#/preview/S20`
  - **Báo cáo tồn kho & đối soát** → `S21` → `#/preview/S21`
  - **Báo cáo bảo hành linh kiện** → `S22` → `#/preview/S22`
  - **Nhãn, đóng gói & in lại** → `S23` → `#/preview/S23`
  - **Nhập liệu, đối chiếu & lỗi dữ liệu** → `S24` → `#/preview/S24`
  - **Xuất theo người nhận đại lý** → `S25` → `#/preview/S25`
  - **Truy vết hàng hóa** → `S26` → `#/preview/S26`
- **Danh mục**
  - **Sản phẩm** → `S03` → `#/preview/S03`
  - **Bệnh / lỗi** → `S02` → `#/preview/S02`
  - **SKU** in metadata; `nav.S04` localizes the visible leaf to **Mã SKU** → `S04` → `#/preview/S04`
  - **Đại lý & nơi nhận** → `S05` → `#/preview/S05`
- **Ứng dụng PV**
  - **Sản phẩm trên App PV** in metadata; `nav.S06` localizes the visible leaf to **Sản phẩm trên PV** → `S06` → `#/preview/S06`
- **Users/admin leaves**
  - **Người dùng & RBAC** → `S29` → `#/preview/S29`
  - **Cấu hình** → `S28` → `#/preview/S28`
  - **Nhật ký hệ thống** → `S27` → `#/preview/S27`

Groups without an `href` are expandable navigation items; only leaves are destinations. `reports` sets `hasSubmenu:false` while supplying children, so the visible report group is a direct expandable list rather than a route of its own.

## Requested labels versus current labels

| Requested label | Actual route | Current Vietnamese shell label | Source of current text | Assessment | Recommendation |
| --- | --- | --- | --- | --- | --- |
| **Phiếu nhập kho** | `#/preview/S12` | **Danh sách phiếu nhập** | `s00-navigation.ts` fallback; `shell-locale.ts` returns the Vietnamese fallback unchanged (`if (language === 'vi') return fallback`) | **MISMATCH (rendered VI)**; English/Chinese locale keys use translated labels | Align the Vietnamese fallback to **Phiếu nhập kho** if that is the approved canonical leaf term; keep route key S12 and update search/registry copy together. |
| **Phiếu xuất kho** | `#/preview/S15` | **Phiếu xuất kho** | `s00-navigation.ts` and `shell-locale.ts` `nav.S15` | **MATCH** | Keep. |
| **Người dùng & phân quyền** | `#/preview/S29` | **Người dùng & RBAC** | `s01-shell-navigation.ts` fallback **Người dùng & RBAC**; S00 remaps key to `S29`; `shell-locale.ts` `nav.S29` is also **Người dùng & RBAC**. The `nav.users` string with the requested wording is not used after the key remap. | **MISMATCH** | Choose one canonical Vietnamese label. For the requested wording, set the S29 menu/locale label to **Người dùng & phân quyền** while retaining the feature title “Người dùng & RBAC” only where the RBAC term is required by the contract. Update search text/translation keys together. |
| **Cấu hình hệ thống** | `#/preview/S28` | **Cấu hình** in the sidebar; screen title is **Cấu hình kho Hoa Nam** | `s01-shell-navigation.ts` fallback **Cấu hình**; S00 remaps key to `S28` but preserves `label`; `shell-locale.ts` `nav.settings` is **Cấu hình**, `nav.S28` is **Cấu hình kho Hoa Nam** and is not selected for the leaf fallback in VI. | **MISMATCH** | Set the menu label to **Cấu hình hệ thống** if that is the approved product term. Keep the screen title’s warehouse qualifier as a page heading if needed. Ensure the route key remains S28 and search labels use the same canonical term. |

English and Chinese shell locale labels also follow the remapped leaf keys (`nav.S29` = Users & RBAC; `nav.S28` = Hoa Nam warehouse configuration). A Vietnamese-only label change should preserve deliberate translations in the other locales, with long-label responsive checks.

## Registry and non-menu routes

The registry contains S01–S06, S09–S29. S07 and S08 are in `authScreenRegistry` and intentionally excluded from `S00_SHELL_NAVIGATION`. The following routes are also handled outside the menu and should remain outside production menu policy:

- `#/preview/S14/history` — putaway history subroute; shares S14 active shell state.
- `#/account/profile`, `#/account/security`, `#/account/settings`, `#/account/notifications` — account center panels.
- `#/setup` — setup/health view.
- `#/qa/operations`, `#/qa/toasts`, `#/harness/notifications`, `#/harness/notifications-repository`, `#/harness/date-policy` — QA/harness routes.
- Canonical overview/document/notification deep links resolved by `resolveCanonicalPreviewSelection`, `resolveOverviewDocumentSelection`, and `resolveNotificationDocumentSelection` — they may land on S01/S09/S11/S12/S15/S16/S23 but are not additional menu leaves.

## Search and active-state implications

`getShellDestinations()` flattens only href-bearing leaves. `GlobalShell` builds search text from localized labels plus the original Vietnamese label, so changing a menu label requires checking both visible text and search matches. Ancestor expansion is derived from the `activeKey`; S28/S29/S27 remain active leaves even though their source metadata keys were originally `settings`, `users`, and `audit`.

No menu item currently carries a capability, role, or warehouse-scope field. The tree therefore expresses presentation and destination metadata only. A production policy should augment (or join) this tree with server-authoritative visibility/read-only/action decisions rather than relying on labels or screen keys.

## Mapping verdict

- S01–S29 business leaves are represented once, with S12/S15/S27/S28/S29 remapped to the actual route keys.
- Auth, account, setup, QA, harness, and S14 history routes are intentionally non-menu destinations.
- **Requested-label result:** S15 matches in the rendered Vietnamese shell; S12, S29, and S28 require label alignment to the requested wording.
- Capability and warehouse scope metadata are absent from S00 menu items; RBAC/data-scope acceptance remains **NOT CERTIFIED** until a server policy and independent functional evidence are supplied.

## Post-change verification (sidebar task)

The implementation commit for this task changes the Vietnamese rendered labels without changing route keys:

- S12: `Phiếu nhập kho` → `#/preview/S12`
- S28: `Cấu hình hệ thống` → `#/preview/S28`
- S29: `Người dùng & phân quyền` → `#/preview/S29`

The earlier tables in this file are a pre-change static audit snapshot. The browser QA result and exact measurements are recorded in `SIDEBAR_VISUAL_QA.md`.
