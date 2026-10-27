# PR checklist

Task `S00-5-CI-RELEASE-20261027`; application base `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`.

Use `.github/PULL_REQUEST_TEMPLATE.md`. Every item must have a real identifier, artifact or recorded NOT_RUN/BLOCKED result.

- [ ] Task ID, purpose, authorized file scope and changed-file list.
- [ ] Base branch/full SHA, current head/full SHA and tested SHA match.
- [ ] Approved design reference, version, baseline checksums; S00#6 approval when applicable.
- [ ] Install, build, typecheck, lint applicability, unit/component and critical E2E commands/results.
- [ ] Visual QA owner and PASS with reference/actual/diff bundle.
- [ ] Functional QA owner and PASS; responsive, console, network, keyboard/accessibility evidence.
- [ ] Required CI jobs PASS on current head; actual run URLs and artifact IDs.
- [ ] P0/P1 counts verified zero; known defects explicitly listed with owners.
- [ ] No unresolved merge conflicts; base current; actual reviews authenticated for current head.
- [ ] S00#1 release-readiness confirmation for current candidate.
- [ ] Preview deploy ID, full SHA, artifact buildId/checksums, actual URL smoke and route tests.
- [ ] Rollback artifact/commit and operator procedure.
- [ ] Workflow/gate/security changes independently reviewed; no tokens or credentials in files/logs.
- [ ] Separate authorization for merge and production deployment under repository policy.

This packet is a DRAFT governance proposal targeting DEV. It must remain BLOCKED while CI billing, missing protection, missing trusted approval integration, Visual QA and Functional QA gates remain unresolved. The checklist does not grant permission or manufacture approvals.
