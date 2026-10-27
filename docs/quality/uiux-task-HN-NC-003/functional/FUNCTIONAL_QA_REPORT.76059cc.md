# Independent Functional QA — HN-NC-UIUX-003

Owner: S00#4 native subagent. Packet: docs/agent-handoffs/HN-NC-UIUX-003.md. Branch DEV. Final candidate `76059cce616543356c623ec248c6350ddd07cdf5`, runtime source tree `d3cbc007a42abb996b74d8c537220fb202e8bb18`. Generated 2026-10-27T06:19:41.306Z.

## Verdict

**Executed local feature checks PASS; overall release remains PARTIAL pending independent Visual QA and CI/deployment authority.** No source/business logic, locked design/baseline, package/lockfile or CI file was edited by this reviewer. No commit/push/deploy performed.

- Critical functional browser: **27/27 PASS** on final SHA.
- Notification/badge/target/session/concurrency Node tests: **24/24 PASS**, skipped0.
- Automated default axe4.14.0: **4/4 PASS**, violated rules0; color-contrast remains INCOMPLETE.
- Focused actual-toast unchanged before→after regression: **1/1 PASS** on final SHA; earlier verified FAIL preserved.
- Shared modal/toast/S01/contrast: first run **3PASS/1environmentFAIL**, then unchanged TabletDark **1PASS**. Four distinct profiles have successful results; this is not a clean first-pass4/4 run.
- Thus36 distinct browser cases have successful final-SHA executions, with37 executions including the preserved environment failure.24 Node cases are separate. Typecheck: **PASS**. Build: NOT_RUN by S00#4; parent owns build evidence.
- Requested GPT-6.1 Sol/high; ACTUAL_MODEL/ACTUAL_REASONING **UNVERIFIED** (no authoritative runtime telemetry).

## Actual environment and coverage

LOCAL_PREVIEW_MOCK / ISOLATED_FIXTURE; Chromium, own Vite server127.0.0.1:5254. Each test uses a fresh browser context and configured test demo credentials. Auth tests execute real S07→S08→setup→S01, then open the actual modal through the bell. Production APIs/data were never used or mutated.

Screen discovery: `#/preview/S01` shell bell `src/shared/ShellHeader.tsx` → `src/notifications/PreviewNotificationCenter.tsx` using shared GlobalModal and GlobalToastProvider. Notification targets remain exact-document routes S09/S11/S12/S15/S16/S23, checked by Node tests and actual navigation.

|Scope|Executed result and limits|
|---|---|
|Lifecycle|Read/unread, selection without mutation, search/no-results/filter, previous/next, mark-all, reload persistence, verified deep link PASS|
|Count|0/1/9/10/99/100/999,99+ cap/full accessible count and count2→1→0 PASS|
|States/recovery|Loading/empty/error/stale/unverified/many, offline disabled mutation, failed storage preserving state and retry PASS in mock/fixture|
|Session/data|Ordinary auth/setup/logout no prior-data exposure PASS; anonymous/unconfirmed/expired actor reject mock read+mutation before persistence; replay/concurrent distinct commands and stale actor response tests PASS|
|Locales/themes|VI/EN/ZH × Light/Dark × Desktop1920×1080/Tablet800×1280 smoke12PASS; no obvious translation-key/undefined leaks or horizontal overflow. This does not approve missing pixel references|
|Keyboard/geometry|Focus trap both directions, Escape/opener return, tab arrows, Tablet>=44px controls and detail reachability PASS|
|Shared impacts|Actual mark-all live feedback group/status/dismiss; Desktop toast outside modal without controls overlap; Tablet queue then admission after close; hidden-origin safe focus fallback PASS. Non-NC actual S01 AcceptedRowDetail heading/no-banner/Tab/Shift+Tab/Escape/exact opener PASS at4profiles|
|Text contrast|640 repeated scoped computed text samples PASS across4profiles/details, including actual warning and success child spans. Not640testcases; full axe contrast remains INCOMPLETE|

## Defects and recovery

|ID|Severity|Verified before|Final executed status|
|---|---|---|---|
|FQ-NC-003-A11Y-01|P1|Generic toast div aria-label violates aria-prohibited-attr in4diagnostic scans|FIXED, axe4profiles RETEST PASS|
|FQ-NC-003-A11Y-02|P2|Nested native modal header exposed as banner in4diagnostic scans|FIXED, axe+shared/S01 RETEST PASS|
|FQ-NC-003-A11Y-03|P2|Actual keyboard toast dismiss leaves BODY focused on exact interim e5ba486|FIXED, unchanged focused final test and shared RETEST PASS|
|FQ-NC-003-A11Y-04|P2|Actual Light placeholder contrast3.402425:1 on e57f6ae|FIXED, final actual ratio5.851331 both viewports|
|FQ-NC-003-A11Y-05|P2|Actual Light warning status span contrast3.424567:1 on e57f6ae|FIXED, final actual ratio5.552797; companion success variant actual6.030105|

Five independent QA findings (P1×1,P2×4) closed for their executed scope. Initial success variant was not separately captured before correction and is not claimed as a sixth reproduced before defect. The new accessibility findings were routed to S00#1 and the leased owner before remediation; S00#4 did not repair source.

TabletDark shared first attempt timed out before login because its actual main.tsx request failed **net::ERR_NETWORK_CHANGED**. Original screenshot is blank, trace/console/network summary retained in shared-final/. Fresh-server unchanged targeted retry PASS54.8s, errors0. No timeout/test was weakened, no snapshot updated. This is recovered environment evidence, not a production bug fix or proof of three clean stability runs.

## Custody and retained history

Final source receipts in run-final/ bind Node/typecheck/main browser to final SHA/tree; each axe/shared/focused record carries its own source custody. working src diff stayed empty in acceptance runs. Evidence SHA256 manifest covers this report, tests, raw JSON/TAP/logs/screenshots/traces. Execution ledger: functional/execution-final-index.json.

Historical evidence remains: initial27browser+24Node at7875281 (source e1d3c3c); original axe4FAIL diagnostic with explicitly imperfect CSS custody in axe/; actual focus1FAIL atclean e5ba486; initial actual contrast1FAIL and27browser24Node PASS ate57f6ae. No earlier result was relabeled. The original functional report is archived as functional/FUNCTIONAL_QA_REPORT.before-finalization.md.

## NOT_RUN / unresolved authority

- REAL_API/STAGING, server RBAC/HTTP401/403/404/500, true realtime arrival, transport timeout/retry, multi-session cross-tab integration: **NOT_RUN / NOT_CONNECTED**. Mock PASS is not integration certification.
- Full WCAG/screen-reader and all non-text/gradient/pseudo contrast: **NOT_RUN**; axe color-contrast remains **INCOMPLETE**. Keyboard and solid-background NC text checks are the executed scope.
- Three clean repeated full configurations: **NOT_RUN**; one actual network failure/recovery is recorded.
- Broad unrelated regression: **NOT_RUN**. Three historical seed failures remain open; this scope does not close them or call them new regressions.
- Full approved-reference visual fidelity and other reference viewports: S00#3 owns. Hosted CI, PR/protection, deployed exact SHA, target public URL and release approval: S00#5/S00#1 own; **not certified by local tests**.

## Commands and evidence

Commands used final run: Playwright with functional/playwright.config.ts (QA_EVIDENCE_DIR=run-final); axe.config.ts (QA_AXE_EVIDENCE_DIR=axe-final); shared-regression.config.ts (QA_SHARED_EVIDENCE_DIR=shared-final then shared-final-retry with --grep F-NC-003-SHARED-800-dark); same config with QA_SHARED_SPEC=focus-repro.spec.ts and evidence focus-final; Node --test badge-contract/notification-center/notification-state/notification-target plus session-concurrency.test.ts; npm run typecheck. Full stdout/TAP and exit receipts remain alongside each run. No source edits or test exclusions were used to make a gate pass.

## Final execution ledger

|Test|Result|Evidence|
|---|---|---|
|F-NC-003-LIFECYCLE search/filter read-unread navigation mark-all persistence and verified deep link|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-STATE-empty|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-STATE-loading|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-STATE-error|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-STATE-unverified|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-STATE-many|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-I18N-1920-vi-light|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-I18N-1920-vi-dark|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-I18N-1920-en-light|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-I18N-1920-en-dark|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-I18N-1920-zh-CN-light|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-I18N-1920-zh-CN-dark|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-I18N-800-vi-light|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-I18N-800-vi-dark|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-I18N-800-en-light|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-I18N-800-en-dark|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-I18N-800-zh-CN-light|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-I18N-800-zh-CN-dark|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-MAIN-SESSION authenticated notifications close before logout; anonymous route exposes no prior data|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-CANARY-BADGE-1920 actual production CSS counts, accessible labels and negative control|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-CANARY-BADGE-800 actual production CSS counts, accessible labels and negative control|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-CANARY-MAIN actual S01 bell 2 → 1 → 0, dialog focus and reload persistence|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|independent: opening and selecting unread does not mutate; filtered read returns to list|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|independent: tablet back retains filter, query and scroll; keyboard tabs operate|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|independent: offline mutation disabled, stale error preserves data, retry recovers|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|independent: focus trap in both directions and Escape restores opener|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|independent: desktop anatomical order, visible controls and tablet touch geometry|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/browser-results.json|
|F-NC-003-AXE-1920-light actual authenticated Notification modal|PASS|docs/quality/uiux-task-HN-NC-003/functional/axe-final/browser-results.json|
|F-NC-003-AXE-1920-dark actual authenticated Notification modal|PASS|docs/quality/uiux-task-HN-NC-003/functional/axe-final/browser-results.json|
|F-NC-003-AXE-800-light actual authenticated Notification modal|PASS|docs/quality/uiux-task-HN-NC-003/functional/axe-final/browser-results.json|
|F-NC-003-AXE-800-dark actual authenticated Notification modal|PASS|docs/quality/uiux-task-HN-NC-003/functional/axe-final/browser-results.json|
|F-NC-003-TOAST-FOCUS actual mark-all feedback dismiss restores visible focus after owning dialog closes|PASS|docs/quality/uiux-task-HN-NC-003/functional/focus-final/browser-results.json|
|F-NC-003-SHARED-1920-light actual app modal semantics, collision-safe mark-all feedback and contrast spot checks|PASS|docs/quality/uiux-task-HN-NC-003/functional/shared-final/browser-results.json|
|F-NC-003-SHARED-1920-dark actual app modal semantics, collision-safe mark-all feedback and contrast spot checks|PASS|docs/quality/uiux-task-HN-NC-003/functional/shared-final/browser-results.json|
|F-NC-003-SHARED-800-light actual app modal semantics, collision-safe mark-all feedback and contrast spot checks|PASS|docs/quality/uiux-task-HN-NC-003/functional/shared-final/browser-results.json|
|F-NC-003-SHARED-800-dark actual app modal semantics, collision-safe mark-all feedback and contrast spot checks|FAIL (environment, recovered in separate run)|docs/quality/uiux-task-HN-NC-003/functional/shared-final/browser-results.json|
|F-NC-003-SHARED-800-dark actual app modal semantics, collision-safe mark-all feedback and contrast spot checks|PASS|docs/quality/uiux-task-HN-NC-003/functional/shared-final-retry/browser-results.json|
|all six notification links resolve only their exact source record|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #1|
|known persisted legacy links resolve exact records without mutating read state|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #2|
|notification refuses mismatched, malformed or unverified target identity|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #3|
|malformed notification queries fail closed and source lookup checks every identity dimension|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #4|
|other notifications retain supported list and overview document routes|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #5|
|contract badge 0 → hidden|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #6|
|contract badge 1 → 1|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #7|
|contract badge 9 → 9|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #8|
|contract badge 10 → 10|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #9|
|contract badge 99 → 99|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #10|
|contract badge 100 → 99+|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #11|
|contract badge 999 → 99+|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #12|
|business notification feed is persisted per actor and read commands are idempotent|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #13|
|notification badge hides zero and caps high counts|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #14|
|selection and refreshing never mark a notification read|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #15|
|read/unread commands commit, replay safely, persist and stay actor-scoped|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #16|
|failed mutation preserves confirmed state and reports failure|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #17|
|generic repository stays empty without an explicit Preview seed|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #18|
|approved Preview seed has six localized records, two unread and supported screen targets|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #19|
|old in-flight response cannot populate another account|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/notification.tap #20|
|F-NC-003-SESSION-anonymous refuses read and mutation without persistence|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/session-concurrency.tap #1|
|F-NC-003-SESSION-unconfirmed refuses read and mutation without persistence|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/session-concurrency.tap #2|
|F-NC-003-SESSION-expired refuses read and mutation without persistence|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/session-concurrency.tap #3|
|F-NC-003-CONCURRENT duplicate command replay and distinct updates retain exact count|PASS|docs/quality/uiux-task-HN-NC-003/functional/run-final/session-concurrency.tap #4|
