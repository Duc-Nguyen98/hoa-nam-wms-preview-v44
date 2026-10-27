# S00#4 independent Wave A+D verification

Authority: `docs/agent-handoffs/S00-1-REMEDIATION-PACKET-20261027.md`.
Start branch/SHA: DEV / `0136e5e8bb3627f0f4f80b1ef8be770a34858e7b`.
Lease: tests/functional, fresh functional evidence and reports only.
Evidence: output/functional-remediation-HN-NC-MA-PILOT-002; pilot-001 copied to before/ and remains immutable.
Tests restored from preserved pilot evidence branch; fresh runs are required. No past PASS is carried forward.
Environment: local Vite/Chromium with browser IndexedDB preview mocks; isolated S01/S02 memory adapters; Notification fixture harness. No real backend integration or production RBAC claim.
Acceptance: three clean independent sessions, auth/setup, reload/idempotency, slow/error/retry/keyboard/focus; broad regression with S27 CSS loader, Notification isolated, S01/S02, affected operational tests. Test timeout is an observation budget, not an approved product SLO.
Candidate SHA and clean/dirty source hashes will be recorded for each run. No source/business/design/CI mutations.
