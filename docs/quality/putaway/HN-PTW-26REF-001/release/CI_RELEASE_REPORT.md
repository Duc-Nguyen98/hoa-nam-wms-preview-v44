# HN-PTW-26REF-001 — Git, CI and preview release audit

Owner: S00#5. Observation date: 2026-10-28 Asia/Bangkok. Checkout: `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`.

## Verdict: BLOCKED

Local checks pass, but release provenance is not releasable. The requested candidate is local `DEV` HEAD `bca3db9062c9246d1fe780fc9e52110128d40859`; public GitHub does not contain that SHA, so no exact hosted CI run or status can be attributed. The public preview manifest is MOCK and advertises historical source `d2547577f342402136f464d4cee3ff237f77bf99`, which differs from the candidate. Per packet rules, unavailable exact CI and mismatched preview provenance are BLOCKED. No push, merge, deployment, or credential collection was performed.

## Source identity and diff

- Branch is `DEV`; local HEAD equals the packet base SHA. Local `DEV` is three commits ahead of `github/DEV` (`bfec706`), all local-only until pushed.
- Candidate source diff against the requested base is empty (`src`, `tests`, package files, scripts, and workflows all unchanged relative to the base SHA).
- The checkout contains unrelated untracked task evidence and temporary discovery files; these were not included in source identity or release claims.
- Evidence: [exact-candidate-provenance.json](exact-candidate-provenance.json) and [source-diff-provenance.json](source-diff-provenance.json).

## Local validation

| Command | Result | Evidence |
|---|---|---|
| `npm run typecheck` | PASS, exit 0 | [local-typecheck.log](local-typecheck.log) |
| `npm run build` | PASS, exit 0 | [local-build.log](local-build.log) |
| `npm run test:putaway` | PASS, 4/4 tests | [putaway-tests.log](putaway-tests.log) |
| `npm run quality:pr` | NOT_RUN by this owner | The packet assigns broader functional/visual/RBAC gates to other owners. |

The local build emitted Vite's existing large-chunk warning. The generated local manifest reports build ID `425f6db063820c56a5ffc71ebaca2925e68a7977e8406c24f0351d8f21854838`, mode `MOCK`, and `publicDemo: true`.

## Hosted CI — BLOCKED

Read-only GitHub API checks were made against `Duc-Nguyen98/hoa-nam-wms-preview-v44` for candidate SHA `bca3db9062c9246d1fe780fc9e52110128d40859`:

- Commit lookup returned `No commit found for SHA` (HTTP 422).
- Commit workflow-runs response was empty.
- Combined status response was empty.
- No PR or exact run/check evidence exists for this SHA; hosted PASS cannot be inferred from local PASS.

The workflow definition has a dependent visual-and-functional job that intentionally exits 1 until a CI capture harness exists. That gate also remains unresolved if/when the candidate is pushed. Raw observation details are preserved in [exact-candidate-provenance.json](exact-candidate-provenance.json).

## Public preview provenance — BLOCKED

The canonical preview manifest was fetched successfully (HTTP 200) from [build-info.json](https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/build-info.json); route under audit is [S13](https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S13).

- Remote `sourceCommit`: `d2547577f342402136f464d4cee3ff237f77bf99`.
- Candidate SHA: `bca3db9062c9246d1fe780fc9e52110128d40859`.
- Remote build ID: `1d53c18c7ec915738ed7e60cd1c8d608c3b659fe664aefe5d116b9b90685424c`.
- Local build ID: `425f6db063820c56a5ffc71ebaca2925e68a7977e8406c24f0351d8f21854838`.

The source and build IDs do not match. The manifest's historical source claim cannot attest that the runtime serves this candidate or the putaway routes S13, S14, S11, and S14/history. Evidence: [preview-provenance.json](preview-provenance.json) and [preview-fetch.log](preview-fetch.log).

## Release handoff

Release remains BLOCKED pending a pushed candidate with an exact hosted CI record (including the visual harness gate), plus a deployment receipt or runtime manifest whose source SHA/build identity matches the candidate. This report grants no release, merge, or deployment approval.
