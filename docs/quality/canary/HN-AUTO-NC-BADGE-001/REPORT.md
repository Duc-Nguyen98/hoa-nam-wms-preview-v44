# Badge canary — HN-AUTO-NC-BADGE-001

## Before evidence

Runtime SHA: `613ae50ab30c7372f9533aabab740c46d5fc079a`.

| Check | Result | Evidence |
|---|---|---|
| Formatter 0,1,9,10,99,100,999 | 7/7 PASS | `node --import tsx --test tests/canary/badge-contract.test.ts` |
| Actual NotificationBell, 1920×1080 CSS | FAIL: 6 nonzero badges hidden | `before/desktop.json`, `before/desktop.png`, `before/results.json` |
| Actual NotificationBell, 800×1280 CSS | FAIL: 6 nonzero badges hidden | `before/tablet.json`, `before/tablet.png`, `before/results.json` |
| Negative control expected100 at count100 | Expected FAIL, exit1 | `negative-control/negative.tap` |
| Restored expected99+ at count100 | PASS, exit0 | `negative-control/restored.tap`, `negative-control/result.json` |

Browser command: `npx playwright test --config tests/canary/playwright.config.ts` (exit1 before fix).
Negative command: `node tests/canary/negative-control.mjs` (overall exit0: correctly detected FAIL then recovery, temporary fixture removed).

## CANARY-NC-001 — confirmed hidden badge

Severity: P1 against explicit canary requirement. Owner: S00#2. Reporter: native canary QA.

Reproduction: render the shipped `NotificationBell` with shared production styles including `preview-ui.css`, inside `.hn-shell`, pass each nonzero count. DOM text/accessible full count are correct, but all six badges have computed `display:none` and 0×0 bounds at both tested viewports.

Root cause: `src/shared/preview-ui.css` contains `.hn-shell .hn-notifications__count { display:none !important; }`, imported by `src/main.tsx`. This defeats the actual badge component and its cap behavior.

No runtime or design baseline was modified by this QA agent. Scoped fix/retest handoff sent to S00#1. These isolated actual-component checks do not establish public-runtime visual acceptance, approved baseline geometry, API correctness, hosted CI or preview provenance.

## Independent after-fix retest

Fix owner: S00#2. Fix SHA: `c39aa2aed11d52a1a3da4174691bf49dca1b02a7`. Diff removes only the obsolete badge hiding rule and updates its comment. Baseline, formatter, component and count data were not changed.

Independent actual-component browser retest: **2/2 PASS**, seven counts per profile. Every nonzero badge is visible with expected text, positive box dimensions and no viewport clipping; count0 has no badge; full accessible label retains100/999; no console/page errors or horizontal overflow. Captures were inspected. Formatter retest **7/7 PASS**. Environment remains isolated component + production CSS, not public acceptance.

Commands:

```powershell
$env:CANARY_EVIDENCE='docs/quality/canary/HN-AUTO-NC-BADGE-001/after'
$env:CANARY_RESULTS='docs/quality/canary/HN-AUTO-NC-BADGE-001/after/results.json'
npx playwright test --config tests/canary/playwright.config.ts
node --import tsx --test --test-reporter=tap tests/canary/badge-contract.test.ts
```

Evidence: `after/{desktop,tablet}.{json,png}`, `after/results.json`, `after/contract.tap`. Runtime SHA and contract hash are embedded in the after metrics. The first after run passed2/2; after adding explicit positive-bounds/provenance assertions, the final after run also passed2/2. Before FAIL evidence was preserved.

CANARY-NC-001 disposition: **FIXED / independent scoped RETEST PASS**. Overall release/Full Autonomous readiness remains owned by S00#1 and blocked by existing pilot visual/CI/provenance gates; this report does not approve runtime release or locked geometry.
