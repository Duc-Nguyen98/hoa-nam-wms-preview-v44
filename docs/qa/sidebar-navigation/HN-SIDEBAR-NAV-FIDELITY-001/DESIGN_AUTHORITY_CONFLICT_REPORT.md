# Design authority and conflict report — HN-SIDEBAR-NAV-FIDELITY-001

**Owner:** S00#6 Design Guardian  
**Scope:** shared `GlobalShell` sidebar/drawer, menu hierarchy, sidebar function search and header screen search for SB1/SB2  
**Branch:** `DEV`  
**Scoped source revision:** `a617604dc722f5e34fd528940c865a4fec2db109`  
**Disposition:** `DESIGN_READY_FOR_SCOPED_COMPARISON`; exact fidelity is `BLOCKED` by the unresolved S10 icon conflict and undeclared SB2 capture profile.

## Authority decision

SB1 and SB2 are approved scoped references for the same Hoa Nam WMS navigation surface at two compositions:

- **SB1:** desktop expanded sidebar with S10 (`Phiếu xuất linh kiện`) active.
- **SB2:** portrait/tablet navigation drawer over the S10 page with the same active leaf and expanded `Bảo hành & sửa chữa` group.

The references establish menu hierarchy, labels, active treatment, flat blue surface, search separation and drawer/sidebar composition. They do not authorize a new shell token, CSS breakpoint, route capability, API permission, fixture, or icon substitution. Shared shell and navigation components remain the source owners.

## Approved hierarchy and route mapping

The visible Vietnamese hierarchy is consistent between SB1 and SB2:

- **Tổng quan** → `S01` → `#/preview/S01`
- **Nghiệp vụ**
  - **Nhập kho** → **Phiếu nhập kho** → `S12` → `#/preview/S12`
  - **Xuất kho** → **Phiếu xuất kho** → `S15` → `#/preview/S15`
  - **Xếp khay** → **Hàng chờ xếp khay** (`S13`), **Lệnh xếp khay** (`S14`), **Danh sách khay** (`S11`)
  - **Bảo hành & sửa chữa** → **Hồ sơ bảo hành** (`S09`) and **Phiếu xuất linh kiện** (`S10`)
  - **Tồn kho & đối soát** → **Tra cứu tồn & đối soát** (`S16`) and **Phiếu đảo tồn kho** (`S17`)
- **Danh mục** → catalog leaves (`S03`, `S02`, `S04`, `S05`)
- **Báo cáo & thống kê** → report leaves `S18`–`S26`
- **Quản trị** → **Người dùng & phân quyền** (`S29`), **Cấu hình hệ thống** (`S28`), **Nhật ký hệ thống** (`S27`)
- **Kho Hoa Nam** footer/warehouse identity (context, not a route leaf)

The route keys and hrefs are source-backed by `src/shared/s00-navigation.ts` and `src/app/registry.ts`. Auth, account, setup and QA/harness routes remain outside the production menu policy.

## Surface and interaction authority

The two references agree on these bounded presentation rules:

- Flat Hoa Nam navy/blue sidebar and drawer surface; no warehouse-photo/sidebar backdrop is promoted from other page references.
- Readable white/light-blue labels, consistent outline icons, and stable row geometry. Active S10 uses semibold text and a small white dot; no cyan rail or raised block is authorized by these bytes.
- `Bảo hành & sửa chữa` is expanded when S10 is active. Parent expansion follows active-key ancestry; it is not a second route.
- SB1 exposes the desktop sidebar search inside the nav. SB2 exposes the same search inside the drawer and retains a close control/backdrop.
- Existing shared focus, Escape, body-scroll-lock, drawer and responsive behavior remain implementation contracts. The images do not grant permission to change them.

## Search separation

SB1 visibly contains two different search surfaces:

1. **Sidebar function search:** `Tìm chức năng…` / `shell.functionSearch`, rendered by `GlobalShell` in `.hn-sidebar__search`. It filters the visible navigation tree and ancestor groups using `matchShellDestinations` with Vietnamese diacritic normalization.
2. **Header screen search:** `Tìm màn hình…` / `header.searchPlaceholder`, rendered by `ShellHeader` in the global search dialog. It searches flattened href-bearing shell destinations and can include the original Vietnamese label as `searchText` for localized matching.

SB2 retains the sidebar function search while the header screen search is visually collapsed to its icon/trigger. These are separate scopes and controls. They must not be merged, share query state, or be relabeled as page-data search. `getShellDestinations()` only supplies menu leaves to the header destination list; it does not change sidebar tree filtering.

## Open conflict — S10 icon

The direct icon conflict found between SB1 and SB2 is the active **Phiếu xuất linh kiện** leaf icon:

| Evidence | Visible S10 icon | Source comparison |
|---|---|---|
| SB1 desktop | Document/file outline (same family as S09 leaf) | Conflicts with current source `S00_SHELL_NAVIGATION` S10 `icon: 'upload'`. |
| SB2 tablet | Upload arrow outline | Matches current source `icon: 'upload'` and the parts-issue semantics. |

The source currently maps S09 to `documents` and S10 to `upload`; the icon registry has both canonical names. Route semantics alone cannot select one approved glyph because the two approved references disagree. This remains `OPEN / DESIGN_CONFLICT` pending S00#1/S00#6 owner decision. Do not edit `src/shared/s00-navigation.ts` or replace an icon based on one raster.

## Other profile and authority gaps

- SB1's raster is 1672×941; SB2's raster is 1024×1536. Existing QA's tablet CSS capture was 992×1586. The portrait source/actual mapping, DPR and browser profile are undeclared, so exact geometry acceptance is `BLOCKED`.
- Sidebar width, drawer width, rail/pinned mode, header geometry and typography are source/QA observations, not new global token approvals. The prior contract records approximate QA measurements (desktop sidebar 320 CSS px; tablet drawer 350 CSS px), but raster pixels do not supersede the shared shell contract.
- No reference establishes role/capability visibility. The menu tree is presentation/destination metadata; server-authoritative RBAC/data-scope decisions remain outside this design report.

## Gate status

- Reference custody and SHA-256 registration: **CONFIRMED**; see [`REFERENCE_MANIFEST.md`](./REFERENCE_MANIFEST.md).
- Route keys, leaf labels, active S10 context and search separation: **CONFIRMED source mapping**; section-heading/grouping parity remains open (see below).
- S10 icon parity SB1 vs SB2: **OPEN / DESIGN_CONFLICT**.
- Exact SB2 visual profile and pixel acceptance: **BLOCKED / DESIGN_GAP**.
- Functional, accessibility, RBAC, production API, hosted CI and deployment provenance: **NOT_RUN by S00#6**.

This packet is documentation-only. It makes no source, token, baseline or business-logic changes.

## Open hierarchy conflict — administration grouping

SB1/SB2 visibly place **Người dùng & phân quyền**, **Cấu hình hệ thống** and **Nhật ký hệ thống** below a `QUẢN TRỊ` section heading separated from the report leaves. The current `S00_SHELL_NAVIGATION` metadata maps these as three top-level leaves (`S29`, `S28`, `S27`) and has no `admin` parent node or section-heading key; `shell-locale.ts` also localizes `nav.operations` as `Nghiệp vụ kho`, while the references show the shorter `NGHIỆP VỤ` heading. The source tree therefore preserves destinations and labels but does not prove the same grouping/heading semantics.

This is `OPEN / DESIGN_CONFLICT` for hierarchy presentation only. Do not add an admin group, rename headings, or alter route keys from raster inference. S00#1/S00#6 must select whether the headings are approved visual section labels implemented outside navigation metadata or whether the metadata requires a scoped grouping revision. Capability and RBAC semantics remain separate from this visual grouping decision.
