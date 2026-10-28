# S00#4 Defect Register — HN-OUTBOUND-GSTATE-001 (S15)

Date: 2026-10-28  
Candidate: `DEV` / `002e291f9005ec5e22c45d7f93350af12f9b26ec`

| ID | Severity | Classification | Area | Evidence | Impact | Status | Exit evidence |
|---|---|---|---|---|---|---|---|
| HN-OUTBOUND-001 | P1 | BLOCKED / REAL_API | Endpoint, DTO and RBAC contract | `src/data/fixtures/S15.seed.json` has null endpoint, DTO and permission keys; controller remains API-contract pending. | No staging/production read or authorization certification. | OPEN | Named API contract, DTO/status mapping, permission keys and staging evidence. |
| HN-OUTBOUND-002 | P1 | BLOCKED_SOURCE / MOCK | Legacy 84-document completeness | Fixture supplies 7 detail rows of 84 and returns `INCOMPLETE_SOURCE` for unsupported search/filter/sort/page queries. | Full reference-list query acceptance cannot be claimed. | OPEN | Complete source-backed dataset or API-backed list/query tests. |
| HN-OUTBOUND-003 | P1 | NOT_RUN / TEST-COVERAGE | Actual-route empty/error/forbidden/record-not-found | Synthetic harness covers all six states; actual route has no deterministic fault/zero-row switch. | Actual route state acceptance remains blocked/not run. | OPEN | Deterministic actual-route fault fixtures plus state assertions. |
| HN-OUTBOUND-004 | P2 | NOT_RUN / MOCK | Focus and responsive functional trace | ESC close passed; complete focus-return/tab-order and tablet geometry assertion not captured by S00#4. | Accessibility/responsive acceptance remains incomplete. | OPEN | Playwright focus-order and viewport/overflow evidence. |
| HN-OUTBOUND-005 | P2 | OBSERVATION / MOCK | Reference cohort discoverability | `src/shared/preview-ui.css` hides `.s15-screen > .s15-action-row`; reference switch is not reachable in public browser flow. | Reviewers cannot exercise the source-bound list through normal route. | ACCEPTED_SCOPE | Owner confirms current-session as sole public cohort or supplies test-only route/harness for reference coverage. |

No production data or source implementation was modified by this QA packet. See sibling `FUNCTIONAL_QA_REPORT.md` and `RBAC_REPORT.md`.


