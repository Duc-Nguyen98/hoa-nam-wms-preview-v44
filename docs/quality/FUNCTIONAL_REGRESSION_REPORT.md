# Functional regression — HN-NC-MA-PILOT-002

Task: HN-NC-MA-PILOT-002 / Wave A+D. Reviewer: S00#4. Branch: DEV. Tested source SHA: `0136e5e8bb3627f0f4f80b1ef8be770a34858e7b`.

Verdict: **BLOCKED / NO GO**. Local preview mocks and isolated fixtures only. No backend integration, visual approval, merge or deployment certification. No runtime or seed assertions edited. Test additions were uncommitted during execution; retained trace source and final test-file checksums identify the harness. Runtime source hashes before/after the browser run are equal.

## Executed results

- Broad node:test: 153/156 PASS; 3 FAIL.
- S02 integration/contract: 12/12 MOCK PASS.
- Browser checks: 18/18 PASS, including three clean independent contexts and five isolated Notification tests.
- Typecheck and quality:contract: exit 0. Contract tool reports 13 states/26 references; that is reference integrity, not visual acceptance.

## Defect custody

| Defect | Severity / owner | Before / reproduction | Fix / retest | Status |
|---|---|---|---|---|
| FQ-001 (three assertions) | P1 regression gate; S00#2 with S00#1 contract authority | Authenticated memory setup; run public-demo.test.ts and warranty-parts/public-demo-flow.test.ts. Expected 4 receipts, actual 31 twice; exact stock map also contains nine SKU-HN records. Broad TAP RG-021/RG-112/RG-113. | No approved seed-contract reconciliation; no fix SHA; exact failures reproduced. No claim of data corruption based only on stale counts. | OPEN / BLOCKED_DECISION |
| VQ-001 / FQ-005 | P1 runtime; S00#2 | Historical public report describes >180s and return to login. Current independent three clean local runs pass setup/reload; lock/error/network probes are separately recorded. | No fix SHA. Root cause of intermittent stall unconfirmed. Passing runs do not close intermittent failure. Setup deadline approval missing. | OPEN / BLOCKED_REPRODUCTION |

No confirmed authorization bypass or data leak was found in the executed Preview controls. Production security remains NOT_RUN. S00#1 must retain the release block and route any security finding to the owning implementation agent.

## Reproduce

Run from the repository root (PowerShell):

```powershell
$qaTests = @(rg --files tests -g '*.test.ts' -g '!tests/functional/**')
node --import ./tests/s27/css-hook.mjs --import tsx --test --test-reporter=tap $qaTests
node --import ./tests/s27/css-hook.mjs --import tsx --test tests/functional/s02-integration.test.ts
$env:QA_EVIDENCE_DIR='output/functional-remediation-HN-NC-MA-PILOT-002/new-clean-run'
npx playwright test -c tests/functional/wave-ad/playwright.config.ts --grep W-A-CLEAN
$env:QA_EVIDENCE_DIR='output/functional-remediation-HN-NC-MA-PILOT-002/new-scoped-run'
npx playwright test -c tests/functional/wave-ad/playwright.config.ts --grep-invert 'W-A-CLEAN|E-AUTH-001'
$env:QA_EVIDENCE_DIR='output/functional-remediation-HN-NC-MA-PILOT-002/new-targeted-retest'
npx playwright test -c tests/functional/wave-ad/playwright.config.ts --grep 'independent:|E-S01-003'
npm run typecheck
npm run quality:contract
```

Original broad execution discovered all then-existing test files before the historical functional subtree was restored. The explicit exclusion above reproduces that same set; the restored 12-case S02 suite is executed separately. E-AUTH-001 is superseded by the three stricter W-A-CLEAN cases, which compare complete business snapshots after reload. No failing test was disabled, and all commands/evidence retain failures. Use a fresh QA_EVIDENCE_DIR per rerun.

## Detailed artifacts

- [FUNCTIONAL_TEST_MATRIX](functional-remediation-HN-NC-MA-PILOT-002/FUNCTIONAL_TEST_MATRIX.md)
- [E2E_TEST_REPORT](functional-remediation-HN-NC-MA-PILOT-002/E2E_TEST_REPORT.md)
- [API_INTEGRATION_REPORT](functional-remediation-HN-NC-MA-PILOT-002/API_INTEGRATION_REPORT.md)
- [FUNCTIONAL_DEFECT_REGISTER](functional-remediation-HN-NC-MA-PILOT-002/FUNCTIONAL_DEFECT_REGISTER.md)
- [REGRESSION_REPORT](functional-remediation-HN-NC-MA-PILOT-002/REGRESSION_REPORT.md)
- [RELEASE_BLOCKERS](functional-remediation-HN-NC-MA-PILOT-002/RELEASE_BLOCKERS.md)

Machine evidence: `output/functional-remediation-HN-NC-MA-PILOT-002/execution-index.json`, `evidence-manifest.json`, TAP logs, browser JSON/HTML, traces, failure screenshots/videos and source hash receipts. Pilot-001 evidence preserved under `before/` and on `chore/s00-1-notification-pilot`. New test code restored from that branch and extended in tests/functional/wave-ad. No runtime/design/CI changes by S00#4.

## Execution history and QA corrections

Browser history is retained: clean run 3/3 PASS; initial scoped run 13/15 PASS with 2 FAIL; targeted rerun 6/6 PASS. Final results cover 18 distinct cases. Initial Notification load failed with net::ERR_NETWORK_CHANGED in module requests (trace evidence); its five-case isolated rerun passed without runtime edits. Initial S01 empty case used the legacy visual harness, which requested unsupported pageSize=100; the owned functional harness now supplies a consistent empty fixture using supported query sizes and the exact case passed. This is a test harness correction, not a business fix. Original FAIL traces/screenshots/videos remain immutable.

A trace audit also found a JSON parse pageerror in the initial secondary lock-holder tab: the chosen Vite /release.html fetched absent generated build metadata and received HTML. Interaction assertions on the primary app had passed; this was not zero-error context evidence. The QA holder was changed to a static same-origin test HTML with no release script, context-level pageerror/console collection was added, and W-A-SLOW reran 1/1 PASS (lock-retest/). No product source changed. Overall browser history: 25 executions, 23 assertion PASS and 2 assertion FAIL; final 18 distinct cases PASS. Original trace remains in independent-browser/.

## Verification index

| Test ID | Route | Expected | Actual | Environment | Commit | Result | Evidence |
|---|---|---|---|---|---|---|---|
| W-A-CLEAN-1 | S07 → S08 → setup → S01 | W-A-CLEAN-1 fresh auth/setup/reload preserves exact business snapshot | All browser assertions completed | LOCAL_CHROMIUM_PREVIEW_MOCK | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | PASS | output/functional-remediation-HN-NC-MA-PILOT-002/base-browser-generated/browser-results.json; wave-ad/setup.spec.ts:21 |
| W-A-CLEAN-2 | S07 → S08 → setup → S01 | W-A-CLEAN-2 fresh auth/setup/reload preserves exact business snapshot | All browser assertions completed | LOCAL_CHROMIUM_PREVIEW_MOCK | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | PASS | output/functional-remediation-HN-NC-MA-PILOT-002/base-browser-generated/browser-results.json; wave-ad/setup.spec.ts:21 |
| W-A-CLEAN-3 | S07 → S08 → setup → S01 | W-A-CLEAN-3 fresh auth/setup/reload preserves exact business snapshot | All browser assertions completed | LOCAL_CHROMIUM_PREVIEW_MOCK | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | PASS | output/functional-remediation-HN-NC-MA-PILOT-002/base-browser-generated/browser-results.json; wave-ad/setup.spec.ts:21 |
| W-A-SLOW | S07 → S08 → setup → S01 | W-A-SLOW reload during lock contention, busy keyboard and recover after release | All browser assertions completed | LOCAL_CHROMIUM_PREVIEW_MOCK | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | PASS | output/functional-remediation-HN-NC-MA-PILOT-002/lock-retest/browser-results.json; wave-ad/setup.spec.ts:30 |
| W-A-ERROR | S07 → S08 → setup → S01 | W-A-ERROR one actual IndexedDB transaction failure exposes retry and preserves auth | All browser assertions completed | LOCAL_CHROMIUM_PREVIEW_MOCK | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | PASS | output/functional-remediation-HN-NC-MA-PILOT-002/independent-browser/browser-results.json; wave-ad/setup.spec.ts:48 |
| W-A-NETWORK | S07 → S08 → setup → S01 | W-A-NETWORK throttled real asset loading still requires auth and reaches ready | All browser assertions completed | LOCAL_CHROMIUM_PREVIEW_MOCK | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | PASS | output/functional-remediation-HN-NC-MA-PILOT-002/independent-browser/browser-results.json; wave-ad/setup.spec.ts:59 |
| RG-021 | S07 → S08 → setup → S01 | public onboarding requires login, creates valid Demo setup and does not reset an existing scenario | not ok 21 - public onboarding requires login, creates valid Demo setup and does not reset an existing scenario   ---   duration_ms: 27494.8442   type: 'test'   location: 'E:\\WMS_HoaNam\\Scanner_CMS\\sites\\hoa-nam-wms-tray-approved-20261026\\tests\\public-demo.test.ts:1:1958'   failureType: 'testCodeFailure'   error: \|-     Expected values to be strictly equal:          31 !== 4        code: 'ERR_ASSERTION'   name: 'AssertionError'   expected: 4   actual: 31   operator: 'strictEqual'   stack: \|-     TestContext.<anonymous> (E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026\tests\public-demo.test.ts:33:149)     async Test.run (node:internal/test_runner/test | LOCAL_PREVIEW_MOCK / node:test (memory fixtures; no live backend) | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | FAIL | output/functional-remediation-HN-NC-MA-PILOT-002/base-regression/broad.tap# TAP 21 |
| RG-112 | S09/S10/S16/S21/S22 | public demo full warranty flow uses one issued serial and two parts; all five screens agree and reload is idempotent | not ok 112 - public demo full warranty flow uses one issued serial and two parts; all five screens agree and reload is idempotent   ---   duration_ms: 84039.6563   type: 'test'   location: 'E:\\WMS_HoaNam\\Scanner_CMS\\sites\\hoa-nam-wms-tray-approved-20261026\\tests\\warranty-parts\\public-demo-flow.test.ts:1:5521'   failureType: 'testCodeFailure'   error: \|-     Expected values to be strictly deep-equal:     + actual - expected            {         'PUBLIC-DEMO-SKU-A': 1,         'PUBLIC-DEMO-SKU-B': 16,     +   'SKU-HN-001': 18,     +   'SKU-HN-002': 36,     +   'SKU-HN-003': 24,     +   'SKU-HN-004': 72,     +   'SKU-HN-005': 90,     +   'SKU-HN-006': 12,     +   'SKU- | LOCAL_PREVIEW_MOCK / node:test (memory fixtures; no live backend) | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | FAIL | output/functional-remediation-HN-NC-MA-PILOT-002/base-regression/broad.tap# TAP 112 |
| RG-113 | S09/S10/S16/S21/S22 | v45 session upgrades additively and a lost parts-post response resumes without duplicate deduction | not ok 113 - v45 session upgrades additively and a lost parts-post response resumes without duplicate deduction   ---   duration_ms: 11121.3718   type: 'test'   location: 'E:\\WMS_HoaNam\\Scanner_CMS\\sites\\hoa-nam-wms-tray-approved-20261026\\tests\\warranty-parts\\public-demo-flow.test.ts:1:6698'   failureType: 'testCodeFailure'   error: \|-     Expected values to be strictly equal:          31 !== 4        code: 'ERR_ASSERTION'   name: 'AssertionError'   expected: 4   actual: 31   operator: 'strictEqual'   stack: \|-     TestContext.<anonymous> (E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026\tests\warranty-parts\public-demo-flow.test.ts:126:12)     asyn | LOCAL_PREVIEW_MOCK / node:test (memory fixtures; no live backend) | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | FAIL | output/functional-remediation-HN-NC-MA-PILOT-002/base-regression/broad.tap# TAP 113 |
| NR-API-001 | Production business API | Approved real API contract, staging endpoint/accounts and persisted server outcomes | No authorized real backend environment/accounts/role matrix supplied | UNAVAILABLE / NOT EXECUTED | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | NOT_RUN | docs/agent-handoffs/S00-2-WAVE-A-REPRODUCTION-20261027.md; S00#1 coordination decisions |
| NR-RBAC-001 | All protected business routes + direct API | Server enforced role and data scope matrix | Only mock 401/403/expiry/denied-command controls executed; no production authorization proof | UNAVAILABLE / NOT EXECUTED | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | NOT_RUN | docs/agent-handoffs/S00-2-WAVE-A-REPRODUCTION-20261027.md; S00#1 coordination decisions |
| BL-WA-001 | S07/S08/setup/S01 | Before → fix SHA → independent retest and approved setup deadline | No fix SHA; intermittent >180s stall not reproduced in current clean runs; approved setup SLO absent | UNAVAILABLE / NOT EXECUTED | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | BLOCKED | docs/agent-handoffs/S00-2-WAVE-A-REPRODUCTION-20261027.md; S00#1 coordination decisions |
| BL-SEED-001 | Public setup / S09/S10/S16/S21/S22 | Approved additive seed scenario reconciles all three failing assertions | S00#1 explicitly withheld approval of new seed contract; assertions preserved | UNAVAILABLE / NOT EXECUTED | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | BLOCKED | docs/agent-handoffs/S00-2-WAVE-A-REPRODUCTION-20261027.md; S00#1 coordination decisions |
| NR-VIS-001 | Notification Center + S01 public | Approved actual/reference/diff on exact deployed SHA | Visual/provenance gates belong to S00#3/#5; isolated functional PASS does not close them | UNAVAILABLE / NOT EXECUTED | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | BLOCKED | docs/agent-handoffs/S00-2-WAVE-A-REPRODUCTION-20261027.md; S00#1 coordination decisions |
| NR-FIX-001 | Affected runtime routes | Regression on implementation fix commit | S00#2 reports no implementation fix; after-fix retest cannot run | UNAVAILABLE / NOT EXECUTED | 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b | NOT_RUN | docs/agent-handoffs/S00-2-WAVE-A-REPRODUCTION-20261027.md; S00#1 coordination decisions |
