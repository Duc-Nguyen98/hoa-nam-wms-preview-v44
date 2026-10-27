# Functional QA — HN-NC-UIUX-003

Owner/reviewer: S00#4 native subagent. Packet: docs/agent-handoffs/HN-NC-UIUX-003.md. Candidate: DEV / `78752811af4b0434c958d604dc52ca445cdbeede`. Date: 2026-10-27 (UTC+07).

## Verdict

**Accessibility addendum:** a subsequent axe4.14.0 scan ran4 actual authenticated profiles and found2 repeated semantic violations (P1 serious generic toast aria-label, P2 nested modal banner); contrast remained INCOMPLETE. See [AXE_REPORT.md](functional/AXE_REPORT.md). The full task functional/accessibility gate is now **FAIL pending owner fix + independent retest**; earlier27browser/24Node lifecycle results below remain valid for their exact source scope.

**PASS for executed local Notification functional scope**; overall task release remains subject to independent Visual QA and CI/provenance. No runtime, business logic, locked baseline, CI or historical pilot report was edited by this reviewer. No commit/push/deploy was performed.

- Browser: **27/27 PASS** (26-case main run + focused session/logout run1/1).
- Node: **24/24 PASS**, 0 skipped (20 existing Notification/badge/target tests +4 session/concurrency probes).
- Typecheck: **PASS**. Production build is NOT_RUN by this reviewer.
- Runtime source tree before/after: `e1d3c3ccca8f29f9a088be3e0d55f5828cc17bb1`; HEAD stayed `78752811af4b0434c958d604dc52ca445cdbeede`, working src diff empty. Exact receipts and execution index are in functional/.
- Requested model/effort: GPT-6.1 Sol / high, explicit fallback allowed by parent because Terra is unavailable. ACTUAL_MODEL/ACTUAL_REASONING: **UNVERIFIED**; runtime provides no authoritative telemetry.

## Environment and safe data

Local Vite URL `http://127.0.0.1:5254`; headless Chromium. Every browser test uses a fresh isolated browser context/namespace and the configured Preview test account; normal S07 → S08 confirmation → setup → S01 executes twice. No production storage or API was mutated. Environment is **LOCAL_PREVIEW_MOCK / ISOLATED_FIXTURE**, not STAGING or REAL_API. The local source identity is verified by Git receipts, not a hosted deployment claim.

Routes/components discovered: shell bell `src/shared/ShellHeader.tsx` opens `src/notifications/PreviewNotificationCenter.tsx` from ordinary business routes such as `#/preview/S01`. Notification details use validated exact-document links targeting S09/S11/S12/S15/S16/S23.

## Coverage and observations

- Ordinary app auth/setup, visible badge2→1→0, read mutation, mark-all, Escape focus restoration, reload persistence and logout preventing previous notification content from showing on anonymous S01: PASS. Main app onboarding test31.7s; separate logout-session test24.5s. These successful runs do not close historical intermittent VQ-001/FQ-005 or approve a setup SLO.
- Isolated actual Notification component: read/unread, opening/selection does not mutate, search/no-results, unread filter, previous/next, mark-all and verified deep-link closure, repeated reload state: PASS.
- Empty/loading/error and recovery, unverified target has no fabricated fields/link,101 unread cap/load-more: PASS. Offline disables mutations; storage failure preserves confirmed state; retry recovers: PASS.
- Badge boundary0/1/9/10/99/100/999: PASS at1920×1080 and800×1280; full accessible count retained; browser-only prior-CSS negative control hides badge then restores correctly.
- VI/EN/ZH × Light/Dark × Desktop/Tablet:12/12 smoke cases PASS, no undefined/object/obvious translation-key leaks or horizontal overflow. These checks do not establish pixel fidelity for themes/locales lacking approved reference.
- Keyboard focus trap in both directions, ESC/opener restoration, ARIA names for bell counts, tab arrows, tablet control hit-area>=44px and detail controls reachable through scrolling: PASS for executed diagnostics. Full axe/WCAG scan and systematic contrast audit: **NOT_RUN** (no axe dependency). Automated checks cannot replace screen-reader/manual accessibility assessment.
- Repository session probes reject anonymous/unconfirmed/expired actor read+mutation with401 before persistence; duplicate replay and concurrent distinct updates retain exact count:4/4 PASS. These are mock enforcement checks, not server RBAC certification.
- Console/pageerror checks are zero in executed test scopes. The existing independent5 suite records request failures as well; the focused actual-session run also records requestfailed. Earlier extended smoke/canary cases capture console/pageerror only, so no comprehensive all-requests HTTP audit is claimed.

## Open and unexecuted scope

| Gate/limitation | Status | Reason |
|---|---|---|
| Notification critical executed functional cases | PASS |27 browser +24 Node assertions completed |
| New confirmed functional defects |0 |No executed failure |
| Production API/RBAC and realtime arrival/push |NOT_RUN |No authorized real backend, roles or push-event environment supplied |
| Full automated accessibility/contrast/screen-reader |NOT_RUN |Keyboard/name/geometry diagnostics only |
| Broad unrelated regression |NOT_RUN |No implementation change yet; three historical seed assertions remain open under pilot002 |
| Design-reference pixel comparison |Owned by S00#3 |Functional screenshots are diagnostic actuals, not approved baselines |
| Hosted CI, deployed SHA, release provenance |Owned by S00#5 / BLOCKED pending evidence |Local tests do not certify deployment |

## Test ledger

| Test | Result | Evidence |
|---|---|---|
| F-NC-003-LIFECYCLE search/filter read-unread navigation mark-all persistence and verified deep link | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-STATE-empty | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-STATE-loading | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-STATE-error | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-STATE-unverified | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-STATE-many | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-I18N-1920-vi-light | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-I18N-1920-vi-dark | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-I18N-1920-en-light | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-I18N-1920-en-dark | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-I18N-1920-zh-CN-light | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-I18N-1920-zh-CN-dark | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-I18N-800-vi-light | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-I18N-800-vi-dark | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-I18N-800-en-light | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-I18N-800-en-dark | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-I18N-800-zh-CN-light | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-I18N-800-zh-CN-dark | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-CANARY-BADGE-1920 actual production CSS counts, accessible labels and negative control | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-CANARY-BADGE-800 actual production CSS counts, accessible labels and negative control | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-CANARY-MAIN actual S01 bell 2 → 1 → 0, dialog focus and reload persistence | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| independent: opening and selecting unread does not mutate; filtered read returns to list | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| independent: tablet back retains filter, query and scroll; keyboard tabs operate | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| independent: offline mutation disabled, stale error preserves data, retry recovers | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| independent: focus trap in both directions and Escape restores opener | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| independent: desktop anatomical order, visible controls and tablet touch geometry | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/browser-results.json |
| F-NC-003-MAIN-SESSION authenticated notifications close before logout; anonymous route exposes no prior data | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-session/browser-results.json |
| all six notification links resolve only their exact source record | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #1 |
| known persisted legacy links resolve exact records without mutating read state | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #2 |
| notification refuses mismatched, malformed or unverified target identity | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #3 |
| malformed notification queries fail closed and source lookup checks every identity dimension | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #4 |
| other notifications retain supported list and overview document routes | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #5 |
| contract badge 0 → hidden | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #6 |
| contract badge 1 → 1 | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #7 |
| contract badge 9 → 9 | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #8 |
| contract badge 10 → 10 | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #9 |
| contract badge 99 → 99 | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #10 |
| contract badge 100 → 99+ | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #11 |
| contract badge 999 → 99+ | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #12 |
| business notification feed is persisted per actor and read commands are idempotent | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #13 |
| notification badge hides zero and caps high counts | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #14 |
| selection and refreshing never mark a notification read | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #15 |
| read/unread commands commit, replay safely, persist and stay actor-scoped | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #16 |
| failed mutation preserves confirmed state and reports failure | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #17 |
| generic repository stays empty without an explicit Preview seed | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #18 |
| approved Preview seed has six localized records, two unread and supported screen targets | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #19 |
| old in-flight response cannot populate another account | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/notification.tap #20 |
| F-NC-003-SESSION-anonymous refuses read and mutation without persistence | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/session-concurrency.tap #1 |
| F-NC-003-SESSION-unconfirmed refuses read and mutation without persistence | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/session-concurrency.tap #2 |
| F-NC-003-SESSION-expired refuses read and mutation without persistence | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/session-concurrency.tap #3 |
| F-NC-003-CONCURRENT duplicate command replay and distinct updates retain exact count | PASS | docs/quality/uiux-task-HN-NC-003/functional/run-before/session-concurrency.tap #4 |

## Commands

```powershell
$env:QA_EVIDENCE_DIR='docs/quality/uiux-task-HN-NC-003/functional/run-before'
npx playwright test -c docs/quality/uiux-task-HN-NC-003/functional/playwright.config.ts
node --import ./tests/s27/css-hook.mjs --import tsx --test --test-reporter=tap tests/canary/badge-contract.test.ts tests/notification-center.test.ts tests/notification-state.test.ts tests/actions/notification-target.test.ts
node --import tsx --test --test-reporter=tap docs/quality/uiux-task-HN-NC-003/functional/session-concurrency.test.ts
$env:QA_EVIDENCE_DIR='docs/quality/uiux-task-HN-NC-003/functional/run-session'
npx playwright test -c docs/quality/uiux-task-HN-NC-003/functional/playwright.config.ts --grep F-NC-003-MAIN-SESSION
npm run typecheck
```

The first browser run executed before the focused session test and requestfailed listener were added to extended.spec.ts; its26-case ledger is preserved. Subsequent focused run1/1 executed the final session test. No previous evidence was overwritten.
