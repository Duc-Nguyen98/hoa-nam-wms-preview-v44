# Global state design contract — HN-WARRANTY-PARTS-FIDELITY-001

**Reference status:** `GLOBAL_STATE_REFERENCE_AVAILABLE`  
**Inherited standard:** [`HN-OUTBOUND-GSTATE-001/design/GLOBAL_STATE_DESIGN_CONTRACT.md`](../../outbound-global-states/HN-OUTBOUND-GSTATE-001/design/GLOBAL_STATE_DESIGN_CONTRACT.md)  
**Scope:** shared state semantics for S09 warranty cases and S10 parts slips. This contract does not invent new state artwork.

The repository already owns a shared `PageState` component and `InitialReadState`; the prior Outbound Global State packet is the available visual/semantic standard. S09/S10 must preserve that standard's distinctions and action semantics. A missing S09/S10 visual panel remains `DESIGN_REFERENCE_MISSING`, not a reason to synthesize one.

## State vocabulary

| State | Meaning | S09/S10 presentation requirement | Permitted action |
|---|---|---|---|
| `loading` | Initial list/detail read is in flight and no usable snapshot exists | Keep route shell; show neutral loading treatment through shared state owner | No destructive action while busy |
| `empty` | Valid snapshot has zero records and no active query/filter | Empty document treatment with route-specific copy | Read/refresh when supplied |
| `no-results` | Valid snapshot exists but search/status/date filter yields zero rows | Search/no-results treatment; do not relabel as empty | Clear filters |
| `error` | Read failed and no trustworthy snapshot is available | Error tone/copy through shared state owner | Retry/read again |
| `forbidden` | Actor lacks permission | Permission treatment; never imply records are absent | Close or return to authorized overview |
| `unauthorized` | Session expired or authentication unavailable | Auth-expired treatment; do not expose stale private records | Sign in/overview |
| `stale` | Snapshot or command outcome cannot be trusted | Reconcile/refresh treatment while preserving safe context | Check/reconcile, then refresh |
| `record-not-found` | Selected S09/S10 row is absent or fence changed | Record-specific not-found detail treatment | Close/return to list |
| `ready/populated` | Valid snapshot with one or more records | Table or cards according to declared route/cohort/profile; statuses and actions remain source-backed | Search, filter, inspect, refresh |
| `detail` | Selected valid row is open | Shared modal/dialog mechanics; fields limited to source projection | Copy/refresh/close where supplied |

`error`, `forbidden`, `unauthorized`, `stale`, `empty` and `no-results` are distinct semantic states even when they share visual primitives. Status color, badge text or screenshot copy cannot be used as a command or permission authority.

## Route-specific mapping

| Route | List state owner | Detail state owner | Source-backed limits |
|---|---|---|---|
| `#/preview/S09` legacy | `WarrantyCasesScreen` → `InitialReadState`/`DataTable` (`emptyStateKind="no-results"`) | `WarrantyDetailDialog` | Identity/date/status/age fields are available; timeline, diagnostics, defect relation and related documents are unavailable in current row contract. |
| `#/preview/S09` operational | `OperationalWarranty` → shared `PageState` for loading/read failure/not-found | guarded operational detail | Session/fence and permission failures remain distinct; do not project legacy artwork fields into operational records. |
| `#/preview/S10` legacy | `PartsSlipsScreen` → `InitialReadState`/`DataTable` (`emptyStateKind="no-results"`) | `PartsSlipDetail` | Summary fields are available; component-line and related-document data are explicitly unavailable; actor/reason/created-at are not in `PartsRow`. |
| `#/preview/S10` operational | `OperationalPartsIssues` → shared `PageState` for loading/read failure/not-found | guarded operational detail/tables | Operational line/event data is source-backed only when present; permission/stale outcomes fail closed. |

## Invariants

1. Use `GlobalShell`, shared dialog/modal mechanics, `PageState`, `DataTable`, controls, pagination, badges, tokens and icon ownership already present in the repository. Do not copy the Outbound state artwork or add a parallel state component.
2. A populated list may be table or card only after route, cohort, interaction state and capture profile are declared. BH-07 versus BH-12/BH-14 remains unresolved; the contract does not choose a Tablet breakpoint.
3. S10 sparse/enriched detail is a visual variant question, not a global state. Do not encode actor/reason/created-at as `ready` data unless an approved source projection supplies them.
4. `record-not-found` is distinct from `empty` and `no-results`; a selected row disappearing must not become a zero-row list message.
5. Loading, retry, reconcile, forbidden and unauthorized actions must preserve focus, dialog semantics, keyboard operation and the shared minimum 44 CSS px target.
6. Artwork values are illustrative evidence only. They cannot change API fixtures, permissions, date policy, business transitions or source DTOs.

## Gate

Global-state semantics are **REFERENCE AVAILABLE / CONTRACTED** through the prior Outbound standard. S09/S10 exact state visuals are **NOT_RUN** where no direct reference exists; this packet records `DESIGN_REFERENCE_MISSING` rather than inventing a panel.
