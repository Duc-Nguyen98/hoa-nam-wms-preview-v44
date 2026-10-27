# Git / CI / preview governance — HN-NC-UIUX-003

Owner: S00#5. Date: 2026-10-27 UTC+07. Base and observed candidate: `DEV` / `78752811af4b0434c958d604dc52ca445cdbeede`. Source tree: `e1d3c3ccca8f29f9a088be3e0d55f5828cc17bb1`.

## Verdict

**BLOCKED / NO RELEASE CERTIFICATION.** This is a fresh read-only GitHub/hosted audit. It does not certify Visual or Functional QA, approve merge/deployment, alter billing/protection or claim the hosted preview is the current candidate. No source, workflow, baseline or existing report was modified.

## Exact-source observations

Local HEAD and GitHub live `refs/heads/DEV` both equal the candidate SHA. `main` is `7304ef8d27b5d3d091bda681cc1afcb36048c318`. Working changes observed were new task packet/evidence files only; `git diff HEAD -- src` was empty. These observations precede any future S00#2 correction. A later implementation SHA requires a new source custody and CI/preview check; this audit must not be attached to a different commit as its PASS.

`origin` is the internal Sites Git remote and `github` is the GitHub repository; they are distinct. `.openai/hosting.json` points at `appgprj_6adc45f730d88191ae066e8ff0c936aa` with `dist` as static output. This configuration does not prove deployment.

## Live GitHub results

| Check | Actual | Status |
|---|---|---|
| Candidate workflow | [Run 40451587889](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40451587889), head `78752811…` | FAIL before runner |
| Critical job | Job/check `122015310649`; no runner name, no steps; annotation explicitly says account locked due to billing issue | BLOCKED_ENVIRONMENT |
| Visual/functional job | Job/check `122015324102`, skipped after critical failure | NOT_RUN |
| Workflow implementation | `critical` runs `quality:pr`; visual job ends in unconditional `exit 1` placeholder | BLOCKED even after billing resolves |
| Workflow trigger | `pull_request`; pushes to `[main, DEV]` | Present; actual DEV run confirms trigger |
| DEV protected flag | Public branch REST returns `protected:false` | No protected merge gate evidenced |
| Rulesets | Public API returns empty array | None observed |
| Protection details | `/branches/DEV/protection` returns HTTP401 | Detailed settings NOT_VERIFIED; no unauthorized bypass |
| Existing PR | [PR #1](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/pull/1), open/draft, head `07fe672f86f4c0c3fe35f5e39a9dde23fa6e239f`, base DEV | CI-governance PR; not a PR for this UI task |

Billing must be resolved by the account owner in GitHub billing settings. No billing workaround, mutation, retrigger, new PR, merge or deployment was attempted. Required checks cannot be claimed enforced from a workflow file or the two visible check results; branch flag/ruleset observations show no enforced gate and detailed access is unavailable.

`quality:pr` covers typecheck, contract, build and putaway tests. It does not execute the new full Notification browser/visual matrix. Local QA evidence is essential but cannot substitute for a passing hosted required gate.

## Public preview

Read-only HTTP requests to the configured domain succeeded (HTTP200):

`https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/`

The served `build-info.json` reports release `HN-B17-PUBLIC-CANDIDATE-20261024.2`, mode `MOCK`, `sourceCommit=d2547577f342402136f464d4cee3ff237f77bf99`, build ID `1d53c18c7ec915738ed7e60cd1c8d608c3b659fe664aefe5d116b9b90685424c` and 15 listed assets. These values do not match or attest the current candidate. The build script copies `sourceCommit` from historical `SOURCE_PROVENANCE.json`, rather than deriving a verified HEAD; even a newly built local bundle reports that historical source SHA.

13/15 downloaded listed assets match manifest SHA-256 and length. `index.html` and `release.html` differ in size/hash: each served response is 938 bytes larger. The observed HTML includes injected Cloudflare challenge script markup. This is consistent with edge HTML transformation; the byte mismatch is retained and is not classified as a production-code defect without additional proof. Manifest/asset consistency alone would still not bind a build to the candidate commit.

**Public current-candidate provenance: UNVERIFIED.** Use a local server tied to the exact tested checkout for task screenshots. A successful public HTTP response or historical release label must not be reported as deployed SHA verification.

## Artifact integrity and historical corrections

- Both current original PNGs match their tracked custody hashes: BL-NOTIFY-D `fa1a5615926a3a15b4cdf72d3482f53f4755931f9b881f8f34874a35233ae22c`, BL-NOTIFY-T `65606c1c19e7124340cdf18f41d201b136be755059275dd2b777847b268569f4`.
- Thirty tray-reference files, including manifest and 26 PNGs, are tracked. Earlier reports claiming all references ignored/untracked are stale for this candidate.
- Earlier reports claiming DEV lacks push trigger or local DEV is ahead of remote are stale at this audit time: trigger is present and refs match.
- Screenshot/trace/geometry/visual-diff artifacts are owned by S00#3/#4 and were still being written during this audit. They are not called final or approved here. Final acceptance must inventory/checksum their final files and bind each to source SHA/profile/transform. Reference checksum equality does not prove visual fidelity.

## Evidence and reproduction

Within `release/`:

- `collect.ps1`: read-only public GitHub/preview collector; writes only the leased evidence folder.
- `github-observation.json`: exact refs, branch/rulesets/protection/PR, candidate runs/jobs/checks/annotations, workflow hash and tracked reference inventory.
- `preview-observation.json`: served manifest and downloaded asset hash/size checks.
- `reference-integrity.json`: user original vs tracked source checksums.

Commands included `git status --short --branch`, `git rev-parse HEAD`, `git rev-parse HEAD:src`, `git remote -v`, `git ls-remote github refs/heads/DEV refs/heads/main`, `git diff --stat HEAD -- src`, `git ls-files output/tray-approved/reference`, targeted workflow/build-script reads, `Get-FileHash`, public `Invoke-RestMethod` and HTTP GETs. No credentials, private keys, production user data or auth configuration were collected.

Requested dispatch model/reasoning: Sol/high fallback for S00#5 because Terra was unavailable in prior verified routing. Actual execution model/reasoning telemetry is not exposed: **UNVERIFIED**.

## Remaining release gates

1. Independent final Visual/Functional task evidence and any fix-SHA retest.
2. Resolve billing, wire real portable browser/visual/a11y/console/overflow CI and obtain PASS for exact candidate.
3. Establish required checks/protection through authorized repository administration; no automatic settings change here.
4. Trusted candidate-to-build-to-deployment provenance and preview smoke of that exact candidate.
5. Preserve pre-existing regression/Design gaps and API/RBAC NOT_RUN where no real backend environment exists.

## Final-source refresh — 2026-10-27

Candidate implementation is now `76059cce616543356c623ec248c6350ddd07cdf5` on `DEV`, source tree `d3cbc007a42abb996b74d8c537220fb202e8bb18`. Relative to the initial audited commit, five tracked files changed: `src/notifications/notifications.css`, `src/shared/GlobalModal.tsx`, `src/toast/GlobalToastProvider.tsx`, `tests/functional/shared-semantics.config.ts`, and `tests/functional/wave-ad/shared-semantics.spec.ts` (98 insertions, 6 deletions). No tracked working edits were observed. The modal/toast changes are shared components, so their independent regression evidence is required; this audit does not substitute for that QA.

Fresh observations are preserved separately in `release/final/`; the initial evidence above remains intact. At 06:05 UTC the public remote DEV still pointed to `78752811af4b0434c958d604dc52ca445cdbeede`. Current candidate checks returned HTTP422 because that local commit was not uploaded, and no workflow run for it was observed. These checks are **NOT_RUN**, not PASS or a confirmed test failure. No push was attempted during this refresh.

A retry of the live DEV branch endpoint succeeded: `protected:false`; rulesets remained empty. Detailed protection still returned HTTP401. The latest remote run `40451587889` remained failed before runner (zero steps); its annotation freshly confirmed the account billing lock. Its dependent visual job remained skipped. The committed workflow still contains the unconditional visual-gate `exit 1`, so billing recovery alone does not provide a complete gate. PR #1 remains open/draft on its older CI-governance head and is not this task's PR.

The public preview again served the historical MOCK release manifest with `sourceCommit=d2547577f342402136f464d4cee3ff237f77bf99`; 13/15 listed assets matched, with the same HTML byte/hash discrepancy. **Hosted candidate SHA remains UNVERIFIED.** No production deployment occurred. The final local candidate screenshots must be attributed to their local server and tested source, not this public domain.

Fresh files: `release/final/github-observation.json`, `github-supplement.json`, `preview-observation.json`, `reference-integrity.json`, and `local-source-custody.json`. Actual spawned model/reasoning remains **UNVERIFIED**. Final screenshot/trace/raw-result integrity is **PENDING** while QA owners finish and freeze their outputs; a later manifest must be bound to the final evidence commit without claiming that evidence-only commit was deployed.

### Authorized candidate source storage

At 06:10 UTC, S00#1 explicitly authorized GitHub DEV source storage under the user's existing DEV/GitHub instruction. S00#5 verified the exact local HEAD, unchanged remote `78752811…`, `protected:false`, and fast-forward ancestry. A normal, non-force push to **GitHub DEV only** succeeded (exit 0); the subsequent remote ref read confirmed `76059cce616543356c623ec248c6350ddd07cdf5`. Receipt: `release/final/source-push-receipt.json`. No Sites remote push, merge, production deployment, billing or protection change occurred. This is source storage while QA is in progress, **not release acceptance**. Exact-source CI observations after the push are retained separately under `release/post-source-push/`.

The push triggered exact-source [run 40459480170](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40459480170) on `76059cce…`: **FAIL/BLOCKED_ENVIRONMENT**, critical check `122040441094`, zero executed steps and no assigned runner, with the explicit annotation “The job was not started because your account is locked due to a billing issue.” Visual/functional check `122040453257` was skipped (**NOT_RUN**). This is direct exact-SHA CI evidence, not a source-test failure claim. The first post-push branch REST response retained the previous SHA; a cache-busted reread and Git ref both confirmed `76059cce…`, with `protected:false` (`release/post-source-push/ref-confirmation.json`). Public preview provenance remained unchanged and unverified after source storage.

## Final portrait correction candidate — 830f83d

The final implementation candidate is `830f83d48eac84c3e2467de7f41c388439cc7eb2`, source tree `65ac25d235682469452f60d50664b3e6acb3a753`. Only the Notification Center portrait CSS changed after `76059cce…` (9 insertions, 6 deletions). A later raw-evidence review did not confirm the claimed 108px candidate jump; this audit does not treat that claim as a verified defect. Final Visual/Functional QA is owned by S00#3/#4 and remains separate from release certification.

S00#1 explicitly authorized source storage again. At 06:34 UTC S00#5 verified exact local HEAD/tree, remote DEV still `76059cce…`, `protected:false`, and fast-forward ancestry, then successfully pushed **only GitHub DEV** with a normal non-force update. Subsequent `git ls-remote` confirmed `830f83d48eac84c3e2467de7f41c388439cc7eb2`. Receipt and new observations: `release/source-830f83d/`. All `76059cce…` observations remain preserved. No production deploy, Sites push, merge, billing/protection mutation or other agent's commit occurred.

Exact-source [run 40461961502](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40461961502) on `830f83d…` completed with **FAIL/BLOCKED_ENVIRONMENT**. Critical check `122048415998` executed zero steps with no runner; its annotation explicitly confirmed the account billing lock. Visual/functional check `122048430019` was skipped (**NOT_RUN**). Public preview again served the historical MOCK manifest, and only 13/15 listed asset bytes matched, so exact deployed candidate SHA remains **UNVERIFIED**. The CI placeholder, required-check enforcement and hosted provenance remain release blockers. Actual agent model/reasoning telemetry remains **UNVERIFIED**. Screenshot/trace/raw-result final integrity still awaits explicit QA owner freeze.

### Frozen QA evidence integrity

After S00#1 confirmed both QA owners frozen, S00#5 executed `release/audit-artifact-integrity.py` on unchanged source `830f83d…`. `release/final-artifact-integrity.json` records SHA-256 and size for **344** frozen raw/supporting files: 186 PNGs verified by image decoder, 99 JSON files parsed, 34 ZIP archives checked for CRC, and 25 command-log/TAP files hashed. The scope includes visual/functional/implementation artifacts and root command logs; dynamic root Markdown, browser cache, `.tmp*` and ignored output scratch are excluded. There were zero existing-file format/CRC failures. Independent owner-manifest checks matched **224/224 Functional files** and **45/45 final Visual files**; the latter includes six valid final trace ZIPs.

Existing-file integrity is not test PASS or completed-run certification. The earlier `visual/after-830f83d/` run remains **INCOMPLETE_ENVIRONMENT** after login/network and `tracing.stop` ENOSPC failures; its missing/incomplete trace provenance is not repaired by hashing surviving PNGs. The first recovery namespace remains **INTERRUPTED**. Both completion warnings are retained in the integrity manifest. Only `visual/after-830f83d-recovery-ignored-temp/` is the owner's completed final capture namespace. Functional full-matrix/axe/focus records retain `76059cce…` provenance; `830f83d…` only has the documented portrait impact reruns, including a preserved ZH setup-selector failure and successful isolated retest.

The aborted `visual/.tmp-830f83d/` scratch directory still exists and `git check-ignore` confirms it and descendants are excluded. Prior automatic policy review blocked its proposed cleanup; S00#5 did not delete it. Staging must respect ignore rules (no `git add -f` of scratch). No final source or baseline was changed during integrity review. Evidence-only integration SHA and its source-tree comparison/push receipt remain pending S00#1 integration; hosted release remains BLOCKED.

### Index byte custody before integration

S00#1 added task-local `.gitattributes` (`* -text`) and restaged to preserve exact raw evidence bytes. S00#5 independently compared actual index blob IDs with `SHA1("blob " + rawLength + NUL + rawWorkspaceBytes)` for all 455 staged paths. **454/454 files within this task's quality directory matched exactly**; no scratch, runtime source, test or workflow file was staged. The single task packet outside that attributes directory had a text-conversion mismatch (`docs/agent-handoffs/HN-NC-UIUX-003.md`: index `2cfe22f03b873a99ab33adfda9283ea588f01f47` vs raw workspace `ca2aa62fb7d897dc7f8e6e9fe8afd26a5f15588c`). This is documented separately from frozen artifact custody and must not be reported as all-455 byte equality. Receipt: `release/staged-byte-integrity.json`; reproducer: `release/verify-staged-bytes.py`.

`git diff --cached --check` reports whitespace in retained command logs/error contexts and several task scripts. It is not called PASS; raw evidence was retained without whitespace normalization. This receipt precedes staging of its own checker/result and this paragraph; S00#1 must restage final leased outputs and record the evidence-only commit. No source tests were rerun during release custody review.
