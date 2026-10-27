# HN-NC-MA-PILOT-002 — CI / release readiness

Owner S00#5; Wave E; 27 October 2026 UTC+07. **BLOCKED / NO-GO. READY_TO_MERGE is not granted.**

## Candidate and custody

- Runtime DEV: `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc` at fresh audit.
- Historical main/Pages: `7304ef8d27b5d3d091bda681cc1afcb36048c318`.
- Governance base: `70dff89468eaac8ca71e2169d90a0fb33a216398`; continuation on own branch `chore/s00-5-ci-release-governance`, [draft PR #1](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/pull/1).
- Parent pilot: `fbd5b3cd11a8d5ecb7fb40cf7bce7d7ba0ea3646`; read its nine required artifacts. Notification isolated5/5, functional browser8/8 and S02 integration12/12 are historical supplemental PASS; parent visual/regression/release verdict remains BLOCKED. Those reports are not current-head approvals.
- Prior evidence was preserved. New raw observations: `output/HN-NC-MA-PILOT-002/wave-e/`; committed snapshot/transcripts in adjacent `evidence/` with checksums. Final full governance head and exact-head validation receipt are in PR #1, avoiding self-referential commit metadata.

## Fresh GitHub audit

REST snapshot 2026-10-27T00:10:57Z (07:10 UTC+07):

| Check | Observation | Gate |
|---|---|---|
| Auth / permissions | Duc-Nguyen98; repository admin/maintain/push verified | Scope verified; no settings mutated |
| DEV/main protection | Both protection endpoints 404 Branch not protected; branch flags false | MISSING |
| Rulesets | 200, empty list | MISSING |
| Enforced required checks | DEV/main enforcement off, contexts/checks empty | MISSING |
| PR #1 reviews | 200, zero reviews; no authenticated #1/#3/#4 reviewer mapping | MISSING |
| PR #1 conflict status | mergeable true, draft; head70dff89 / baseb287d12 | No observed conflict; no approval implied |
| Current known CI | [run40413549583](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40413549583), head70dff89 | FAILURE before runner |
| DEV CI | [run40402714433](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40402714433), b287d12 | FAILURE before runner |
| Billing indication | Both current-head failure annotations still say account locked due billing | BLOCKED; not a live view of payment details |
| Current-head QA | No trusted current-head Visual/Functional/#1 approval receipt | MISSING / BLOCKED |

No fresh runner was started merely to repeat the same billing failure. Pushing this bounded change to the existing PR triggers its normal head check; the actual new run/status is appended to the PR. Do not reinterpret a billing failure as a test failure or PASS; Linux validation and artifact uploads remain NOT_RUN when no steps execute.

### Owner action for billing

Owner opens GitHub account **Settings → Billing & Licensing**, reviews any indicated payment/authorization issue and resolves it directly. If the page shows no actionable subscription/balance/payment issue, request GitHub Support to review the billing lock. These are the official [locked-account instructions](https://docs.github.com/en/billing/how-tos/troubleshooting/locked-account). This agent neither changes payment/budget/plan settings nor infers the underlying financial cause from the runner annotation.

After the account is unlocked, rerun the current candidate workflow once, inspect real job steps/logs and artifact IDs, and keep release BLOCKED until all mandatory checks and approvals pass. Do not use another account/runner, loosen required checks, or change billing settings as a workaround.

## Bounded implementation

Workflow already checks out `github.event.pull_request.head.sha || github.sha`. The new `build-provenance.mjs` independently requires CANDIDATE_SHA to equal actual HEAD, captures actual Git tree identity and source-worktree cleanliness including nonignored untracked files, and inventories built bytes. It fails closed for stale/short SHA, dirty/unverified source, missing Git tree, missing index or artifact symlinks.

The sidecar `output/ci/build-provenance.json` is uploaded alongside `dist/` and source-sha.txt by the critical job. It deliberately leaves the application's inherited build-info.json untouched. Local trust is UNATTESTED_LOCAL; runner metadata is UNATTESTED_WORKFLOW_METADATA. Run URL/ID is a locator, not a signature or proof of execution. Require actual successful Actions run/artifact association and independent QA review before accepting it as release evidence.

Audit tools now accept a separate output directory and inspect candidate-specific checks/review metadata, preserving earlier evidence. The release-readiness evaluator still rejects missing/stale artifacts, missing QA/role approvals and P0/P1 defects. Its CLI remains BLOCKED while trusted reviewer/evidence integration is MISSING. New build metadata cannot turn that gate green.

## Validation and actual hosting

- New provenance + prior gate controls: **27/27 local PASS including two parent tests**, initially on the uncommitted delta. Final committed-head rerun, build output and sidecar identity are recorded separately in PR receipt.
- Prior quality:pr / unit21 / isolated browser5 results belong to head70dff89. Unchanged browser tests are not rerun solely to manufacture a new acceptance record; full current-head runtime/Visual/Functional gates remain with #2/#3/#4.
- [Pages](https://duc-nguyen98.github.io/hoa-nam-wms-preview-v44/) remains historical main:/docs, [Pages run40286075297](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40286075297). [Canonical Site](https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S01) has no verified current candidate deployment ID.
- Both hosted build-info files advertise old sourceCommit `d2547577f342402136f464d4cee3ff237f77bf99`. Site buildId `1d53c18c7ec915738ed7e60cd1c8d608c3b659fe664aefe5d116b9b90685424c`; Pages buildId `29feff1f7ea16e52e6fc26d225b8332598baf1c621327bd3c0d7a4db2aa6ac24`. Neither proves deployed DEV SHA.
- Refreshed served-byte verification at approximately 00:12Z is retained in `evidence/hosted-build-verification.json`: Pages44/51 assets MATCH, Site13/15 MATCH; JS/CSS match on both, text/HTML differ. The Site HTML hashes changed from the prior observation while advertised build identity stayed the same. Hosting injection is a possible explanation, not an accepted integrity exception. Exact-byte verification remains BLOCKED.
- A new unmerged sidecar cannot repair already hosted provenance. Full deployed-SHA verification remains BLOCKED pending an authorized deployment from a reviewed candidate with trusted artifact provenance and live checksum/route/console validation.

## Ownership, integration and rollback

Changed-file lease and acceptance are in `docs/agent-handoffs/HN-NC-MA-PILOT-002-S00-5-WAVE-E.md`. No runtime fix, baseline, package script, other-agent test or shared readiness file was changed.

S00#1 reviews the bounded CI delta and reviewer identity mapping, then requests Owner decisions for billing and protection policy. Do not enable protection or merge/deploy in this packet. After runtime/design handoffs, integrate through a reviewed PR and rerun on the resulting SHA. Evidence from this governance branch does not certify a later runtime fix.

Rollback point: governance base70dff89, DEVb287d12, main7304ef8. This branch is unmerged; reverting its proposal has no deployed effect. If later merged, use a reviewed revert commit and independently reverify any authorized deployment. Historical Pages success is not a health certification.

## Remaining release blockers

Billing/CI execution; absent server protection/required checks; trusted current-SHA approvals and external QA artifacts; exact hosted-SHA binding; parent Visual/runtime/design/regression blockers until independently closed. **No NOTIFICATION_CENTER_PASS, ARCHITECTURE_PASS, RELEASE_READY, merge or deployment is asserted by Wave E.**
