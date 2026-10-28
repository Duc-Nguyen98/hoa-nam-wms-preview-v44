# PTW-01 Component and Route Mapping

Base `bca3db9062c9246d1fe780fc9e52110128d40859`, branch `DEV`. Mapping is source discovery only; it does not approve unverified CSS or backend contracts.

| Reference/state | Route | Screen/root owner | Data/controller or binding | Modal/state owner | Shared components | Acceptance notes |
|---|---|---|---|---|---|---|
| REF-01 eligible queue | `#/preview/S13` | `S13/PutawayQueueScreen.tsx` | Legacy `createPutawayQueueController`; operational `createOperationalWebAdapter(scope:S13)` + `S13/putaway-create-binding.ts` | `OperationalPutawayQueue` owns selection fence, read/recovery, pagination and `TrayDialog` create flow | `GlobalShell`, `CatalogueNavTabs`, `DataTable`, `CatalogueToolbar`, `Pagination`, `StatusBadge`, `Notice` | 9 coherent eligible BOX rows; whole BOX only; create action is operational-cohort owned |
| REF-02 order list | `#/preview/S14` | `S14/PutawayOrdersScreen.tsx` | Legacy `createPutawayOrdersController`; operational `createOperationalWebAdapter(scope:S14)` + `S14/putaway-binding.ts` | Legacy `PutawayOrderDetail` owns read-only selected-row native dialog; operational `OperationalPutawayOrders` owns details/editor `GlobalModal`s | `GlobalShell`, tabs, `DataTable`, filters, `Pagination`, `StatusBadge`, `Notice` | Status/source filters, order/BOX/receipt identity, paging |
| REF-03 tray list | `#/preview/S11` | `S11/TraysScreen.tsx` → `OperationalTrays` | `S11/tray-binding.ts` reads setup masters, BOX trace, catalog and pinned report | `OperationalTrays` owns selection token and `GlobalModal` detail; return focus resolved to originating row | `GlobalShell`, `DataTable`, `CatalogueNavTabs`, `FilterInput`, `StatusBadge` | Derived BOX/SKU counts; current ledger quantities; no tray capacity inference |
| REF-04 authorized history | `#/preview/S14/history` | `putaway/PutawayHistoryScreen.tsx` | `data/http/putaway-history-adapter.ts`; fixture reader is preview-only | No modal; route component owns loading, filter, empty, read failure and forbidden state | `GlobalShell`, tabs, `TrayPaging`, `TrayEmpty`, `StatusBadge`, `Button` | Scope/filter before count/page; Asia/Ho_Chi_Minh policy remains locked for tray history |
| REF-05 create confirmation | S13 state | `OperationalPutawayQueue` | `createPutawayCreateBinding`; selection captures epoch/scenario/generation, BOX version | `TrayDialog` (`TrayUi.tsx`) title/description/footer; focus returns to create origin | `GlobalModal` through `TrayDialog`, `TrayFields`, `TrayInfo`, `PageState` | Creating records DRAFT only; no tray selection, location or stock change |
| REF-06 create success | S13 state | `OperationalPutawayQueue` | accepted sequence and `putaway.create` outcome | second `TrayDialog`; closes to origin, links to order route | `TrayStatus`, `TrayFields`, `TrayInfo` | One accepted order; no repeat create while recovery/busy; “unselected tray” is explicit |
| REF-07 confirmed detail | S14 state | `OperationalPutawayOrders` (operational) or `PutawayOrderDetail` (legacy) | `putaway-binding.ts` reads captured/current versions and content revisions | Details modal is read-only until DRAFT editor action is chosen | `GlobalModal`/native dialog, `DataTable`, `StatusBadge` | Confirmed row exposes tray/location and captured/current quantities/versions |
| REF-08 draft validation | S14 state | `OperationalPutawayOrders` | `refreshPutawayEditor`, `availablePutawayTrays`, `save` | Editor `GlobalModal`; confirmation disabled without tray; validation text retains input | `GlobalModal`, `Button`, `ReadState`, `PageState` | No partial BOX; required tray and active location are validated |
| REF-09 tray detail | S11 state | `OperationalTrays` | `resolveTraySelection`; `tray-binding` verifies links and computes balances | `GlobalModal` detail body/footer; bounded table/card projection | `GlobalModal`, `DataTable`, `PageState`, `StatusBadge` | Nine BOX projection is derived from confirmed mapping and current ledger events |
| REF-10 confirming | S14 state | `OperationalPutawayOrders` | `createPutawayBinding.save` busy/recovery/accepted sequence | Editor modal disables controls during command and unknown-outcome recovery | `GlobalModal`, `ReadState`, `Button` | Exactly one commit proof; duplicate submit is locked |
| REF-11 stale/conflict | S14 state | `OperationalPutawayOrders` + `putaway-binding.ts` | fence/version/content-revision assertions; refresh preserves captured editor values | Existing modal displays reread/recovery message; no silent rebasing | `ReadState`, `GlobalModal`, `TrayInfo` where used | Must reread before retry; stale content remains visible |
| REF-12 no eligible tray | S14 state | `OperationalPutawayOrders` | `availablePutawayTrays` returns none | Editor modal keeps confirm disabled and shows no-tray message | `GlobalModal`, `PageState`, `Button` | Empty tray state is distinct from forbidden/error |
| REF-13 permission denied | `#/preview/S14/history` | `PutawayHistoryScreen` | Adapter/HTTP 403 mapped to `PUTAWAY_HISTORY_FORBIDDEN`; route direct/refresh supported by `App.tsx` | No modal; forbidden page owns return link | `GlobalShell`, lock `Icon`, primary link | No rows or count leak; authorized route returns to S14 |

## Ownership constraints

- `App.tsx` owns route selection only; it does not own putaway business transitions.
- S13 creation is owned by `putaway-create-binding.ts`; S14 confirmation/cancel/recovery is owned by `putaway-binding.ts`; S11 is read/projection-only through `tray-binding.ts`.
- `GlobalModal` owns focus trap, Escape/backdrop close, body scroll lock and return-focus mechanics. `TrayDialog` may add scoped class/copy only.
- `DataTable`, pagination, tabs, notices, shell and status badges remain shared owners. Feature code supplies columns, query semantics and state copy.
- `PutawayHistoryScreen` is the only owner of the S14 history page and must not reuse S20 movement history.
- Backend endpoint/DTO/permission contracts are not confirmed by frontend shapes. Do not promote fixture values or source comments into API authority.

## Route risks requiring a design/implementation decision

1. `OperationalPutawayQueue` emits `${orderRoute}/order/{id}` after creation, while `App.tsx` only dispatches the base S14 hash route in the discovered switch. Direct order-detail deep-link behavior is therefore **DESIGN_GAP** until the route parser/owner is documented.
2. S13/S14 have legacy and operational cohorts with different visual roots. The approved state images do not identify the cohort; capture evidence must freeze the selected data source before comparison.
3. The exact shell/backdrop shown in the references is not independently registered; preserve the approved shell owner and raise a change request for any chrome discrepancy.
