# HN-OUTBOUND-GSTATE-001 — CI and preview report

Owner: S00#5 (Git/CI/preview metadata)  
Observation: 2026-10-28 11:43 +07:00  
Checkout: `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`

## Verdict: BLOCKED

The exact local candidate passes the available local gates, but hosted CI has no run for the candidate SHA and the canonical public preview cannot be proven to contain it. Release approval is therefore blocked. No push, merge, deployment, or credential action was performed.

## Candidate identity and source diff

- Branch: `DEV`; local HEAD: `002e291f9005ec5e22c45d7f93350af12f9b26ec` (`docs(qa): record putaway post-fix release status`).
- Local working tree contains only untracked `docs/qa/` evidence; no tracked source or test edits are present outside the candidate commits.
- `github/DEV` remains `bfec7060cdf422a112ec5e644bf0b51401d9bda2`; local `DEV` is seven commits ahead. The candidate is not present on the GitHub DEV ref.
- Candidate source tree: `dc457b99965bcc9c045d55f2cc34a1a1ec280d62`; test tree: `67ca3d918841bce495ab723dba65bca4aa79f545`.
- `git diff github/DEV...HEAD` source/test paths: `src/features/S12/OperationalReceipts.tsx`, `src/preview-mock/operational-policy.ts`, `tests/putaway-approved/operational-seed.test.ts`, `tests/s12/receipt-visibility.config.ts`, and `tests/s12/receipt-visibility.spec.ts`. No S15/outbound implementation or S15 test path differs from `github/DEV`.

## Local validation — PASS (local scope)

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | **PASS** (exit 0) | Node v26.5.0 / npm 11.17.0 |
| `npm run build` | **PASS** (exit 0) | Vite produced 15 assets; existing chunk-size warning; local build ID `a011e8ccb02efedac6ab6741e87298ddb7c35ce74116dd08922dec9c27505702` |
| `npm run quality:contract` | **PASS** (exit 0) | `QUALITY_CONTRACT_PASS: 13 states, 26 references, immutable source policy` |
| `npm run test:putaway` | **PASS** (5/5) | Duration 29.0 s |
| Full hosted `quality:pr` | **NOT_RUN** | Hosted CI is unavailable for this SHA; visual/functional owner gates remain separate |

The build writes `dist/build-info.json` with the historical `sourceCommit` `d2547577f342402136f464d4cee3ff237f77bf99`; this field is copied from repository `SOURCE_PROVENANCE.json` and does not attest the current Git HEAD.

## GitHub CI — BLOCKED

Read-only GitHub Actions lookup for commit `002e291f9005ec5e22c45d7f93350af12f9b26ec` in `Duc-Nguyen98/hoa-nam-wms-preview-v44` returned `workflow_runs: []`. The candidate has not been pushed to the GitHub DEV ref, so no exact-SHA hosted check can be observed. Workflow `.github/workflows/quality-pr.yml` is present locally (SHA-256 `5db7b1d1cab15bad63d7a91d9d38d918f8625e6fedd9e4a909eec025878b59c7`); it runs `quality:pr` and contains an intentional `visual-and-functional` failure until a CI capture harness is wired.

## Canonical public preview — BLOCKED / exact deployment unverified

Canonical site: [Hoa Nam WMS public candidate](https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S15). A read-only fetch of `/build-info.json` on 2026-10-28 returned release `HN-B17-PUBLIC-CANDIDATE-20261024.2`, build ID `1d53c18c7ec915738ed7e60cd1c8d608c3b659fe664aefe5d116b9b90685424c`, and `sourceCommit` `d2547577f342402136f464d4cee3ff237f77bf99`. This differs from candidate `002e291f9005ec5e22c45d7f93350af12f9b26ec`; no deployment receipt or exact source mapping exists for the candidate. The preview is therefore usable as a public URL reference only, not candidate evidence.

## Release handoff

Status remains **BLOCKED** pending a pushed exact candidate SHA, successful hosted critical checks, resolution of the workflow's intentional visual harness gate, and a deployment manifest/receipt whose source identity matches the candidate. This report grants no release approval.
