# HN-S12-UIUX-006 — Git, CI and preview audit

Owner: S00#5. Observation date: 2026-10-28 Asia/Bangkok. Candidate: `bfec7060cdf422a112ec5e644bf0b51401d9bda2`, branch `DEV`.

## Verdict: BLOCKED

Local typecheck/build pass. Exact candidate hosted CI did not execute because of a GitHub account billing lock, and canonical preview identity cannot be attested to this candidate. No push, merge, deployment or credential collection was performed.

## Source identity and diff

- Explicit checkout: `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`.
- Local branch `DEV` and HEAD equal the requested candidate. Independent `git ls-remote github` and public branch API confirm GitHub `DEV` equals the candidate; `main` remains `7304ef8d27b5d3d091bda681cc1afcb36048c318`.
- Candidate commit subject: `docs(qa): preserve S27 audit fidelity evidence and partial verdict`. Its parent diff contains 912 paths, all under `docs/`; no source, tests, package, script or workflow change. This is the S12 starting candidate, not evidence of an S12 remediation commit.
- `src` tree: `4360e98244c6308d14de19d50301fb0945c231f6`; `tests` tree: `85450783eeadd34277b48bcc0ebd15bd36e3f8be`.
- Working `src`/`tests` status was empty before and after the local checks. Untracked task evidence/handoff was present and remains outside the source candidate.
- Evidence: `exact-candidate-provenance.json`, `source-diff-provenance.json`.

## Local validation — PASS, local scope only

| Command | Result | Evidence |
|---|---|---|
| `npm run typecheck` | PASS, exit 0 | `local-typecheck.log` |
| `npm run build` | PASS, exit 0; includes typecheck | `local-build.log` |
| Full `quality:pr`, unit/E2E/visual/RBAC gates | NOT_RUN by this owner | Independent QA owners retain those gates |

Checks ran 00:50:47–00:51:26 +07:00 on Node v26.5.0 / npm 11.17.0, at the candidate SHA. CI is configured for Node 22, so this local environment does not substitute for hosted execution. Build emits the existing chunk size warning. Local build ID: `0605378cca0e0981a5d6fef1002ed6dee102bcb5bf14d858612509ef9bac4af9` (15 assets). `local-build-provenance.json` records timing, exit codes and manifest. Build writes only ignored local `dist` output in addition to owned evidence.

## Hosted CI — BLOCKED

One exact SHA observation was collected at 00:50:28 +07:00, using public read-only GitHub API calls.

- [Workflow run 40515752337](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40515752337) independently identifies `head_sha` as the candidate; completed / failure.
- `critical`, job/check `122229144263`: completed / failure, empty runner name and zero steps. Exact failure annotation: “The job was not started because your account is locked due to a billing issue.” Hosted checks did not run.
- `visual-and-functional`, job/check `122229484608`: completed / skipped, zero steps.
- Workflow `.github/workflows/quality-pr.yml` SHA-256: `5db7b1d1cab15bad63d7a91d9d38d918f8625e6fedd9e4a909eec025878b59c7`. It runs `quality:pr` in `critical`; its dependent visual job intentionally executes `exit 1` until the capture harness is wired. That separate gate remains unresolved even after billing recovery.
- Raw API responses, jobs, checks and annotations: `exact-candidate-provenance.json`. No local PASS is promoted to hosted PASS.

## Canonical preview — BLOCKED / exact deployment UNVERIFIED

Canonical [S12 preview](https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S12) build manifest was fetched at 2026-10-27T17:50:50Z (2026-10-28 00:50:50 +07:00).

- Manifest claims historical source `d2547577f342402136f464d4cee3ff237f77bf99`, build ID `1d53c18c7ec915738ed7e60cd1c8d608c3b659fe664aefe5d116b9b90685424c`.
- `scripts/write-build-info.mjs` copies `sourceCommit` from `SOURCE_PROVENANCE.json`, not the Git HEAD being built. Therefore this field cannot independently attest the current deployed commit. The historical claim is not proof that the runtime necessarily uses that historical source either.
- Canonical build ID differs from this audit's candidate local build ID. Remote asset hashes and exact deployed source mapping were NOT_RUN. No candidate deployment or matching deployment receipt was available.
- Evidence: `preview-provenance.json` preserves the fetched manifest and limitation.

## Release handoff

Release remains BLOCKED pending actual hosted execution, resolution of the intentional visual harness gate, exact candidate deployment provenance, and independent S12 QA/freeze. Re-audit if source changes or a new candidate is committed. This report grants no production release approval.
