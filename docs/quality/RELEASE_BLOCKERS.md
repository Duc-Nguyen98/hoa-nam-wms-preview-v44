# Functional Release Blockers

Date: 2026-10-27 UTC+07. Tested source: DEV @ `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`.

Source is the current local checkout with QA tests added but not committed. Runtime src/ has no working-tree diff. Existing dirty design/visual files are preserved. Local: http://127.0.0.1:5204; public: https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/. API success below means Axios Preview MOCK or fixture behavior, never production integration. All rows inherit this commit/environment unless explicitly overridden.

**Decision: BLOCK. No merge/deploy/release approval.** Pilot assertions passing does not satisfy full required E2E, production integration or the existing regression gate.

| Blocker / test ID | Route | Expected gate | Actual | Environment | Result | Evidence / owner |
| --- | --- | --- | --- | --- | --- | --- |
| RB-01 / FQ-001 | Auth/onboarding + warranty/stock reports | Existing critical regression assertions resolved against current approved seed | Three existing assertions FAIL (4→31 receipts; extra tray SKU map). Product regression vs stale test decision not yet approved. | LOCAL memory MOCK | FAIL | existing-tests.tap; S00#2 with S00#1 scenario approval |
| RB-02 / FQ-003 | All pilot routes / CI | Required CI executes real E2E/a11y/console checks | Workflow still has intentional exit 1. New config exists but no CI execution/required-check evidence. | CI / static inspection | BLOCKED | .github/workflows/quality-pr.yml; S00#5/S00#1 |
| RB-03 / NR-01/02 | Real API / RBAC / data scope | Approved endpoint, role matrix, accounts; server-side tests | Unavailable; only MOCK policy checks have PASS | Real backend/staging | NOT_RUN | API_INTEGRATION_REPORT.md; S00#1/environment owner |
| RB-04 / NR-04/05/06/07/08 | S01/S02 full states + other critical routes | All required browser cases, automated accessibility audit | Offline/unknown/conflict and remaining browser-state/locale/theme matrix and full-route E2E incomplete | LOCAL / unprovided requirements | NOT_RUN | FUNCTIONAL_TEST_MATRIX.md; S00#4 after packet/environment supplied |
| RB-05 / FQ-004 | Public candidate | Source SHA/deployment provenance reconciled | sourceCommit metadata identifies older source; asset equivalence recorded separately | Local build/public | BLOCKED | provenance.json; S00#5/S00#1 |
| RB-06 / FQ-005 / VQ-001 | Public S08 setup → S01 | Reproducible initialization and resolved Visual QA blocker | One current public PASS; earlier S00#3 >180s failure unresolved; no fix commit or stability evidence | PUBLIC browser-local MOCK | BLOCKED | public-observation.json + VISUAL_QA_REPORT; S00#2/S00#3 |

Exit: owner resolves/reconciles FQ-001 on a named commit; rerun failing cases and related business flows; CI runs the actual gates; supply missing required scenarios and real API/RBAC environment when release scope includes backend integration; reconcile build provenance; retest intermittent initialization and obtain S00#3 verdict. No confirmed authorization bypass, P0 integrity defect or production data mutation occurred in this audit. NOT_RUN is never PASS.
