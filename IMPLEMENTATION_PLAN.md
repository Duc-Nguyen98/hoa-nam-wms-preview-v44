# Design fidelity and zero-regression implementation plan

This plan preserves existing business logic and proceeds in verified phases. Each phase has an entry condition, bounded file scope, exit evidence, and a stop rule.

## Phase 1 — Audit (current)

**Scope:** repository instructions, design references, tokens, fixtures, CSS/component inventory, tests, scripts and CI discovery.  
**Allowed changes:** audit documents only.  
**Outputs:** `DESIGN_AUDIT.md`, `GAP_REGISTER.md`, this plan.  
**Exit:** the source hierarchy, open gaps, baseline inventory, and current test limitations are recorded.  
**Stop rule:** do not modify business code or snapshots if the source authority is ambiguous.

## Phase 2 — Design Contract

**Priority:** P0, before visual refactoring.

1. Create `DESIGN_CONTRACT.md` with source precedence: approved reference manifest → screen matrix → source-backed fixture/contract → confirmed shared tokens → explicitly marked implementation proposal.
2. Define token records for color, typography, spacing, grid, breakpoints, radius, shadow, icon and component variants. Each record must include status (`CONFIRMED`, `PROVISIONAL`, `DESIGN_GAP`), source, owner and change rule.
3. Create a reference manifest for the 13 tray states × Desktop/Tablet, including route, language/theme, viewport, DPR, expected state, source image checksum and evidence directory.
4. Create a component map for shell, modal, table, filters, pagination, form validation, notice/toast, drawer and icons. Map each to one owner and list allowed screen-local overrides.
5. Add a design-change rule: no baseline/token/reference update without Design Guardian approval evidence.

**Exit checks:** contract parses, every tray state has a reference entry, all unresolved values appear as `DESIGN_GAP`, and no business source file changes are required.

## Phase 3 — Agent ownership

Add `docs/quality/OWNERSHIP_MATRIX.md` with:

| Role | Input | Output | File scope | Acceptance |
|---|---|---|---|---|
| S00#1 | contract, matrix, QA reports | integration/release commits | app registry, shared integration, CI, docs | all gates green and evidence indexed |
| Design Guardian | approved references, contract | token/component decisions, approvals | contract, manifest, token governance | no unrecorded design assumption |
| S00#2 | screen contracts, fixtures | CRUD/adapters/functional tests | feature contracts, adapters, business tests | behavior and data invariants pass |
| Visual QA | references, actual captures | diffs, geometry/overflow reports | visual tests, evidence tooling | no unapproved visual regression |
| Functional QA | routes, role/state matrix | E2E/a11y/console reports | functional tests and gate config | critical failures block merge |

## Phase 4 — Automated quality gates

**Priority:** P0 after the contract exists.

1. Add portable npm scripts: `lint`, `test:unit`, `test:e2e`, `test:visual`, `test:a11y`, `test:runtime`, `quality:pr`.
2. Add a PR workflow using a clean checkout and Node version from the package engine. Upload reports and diffs as artifacts.
3. Add typecheck/build, component/unit, Playwright functional, visual comparison, responsive/overflow, console-error and accessibility checks.
4. Make critical failures block merge. Do not use snapshot update flags in CI.
5. Make all report paths repo-relative or CI artifact-relative; remove historical W: paths.
6. Add a baseline checksum and approval check before accepting any visual baseline change.

**Exit checks:** run `quality:pr` locally from E, then run the same workflow in CI; deliberately failing a critical test must fail the gate.

## Phase 5 — Pilot

Use S14 Putaway Orders as the pilot because the approved matrix already covers list data, search/status filtering, paging, detail, form validation, pending/stale/empty/permission states, and responsive dialogs. The pilot must produce the eight required artifacts for each state/viewport and include VI/EN/zh-CN plus light/dark interaction checks. S01 remains the shell smoke route and is not sufficient alone for the pilot.

**Exit checks:** reference, actual, diff, test, open-issue, evidence, commit/URL and PASS/FAIL/BLOCKED status are all present. Any missing artifact leaves the pilot `BLOCKED`.

## Phase 6 — Acceptance and handover

Expand the pilot gates to S11–S29 only after the pilot passes. Generate a release report containing commit hash, preview URL, test command/result, evidence index, open gaps by severity, rollback baseline and Design Guardian approval. Public release remains blocked by any P0 gap or unverified critical test.

## Priority order

1. Resolve E-path instruction conflict (`GAP-001`).
2. Formalize the design contract and reference manifest (`GAP-003`, `GAP-004`, `GAP-013`).
3. Make test/report paths portable (`GAP-009`, `GAP-010`).
4. Add PR quality gates and critical-failure blocking (`GAP-002`, `GAP-011`, `GAP-012`).
5. Add component/token governance (`GAP-005`, `GAP-006`, `GAP-007`).
6. Run the S14 pilot and publish evidence before broad rollout.

No phase may mark `PASS` from build output alone. Every acceptance state must cite its actual test result and evidence artifact.
