# S00#4 command ledger — HN-NC-UIUX-003

All commands used explicit working directory:
`E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`.

The evidence paths below are repository-relative. PowerShell command stdout/stderr was retained with `Tee-Object`; Playwright JSON, failure traces, screenshots and Node TAP were preserved. The original before runs use `run-before`, `run-session`, `axe`, `focus-before`, `shared-final-diagnostic` and interim `run-after`; their commands use the same configurations with those evidence directories. No earlier run was overwritten.

## Full matrix on76059cce — EXECUTED

```powershell
$env:QA_EVIDENCE_DIR='docs/quality/uiux-task-HN-NC-003/functional/run-final'
npx playwright test -c docs/quality/uiux-task-HN-NC-003/functional/playwright.config.ts

node --import ./tests/s27/css-hook.mjs --import tsx --test --test-reporter=tap tests/canary/badge-contract.test.ts tests/notification-center.test.ts tests/notification-state.test.ts tests/actions/notification-target.test.ts
node --import tsx --test --test-reporter=tap docs/quality/uiux-task-HN-NC-003/functional/session-concurrency.test.ts
npm run typecheck

$env:QA_AXE_EVIDENCE_DIR='docs/quality/uiux-task-HN-NC-003/functional/axe-final'
npx playwright test -c docs/quality/uiux-task-HN-NC-003/functional/axe.config.ts

$env:QA_SHARED_EVIDENCE_DIR='docs/quality/uiux-task-HN-NC-003/functional/shared-final'
npx playwright test -c docs/quality/uiux-task-HN-NC-003/functional/shared-regression.config.ts

$env:QA_SHARED_EVIDENCE_DIR='docs/quality/uiux-task-HN-NC-003/functional/shared-final-retry'
npx playwright test -c docs/quality/uiux-task-HN-NC-003/functional/shared-regression.config.ts --grep F-NC-003-SHARED-800-dark

$env:QA_SHARED_EVIDENCE_DIR='docs/quality/uiux-task-HN-NC-003/functional/focus-final'
$env:QA_SHARED_SPEC='focus-repro.spec.ts'
npx playwright test -c docs/quality/uiux-task-HN-NC-003/functional/shared-regression.config.ts

git rev-parse HEAD
git rev-parse HEAD:src
git diff HEAD -- src
node docs/quality/uiux-task-HN-NC-003/functional/finalize-report.mjs
```

Every shell execution starts a fresh PowerShell environment. If replaying these in one persistent shell, remove `QA_SHARED_SPEC` before running the regular shared suite; the focused override is deliberately explicit. `finalize-report.mjs` is a historical76059cce custody verifier and rejects changed runtime source; it must not be used to overwrite a later final-source delta report.

## Scanner prerequisite — EXECUTED

```powershell
npm install --prefix output/hn-nc-003-axe-runtime --no-audit --no-fund --ignore-scripts --package-lock=false axe-core
```

Resolved scanner version4.14.0 was captured in raw results. No repository package/lockfile was edited. Scanner absence fails the suite rather than skipping it.

## Impacted portrait delta

Four profiles passed (3 initial +1 QA-selector-corrected retest) on 830f83d48eac84c3e2467de7f41c388439cc7eb2; complete command, profile/source receipts and limitations are in FINAL_SOURCE_DELTA_RETEST.md. The full matrix remains associated with76059cce.
