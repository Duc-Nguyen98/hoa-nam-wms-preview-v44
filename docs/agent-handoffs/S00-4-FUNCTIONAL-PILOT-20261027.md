# S00#4 functional audit packet

Date: 2026-10-27 UTC+07. Parent: S00-1-PILOT-20261027.
Branch: DEV. Base/tested SHA: b287d1294f0aa37b1c38c14275ef8c0a279d4fcc.
Start prerequisite: S00#3 chat turn 01a17a2e-a2fa-7203-8f5c-7eac4c86545e completed (Visual BLOCKED), verified through wait_threads before repository QA began.

User authorizes independent functional testing and reports. Lease: tests/functional/**, playwright.functional.config.ts, output/functional-qa-20261027/** and the six FUNCTIONAL/E2E/API/REGRESSION/RELEASE_BLOCKERS reports in docs/quality. Existing dirty design and visual files belong to other agents and are preserved.

Acceptance: execute existing suites; source S01/S02 behavior from parent packet, src/contracts/overview.ts, src/contracts/defects.ts, S02 approved policy, versioned HTTP and Preview business contracts. Verify create/update/status, required fields, duplicate normalization, immutable code, version conflicts, exact replay, outcome uncertainty, denied commands, read/query behavior, browser states and console. All unavailable production API/RBAC/scoped roles and unexecuted workflows remain BLOCKED/NOT_RUN. No business implementation, baseline, package script, workflow, deployment or merge edits.

Environment: local Vite 127.0.0.1:5204; in-memory Axios Preview API for integration tests; browser fixtures explicitly identified in reports. Public build provenance must be checked separately from local SHA.
