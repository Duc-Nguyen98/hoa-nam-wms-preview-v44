# Branching and merge policy

Task `S00-5-CI-RELEASE-20261027`. Policy proposal for S00#1 review; server enforcement is MISSING.

## Branches

| Branch | Purpose | Starting point |
|---|---|---|
| main | Owner-approved release and existing Pages docs | 7304ef8d27b5d3d091bda681cc1afcb36048c318 |
| DEV | Integration after all applicable gates | b287d1294f0aa37b1c38c14275ef8c0a279d4fcc |
| feature/<task-id> | Application feature packet | Current approved DEV |
| fix/<defect-id> | Scoped defect fix | Current approved DEV |
| test/<task-id> | QA tests and evidence | Packet base |
| chore/<task-id> | Tooling/governance | Packet base |

Do not create a second develop branch. Each packet records its base, head, file lease, acceptance criteria, references and evidence. Use separate checkouts for overlapping agents. Preserve unrelated work. No force push, history rewrite or force merge on shared branches.

## Proposed protection, main and DEV

- Require PR, at least one independent approval, dismiss stale approvals, require approval after the last push, resolve all review conversations.
- Required checks: `critical`, `visual-and-functional`, `release-readiness`, bound to GitHub Actions; require branch up to date. Validate actual emitted names/app IDs before applying.
- Enforce for administrators; disallow bypass, force pushes and deletion.
- Do not authorize automatic merge/deploy. main changes require Owner's release permission plus S00#1 readiness.
- Map S00#1/#3/#4/#6 to actual authorized GitHub reviewers before configuring CODEOWNERS. These identities are currently MISSING; do not invent accounts.
- Protect workflow/gate/baseline changes with independent governance review. A PR must not weaken its own checks. A receipt edited by a PR cannot authenticate reviewer approval.

No server settings were changed in this audit. Therefore this document does not prevent direct pushes; until protections are enabled and verified, readiness remains BLOCKED.

## Merge sequence

1. Draft PR to DEV with the template, full tested head SHA, immutable baseline checksum and artifacts.
2. S00#3 visual PASS, S00#4 functional/E2E/console/accessibility PASS on that head. S00#6 approves design changes when applicable; zero P0/P1.
3. CI required checks PASS on current head; independent review, no conflicts, current base verified. Re-run evidence after any source push; do not reuse stale reports.
4. S00#1 confirms readiness. Owner policy controls merge. S00#5 verifies actual merged tree/commit identity before any separately authorized deploy.
5. Promotion to main uses another reviewed PR; test the resulting release artifact and bind deploy to SHA. Current workflow tests the PR head, not a synthetic merge commit; up-to-date enforcement and resulting-tree verification are still required.

## Rollback

For an approved merged change, use a reviewed revert PR; never reset shared history. For a deployment, restore an identified known artifact only after Owner authorization and repeat URL/route/console checks. Historical Pages reference: main7304ef8 and run40286075297. An audit reference is not a certified healthy release point.
