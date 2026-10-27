# HN-NC-MA-PILOT-002 — S00#1 remediation packet

Task ID: `HN-NC-MA-PILOT-002`
Parent: `HN-NC-MA-PILOT-001`
Base: `DEV` at `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`
Coordinator: S00#1
Status: `WAVE_A_READY / WAVE_B_ACTIVE / RELEASE_BLOCKED`

## Shared rules

Prior pilot evidence is immutable and remains on the evidence branch `chore/s00-1-notification-pilot` at `fbd5b3cd11a8d5ecb7fb40cf7bce7d7ba0ea3646`. This remediation packet does not overwrite it. Every agent must record the tested SHA, changed files, commands, evidence paths and final `PASS`, `FAIL`, `NOT_RUN` or `BLOCKED` state.

## Leases

- S00#2: `src/preview-mock/public-demo-setup.ts`, `src/preview-mock/PublicDemoGate.tsx`, directly related setup/session tests only. No seed contract changes, shared shell/token changes or CI edits.
- S00#4: `tests/functional/**`, functional evidence and remediation reports only. No runtime source, design baselines or CI edits.
- S00#6: `docs/quality/DESIGN_CONTRACT.md`, design source/register/gap/mapping/baseline documents and reference custody only. No runtime/tests/CI.
- S00#3: visual capture/comparison scripts and visual evidence only. No runtime source or snapshot replacement.
- S00#5: `.github/**`, `scripts/ci/**`, release-governance documents and CI evidence on a dedicated branch. No merge, protection, billing or deployment mutation.
- S00#1: packet, integration, final reports and gate decisions; serialize shared files.

## Wave A acceptance

Reproduce VQ-001/FQ-005 before editing. A fix must make initialization observable, bounded, idempotent and recoverable without bypassing auth or changing business seed data. S00#2 supplies a fix SHA; S00#4 independently runs at least three clean sessions plus reload/slow/error/retry/focus checks.

## Wave D acceptance

Reconcile the three seed-contract assertions against an approved additive scenario. Do not replace expected values blindly. The supported S27 CSS loader is the required runner; no business change is allowed for that configuration issue.

## Stop rules

Missing design authority remains `DESIGN_GAP`/`CHANGE_REQUEST_REQUIRED`. Production API/RBAC, GitHub billing and hosted SHA identity remain `NOT_RUN`/`BLOCKED` when unavailable. No `NOTIFICATION_CENTER_PASS`, `ARCHITECTURE_PASS` or `ROLLOUT_READY` may be claimed until all required evidence is present.
