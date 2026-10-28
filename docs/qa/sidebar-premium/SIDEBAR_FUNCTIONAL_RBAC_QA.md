# Sidebar functional and RBAC QA

## Browser interaction checks

| Check | Result | Evidence |
|---|---|---|
| Active route marks S10 | PASS | Browser metrics in `SIDEBAR_VISUAL_QA.md` |
| Function search with no diacritics | PASS | `phieu nhap kho` → `Phiếu nhập kho` |
| Tablet drawer open | PASS | `sidebar-tablet-after.png` |
| Escape close | PASS | Browser run output |
| Body scroll lock | PASS | `overflow: hidden` while drawer open |
| Route labels S12/S28/S29 | PASS in source | `s00-navigation.ts` and static mapping |
| Backend capability enforcement | NOT_RUN | No production API contract in this checkout |
| Per-route RBAC/data-scope filtering | BLOCKED | See `ROUTE_RBAC_AUDIT.md` |

The browser run used the local Preview mock. It proves client presentation and interaction only. It does not certify server authorization, warehouse scope, session expiry, or forbidden data isolation.

## S00#2 handoff

S00#2 completed a source-only audit covering S01–S29 route mapping, session boundary, API/resource seams, and RBAC/data-scope gaps. No S00#2 source files were modified. The audit identifies the missing shared route capability policy as a release concern; this sidebar task keeps the menu tree intact and does not invent permissions.
