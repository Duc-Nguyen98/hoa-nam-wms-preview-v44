# Global regression report — HN-OUTBOUND-GSTATE-001

| Check | Result | Evidence |
|---|---|---|
| S15 source typecheck/build | PASS | S00#2 validation logs |
| S15 browser route smoke | PASS | FUNCTIONAL_QA_REPORT.md |
| S15 Tablet compact/expanded geometry | PASS after fix | `visual/AFTER_RETEST_REPORT.md`, `tests/s15/visual-geometry.mjs` |
| Detail modal footer/focus/overflow | PASS after fix | AFTER manifest |
| Search/filter/reset/detail/copy/ESC | PASS MOCK | functional report |
| REF-06 shared state reachability | PASS synthetic | `visual/global-states-manifest.json` |
| Actual-route empty/error/forbidden/not-found | BLOCKED/NOT_RUN | no deterministic fault fixture |
| Global route regression | NOT_RUN beyond scoped S15 | broad migration authority and fixtures incomplete |
| REAL_API/RBAC/CI/preview | BLOCKED | RBAC and CI reports |

No source change touched GlobalShell or business logic. Remaining open visual defect: VQ-OUT-001 shared shell geometry/design authority gap.
