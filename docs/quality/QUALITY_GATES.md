# Quality gates

Version: 1.0.0
Owner: S00#1 / S00#5
Reviewer: S00#6 for visual changes; S00#4 for functional gates

## Required gate states

Every gate is one of `PASS`, `FAIL`, `BLOCKED`, or `NOT_RUN`. `NOT_RUN` never counts as PASS. Any P0/P1 defect or critical FAIL blocks merge and release.

| Gate | Local command/evidence | Required result |
|---|---|---|
| Typecheck | `npm run typecheck` | PASS |
| Build | `npm run build` | PASS |
| Contract/reference integrity | `npm run quality:contract` | PASS on a clean checkout with tracked reference inputs |
| Component/business tests | packet-scoped `node:test`/`tsx` command | PASS with report |
| Critical E2E | S00#4 packet command | PASS; current SHA recorded |
| Visual | S00#3 reference/actual/diff bundle | PASS with approved baseline checksum |
| Responsive/overflow | browser geometry report | PASS at required profiles |
| Console | pageerror/console report | zero unexpected errors |
| Accessibility | automated report plus keyboard checks | no critical violations |
| CI | GitHub workflow on PR and DEV | required checks complete |

## Current implementation status

The local `quality:pr` command currently covers typecheck, contract validation, build and four putaway tests. The notification visual harness has historical evidence (22/24 plus 5/5), but two failures remain open and it is not the S01/CRUD pilot. The CI visual-and-functional job is intentionally blocked until a real preview/capture harness is wired; its placeholder failure is not a test PASS.

## Baseline policy

Source references are immutable. A baseline change requires S00#6 approval, old/new SHA-256, visual diff, reason, reviewer and the candidate commit. No `--update-snapshots` operation is allowed in CI.
