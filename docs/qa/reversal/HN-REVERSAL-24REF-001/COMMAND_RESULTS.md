# Actual commands and gate results

Application source a75ded0c426f8548be2af25e85ed9482b25917ff; build551357b4a3e3ff7448da0ebfc39a0cc5dfbed6263d1ed7cea9b293a512625def. Tool output, independent receipts and source hashes are retained; documentation-only packaging does not rebuild the application.

| Command/activity | Actual result / scope |
|---|---|
| git status, branch/log/diff; rg source/route/contract discovery | Candidate branch, actualS17 and owning sources verified; protectedDEV/main unchanged |
| ZIP registration and independent custody |24 PNGs match supplied manifest hashes/dimensions; no README exists in archive |
| npm run typecheck | PASS; final-typecheck-e-cache.txt |
| npm run build | PASS;15 assets and exact source/build in final-build-info.json; large-bundle warning retained |
| node --import tsx --test tests/reversal-approved24/*.test.ts tests/reversal-approved24-qa/*.test.ts |31 PASS/0 FAIL; final-unit.txt; includes22 independent units, not53 distinct units |
| node --import tsx --test tests/reversal-ui/selection.test.ts tests/reversal-public/*.test.ts tests/inventory-recon-fidelity/navigation.test.ts |26 PASS/0 FAIL; final-operational-regression.txt; existing operational MOCK integration/selection guards |
| npm run quality:contract | Existing13-state/26-reference contract passed with E: process cache; initial C: ENOSPC attempt preserved; not a reversal visual gate |
| Independent normal-login/core browser suite |22/22 PASS in completed run on final application source |
| Independent supplemental browser suite |13 distinct checks validated; initial11 PASS/2 invalid direct-unknown setup assumptions, then9/9 targeted actual-request tests PASS; no source/test guard weakened |
| Shared-shell browser regression |44 route/layout checks +4 deterministic S09 stress probes PASS in one completed run;29 actual routes visited including auth surfaces |
| VI/EN/zh × Light/Dark deep geometry |60 actual state visits within supplemental coverage; semantic/geometry checks, not approved pixel baselines |
| Visual capture/compare scripts |36 actual captures +36 diagnostic comparison sets (144 PNGs); three actual CSS/DPR profiles; manual independent report PARTIAL |
| GitHub combined status / PR-workflow queries | Empty results, no hostedCI PASS; workflow wrapper limits and intentional CI gate documented |
| Sites get/version inspection | Canonical publication remains version63 on older SHA; candidate not deployed |
| git push github candidate/reversal-24ref-20261029 | Candidate source pushed; noDEV/main/origin push or merge |
| Lint | NOT_APPLICABLE, no lint script declared |
| New-build server expiry / actual200% zoom / comprehensive automated WCAG | NOT_RUN; bounded keyboard/focus checks do not replace these |

The synchronous isolated design adapter cannot prove read-loading/API-error/401/403 handling, production RBAC, partial-posting transactions, backend concurrency/idempotency or inventory accuracy. These remain BLOCKED. See independent functional report for actual per-case coverage and retained historical failure lineage.
