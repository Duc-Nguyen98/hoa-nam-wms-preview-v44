# S27 implementation receipt

Owner: S00#2. Task: HN-S27-UIUX-005. Workspace: `E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026`. Branch/base: DEV / `bde0e4292ae4a7db569c7a5d56bce0c7ffa8e703`. Source edits released explicitly by S00#1 after BEFORE custody closed. Requested supported Sol/high escalation for audit integrity; actual model telemetry UNVERIFIED; GPT-6.1 Terra unavailable. No subagents spawned.

## Status

**READY_FOR_INDEPENDENT_QA**, source edits frozen for coordinator integration. These local results concern the uncommitted source candidate recorded in `implementation/source-hashes.json`; coordinator must supply the integrated candidate SHA to independent QA. No commit, push, baseline update, provider/schema/source-fixture modification or deployment performed by this owner. Exact design fidelity remains BLOCKED by the registered design authority gaps.

## Changes and rationale

| Defect | Repair | Files |
|---|---|---|
|S27-F002 / P1|Preserve `pinOperationalReports` complete canonical population gate. Replace each-audit-equals-entire-batch event equality with exact per-audit event membership and completeness: canonical stock changes linked through that audit's FK IDs or primary document. Validate uniqueness, canonical proof event/audit enumeration, same epoch, actor, command, commit, timestamp and scenario/generation; retain entity/version/FK validation. A legitimate batch subaudit retains only its own IDs; command audit retains all its linked IDs.|`src/features/S27/audit-operational-binding.ts`|
|S27-F001 / P2|Remove preview-specific 25Oct default. `currentAuditPeriod` uses actual runtime Vietnam calendar date and is shared by UI initialization and reader default. DatePicker uses the same shared Vietnam date policy. User-selected period survives explicit reload/focus refresh; source event dates do not drive the picker.|binding, `OperationalAudit.tsx`|
|V02|Restore desktop information band with reference text “Mã sự kiện, mã lệnh và mã commit nằm trong chi tiết.” and information icon; EN/ZH translations remain within S27. Tablet band remains absent.|`OperationalAudit.tsx`, `audit-ui-copy.ts`, `system-audit.css`|
|V03|Set font on tablet action/trace child `code` elements whose inherited parent font was ineffective. Values are PROVISIONAL, not approved numeric tokens.|`system-audit.css`|
|V04|Add tablet event information column separators and separate bordered copy buttons, retaining 44 CSS pixel targets.|CSS|
|V05|Compact tablet footer padding and pagination minimum height. Preserve page-size selector, page navigation, totals and all behavior; 44 CSS pixel controls retained.|CSS|
|V06|Remove desktop copy target's 36 pixel override; target is 44 pixels.|CSS|

## Integrity evidence

New `tests/s27-audit-integrity.test.ts` supplies an isolated canonical two-entity batch and command audit, never imported by production. It verifies immutable output and source preservation, valid per-entity subsets and complete command-wide relationships. Negative cases cover missing/duplicate/unknown/other-commit/unrelated same-batch event IDs, missing FK linkage, mismatched proof enumeration, canonical audit tampering, actor/command/time/entity/version/scope/FK mismatches and stock-event relationship metadata. Midnight tests compare current default against DatePicker date policy and prove historical user period preservation. Existing state tests retain race, rollback, pin, refresh, ordering, query, versions and immutable relationships coverage.

This is a source projection repair; screenshot IDs were not reconstructed and the source's canonical records remain authoritative. Unsupported module filtering remains unavailable.

## Local verification

| Command | Result |
|---|---|
|`npm run typecheck`|PASS|
|`node --import ./tests/s27/css-hook.mjs --import tsx --test tests/s27-audit-integrity.test.ts tests/s27-audit-state.test.ts tests/s27-audit-presentation.test.ts`|PASS: 18 tests, 18 pass, 0 failures|
|`git diff --check`|PASS|

The first direct `npx tsx --test ...` invocation failed loading an existing shared CSS import from state tests; the repository's existing CSS hook was required. Initial test mutation typing errors were corrected before the successful typecheck. No tests suppressed. Runtime source repair count: one per confirmed root cause; no runtime retry cycle performed here.

## Remaining gates / limitations

- Independent Visual/FQA on coordinator's exact candidate SHA: NOT_RUN by this owner; delegated owners must report independently.
- Build, impacted shared regression, contract gate, hosted CI and deployed SHA: coordinator/release-owned or NOT_RUN here.
- Original CSS viewport/DPR, unpublished numeric tokens and missing complete reference source snapshot remain DESIGN_GAP; no exact visual acceptance claimed.
- Runtime today 27Oct can correctly produce empty data while preview source business events remain 26Oct. Selecting 26Oct uses the real DatePicker; no source clock or hardcoded date was changed.
- Four runtime files and one new test file changed. `implementation/runtime.patch` records runtime changes; `implementation/source-hashes.json` records all five exact source/test file hashes.
