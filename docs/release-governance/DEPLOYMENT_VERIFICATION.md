# Deployment verification — read-only audit

Task `S00-5-CI-RELEASE-20261027`; checked 27 October 2026 (UTC+07). No deployment performed by this packet.

## Identity and status

| Host | Observed identity | Result |
|---|---|---|
| [Pages](https://duc-nguyen98.github.io/hoa-nam-wms-preview-v44/) | main `7304ef8d27b5d3d091bda681cc1afcb36048c318`, /docs; [run40286075297](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/actions/runs/40286075297) success | Existing historical v44 deployment; current DEV not deployed here |
| [v44 report](https://duc-nguyen98.github.io/hoa-nam-wms-preview-v44/review/DOCUMENT_FLOW_VISUAL_COMPARISON.html) | Rendered report states source `af8148d248048fa3a2319428774a38425fd76288`, build `4e35396cfaf3fe9287cb468c4e15ed2cc46754b7c19b717c93071ff62110f7ea` | Historical evidence, not current candidate QA |
| [Canonical Site](https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S01) | buildId `1d53c18c7ec915738ed7e60cd1c8d608c3b659fe664aefe5d116b9b90685424c` | Matches local base buildId, exact source commit binding still BLOCKED |
| DEV candidate | `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc` | Build succeeds; CI and acceptance blocked |

Both hosts' build-info.json advertise sourceCommit `d2547577f342402136f464d4cee3ff237f77bf99`, inherited from SOURCE_PROVENANCE.json rather than the build checkout SHA. Pages build-info advertises buildId `29feff1f7ea16e52e6fc26d225b8332598baf1c621327bd3c0d7a4db2aa6ac24`, differing from its rendered v44 report. Do not infer exact current deployment commit from this metadata. Fixing application build provenance requires a separate scoped packet.

## Smoke scope

`node scripts/ci/hosting-smoke.mjs` uses clean Desktop1920×1080 and Tablet800×1280 sessions. Six URL visits (Pages S01, Pages report, Site S01) returned HTTP200 with no observed pageerror, console error, request failure or HTTP>=400 during initial navigation. App routes resolve to login, as expected without an authenticated session. The report renders and its links are collected. Screenshots and raw observations: `output/s00-5/hosting/` and `hosting-smoke.json`; concise records are retained in `evidence/`.

This verifies initial reachability only. No authenticated S01 → source document route, create/update flow or complete accessibility audit was executed by this smoke. S00#3 reported public initialization P1 VQ-001; clean-page reachability does not resolve it. Full navigation and post-login console/network gates remain BLOCKED/NOT_RUN.

`node scripts/ci/verify-hosted-build.mjs` separately downloads each advertised asset and compares SHA-256/size. Its immutable observation is retained in `evidence/hosted-build-verification.json`. Manifest consistency and exact candidate identity are separate requirements; a matching manifest alone does not authenticate the source SHA.

Observed: Pages 44/51 assets MATCH, 7 MISMATCH (font text/provenance/license files, favicon, release page, review HTML). Site 13/15 MATCH, index.html and release.html MISMATCH. JS/CSS bundles match advertised hashes on both hosts. Line-ending normalization and hosting HTML injection may explain some differences; that explanation has not been accepted as an integrity policy. Record exact-byte verification as BLOCKED, not PASS; preserve these results for the implementation/deployment owner.

## Release/rollback controls

No new build was published, no Pages settings changed, no hosting credentials modified. Historical rollback reference: main7304ef8, Pages run40286075297; this is an observed deployment point, not full health certification. Canonical Site release ID/rollback API is not available in this packet: MISSING.

For a later authorized preview, record actual deployment ID/SHA/buildId, independently hash served assets, test authenticated critical routes at required profiles, inspect console/network, then record rollback artifact. Mark DEPLOYED only after status and live URL verification. Production remains prohibited without Owner approval and S00#1 readiness.
