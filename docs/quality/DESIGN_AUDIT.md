# Design audit — Hoa Nam WMS

Date: 2026-10-26  
Scope: `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
Audit mode: read-only; no business code, fixture, or snapshot was changed.

## Executive result

The repository has a strong source-backed visual foundation, but it does not yet have one enforceable design contract or a pull-request quality gate. The approved tray reference set is identifiable and complete for its stated scope, while the broader application still mixes confirmed tokens with provisional screen CSS and historical guidance. The current release is buildable and has targeted tests, but a full zero-regression acceptance result cannot be claimed until the missing gates and evidence are added.

## Repository and instruction inventory

- The active application repo is on `main` at commit `feea1fe25ab55e3dfaf39b30942e47f5a6135778`.
- `E:\WMS_HoaNam\Scanner_CMS\AGENTS.md` is the nearest workspace instruction. It still names the old `W:\` workspace and old migration paths; this is a documentation/configuration conflict with the current E workspace and is recorded as `GAP-001`.
- The application repo has `docs/tray-approved/IMPLEMENTATION_MATRIX.md` and `docs/tray-approved/RELEASE_REPORT.md`. There was no repository-level design contract, gap register, audit, implementation plan, or PR workflow before this audit.
- The source contains 31 feature directories (`S01`–`S29` plus `documents` and `putaway`), shared components, contracts, preview fixtures, i18n, and operational adapters.
- The CSS inventory contains 68 files. A static scan found approximately 1,570 color literals and 8,753 `px` literals; these are audit indicators, not automatic defects. Many are feature-specific or state-specific and require mapping before consolidation.
- A static declaration scan found 39 screen declarations, 42 modal/global-modal usages, and 1,871 shared token references. This indicates reuse exists, but the mapping is not yet machine-enforced.

## Single Source of Truth

For the approved tray work, the strongest available design authority is:

1. `output/tray-approved/reference/PROMPT_S00-1.md` — user-approved scope and normalization rules.
2. `output/tray-approved/reference/Desktop/` and `Tablet/` — 26 reviewed PNG references covering 13 states at the two locked capture profiles.
3. `output/tray-approved/reference/DANH-MUC-ANH.json` and `README.txt` — reference manifest and provenance.
4. `docs/tray-approved/IMPLEMENTATION_MATRIX.md` — screen/state ownership, required evidence, viewport and interaction contract.

For the existing shared shell, the authority is the source-backed contract described in `src/shared/README.md`, `src/shared/tokens.css`, and the referenced S00/S01 evidence under `output/`. `src/data/fixtures/DESIGN_FIXTURE_SNAPSHOT.json` is the data/design fixture authority for screen summaries and records; it explicitly records where detail completeness and production matching are unresolved.

The authority is therefore **scoped**, rather than one file for the whole product. Phase 2 must formalize this precedence and link every screen to a reference manifest.

## Confirmed versus provisional design decisions

Confirmed or source-backed values include brand/control colors, shell widths, header heights, 44px minimum target, approved tray normalization, the 13-state reference inventory, and the stated Desktop 1920×1080 DPR1 / Tablet 800×1280 DPR2 capture profiles. The shared token file marks the foundation contract explicitly.

Provisional or unresolved values include several neutral colors, spacing/radius choices not traced to a reviewed source, technical breakpoints, exact icon/logo provenance outside the supplied approved assets, and font provenance where the shared README still describes fallback behavior. These must remain `DESIGN_GAP` items until evidence closes them; they must not be silently promoted into approved tokens.

## Component and CSS findings

- Shared primitives exist (`GlobalShell`, `GlobalModal`, `DataTable`, `Pagination`, `FilterInput`, `FilterSelect`, `Notice`, `DatePicker`, token files), but the repository has no component mapping table connecting each approved reference element to exactly one implementation owner.
- Multiple feature CSS files repeat colors, spacing, control, table, modal, and state rules. `dark-theme.css`, `premium-dark.css`, `unified.css`, `wave4-*`, `s00-*`, and feature CSS overlap in scope. This is a risk of cascade drift, not proof that every literal is wrong.
- Screen-local modal and form styles are present alongside shared modal/control primitives. These need an owner and allowed-override table before refactoring.
- Hard-coded literals are not currently classified as confirmed, provisional, state semantic, or intentional geometry. A token lint rule is absent.
- Existing CSS comments identify one confirmed foundation contract, but there is no `DESIGN_GAP` annotation convention or CI check for unapproved design assumptions.

## Baseline and screen coverage

The tray-approved matrix defines 13 states: queue, orders, tray list, history, create confirmation/result, confirmed detail, validation, pending confirmation, stale conflict, empty tray, and unauthorized history. Each has Desktop and portrait Tablet references. It also requires VI/EN/zh-CN, light/dark, responsive, overflow, focus, and interaction evidence.

The current release report records build/typecheck, four putaway tests, setup smoke data, and local browser QA. It does not provide a repository-wide per-state reference/actual/diff bundle, computed geometry report, accessibility report, console-error report, or CI result. S01 data fixtures also explicitly mark production matching as unverified and aggregate-only detail as incomplete.

## Test and delivery system

- `npm run typecheck` and `npm run build` exist and have passed for the current release.
- Playwright is installed and there are targeted browser/unit suites under `tests/`, including tray, notification, reference audit, S01, S15, warranty, reversal, and visual suites.
- There is no general `test`, `lint`, `e2e`, `visual`, `a11y`, or `ci` npm script in `package.json`.
- There is no `.github/workflows` PR workflow in the repository.
- The notification configs write reports to historical `W:\` paths, which conflicts with the E workspace and makes portable CI evidence impossible without a path-neutralization change.
- There is no merge-blocking policy, snapshot approval record, baseline checksum manifest, or critical-test classification.

## Audit conclusion

The codebase is suitable for incremental quality-system work and should be preserved. The highest-risk changes are governance and evidence plumbing: formalizing source precedence, separating confirmed tokens from provisional values, making reference manifests machine-readable, and adding path-neutral, merge-blocking quality gates. Business logic should remain untouched while these controls are introduced.
