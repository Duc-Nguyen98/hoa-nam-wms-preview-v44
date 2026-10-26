# CI and release report

Owner: S00#5
Verdict: **BLOCKED — READY_TO_MERGE not granted**

- Draft PR: [#1](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/pull/1), tested governance head `70dff89468eaac8ca71e2169d90a0fb33a216398`.
- Local governance checks: quality/build/typecheck/contract, putaway `4/4`, unit `21`, fail-closed controls `17`, isolated browser `5/5` PASS.
- GitHub Actions run was blocked before runner execution by account billing lock; this is not CI PASS.
- `main` and `DEV` have no branch protection or required checks.
- GitHub Pages serves historical `main` v44; candidate DEV is not proven deployed at the preview URL.
- Hosted asset comparisons show byte mismatches and stale source metadata; exact candidate identity is BLOCKED.
- No merge, deployment, protection, secret or production mutation was performed.

Detailed handoff: S00#5 `docs/release-governance/` packet in the draft PR.
