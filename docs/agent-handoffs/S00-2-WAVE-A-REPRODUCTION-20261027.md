# S00#2 Wave A — reproduction handoff

- TASK_ID: HN-NC-MA-PILOT-002 / Wave A / VQ-001 + FQ-005.
- SCREEN/ROUTE: S07 login → S08 confirm → PublicDemoGate → S01.
- BRANCH / COMMIT: DEV / 0136e5e8bb3627f0f4f80b1ef8be770a34858e7b.
- STATUS: BLOCKED_REPRODUCTION for a root-cause fix. Defects remain OPEN; not READY_FOR_QA and no independent QA verdict.
- FIX_SHA: none. Runtime source remains unchanged. No merge, push or deployment.

## Pre-edit checklist and scope

- [x] Read repository AGENTS, remediation packet, ownership/design/quality contracts and original QA report from the preserved evidence branch.
- [x] Verify current DEV HEAD already contains packet commit; no rebase required. Initial working tree clean.
- [x] Lease: public-demo-setup.ts, PublicDemoGate.tsx, directly related setup/session tests. Shared Button/shell/auth/storage/seed/CI changes excluded.
- [x] Inspect setup command sequence, recovery journals, readiness gate, session/account storage and Web Locks read-only.
- [x] Reproduce via ordinary login/confirm, three independent new contexts per environment and reload; do not clear user namespaces or bypass auth.
- [ ] Identify the cause of the reported >180-second stall/session expiry before runtime edits.
- [ ] Implement and verify a bounded fix only once the cause is established; independent slow/error/retry/focus validation remains required.

## Before / after and observations

There is no after-fix candidate. Six unchanged-source baseline observations completed:

| Environment | Attempt | Setup time after Continue | Reload | Console/page errors |
| --- | --- | --- | --- | --- |
| Hosted public | 1 | 25,456 ms | PASS | 0 |
| Hosted public | 2 | 27,125 ms | PASS | 0 |
| Hosted public | 3 | 29,689 ms | PASS | 0 |
| Local DEV | 1 | 29,430 ms | PASS | 0 |
| Local DEV | 2 | 29,460 ms | PASS | 0 |
| Local DEV | 3 | 28,943 ms | PASS | 0 |

All final lock snapshots have no held or pending locks. Each context was fresh, 1440×900, vi-VN, Asia/Bangkok. All are browser-local MOCK, not production integration. Local SHA does not prove hosted deployment identity. These observations do not establish stability or close the intermittent defect.

Evidence directories: `output/wave-a-setup-before/` (hosted) and `output/wave-a-setup-local-before/` (local). Each contains results.json, three screenshots and three Playwright traces. Original QA evidence is untouched.

The preserved VQ-001 report distinguishes two runs: the linked `output/design-evidence/public-setup-blocker-20261027/result.json` records S01 reached at its ~65-second sample; the report separately describes a repeated >180-second run returning to login. The linked JSON is not evidence of that second run. A trace/session timeline for the latter is still needed to correlate the blocked operation or expiry.

## Root-cause status and safety

Root cause of the >180-second stall is UNCONFIRMED, not proven source-side or deployment-side. Static inspection confirms missing overall setup deadline/progress and an unbounded setup-lock wait; these are hardening gaps, not proof of the intermittent cause. HTTP requests already have a 10-second client timeout, but setup also uses direct recovery/storage paths and many sequential commands.

Do not add a naive Promise.race timeout followed by a new initialization: a timed-out operation may still be writing. Any fix must preserve single-flight behavior, journal outcome verification, cancellation boundaries and actor/session validity. No timer/threshold was invented, and no seed/auth logic changed to force a green test.

## TEST_COMMANDS / TEST_RESULTS

- `node tests/public-demo-session-probe.mjs`: exit 0; three hosted setup/reload observations PASS.
- `npm run dev -- --host 127.0.0.1 --port 5212 --strictPort`, then set DEMO_BASE to `http://127.0.0.1:5212/`, DEMO_OUT to `output/wave-a-setup-local-before` and run the same probe: exit 0; three local setup/reload observations PASS.
- `npm run build`: exit 0, including `npm run typecheck`; existing >500 kB chunk warning remains. Execution transcript retains output.
- `node --import ./tests/s27/css-hook.mjs --import tsx --test tests/public-demo.test.ts tests/warranty-parts/public-demo-flow.test.ts`: exit 1, 1 PASS / 3 FAIL. Same FQ-001 expectations: 31 vs 4 receipts twice, plus nine SKU-HN balances. Assertions after failures did not run. No test expectations were changed.
- Slow/error/lock injection, retry/focus and full idempotent snapshot assertions: NOT_RUN in this probe; independent S00#4 coverage required. Reload success alone is not data-idempotency proof.

## Remaining handoff fields

- FILES_CHANGED: `tests/public-demo-session-probe.mjs` and this report; diagnostic additions only.
- FEATURES_IMPLEMENTED: no runtime feature or fix; reusable three-clean-session diagnostic harness with trace, screenshot, timing, reload, error and final lock evidence.
- KNOWN_ISSUES: VQ-001/FQ-005 OPEN, root cause unreproduced; FQ-001 three existing test failures; hosted source identity not certified; design acceptance unchanged.
- VISUAL_REFERENCE_USED: none for this behavioral probe; original QA report read, no visual baseline changed.
- HANDOFF_TO_VISUAL_QA: no fix candidate; preserve OPEN status and supply the distinct >180-second run trace if available.
- HANDOFF_TO_FUNCTIONAL_QA: baseline evidence available for independent comparison; no fix SHA. Correlate slow/error/lock/session findings with the exact awaited operation before remediation.

Next required input: failing-run trace or a deterministic fault sequence identifying the stalled operation/session-expiry boundary. This is not a request to relax acceptance or close the defect based on six successful attempts.
