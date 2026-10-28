# Sidebar remediation — HN-SIDEBAR-REPAIR-001

## Reproduced defect

At 1920px desktop the shell rendered an extra `Nghiệp vụ` disclosure row, expanded the catalogue tree, kept `Quản lý mã SKU` at the top level, and pinned the footer while the remaining admin items were below the scroll region. The result made the sidebar appear truncated and pushed the business content into an inconsistent shell state.

## Targeted fix

- Added non-interactive `NGHIỆP VỤ` and `QUẢN TRỊ` section headings.
- Kept operations groups and routes intact while removing the redundant parent row.
- Moved `Quản lý mã SKU` under `Danh mục` so it remains routable without consuming an extra top-level row.
- Set `Danh mục` collapsed by default; active ancestors still open from route matching.
- Preserved S01–S29 route IDs, search registry, and permission behavior.
- Added section rendering at the shared `GlobalShell` layer; no business screen code changed.

## Verification

- Desktop 1920×923: section headings and all three admin links visible; sidebar width 320px.
- Tablet 1024×1536: `NGHIỆP VỤ`/`QUẢN TRỊ` headings present in drawer; Escape closes and body scroll lock remains intact.
- `npm run typecheck`: PASS.
- `npm run quality:contract`: PASS.
- `npm run build`: PASS (existing large-chunk warning only).
- `git diff --check`: PASS.

Artifacts:

- [desktop fixed](sidebar-fixed-desktop.png)
- [tablet fixed](sidebar-fixed-tablet.png)
- [full fidelity evidence](../sidebar-navigation/HN-SIDEBAR-NAV-FIDELITY-001/FINAL_ACCEPTANCE.md)

Backend RBAC and complete S01–S29 hosted browser coverage remain outside this local remediation run.
