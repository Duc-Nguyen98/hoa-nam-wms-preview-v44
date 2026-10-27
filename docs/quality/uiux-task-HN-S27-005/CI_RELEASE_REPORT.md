# S27 Git / CI / release audit

Owner: S00#5. Task: HN-S27-UIUX-005. Initial observation: 2026-10-27 UTC. Requested model Sol medium as explicit fallback; actual runtime telemetry UNVERIFIED.

## Verdict: BLOCKED — exact candidate hosted CI billing failure

## Final source candidate ebcf0d3 — authoritative latest observation

Final source candidate ebcf0d360e52bf2036c5a3c531563675ebf3580c supersedes d80255b and cc030be. Evidence release/ebcf0d3-postpush/exact-ci-observation.json. One exact CI observation, no repeated unchanged polling.

- Local HEAD and GitHub DEV equal ebcf0d360e52bf2036c5a3c531563675ebf3580c; main remains 7304ef8d27b5d3d091bda681cc1afcb36048c318.
- [Exact final workflow run 40511952910](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40511952910): completed / failure.
- critical check/job 122215881291 failed with empty runner name and zero steps; exact failure annotation: "The job was not started because your account is locked due to a billing issue."
- visual-and-functional check/job 122216006029 skipped with zero steps. Hosted CI remains BLOCKED; no hosted test execution. Workflow's intentional visual harness failure remains separate.
- Fresh eligibility evidence release/ebcf0d3-prepush-eligibility.json: push/admin true, DEV protected=false, rulesets empty; then-live DEV was expected d80255b. This audit did not push.
- Coordinator reports exact final quality:pr PASS/exit 0 and protected 577/577 unchanged. Final owner QA/report closure and explicit freeze receipt still pending; artifact integrity NOT_RUN.
- Public deployment provenance UNVERIFIED. No new PR, production merge/deploy or Sites push by this audit.

## Final source candidate d80255b — authoritative CI observation

Final source candidate d80255b94a3d6ad37e7c65eb34bb4f075e48deaf supersedes cc030be. Collected 2026-10-27T20:12:00.0611143+07:00; evidence release/d80255b-postpush/exact-ci-observation.json and direct-run-observation.json. Initial runs-list request failed transient DNS resolution; the exact checks succeeded and exposed run 40509853481. One direct read of that run and its jobs completed the missing evidence, without polling unchanged state.

- Local HEAD and GitHub DEV both equal d80255b94a3d6ad37e7c65eb34bb4f075e48deaf. main remains 7304ef8d27b5d3d091bda681cc1afcb36048c318. Local src/tests status empty.
- Source tree 09c0f24b3c58e00e0db7498e70a747232de28920; tests tree cf2930b0898b69188b11710286cae5e29fee8a6e.
- [Final source workflow run 40509853481](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40509853481) independently reports exact head_sha d80255b94a3d6ad37e7c65eb34bb4f075e48deaf, completed / failure.
- critical check/job 122208561298 completed / failure, empty runner name, zero steps. Exact candidate failure annotation: "The job was not started because your account is locked due to a billing issue."
- visual-and-functional check/job 122208582755 completed / skipped, zero steps. Hosted CI is BLOCKED; tests did not execute. Existing workflow's intentional visual harness exit 1 remains unresolved separately.
- Fresh pre-push API eligibility observation in release/d80255b-prepush-eligibility.json reported push/admin true, DEV protected=false and empty rulesets, with then-live DEV at cc030be. This audit performed no push.
- Coordinator reports final quality:pr PASS/exit 0 and 577/577 protected hashes unchanged; independent owner QA is still running. These local results do not replace hosted CI. Final artifact integrity remains NOT_RUN until QA freeze.
- Deployed candidate identity remains UNVERIFIED. No new PR, Sites push, production merge or deploy performed by this audit.

## Historical initial observations

Read-only remote audit completed; source was dirty and no final S27 commit was available. This report does not mark source, QA, hosted CI, deployed provenance, or final artifact integrity PASS. Re-run exact candidate CI after coordinator's normal DEV push and run artifact integrity only after QA freeze.

Coordinator subsequently supplied candidate cc030be40552845881d0a234a26e1e783f5e6e4f on DEV (five files: four S27 runtime files and one test). Independent QA is running. Initial observations below remain historical base observations. Coordinator reports local quality:pr PASS/exit 0 and 577 protected source files unchanged; final collector must independently verify frozen evidence. No final artifact integrity verdict is issued.

## Exact candidate post-push observation

Collected 2026-10-27T19:48:24.7090956+07:00 by release/collect-exact-ci.ps1. Evidence: release/cc030be-postpush/exact-ci-observation.json. One completed-run observation; no repeated unchanged polling.

- Candidate and local HEAD: cc030be40552845881d0a234a26e1e783f5e6e4f. Git status for src/tests was empty. Source tree 165b4bf168c6e59968252ba8a25a4be9b8838688; tests tree 217dd030d92ce40482270e64d1be0431f9dd09c5.
- Independent git ls-remote confirmed GitHub DEV at the exact candidate; main remains 7304ef8d27b5d3d091bda681cc1afcb36048c318.
- [Exact candidate workflow run 40506619161](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40506619161): completed / failure.
- critical check/job 122197436434: completed / failure, empty runner name, zero steps. Failure annotation: "The job was not started because your account is locked due to a billing issue."
- visual-and-functional check/job 122197460991: completed / skipped, zero steps. Hosted tests did not execute; CI remains BLOCKED by infrastructure. Local quality results cannot replace this gate.
- Workflow SHA-256: 5db7b1d1cab15bad63d7a91d9d38d918f8625e6fedd9e4a909eec025878b59c7. Its intentional visual harness failure remains a separate unresolved gate after billing recovery.
- Deployed candidate identity remains UNVERIFIED; no deploy performed. Final frozen artifact integrity remains NOT_RUN pending coordinator freeze.

| Check | Observed evidence / status |
|---|---|
| Workspace | Explicit E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026 works. Inherited W: cwd fails process creation with os267. |
| Branch / local HEAD | DEV at bde0e4292ae4a7db569c7a5d56bce0c7ffa8e703; dirty S27 source and untracked S27 test. Final source identity NOT_RUN. |
| GitHub DEV | bde0e4292ae4a7db569c7a5d56bce0c7ffa8e703, independently observed by API and ls-remote. |
| GitHub main | 7304ef8d27b5d3d091bda681cc1afcb36048c318. |
| Authentication / permission | Existing local Git credential helper authenticated as Duc-Nguyen98. Repository API reports admin, maintain, push, triage, pull true. Capability does not grant production authorization. No secret stored or printed. |
| Protection / rulesets | DEV and main protected=false. Both protection endpoints return 404 with explicit Branch not protected. Rulesets endpoint succeeds with empty array. No enforced branch gate observed. |
| Hosted base CI | Run 40496034486, exact base bde0e429, failure. critical job 122161591564 completed/failure, no runner, zero steps. Annotation: account locked due to billing issue. visual-and-functional job 122161607449 skipped. This is infrastructure failure, no test execution proof. |
| Workflow | .github/workflows/quality-pr.yml triggers PR and pushes to main/DEV. critical runs npm ci and quality:pr. Dependent visual-and-functional includes an intentional exit 1 until capture harness is wired. Current source workflow cannot produce a full green gate even after billing recovery. |
| Pull requests | One existing open PR #1: S00-5: CI quality gates and release governance (BLOCKED), chore/s00-5-ci-release-governance -> DEV, head 07fe672f86f4c0c3fe35f5e39a9dde23fa6e239f. It is not an S27 candidate PR. No new PR created. |
| Canonical deployment | build-info fetched from canonical Site; sourceCommit d2547577f342402136f464d4cee3ff237f77bf99, buildId 1d53c18c7ec915738ed7e60cd1c8d608c3b659fe664aefe5d116b9b90685424c, 15 listed assets. UNVERIFIED_CURRENT_CANDIDATE. |
| Manifest trust | scripts/write-build-info.mjs copies sourceCommit from historical SOURCE_PROVENANCE.json rather than current Git HEAD. Manifest sourceCommit alone cannot prove S27 candidate identity. Listed asset hashes are not yet audited in this initial observation. |
| Frozen artifact integrity | NOT_RUN: QA still active. Requires PNG decode, JSON parse, ZIP CRC, hashes, immutable references and protected sources; exclude output inventory/control receipts from self-reference. |

## Evidence and next handoff

- release/collect-initial.ps1 is reproducible and writes only owned release outputs.
- release/initial-github-observation.json contains API branch/protection/ruleset/PR/check/job/annotation responses with observation time.
- release/initial-preview-observation.json records canonical manifest and provenance limitation.
- Prior task artifacts were read only. No build, source edit, commit, push, PR creation, production merge or deploy performed.
- Coordinator must provide final source SHA and QA freeze. Exact SHA must be used for runs/checks/jobs/annotations, remote DEV comparison and downstream report provenance. A local successful test cannot replace hosted CI.
