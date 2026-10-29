# Route, component and API boundary

The router resolves `#/preview/S17`. `src/app/App.tsx` keeps the original `ReversalSlipsScreen` and business HTTP adapters as the default. Only the existing browser-preview opt-in `?reversalDesign=20261029` selects `src/features/S17/approved/ReversalDesignWorkspace.tsx`. Twelve view states are projections of that route, not 24 new routes. Final tested application source is `e7b145feb3d8ec4b42bb2ba8fa66bfb5b3d9bf2f`; local build `1bebecb3e20357207c7f6eb09c9ed987661c32c553451aeed3fe38a9f8b8b955`.

| Reference | Route view / setup | Owning implementation |
|---|---|---|
| REV-01 | `view=list` | workspace list, accepted filters, summaries, pagination |
| REV-02 | `view=choose` | source selector and wizard |
| REV-03 | `view=edit&id=REV-20261028-007` | draft form; filename phieu_nhap does not change original receipt |
| REV-04 | `view=review&id=REV-20261028-007` | review, confirmation dialog, post handler |
| REV-05 | `view=detail&id=REV-20261028-009` | posted detail |
| REV-06 | `view=detail&id=REV-20261028-008` | awaiting-return detail; no available-stock increment |
| REV-07 | `view=detail&id=REV-20261027-005` | cancelled detail |
| REV-08 | `view=impact&id=REV-20261028-009` | document-chain quantities, trace and known-only timeline |
| REV-09 | `view=blocked&id=REV-20261025-002` | dependency-blocked fixture |
| REV-10 | edit007, enter invalid reason/quantity, validate | field and summary errors |
| REV-11 | review007, local submit with `reversalOutcome=unknown` | durable operation journal and read-only status recovery |
| REV-12 | review007, local confirmed submission | exact local receipt, success, persisted detail |

These codes are reference fixture identities, not production defaults. Every capture uses an independent bounded `reversalScenario` namespace. App initializes the fixture adapter only after normal active authentication; its username/role/warehouse labels and scenario form a model-isolation key. They do not authorize a backend operation. Session-scope changes remount the workspace. Invalid scope fails closed.

`approved/adapter.ts` owns the isolated fixture sources, transitions, remaining-quantity calculation and fingerprints. `approved/durable-adapter.ts` uses a separate `hoa-nam-wms-reversal-design-v1:<encoded scope>` IndexedDB database with serialized read/compare/write transactions. It stores prepared intent before simulated commit, preserves request identity/input, uses expected model and scratch revisions, validates persisted identity and rejects corrupt state without reset. `status()` reads; explicit receipt acknowledgement writes recovery metadata. It never automatically repeats a posting command. Optional injected memory persistence belongs to tests. Credentials and canonical account/business state are not copied into this model.

`approved/presentation.ts`, `copy.ts` and `approved.css` own unit grouping, translations and bounded module layout. Shared `DatePicker`, `GlobalModal`, `PageState`, icons, shell, sidebar, Toast and Notification Center are reused without edits. Tablet list/impact fixes are scoped by `data-view` and module selectors.

There is no approved live generic partial inbound/outbound reversal DTO or server integration for these artwork views. Existing whole-unused warranty-parts return contracts, `src/data/http/operational-preview-adapter.ts`, repository commands and permission policy remain unchanged. No generic form is bridged into the old whole-return command. Original-document, stock and audit backend invariants are therefore BLOCKED for REAL_API, even where local model tests pass. See [business rules](BUSINESS_RULE_MATRIX.md), [transaction report](TRANSACTION_INTEGRITY_REPORT.md) and [RBAC report](RBAC_AUDIT_REPORT.md).
