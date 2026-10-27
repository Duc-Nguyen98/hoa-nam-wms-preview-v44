# Final source impact retest — HN-NC-UIUX-003

Owner: S00#4 independent QA. Current candidate `830f83d48eac84c3e2467de7f41c388439cc7eb2`; runtime source tree `65ac25d235682469452f60d50664b3e6acb3a753`; DEV. Generated 2026-10-27T06:38:47.615Z.

## Result

**All4 actual application portrait profiles have PASS executions on the exact current SHA:3 initial PASS +1 retest PASS after correcting a QA-only setup selector.** Initial fourth attempt FAIL is preserved. Successful profile executions have console/pageerror/requestfailed0. Fresh browser contexts and normal S07 login→S08 confirmation→setup→S01→bell, safe local Preview mock. No runtime edit, production mutation, commit/push/deploy by QA.

This is an additional CSS-only impact run after the full matrix baseline at `76059cce616543356c623ec248c6350ddd07cdf5` (36 distinct browser cases successful,24 Node cases, typecheck; one preserved network failure recovered in an unchanged retry). The full36/24 suite was **not** rerun on the new SHA. Source diff proves only Notification CSS changed, confined to801..1100portrait layout rules. Shared semantics/focus, notification data/business code, colors/fonts and other source modules remain identical. New run receipts bind actual impacted behavior to the new SHA; baseline results are retained with their original SHA.

|Profile|Modal x/y/width/height CSS px|Maximum selection-only row-box delta|Result|
|---|---|---:|---|
|992-vi-light (992×1586)|61.456 / 261.125 / 880 / 1262|0|PASS|
|992-vi-dark (992×1586)|61.456 / 261.125 / 880 / 1262|0|PASS|
|900-en-light (900×1440)|24 / 154 / 852 / 1262|0|PASS|
|801-zh-CN-light (801×1280)|24 / 24 / 753 / 1232|0|PASS|

Executed at each profile: initial six-item list/two unread; detail CTA reachable through its own scroll pane; selecting an unread notification without mutation then Back; every row's position/size remains stable; read/unread count2→1→2; search real reference; no-results state; unread filter2→read→1 and automatic list/focus restoration; All→mark-all→0; disabled mark-all; normal Escape→bell and focused toast dismissal→visible main fallback. No page/dialog horizontal overflow; modal retains the existing24px viewport guard; inspected close/search/tab/mark-all controls remain>=44px; row title/time and child bounds do not overlap or clip within their own rows.

The1CSSpx stability probe is an engineering invariant for selection-only reflow/rounding, not an approved screenshot-diff tolerance. Actual measured maximum row-box delta is shown above. No pixel threshold or baseline was changed.

The initial801ZH attempt stopped before NC at the setup button: QA expected Vietnamese “Tiếp tục” while the actual localized accessible name was “继续”. Screenshot/DOM/trace prove this QA selector error; it is not a reproduced NC defect. The setup selector alone was corrected for ZH; all NC assertions/timeouts/source stayed unchanged. Its isolated retest passed; original failed execution remains in tablet-delta-final/ and the successful record is in tablet-delta-retest/. This is not a clean first-pass4/4 run.

Original full-matrix artifacts, initial semantic/focus/contrast FAILs and recovered network failure remain byte-preserved. See `source-delta.diff`, `source-provenance.json`, four successful raw profile records,16successful screenshots plus the failed screenshot/trace, browser-results.json and command logs. S00#3 independently owns reference geometry/visual residual verdict. P3 optical/reference uncertainty is not closed by these functional passes.

Release verdict remains **PARTIAL / external release gates unresolved** pending Visual QA and CI/deployed-SHA authority. REAL_API/server RBAC/realtime, full WCAG/screen-reader/non-text contrast, three clean stability runs and unrelated historical regression remain NOT_RUN or under their existing blockers. The baseline axe color-contrast INCOMPLETE remains recorded; no axe rule was suppressed. Current CSS delta does not alter its contrast colors.

## Executed command

```powershell
$env:QA_EXPECTED_SHA='830f83d48eac84c3e2467de7f41c388439cc7eb2'
$env:QA_TABLET_EVIDENCE_DIR='docs/quality/uiux-task-HN-NC-003/functional/tablet-delta-final'
npx playwright test -c docs/quality/uiux-task-HN-NC-003/functional/tablet-delta.config.ts
$env:QA_TABLET_EVIDENCE_DIR='docs/quality/uiux-task-HN-NC-003/functional/tablet-delta-retest'
npx playwright test -c docs/quality/uiux-task-HN-NC-003/functional/tablet-delta.config.ts --grep F-NC-003-DELTA-801-zh-CN-light
```
