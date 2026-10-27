# Independent functional canary — HN-AUTO-NC-BADGE-001

Reviewer: S00#4. Defect: CANARY-NC-001. Packet: docs/agent-handoffs/S00-1-CANARY-NC-001-PACKET.md.

## Verdict

**PASS for this badge fix and affected Notification regression**. This does not change the overall release BLOCKED verdict from pilot-002. No runtime/design/CI changes, merge or deployment by S00#4.

- Fix commit: `c39aa2aed11d52a1a3da4174691bf49dca1b02a7`; browser run started on that exact HEAD. Shared HEAD ended at `d0d563ef7eeaab3645b931ca247d7d22d24ac799` after S00#3 committed evidence. Full production `src` tree is identical: `e1d3c3ccca8f29f9a088be3e0d55f5828cc17bb1`; working src diff empty. Before/after SHA-256 receipts also match CSS, NotificationBell and formatter.
- Browser: 8/8 PASS — two independent production component/CSS fixtures, actual S01 auth/setup/bell workflow, five existing isolated Notification tests.
- Node: 20/20 PASS, 0 skipped/cancelled/todo — seven count boundary cases plus affected notification persistence/state/target suites.
- Final typecheck/build: PASS (npm run build includes typecheck).

## Badge boundary matrix

| Count | Expected badge | Desktop 1920×1080 | Tablet 800×1280 | Accessible name |
|---|---|---|---|---|
| 0 | absent | PASS | PASS | Thông báo · 0 |
| 1 | 1 | PASS | PASS | Thông báo · 1 |
| 9 | 9 | PASS | PASS | Thông báo · 9 |
| 10 | 10 | PASS | PASS | Thông báo · 10 |
| 99 | 99 | PASS | PASS | Thông báo · 99 |
| 100 | 99+ | PASS | PASS | Thông báo · 100 |
| 999 | 99+ | PASS | PASS | Thông báo · 999 |

The fixtures import the actual NotificationBell and full production CSS cascade including preview-ui.css; no test-specific override makes the positive cases pass. All positive badges have nonzero dimensions and remain within the viewport; page has no horizontal overflow and buttons are keyboard focusable. A controlled browser-only negative test injects the exact deleted CSS suppression, confirms the positive badge becomes hidden, removes it and confirms visibility returns. This is a negative control, not a source checkout of the old commit or an approved visual comparison.

Actual application E2E uses normal S07 login/S08 confirmation/setup → S01. Initial count2 is visible; mark one read → visible1; Escape restores bell focus; reload retains1; mark all read → badge absent and accessible count0; reload retains0. Data is browser-local Preview mock in a fresh isolated context, not a real backend.

## Test execution records

| Test ID | Route | Expected | Actual | Environment | Commit | Result | Evidence |
|---|---|---|---|---|---|---|---|
| F-CANARY-BADGE-1920 | NotificationBell / tests/functional/canary-badge/badge.html | F-CANARY-BADGE-1920 actual production CSS counts, accessible labels and negative control | All assertions completed; zero unexpected console/page errors | LOCAL Chromium / preview mocks or isolated fixtures | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/browser-results.json; canary-badge/badge.spec.ts:4 |
| F-CANARY-BADGE-800 | NotificationBell / tests/functional/canary-badge/badge.html | F-CANARY-BADGE-800 actual production CSS counts, accessible labels and negative control | All assertions completed; zero unexpected console/page errors | LOCAL Chromium / preview mocks or isolated fixtures | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/browser-results.json; canary-badge/badge.spec.ts:4 |
| F-CANARY-MAIN | #/preview/S01 → Notification Center | F-CANARY-MAIN actual S01 bell 2 → 1 → 0, dialog focus and reload persistence | All assertions completed; zero unexpected console/page errors | LOCAL Chromium / preview mocks or isolated fixtures | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/browser-results.json; canary-badge/badge.spec.ts:23 |
| F-NC-REG-01 | tests/visual/notification.html (isolated dialog) | independent: opening and selecting unread does not mutate; filtered read returns to list | All assertions completed; zero unexpected console/page errors | LOCAL Chromium / preview mocks or isolated fixtures | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/browser-results.json; wave-ad/notification.spec.ts:18 |
| F-NC-REG-02 | tests/visual/notification.html (isolated dialog) | independent: tablet back retains filter, query and scroll; keyboard tabs operate | All assertions completed; zero unexpected console/page errors | LOCAL Chromium / preview mocks or isolated fixtures | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/browser-results.json; wave-ad/notification.spec.ts:32 |
| F-NC-REG-03 | tests/visual/notification.html (isolated dialog) | independent: offline mutation disabled, stale error preserves data, retry recovers | All assertions completed; zero unexpected console/page errors | LOCAL Chromium / preview mocks or isolated fixtures | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/browser-results.json; wave-ad/notification.spec.ts:49 |
| F-NC-REG-04 | tests/visual/notification.html (isolated dialog) | independent: focus trap in both directions and Escape restores opener | All assertions completed; zero unexpected console/page errors | LOCAL Chromium / preview mocks or isolated fixtures | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/browser-results.json; wave-ad/notification.spec.ts:66 |
| F-NC-REG-05 | tests/visual/notification.html (isolated dialog) | independent: desktop anatomical order, visible controls and tablet touch geometry | All assertions completed; zero unexpected console/page errors | LOCAL Chromium / preview mocks or isolated fixtures | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/browser-results.json; wave-ad/notification.spec.ts:72 |
| F-NC-UNIT-01 | Notification repository/store/target resolver/formatter (no live API) | all six notification links resolve only their exact source record | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 1 |
| F-NC-UNIT-02 | Notification repository/store/target resolver/formatter (no live API) | known persisted legacy links resolve exact records without mutating read state | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 2 |
| F-NC-UNIT-03 | Notification repository/store/target resolver/formatter (no live API) | notification refuses mismatched, malformed or unverified target identity | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 3 |
| F-NC-UNIT-04 | Notification repository/store/target resolver/formatter (no live API) | malformed notification queries fail closed and source lookup checks every identity dimension | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 4 |
| F-NC-UNIT-05 | Notification repository/store/target resolver/formatter (no live API) | other notifications retain supported list and overview document routes | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 5 |
| F-CANARY-CONTRACT-0 | Notification repository/store/target resolver/formatter (no live API) | F-CANARY-CONTRACT-0: hidden | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 6 |
| F-CANARY-CONTRACT-1 | Notification repository/store/target resolver/formatter (no live API) | F-CANARY-CONTRACT-1: 1 | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 7 |
| F-CANARY-CONTRACT-9 | Notification repository/store/target resolver/formatter (no live API) | F-CANARY-CONTRACT-9: 9 | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 8 |
| F-CANARY-CONTRACT-10 | Notification repository/store/target resolver/formatter (no live API) | F-CANARY-CONTRACT-10: 10 | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 9 |
| F-CANARY-CONTRACT-99 | Notification repository/store/target resolver/formatter (no live API) | F-CANARY-CONTRACT-99: 99 | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 10 |
| F-CANARY-CONTRACT-100 | Notification repository/store/target resolver/formatter (no live API) | F-CANARY-CONTRACT-100: 99+ | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 11 |
| F-CANARY-CONTRACT-999 | Notification repository/store/target resolver/formatter (no live API) | F-CANARY-CONTRACT-999: 99+ | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 12 |
| F-NC-UNIT-13 | Notification repository/store/target resolver/formatter (no live API) | business notification feed is persisted per actor and read commands are idempotent | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 13 |
| F-NC-UNIT-14 | Notification repository/store/target resolver/formatter (no live API) | notification badge hides zero and caps high counts | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 14 |
| F-NC-UNIT-15 | Notification repository/store/target resolver/formatter (no live API) | selection and refreshing never mark a notification read | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 15 |
| F-NC-UNIT-16 | Notification repository/store/target resolver/formatter (no live API) | read/unread commands commit, replay safely, persist and stay actor-scoped | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 16 |
| F-NC-UNIT-17 | Notification repository/store/target resolver/formatter (no live API) | failed mutation preserves confirmed state and reports failure | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 17 |
| F-NC-UNIT-18 | Notification repository/store/target resolver/formatter (no live API) | generic repository stays empty without an explicit Preview seed | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 18 |
| F-NC-UNIT-19 | Notification repository/store/target resolver/formatter (no live API) | approved Preview seed has six localized records, two unread and supported screen targets | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 19 |
| F-NC-UNIT-20 | Notification repository/store/target resolver/formatter (no live API) | old in-flight response cannot populate another account | All assertions completed | LOCAL node:test / memory persistence | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/notification-regression.tap # 20 |
| G-BUILD-RETEST | Production build | Typecheck and Vite build exit0 | exit 0 | LOCAL working checkout; src identical to fix | c39aa2aed11d52a1a3da4174691bf49dca1b02a7 | PASS | output/functional-canary-HN-AUTO-NC-BADGE-001/build-retest.log |

## Gate history and scope limits

Initial build attempt FAIL: TS2339 in the new QA negative-control cleanup (Node.remove typing). Only the QA test was corrected to cast the style element as Element; runtime behavior and source unchanged. build.log/build-exit.txt preserve the failure; build-retest.log/build-retest-exit.txt record the passing rerun. The executed browser cleanup had already worked; no product fix was inferred from that type error.

No affected Notification regression observed. Broad non-Notification regression was not rerun for this narrowly scoped CSS fix. Three previously open seed assertions and intermittent VQ-001/FQ-005 remain governed by FUNCTIONAL_REGRESSION_REPORT.md; this canary does not close them. Production API/RBAC, hosted deployment SHA, visual comparison and CI/branch protection remain NOT_RUN/BLOCKED outside this local test scope.

## Commands

```powershell
$env:QA_EVIDENCE_DIR='output/functional-canary-HN-AUTO-NC-BADGE-001'
npx playwright test -c tests/functional/canary-badge/playwright.config.ts
node --import ./tests/s27/css-hook.mjs --import tsx --test --test-reporter=tap tests/functional/canary-badge/badge-contract.test.ts tests/notification-center.test.ts tests/notification-state.test.ts tests/actions/notification-target.test.ts
npm run build
```

Use a new evidence directory for reruns; existing logs, traces and screenshots are immutable. Evidence: `output/functional-canary-HN-AUTO-NC-BADGE-001` (execution-index.json, source-custody.json, source hash receipts, browser JSON, all traces, attached screenshots/measurements, TAP, both build attempts, SHA-256 manifest).
