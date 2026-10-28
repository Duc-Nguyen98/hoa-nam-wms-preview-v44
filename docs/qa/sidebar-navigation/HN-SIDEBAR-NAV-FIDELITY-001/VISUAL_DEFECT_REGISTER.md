# Defect register

| ID | Severity | Finding | Status | Evidence |
|---|---|---|---|---|
| SB-NAV-001 | P1 | Previous sidebar used raised hover/active surfaces and no function search | FIXED | desktop before/after + source diff |
| SB-NAV-002 | P1 | Tablet drawer was 280px and had no function search | FIXED | tablet open before/after |
| SB-NAV-003 | P1 | Tablet open/closed state and focus/scroll behavior required verification | FIXED locally | functional smoke + closed-after capture |
| SB-NAV-004 | P1 | SB1 document icon vs SB2 upload icon for Phiếu xuất linh kiện | DESIGN_CONFLICT | `DESIGN_AUTHORITY_CONFLICT_REPORT.md` |
| SB-NAV-005 | P1 | `QUẢN TRỊ` grouping differs between reference and current registry | DESIGN_CONFLICT | `DESIGN_AUTHORITY_CONFLICT_REPORT.md` |
| SB-NAV-006 | P1 | Backend route capability/RBAC/data scope not server-verified | BLOCKED | `RE_AUDIT.md`, `FUNCTIONAL_NAV_QA.md` |
| SB-NAV-007 | P2 | Registry/page-title labels diverge for S12/S28/S29 outside sidebar | OPEN | `RE_AUDIT.md` |

No source fix was applied to unresolved design conflicts without an approved decision.
