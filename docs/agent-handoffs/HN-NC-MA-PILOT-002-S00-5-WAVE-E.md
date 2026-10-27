# HN-NC-MA-PILOT-002 — Wave E / S00#5

Owner: S00#5. Coordinator: S00#1. Date: 2026-10-27 UTC+07.
Authorization: Owner's REMEDIATION ORDER pasted into S00#1, attachment aa0610a3-7931-4b4b-ba21-6aa3378f835c; Wave E explicitly delegated by S00#1. This supersedes the prior pilot's waiting-for-oke condition for this remediation scope.

Branch: chore/s00-5-ci-release-governance; draft PR #1 to DEV.
Governance base: 70dff89468eaac8ca71e2169d90a0fb33a216398.
Runtime base / current remote DEV at audit: b287d1294f0aa37b1c38c14275ef8c0a279d4fcc.
Parent pilot evidence: fbd5b3cd11a8d5ecb7fb40cf7bce7d7ba0ea3646 on chore/s00-1-notification-pilot; nine required pilot artifacts read through the primary checkout's Git object database. Initial network fetch failed DNS; no source change resulted.

Lease: .github/workflows/quality-pr.yml; scripts/ci/build-provenance.mjs and its test; scripts/ci/github-audit.mjs; scripts/ci/verify-hosted-build.mjs; docs/release-governance/HN-NC-MA-PILOT-002/**; this packet. Existing pilot evidence and shared S00#1 readiness are preserved. No application, reference, other-agent test, package, billing, secrets, protection, merge or deployment changes.

## Change and acceptance

- Add build sidecar bound to actual Git HEAD/tree, explicit expected candidate SHA, clean source worktree (including nonignored untracked files), and sorted built-file SHA-256/size inventory. Reject stale SHA or dirty/unknown source; fail if built index absent.
- Keep trust explicit: local/workflow metadata is UNATTESTED. The sidecar does not sign an artifact or prove hosted commit identity.
- Upload sidecar beside actual dist artifact in existing critical job. Existing release gate remains fail-closed and does not accept self-edited approval receipts.
- Add negative controls; verify local build and provenance on final committed head. Exact full head/commands/log hashes go in the PR handoff receipt; initial delta transcripts are labeled as such.
- Refresh billing/protection/reviews/hosting observations into a new evidence namespace. Report MISSING/NOT_RUN/BLOCKED honestly.

## Handoff / integration

Report: docs/release-governance/HN-NC-MA-PILOT-002/CI_RELEASE_READINESS.md.
Local receipts: output/HN-NC-MA-PILOT-002/wave-e/ (including final validation receipt).
Final commit and real Actions run identifiers are recorded in PR #1 after push. No self-referential committed SHA is fabricated.

S00#1 integrates through reviewed PR and revalidates on the resulting application candidate; do not cherry-pick QA PASS from an earlier head. Runtime fix/design/functional gates remain with their owners. Rollback of this unmerged proposal: leave DEV/main unchanged; close or supersede the draft only through an explicit coordination decision. If later merged, use a reviewed revert, never reset shared history.
