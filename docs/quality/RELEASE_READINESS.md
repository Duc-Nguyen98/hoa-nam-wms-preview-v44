# Release readiness

Candidate runtime: `DEV` at `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`.
Evidence integration branch: `chore/s00-1-notification-pilot` (pending commit).
Preview URL: `https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S01`
Reviewer: S00#1
Status: `BLOCKED`

## Evidence checklist

- [x] Working tree clean at audit start.
- [x] Typecheck/build and scoped putaway tests passed on the runtime candidate (`quality:pr`).
- [x] Reference manifest and 26 approved PNGs are tracked in the candidate commit under `output/tray-approved/reference/`.
- [x] Current SHA functional pilot report: 8/8 browser cases and 12/12 S02 contract/integration cases; full gate remains blocked by missing scenarios.
- [ ] Current SHA S01 visual reference/actual/diff bundle; public clean-session setup remains P1-blocked.
- [ ] Current SHA S01 critical E2E and responsive/overflow report; required profiles remain incomplete.
- [ ] Current SHA accessibility and console report.
- [ ] P0/P1 defect register clear.
- [ ] GitHub DEV branch protection and required checks enabled.
- [ ] Live deployment identity matches candidate SHA; hosted source metadata is stale/mismatched.

No public release or `DONE` claim is permitted until every unchecked item is evidenced or explicitly approved as out of scope.
