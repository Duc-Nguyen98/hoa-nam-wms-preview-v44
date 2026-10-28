# CI and release audit — HN-WARRANTY-PARTS-UIUX-001

Audit date: 2026-10-28 (Asia/Bangkok)  
Owner: S00#5 Release / CI  
Checkout: `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
Branch: `DEV`  
Candidate source SHA: `7ac520aecc2f38231e6be9b118105ed8e91ee5b7`

## Git ownership and provenance

The worktree was clean at audit time (`git status --short --branch` reported only `DEV...github/DEV [ahead 11]`). The candidate commit contains the S09/S10 source and QA documentation. No deployment, push, reset, or source edit was performed by this audit. The branch is eleven commits ahead of `github/DEV`; this is local branch state, not proof of a remote PR or CI run. The task packet still records the earlier registration SHA `93371f4...`; that is historical evidence and must not be used as the release SHA.

## Local gate evidence

| Gate | Command / evidence | Result |
|---|---|---|
| TypeScript | `npm run typecheck` | PASS (exit 0) |
| Contract/reference | `npm run quality:contract` | PASS — 13 states, 26 references, immutable source policy |
| Production build | `npm run build` | PASS (Vite 8.3.3; 618 modules; exit 0). Vite emitted a non-blocking >500 kB chunk warning. |
| S09/S10 binding | `npx tsx --test tests/warranty-parts/s09-operational-binding.test.ts tests/warranty-parts/s10-operational-binding.test.ts` | PASS — 15 tests observed in the run; prior packet evidence records 22/22 focused tests. |
| Public demo flow | `npx tsx --test tests/warranty-parts/public-demo-flow.test.ts` | PASS — 2/2, 82.1 s |
| Browser/visual/functional CI harness | repository reports | BLOCKED/NOT_RUN for fresh candidate certification; browser harness has navigation-context and stale-selector failures, and no CI capture service is wired. |

The committed QA reports contain additional visual and functional evidence, but those captures were local preview evidence and mostly reference the pre-commit or uncommitted retest state. They do not establish hosted CI acceptance for this SHA.

## Workflow and hosted CI limitations

`.github/workflows/quality-pr.yml` runs `quality:pr` on pull requests and pushes to `main`/`DEV`. Its `critical` job covers typecheck, contract, build, and the putaway test suite. The dependent `visual-and-functional` job deliberately exits 1 with a message that the preview server/capture harness is not available. Therefore any GitHub Actions run using this workflow is expected to be red until that harness is implemented; a green critical job cannot be treated as complete release certification. No PR check run, required-check configuration, or remote commit status was available in this checkout.

## Hosted Site observation

The canonical URL in the task packet, [hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site](https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site), responded HTTP 200 during this audit. Its public `/build-info.json` also responded 200 and reported release `HN-B17-PUBLIC-CANDIDATE-20261024.2`, `mode: MOCK`, `publicDemo: true`, build ID `eef02039dbaabea7807ebd88ec9f2869871cb9009043b809796c48064a13e163`, and source commit `93371f4da9b6659d320a7c66d9b0862f89744a0d`. That hosted source does not equal candidate `7ac520ae...`; the Site is therefore stale relative to this candidate. Local `SOURCE_PROVENANCE.json` also carries an older source commit (`d2547577...`), so the local generated build-info is not a reliable candidate provenance record until the provenance input is updated by its owner.

## Release blocker

Release is `BLOCKED` for this candidate. The hosted Site is not proven to serve the candidate SHA, the required visual/functional CI job is intentionally failing, and fresh browser acceptance is unavailable. Do not label the public URL as this candidate or approve rollout until the deployment metadata and required checks are tied to the exact candidate SHA.
