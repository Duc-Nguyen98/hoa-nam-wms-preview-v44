# Quality-system ownership matrix

| Role | Inputs | Outputs | File scope | Acceptance criteria |
|---|---|---|---|---|
| S00#1 — Technical Lead / Orchestrator | contract, matrix, QA reports, release state | integrated change, release report, rollback reference | app registry, shared integration, workflow, quality docs | all required gates have fresh evidence; no P0 gap open |
| Design Guardian | approved references, token inventory, component map | `DESIGN_CONTRACT.md`, manifest, token decisions, baseline approvals | contract, reference manifest, design governance docs | every design assumption is CONFIRMED, PROVISIONAL, or DESIGN_GAP |
| S00#2 — CRUD / data owner | screen contracts, fixture policy, adapter behavior | CRUD implementation, adapters, business tests | owning feature contracts/adapters and business tests | state transitions, quantity invariants, scope and replay tests pass |
| Visual QA | reference manifest, running preview, viewport matrix | actual captures, diffs, geometry/overflow reports | visual tests, capture/compare scripts, evidence artifacts | no unapproved visual regression; source images untouched |
| Functional QA | route/role/state matrix, running preview | E2E, a11y, console, responsive and regression reports | functional tests and gate configuration | critical failures block merge; evidence includes command and result |

## Handoff rules

- Each role owns its output and may not silently change another role's baseline or business contract.
- S00#1 integrates only artifacts with commit/evidence references.
- Design Guardian approval is required for token, reference, icon, typography, baseline or locked-geometry changes.
- Visual and Functional QA report `BLOCKED` when a required reference, route, role, or test environment is unavailable; they do not infer PASS.
