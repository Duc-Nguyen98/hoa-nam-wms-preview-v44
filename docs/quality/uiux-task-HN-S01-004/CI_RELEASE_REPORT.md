# HN-S01-UIUX-004 — GitHub, CI and hosted provenance audit

Owner: S00#5. Stage 1, observed 2026-10-27 10:08–10:13 UTC. Candidate source and final QA freeze are pending S00#1 handoff. Requested dispatch Sol/medium fallback; actual runtime model/effort telemetry **UNVERIFIED**.

## Verdict

**BLOCKED / NO RELEASE CERTIFICATION.** Fresh observations below apply to initial HEAD `06954a99885f7c9e808bf9a5556c7dd6c0d6b9a2`, source tree `65ac25d235682469452f60d50664b3e6acb3a753`, on `DEV`. Other agents are actively editing the authorized S01 files. This initial audit is not final candidate QA or deployment proof.

## GitHub and authorization

- Local HEAD and live `git ls-remote github refs/heads/DEV` matched `06954a9…`; GitHub `main` was `7304ef8d27b5d3d091bda681cc1afcb36048c318`.
- `github` is `Duc-Nguyen98/hoa-nam-wms-preview-v44`. `origin` is the separate internal Sites remote. Hosting configuration names `appgprj_6adc45f730d88191ae066e8ff0c936aa`, output `dist`; configuration is not deployment evidence.
- `gh` CLI is unavailable. Git Credential Manager is configured. A transient credential was used only in memory for read-only GitHub API requests; `/user` succeeded and repository permissions reported pull/push/admin/maintain/triage true. No credential value is written to evidence.
- Fresh authenticated branch metadata reports `protected:false`; rulesets return `[]`. Authenticated `/branches/DEV/protection` returns HTTP404. Initial anonymous request returned HTTP401; the authenticated result supersedes that access limitation. No enforced required check list is evidenced. Workflow job names alone do not establish required checks.
- The sole open PR is draft [PR #1](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/pull/1), older CI-governance head `07fe672f86f4c0c3fe35f5e39a9dde23fa6e239f`, base DEV. No S01 task PR is observed.
- The packet carries user authorization for normal GitHub DEV source storage after exact HEAD/remote/fast-forward/unprotected verification. S00#1 retains storage responsibility. Capability is distinct from authorization. This audit performed no stage, commit, push, PR creation, merge, workflow rerun, deployment, Sites write, billing or protection change.

## Exact-SHA CI

[Run 40464186193](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40464186193) is completed/failure on exact initial HEAD `06954a9…` (created 06:57:28 UTC, updated 06:57:31 UTC).

| Gate | Fresh result | Classification |
|---|---|---|
| critical / check 122055548700 | Failure, zero steps, empty runner name; annotation explicitly confirms account billing lock | BLOCKED_ENVIRONMENT; no source tests executed |
| visual-and-functional / check 122055562701 | Skipped, zero steps | NOT_RUN |
| Combined legacy status API | pending, total_count 0 | No legacy statuses; not a contradiction of check-run failures |
| Committed workflow | PR and pushes to main/DEV; critical runs quality:pr; dependent visual job ends in unconditional exit 1 | Gate incomplete even after billing is resolved |

`quality:pr` covers typecheck, contract, build and putaway tests. It does not certify the complete S01 browser/visual/a11y matrix. Local PASS cannot be relabeled CI PASS. Billing and workflow limitations are freshly reverified rather than inherited from NC003 history.

## Public S01 preview

The explicitly requested [canonical S01 URL](https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S01) was attempted through the web tool, which reported inaccessible. Direct read-only HTTP GETs to the same origin, manifest and assets succeeded. URL fragments are client-side; this stage does not claim a rendered browser S01 smoke.

The served manifest reports `HN-B17-PUBLIC-CANDIDATE-20261024.2`, mode `MOCK`, sourceCommit `d2547577f342402136f464d4cee3ff237f77bf99`, buildId `1d53c18c7ec915738ed7e60cd1c8d608c3b659fe664aefe5d116b9b90685424c`. This does not match the initial candidate. `scripts/write-build-info.mjs` freshly confirms sourceCommit is copied from historical `SOURCE_PROVENANCE.json`; it is not a trusted HEAD attestation.

13/15 listed asset SHA-256/size pairs match. `index.html` and `release.html` each have 938 additional served bytes and differing hashes. This mismatch is retained as transport/manifest evidence, not asserted as a source defect. **Exact deployed candidate SHA: UNVERIFIED.** Local actual app captures use source fixture MOCK data (`overview-fixture-adapter.ts` imports S01_SCANNER_PINNED.json); those screenshots must retain local URL/source/scenario attribution rather than be described as captures of this hosted candidate.

## Protected source and artifact custody

The root `PROTECTED_SOURCE_BEFORE.json` lists 100 protected files. Current initial working bytes match all 100 SHA-256 values; zero mismatches. This check will be repeated against the final candidate. The preserved shell, notification, shared controls and toast bytes are not authorized for editing by this release role.

All four user originals 3/4/5/6.png match their tracked custody copies in `docs/quality/references/hn-astra-20261027/`; hashes are in `release/reference-integrity.json`. This is reference custody, not visual acceptance.

Final screenshot/JSON/trace ZIP inventory and decoder/CRC checks are **PENDING QA owner freeze**. Other agents are writing evidence; no provisional file list is called final. Final audit must retain original run/source chronology, distinguish incomplete attempts, hash frozen files, validate PNG/JSON/ZIP formats, compare owner manifests, and rerun protected-source and exact candidate CI/remote checks.

## Evidence and commands

`release/collect-stage1.ps1` and `collect-supplement.ps1` are read-only collectors writing only this leased release directory. Results: `github-observation.json`, `github-supplement.json`, `preview-observation.json`, `reference-integrity.json`. Raw observations carry UTC timestamps. Commands included explicit E: cwd, repository/packet/design/workflow/build writer reads; `git status --short`, branch/HEAD/src-tree/remote/config reads; `git ls-remote`; read-only GitHub REST for branch/rulesets/protection/PR/runs/jobs/checks/annotations/status/user/permissions; HTTP manifest/asset GET and SHA-256 comparisons; protected-file SHA-256 comparisons. One rg Windows wildcard attempt failed and was retried with rg -g filters. No test execution or release action is implied by these read-only commands.

## Remaining gates

Final committed source handoff and independent Visual/Functional/Regression reports; frozen evidence integrity; exact candidate remote/CI checks; functioning complete CI gate; trusted candidate-to-build-to-deployment provenance and exact deployed preview smoke; unresolved design/environment limitations retained in owner reports. No production release is authorized by this audit.

## Final candidate — prestorage refresh

S00#1 handed off frozen source `f56e25cfc119f5a758f0cd48ebdc6a96e78f8a09`, src tree `72189a9c0bdb2aff13a0294fd2b66929b157273e`, tests tree `3a61cae4bffcbda3f9e614eaaa02a38e637f3e64`. The intervening source commits are `60b76b91764644996d9c69c9c08833ed76036a89` and `f56e25c…`. Fresh local reads match all identities; `git status --short -- src tests` is empty. The root quality:pr receipt in `integration/f56e25c/candidate-results.json` records exit0 at this exact HEAD; this is local validation, not CI acceptance.

Authenticated prestorage refresh again confirms DEV `protected:false`, rulesets `[]`, protection HTTP404, repository push/admin permission available, one existing draft PR. Live GitHub DEV remains `06954a9…`; main remains `7304ef8…`. `git merge-base --is-ancestor 06954a9… f56e25c…` returns0, supporting a normal fast-forward DEV update. All100 protected file hashes remain unchanged. Receipts are preserved separately under `release/f56e25c-prestorage/`; stage1 is unchanged.

S00#1 retains responsibility for the authorized GitHub DEV-only source storage and immediate ref recheck. No push was made by S00#5. The reused supplement incidentally issued one legacy status read for the not-yet-uploaded final SHA; that response is retained without classifying it as a CI test result. No run polling/retry was performed before upload. Exact candidate CI awaits source-storage confirmation. Independent QA is still running and final artifact integrity remains PENDING owner freeze.

## Final candidate — post-push exact-SHA CI

After S00#1 confirmed its normal GitHub DEV storage succeeded, S00#5 freshly observed live DEV `f56e25cfc119f5a758f0cd48ebdc6a96e78f8a09` at 10:47:38 UTC; main remains `7304ef8…`. This supersedes the earlier prestorage remote observation without rewriting it.

Exact candidate [run40490897720](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40490897720) completed/failure (10:45:09–10:45:13 UTC). Critical check/job `122144264947` failed with no assigned runner and zero steps. Its annotation explicitly states the account is locked due to a billing issue: **BLOCKED_ENVIRONMENT**, no executed source-test result. Visual-and-functional check/job `122144290388` is skipped with zero steps: **NOT_RUN**. The workflow still has its unconditional visual placeholder; no CI PASS is claimed.

Fresh evidence is in `release/f56e25c-postpush/`. The initial jobs GET encountered DNS failure (`api.github.com`); it is preserved in `github-observation.json`. One targeted retry succeeded, with zero-step job metadata in `jobs-retry.json`. No repeated run polling or workflow mutation occurred.

The same post-push public HTTP audit still serves historical MOCK manifest `d254757…`, buildId `1d53c18…`;13/15 asset pairs match, with the two retained HTML mismatches. Exact hosted candidate remains **UNVERIFIED**. Original reference custody still matches3–6. Final QA artifact inventory/format/CRC validation is **PENDING QA freeze**; no active evidence files are called a final integrity PASS.

## Footer correction candidate — prestorage

S00#1 superseded f56 as final candidate with `e18305b1e3b09c4402317d507d7008967284341b`, src tree `edd34681bf20a5281188e9da49cdc91876a0845d`; tests tree remains `3a61cae4bffcbda3f9e614eaaa02a38e637f3e64`. Fresh local source/tests are clean. The exact f56→e183 product delta is one CSS insertion setting desktop detail-modal footer padding-block16px. f56 CI observations remain historical evidence for f56 and are not promoted to e183.

At10:58–10:59UTC, live GitHub DEV remains f56 and main7304ef8. Authenticated DEV protected:false and protection404; rulesets initially hit an SSL transport failure, preserved in `release/e18305b-prestorage/storage-prerequisites.json`, then one retry returned[] in `rulesets-retry.json`. Normal fast-forward ancestry f56→e183 returns0. Root retains normal GitHub DEV-only storage responsibility after an immediate ref recheck. No push by this audit. Exact e183 CI awaits upload confirmation; artifact freeze remains pending independent QA. No broad public-asset audit was repeated for this one-property local change.

## Footer correction candidate — exact uploaded CI

After S00#1 confirmed normal GitHub DEV storage, fresh live refs show DEV `e18305b1e3b09c4402317d507d7008967284341b`, main unchanged7304ef8. Local HEAD/src/tests match the e183 handoff and source/tests working state is clean. Root reports quality:pr exit0 in `integration/e18305b/`; that local receipt is distinct from hosted CI.

Exact e183 [run40492867184](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40492867184) is completed/failure. Critical check/job `122150892604` failed before runner assignment, zero steps, with the explicit account billing-lock annotation: **BLOCKED_ENVIRONMENT**, no executed source-test failure. Visual-and-functional check/job `122150911155` is skipped, zero steps: **NOT_RUN**. Receipt: `release/e18305b-postpush/exact-ci-observation.json`, collected with `release/collect-exact-ci.ps1`. No broad public asset matrix was repeated; last hosted provenance observation remains historical and UNVERIFIED for e183. Final artifact validation is still PENDING QA freeze.

## Partial frozen artifact validation — Visual and Implementation

After S00#1 explicitly froze Visual and Implementation only, `release/audit-frozen-artifacts.py --scope partial` independently read311files/279,296,104bytes under visual/**, implementation/** and IMPLEMENTATION_REPORT.md. It decoded232PNGs, parsed29JSONs, CRC-tested41ZIPs, and hashed9other supporting files. Zero existing-file format/CRC failures were found. All297 entries in visual/artifact-manifest.json and all107 historical f56e25c-manifest.json entries match size/SHA-256; both owner manifests are themselves hashed in the release inventory. The visual owner manifest excludes itself, explaining the distinction between its297 entries and this broader311-file scope.

At unchanged e183 HEAD/src/tests,100/100 protected source hashes still match, and originals/custody/visual copies of3–6 all agree. Receipt: `release/partial-frozen-integrity.json`. This validates frozen existing bytes, not visual fidelity, completed-run status, or test PASS. Historical failed attempts remain intact with original provenance. Functional evidence and mutable root reports are excluded and **NOT YET FROZEN**; this is not global final integrity acceptance. No CI/public-asset audit was rerun.

## Final frozen QA artifact integrity

After S00#1 explicitly confirmed the final owner-artifact freeze, `release/audit-frozen-artifacts.py --scope final --output final-frozen-integrity.json` read508files totaling291,267,710bytes. Scope: all Visual, Functional, Implementation and Integration files; frozen DATA_SCENARIO, DATA_CONSISTENCY_MATRIX, FUNCTIONAL_QA_REPORT, DESIGN_ACCEPTANCE_MATRIX, DESIGN_GAP_REPORT, VISUAL_QA_REPORT and IMPLEMENTATION_REPORT; root JSON/log/TAP evidence including PROTECTED_SOURCE_BEFORE.json.

- 334PNGs fully decoded,69JSONs parsed,41ZIPs CRC-tested,64other supporting files hashed. Zero existing-file format/CRC failures.
- 297/297 final Visual owner-manifest entries and107/107 historical f56 snapshot entries match SHA-256 and size. Both manifests are independently hashed. Failed/superseded attempts remain in inventory with original owner chronology; valid file bytes do not certify successful test execution.
- HEAD remains e18305b, src tree edd34681, tests tree3a61cae4; source/tests working status empty. All100protected hashes match. Original/custody/visual reference copies3–6 match.
- All four canonical BEFORE and four e183 normal AFTER screenshots, four reference files, and all four latest diff/aligned comparison sets exist and decode. `fourStateEvidenceCompleteness` records paths. Normal AFTER source fixture page10/pending5 is deliberately distinct from isolated comparison scenarios; dashboard comparisons use declared QA_SYNTHETIC page4/pending3 and modal comparisons source-preserving page4/pending5. Transform/source authority remains in comparison-e18305b/comparison-metadata.json. Presence/integrity does not overrule Visual fidelity FAIL/exact acceptance BLOCKED.

Explicit mutable root exclusions: AGENT_TRACE.md, DEFECT_REGISTER.md, REGRESSION_REPORT.md, FINAL_REPORT.md, EVIDENCE_INDEX.md and CI_RELEASE_REPORT.md. Release scripts/receipts are excluded from their own inventory; .gitattributes, verify-candidate.ps1 and the external task packet are also outside this immutable QA inventory. Root may finish control reports and integrate evidence without claiming those excluded files were frozen here. Functional34Node/12modalcase execution and broader f56 transfer qualification remain owned by FUNCTIONAL_QA_REPORT; hashing does not independently rerun them. No CI/public preview polling, source edit, stage, commit, push or deployment was performed during this final check.

**Final artifact byte/format integrity: PASS for this explicit frozen scope. Release readiness remains BLOCKED:** exact e183 CI is billing-blocked with visual job NOT_RUN, hosted candidate provenance remains UNVERIFIED, and Visual reference fidelity remains FAIL/exact acceptance BLOCKED. Evidence-only integration commit and its Git/index custody are subsequent root operations; they do not change the tested e183 source identity.

