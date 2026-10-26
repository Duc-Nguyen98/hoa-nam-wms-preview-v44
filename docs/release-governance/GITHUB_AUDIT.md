# S00#5 — GitHub audit

Task `S00-5-CI-RELEASE-20261027`; audited 27 October 2026 (UTC+07).

## Repository and working copies

- Remote: https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44.git (public).
- Authenticated account: `Duc-Nguyen98`; REST confirms admin/maintain/push permissions. Credentials remained in memory; no token was logged or committed.
- Default `main`: `7304ef8d27b5d3d091bda681cc1afcb36048c318`.
- Integration `DEV`: `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`. No `develop` branch exists.
- Primary checkout `E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026` has other agents' outstanding changes; they were preserved and excluded.
- Clean clone for this packet: `E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-ci-governance-20261027`, branch `chore/s00-5-ci-release-governance`, based on DEV above. Final tested head is recorded in the draft PR and validation receipt, rather than a self-referential SHA in this committed report.
- Initial open PR inventory: zero. This packet prepares a draft PR to DEV; no main push, merge or deployment.

## Server configuration observed

| Item | Actual result | Consequence |
|---|---|---|
| main / DEV protection | Both unprotected; protection API 404, rulesets empty | Server does not enforce the policy yet; BLOCKED |
| Required checks / reviews | None enforced | Proposed configuration in BRANCHING_STRATEGY.md |
| Actions | Enabled, all actions allowed; no mandatory full-SHA pinning | Workflow uses read-only contents permission; no deployment token |
| Custom CI | `Hoa Nam quality gates` | DEV run fails before execution |
| DEV run | [40402714433](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40402714433), b287d12 | `critical` FAILURE; browser SKIPPED |
| Failure annotation | “The job was not started because your account is locked due to a billing issue.” | Account owner must resolve billing; local PASS is not CI PASS |
| Pages | Legacy source main:/docs, HTTPS enforced, built | Historical v44 hosting; independent from current DEV CI |
| Pages run | [40286075297](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40286075297), main7304ef8 | Historical successful deployment only |
| Actions secrets | Repository secret count 0 | Does not prove absence of organization/environment secrets |
| Environment | github-pages; deployment branch policies enabled; admins may bypass | No environment/protection/secrets changes made |

## Local implementation audit

`quality:pr` covers typecheck, reference contract, build and four putaway tests. Lint script is MISSING/NOT_RUN. Existing Notification harness covers five isolated interaction/focus/geometry scenarios; it is not full S01/CRUD E2E, approved visual comparison or full accessibility validation.

This branch adds artifact uploads, scoped unit tests, a portable browser server config, and a fail-closed evidence evaluator. The readiness job remains intentionally BLOCKED until trusted current-commit QA and approval integration exists. See CI_QUALITY_GATES.md for exact coverage and limitations.

Limited tracked-source pattern scan found no private-key / ghp / github_pat / sk key patterns. This is not a full secret scan. No production secrets, tokens, customer data, TLS material or browser storage are included in this packet.

## Evidence and actions

Checked REST metadata and test transcripts are in `evidence/`; full local metadata is `output/s00-5/github-audit.json`. Repeat read-only audit with `node scripts/ci/github-audit.mjs` using Git Credential Manager. It requires an existing credential and never prints it.

S00#1 must review check names, role-to-reviewer mapping and proposed protections. S00#3 completed with BLOCKED before this packet started. S00#4 is independently producing functional evidence. None of these observations supplies release approval.
