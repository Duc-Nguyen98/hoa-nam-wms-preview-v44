# S00#2 pilot preflight and implementation checklist

- TASK_ID: S00-1-PILOT-20261027
- SCREEN/ROUTE: S01 `#/preview/S01`, S02 `#/preview/S02`
- STATUS: BLOCKED_DESIGN — preflight complete; implementation not started; not READY_FOR_QA.
- BRANCH / COMMIT: DEV / b287d1294f0aa37b1c38c14275ef8c0a279d4fcc
- Packet base: 36f3dc6e2a531db9d1c463f30248566d7d4556ae, verified ancestor of HEAD. Intervening committed changes are governance/reference inputs, not runtime implementation.
- Workspace: E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026. Migration receipt and current repository AGENTS supersede retired W: paths.

## Inputs and ownership

Read repository/parent AGENTS, pilot packet, S00#6 package, Design Contract, Component Spec, Source Register, Baseline Manifest, Design-to-Code Mapping, Design Gap Report, Quality Gates, Agent Ownership and Route Test Matrix.

Lease permits src/features/S01/**, src/features/S02/**, related contracts/adapters and scoped business tests. Shared shell, tokens, modal mechanics, toast, baseline documents, visual tests and functional-QA harnesses remain their owners' files. Existing uncommitted S00#6 documents/reference copies were preserved. This new implementation preflight is the only file added by this task.

## Source-backed behavior to preserve

| Surface | Existing contract | Boundary |
|---|---|---|
| S01 list | DEFAULT_OVERVIEW_QUERY uses four rows and September 2026; query changes reset page; table reset preserves period; unknown stock remains unknown | Current implementation fact, not resolution of DG-04 scenario/date approval |
| S01 document link | Accepted SOURCE_FIXTURE row, exact snapshotId/documentId and inbound S12/outbound S15 type required | No role grant inferred; unsupported target stays unavailable |
| S02 create | Required code/name, string description, active/inactive status; duplicate code comparison trims + NFC + uppercase | Preview canonical command, not production backend integration |
| S02 update/status | Saved code immutable; only name/description/status payload; expectedVersion and canonical entity coordinates | No delete or rename added |
| S02 recovery | Durable actor-bound journal; restore does not mutate; retry original request; acknowledge verified result | Preserve unknown outcome, conflict, denied and expired distinctions |
| S02 list | Normalized code/name search; current page-size option 15; filter/sort changes reset page | Do not broaden page sizes from artwork |

API status: MOCK / frontend and Preview HTTP contracts. Production API INTEGRATED and production RBAC are NOT_RUN/unproven.

## Implementation checklist before edits

- [x] Verify active path, branch, HEAD, packet-base ancestry and dirty-file ownership.
- [x] Read available design package and API/business contracts.
- [x] Identify shared consumers: GlobalShell, GlobalModal, filters, DateRangePicker, DataTable, Pagination and toast/Notice.
- [x] Identify S01 states: initial/refresh, list/detail, no records/no matches, error, unavailable target, forbidden/expired, copy success/failure, filter/sort/page and document navigation.
- [x] Identify S02 states: list/detail, create/update/status, required validation, dirty dismissal, pending/success/error/retry, stale version, replay, denied/expired, unknown outcome and query controls.
- [ ] Resolve S00#6 critical design decisions before runtime edits: DG-01/02 exact foundation and earlier shell artifact; DG-04 S01 profile/scenario/date/paging; DG-05 detail variant; DG-07/08 locale/theme/state presentation; DG-09 action-role presentation.
- [ ] Obtain S02 visual/state mapping (BL-S02-* is explicitly missing).
- [ ] S00#1 records implementation release/remaining bounded scope; serialize any shared-file change proposal with S00#6 review.
- [ ] Implement only released changes, reproduce concrete defects first, add scoped regression tests, then run typecheck/build/tests.
- [ ] Prepare actual/diff/geometry and independent functional evidence through S00#3/S00#4. Implementation ends READY_FOR_QA, never self-awarded Visual/Functional QA PASS.

## TEST_COMMANDS / TEST_RESULTS

Executed against the existing candidate on 2026-10-27 (no runtime edits):

- `npm run typecheck`: completed without diagnostics.
- `npm run quality:contract`: PASS, 13 states/26 references/immutable-source policy. This runner covers tray inputs, not S01 visual acceptance.
- `node --import tsx --test tests/overview-detail.test.ts tests/s01/document-navigation.test.ts`: 10 passed, 0 failed.
- Build, browser/console/a11y, visual comparisons, independent functional QA and production RBAC: NOT_RUN in this preflight.
- Dedicated S02 pilot tests are not yet supplied by this packet; current warranty/reversal suites reference S02 commands but do not establish full S02 acceptance.

## Handoff

FILES_CHANGED: this preflight document only.

FEATURES_IMPLEMENTED: none; preserve existing runtime while DESIGN_READY_BLOCKED is active.

KNOWN_ISSUES: package status DESIGN_READY_BLOCKED; missing S02 visual mapping; S00#6 inputs currently uncommitted; no new runtime defect proven by this preflight. Existing S01 unit checks pass but cannot substitute for acceptance.

VISUAL_REFERENCE_USED: registered BL-S01-D/T (HN_Astra 3/4) and BL-S01-DETAIL-D/T (5/6), page-component authority only. Registration reviewed; no visual comparison performed in this task. Sidebar/Menu/Header artwork is excluded; earlier approval remains intact.

HANDOFF_TO_VISUAL_QA: prepared, not dispatched; blocked assertions and immutable source IDs are in S00#6 mapping AC-01..12. S00#3 owns captures, measurements and verdict.

HANDOFF_TO_FUNCTIONAL_QA: prepared, not dispatched; existing S01 tests above are baseline evidence only. S00#4 must independently exercise S01 routes and the full S02 state/recovery/permission matrix on the implementation candidate.

Next required decision: S00#1/S00#6 close or explicitly bound the listed design gaps and release the implementation scope. No merge, push or deploy performed.
