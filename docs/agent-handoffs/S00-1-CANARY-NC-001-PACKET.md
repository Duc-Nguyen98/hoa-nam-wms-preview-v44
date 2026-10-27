# Task Packet — CANARY-NC-001

- **Task ID:** `HN-AUTO-NC-BADGE-001`
- **Parent:** Autonomous Operating Mode activation
- **Base SHA:** `613ae50ab30c7372f9533aabab740c46d5fc079a`
- **Branch:** `DEV`
- **Route/component:** shared `NotificationBell` / Notification Center unread badge
- **Defect:** S00#3 canary confirmed the badge formatter passed 7/7, but production CSS hid the rendered count (`display:none`, 0×0) for positive counts.
- **Owner:** S00#2, lease limited to `src/shared/preview-ui.css` and a scoped regression assertion if required.
- **Reviewers:** S00#3 visual retest; S00#4 functional/regression retest; S00#1 integration.
- **Design authority:** `docs/quality/DESIGN_CONTRACT.md`, badge cap `99+` for counts ≥100.
- **Acceptance:** 0 hidden; 1/9/10/99 exact; 100/999 `99+`; visible at desktop and tablet; no overflow; focused tests, typecheck and build pass; before/negative-control evidence retained.
- **Restrictions:** no baseline refresh, design reinterpretation, business logic change, CI change or production deployment.
