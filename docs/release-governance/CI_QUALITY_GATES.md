# CI quality gates

Task `S00-5-CI-RELEASE-20261027`; base DEV `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`.
Authority: `docs/quality/QUALITY_GATES.md` owned by S00#1. This packet proposes implementation; it does not amend shared acceptance criteria.

## Workflow

`.github/workflows/quality-pr.yml` runs for PRs to main/DEV, pushes to those branches and manual dispatch. Read-only contents permission, bounded timeouts, cancellation of superseded runs. PR jobs check out the full head SHA. No deployment step.

| Job / gate | Command or evidence | Local result | Remaining scope |
|---|---|---|---|
| Dependency installation | npm ci --include=dev | PASS | Linux Actions NOT_RUN due billing |
| Typecheck / contract / build | npm run quality:pr | PASS | Build warning for large JS chunk; not a failure |
| Putaway | Same command | 4/4 PASS | Scoped tests only |
| Unit / component | tsx tests listed in workflow | 21/21 PASS | Not whole-repository regression |
| Fail-closed controls | node --test scripts/ci/release-readiness.test.mjs | 17/17 PASS incl parent suite | Synthetic controls; no QA approval |
| Browser | playwright with .github/playwright.ci.config.ts | 5/5 PASS | Isolated Notification harness only |
| Lint | No configured script | MISSING/NOT_RUN | S00#1 to define applicability and owner |
| Full critical S01/CRUD E2E | S00#4 packet | MISSING/current-head NOT_RUN | Existing isolated suite does not substitute |
| Visual regression | S00#3 approved reference/actual/diff | BLOCKED | Public initialization P1 and design gaps |
| Responsive / console / a11y | Full product at all required profiles | NOT_RUN on governance head | Focus/geometry harness and login reachability are supplemental |
| CI execution | Real Actions required jobs | BLOCKED | Account locked due billing |
| Release readiness | node scripts/ci/release-readiness.mjs | BLOCKED, expected exit1 | Missing authenticated approvals/evidence integration |

Local evidence transcripts are retained in `evidence/`. Exact final-head validation receipt and head SHA accompany the draft PR. Local execution does not certify Linux CI.

## Artifact behavior

`critical` always uploads logs, checked-out source-sha.txt and available dist build under `critical-<head SHA>`. Browser job uploads JSON, HTML, screenshots and failure traces/videos under `browser-<head SHA>`. Readiness uploads its JSON under `readiness-<head SHA>`, including diagnostics after an upstream failure. Jobs do not update snapshots or delete defect evidence. Logs must be checked when install or an earlier step fails; missing artifacts never count as PASS. Billing may prevent every step, including uploads.

## Evidence receipt contract

Default input: `docs/release-governance/release-evidence.json` (absent until authentic evidence is provided). Candidate SHA comes from workflow, not the receipt. Required fields:

- `commit`: full 40-character candidate SHA.
- `gates`: typecheck, build, contract, unit, criticalE2E, visual, responsive, console, accessibility, ci. Each has `status: PASS`, matching `commit`, and nonempty `artifacts: [{path, sha256}]`.
- Paths are relative to checkout, cannot escape through traversal/absolute paths/symlinks; files must exist and SHA-256 must match.
- `openP0: 0`, `openP1: 0`, explicit boolean `designChanged`.
- `approvals`: S00#1, S00#3, S00#4, and S00#6 when designChanged; each has APPROVED, matching commit and an evidence reference.

The pure evaluator returns EVIDENCE_STRUCTURALLY_VALID only for structurally consistent evidence. This is not READY_TO_MERGE. The CLI additionally blocks because authenticated reviewer/evidence retrieval is not wired. It always exits nonzero in this proposal, preserving the existing release blocker while providing useful diagnostics. A self-edited receipt is never trusted as approval.

Next implementation requires S00#1-approved reviewer identity mapping and trusted external QA artifacts keyed by current SHA, fetched with checksum/provenance verification. Do not commit a self-referential receipt to declare PASS: committing it changes the candidate. Avoid circular dependence by checking prerequisite CI jobs before the release decision, then validating the final completed workflow independently. These integrations remain MISSING.

The previous unconditional browser placeholder is replaced by real scoped browser execution plus a separate release blocker. This does not make the full visual/functional gate PASS. Enable proposed server required checks only after S00#1 reviews this distinction. No automatic deployment, billing workaround, gate bypass or production-secret changes are provided.
