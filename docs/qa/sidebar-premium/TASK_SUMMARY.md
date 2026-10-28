# Sidebar Premium — task summary

- Task: `HN-SIDEBAR-PREMIUM-001`
- Project: `S00_Hoa_Nam_Web`
- Branch: `DEV`
- Base source revision: `0ce1b528d328c51955c5cb9fac04afa1a20684e5`
- Scope: shared `GlobalShell` sidebar/drawer, navigation labels, function search, responsive states.
- Business pages and fixtures: unchanged.
- Candidate environment: local Vite preview at `http://127.0.0.1:5294/` for before/after QA. Public Preview deployment is performed only after this evidence is committed.
- Published Preview: `https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site` (Site version 62; deployment `appgdep_6ae25a63759c8191a72fb4a7c49a1aca`).

## Completed

- Flat Hoa Nam blue sidebar and drawer surface.
- Hover has transparent background and 150ms text/icon transition.
- Active route uses semibold text and a small dot; no cyan rail or raised block.
- Function search added to expanded desktop sidebar and tablet drawer; matching is diacritic-insensitive.
- Approved Vietnamese labels applied to S12, S28, and S29 while route keys remain unchanged.
- Tablet drawer width, Escape close, focus handling and body scroll lock verified.

## Evidence

- Desktop actual: [sidebar-desktop-after.png](sidebar-desktop-after.png)
- Tablet actual: [sidebar-tablet-after.png](sidebar-tablet-after.png)
- Static route/RBAC audit: [ROUTE_RBAC_AUDIT.md](ROUTE_RBAC_AUDIT.md)
- Menu mapping: [MENU_MAPPING.md](MENU_MAPPING.md)
- Browser metrics: [SIDEBAR_VISUAL_QA.md](SIDEBAR_VISUAL_QA.md)

Video capture is `NOT_RUN`; no video is claimed as evidence.
