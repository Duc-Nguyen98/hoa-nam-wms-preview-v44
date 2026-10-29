# Business / contract audit — HN-INVENTORY-32REF-001

Owner: S00#2 business audit (read-only source inspection)  
Branch: DEV · baseline: `57b9f399a55d41d43ecad7a31e1b279da2cda717`  
Date: 2026-10-29 · input: approved `PROMPT_S00-1.md` and `IMAGE_INDEX.md` in the supplied 32-image folder.

## Existing architecture and 16-state map

The approved image numbers are design state IDs, not existing S routes. No 16-route requirement is inferred. The safest module host is S16 with context-preserving SKU/BOX/tray details and reconciliation/history tabs; any new subroute needs explicit registration and scope-safe IDs. Existing S11/S20/S21 remain compatibility paths.

| State | Real architecture / data owner | Available today | Contract / implementation gap |
|---|---|---|---|
| 01 Inventory lookup | S16 `InventoryScreen` → `OperationalInventory` / `inventory-binding.ts`; legacy `InventoryAdapter` | Ledger rows joined to SKU/Product at one epoch/revision; search SKU/name. Legacy four-row searchable/sortable/paged list | No BOX search, warehouse/location filters, reserved or available contract on operational path; approved nine-row fixture is new |
| 02 SKU overview | S16 operational inventory `GlobalModal` with `InventorySelection` | SKU/warehouse/unit/ledger, exact epoch/scenario/generation selection fence; related events | No on-hand/held/available or location allocation overview DTO; existing selected quantity must stay ledger-labelled |
| 03 BOX allocation | Existing `OperationalReports.trace` + S11 `tray-binding.ts` | BOX identity, SKU, unit, source receipt/line, confirmed tray/location joins, canonical event balance | No S16 allocation panel/route or pagination/filter query; new read projection required |
| 04 BOX detail | Canonical trace, receipt, BOX and putaway records; S26 related trace path | Identity, source and signed events exist in MOCK snapshot | No exact S16 BOX detail/deep-link contract; no reservation/count fields; do not infer join by display code alone |
| 05 Tray detail | S11 `OperationalTrays` / `tray-binding.ts` / `GlobalModal` | Exact tray→location and BOX→SKU→receipt→confirmed-putaway mapping. BOX/SKU counts are distinct-object counts | S16 contextual link/back navigation absent. Existing approved tray fixture differs from KH-001 sample; do not overwrite it |
| 06 Movement / trace | S20 `OperationalMovementLedger` / `movement-ledger-binding.ts`; S16 detail events; S26 trace | Immutable event, timestamp, document ID/code, SKU, BOX/physical identity, unit, signed quantity and actor; 90-day period validation | Approved running balance/stock-after and item context projection must be verified; S16 legacy history tab currently unavailable. Document links require exact target/authority |
| 07 Current reconciliation by SKU | S16 legacy has onHand−ledger comparison; S21 period stock has actual/difference null operationally | Current canonical ledger and unit-scoped balances only | **No physical-count/reconciliation source, reconciliation ID, snapshot version or multi-warehouse scope contract.** Separate fixture DTO needed; never substitute legacy semantics |
| 08 Difference by BOX | New context from 07 + canonical BOX identities | BOX grouping foundation exists | Counted quantity and immutable comparison snapshot are missing. Preserve reconciliation ID/snapshot/warehouse/unit through SKU→BOX; root cause remains Unknown |
| 09 Reconciliation history | No existing reconciliation history store/route | S14 has putaway history, S27 audit; neither is reconciliation history | **API BLOCKED** for saved reconciliation IDs, history permission, snapshot/scope/filter/pagination and record retention. Do not repurpose putaway/audit history |
| 10 Saved result detail | New read-only immutable result projection | General report pin/hash pattern in `operational-reports.ts` can guide design | No saved reconciliation record or snapshot retrieval endpoint. Never join historical counts to current live quantities |
| 11 Loading | shared `PageState`, `ReadState`, `InitialReadState` | Loading skeleton, busy semantics; source controllers fence superseded reads | S16/S11/S20/S21 bindings currently clear accepted models at refresh. Approved refresh-context behavior needs deliberate state-contract work, not simply passing `hasData` |
| 12 Empty | S16 operational `PageState kind="empty"` after valid zero-row snapshot | Empty differs from no-results | HN04 is a new scoped fixture case, not an existing real warehouse or permission assumption; no unauthorized inbound CTA |
| 13 No result | S16 operational `PageState kind="no-results"` + reset | Search retains text and supports reset; legacy list adapters return ready zero-row models | ZX-999 can safely test current search; approved warehouse/location queries need new DTO support |
| 14 Load error/retry | Shared error mapper + existing read bindings | Errors clear unverified data; reload button available; session expiry fenced | Need browser failure/retry capture and distinction from valid zero results. Error must not stamp a successful updated time |
| 15 Forbidden history | Shared `PageState kind="forbidden"`, `readFailureKind` | MOCK service rejects absent/wrong/unconfirmed/expired actor before repository read | No production reconciliation-history permission key or role matrix. A fixture denial is UI evidence only; absent implementation is not Forbidden |
| 16 BOX not found | Shared `record-not-found` / stale-selection patterns | S16/S11 selections reject changed epoch/scenario/generation | New BOX read outcome needs exact contract: missing/inaccessible/stale ID behavior, scope fencing and context-preserving return |

## Confirmed business gaps and invariants

1. `src/contracts/inventory-reconciliation.ts` explicitly identifies itself as a frontend fixture model, not a backend DTO. It has a single `warehouse: 'Kho Hoa Nam'`, `onHand`, `ledger`, `available`, and `difference`; legacy adapter verifies `difference = onHand − ledger`. This cannot be relabelled as the approved `counted − system` comparison.
2. `OperationalInventoryRow` intentionally exposes `quantity`, `actual:null`, `difference:null`. No reservation/held balance or physical-count source appears in the operational contract. Production availability must not be fabricated as zero held or ledger minus an invented reservation.
3. Canonical quantities are keyed by SKU, warehouse and unit. Never sum different units. BOX count and distinct SKU count in S11 are object counts. A tray may contain multiple BOX/SKU; each BOX joins one SKU and source line.
4. Existing tray setup/confirmation is stock-neutral. `pinOperationalReports` validates event population/proofs. Opening, refreshing, history browsing and allocation must not execute stock or putaway commands.
5. No stored reconciliation result, warehouse authorization matrix, reconciliation permission enum or production reconciliation API exists in inspected contracts. `BUSINESS_RESOURCES` supplies local integration paths (`inventory`, `trays`, `reports/movements`, `reports/inventory`); their presence does not certify a deployed backend. Operational adapter explicitly requires `mode='MOCK'`.
6. `stock-report-binding.ts` pins immutable period reports and supports existing XLSX behavior. Preserve that authorized behavior on its report path; do not add exports/adjustments to new reconciliation panels from image artwork alone.
7. Shared history/report date policy is Vietnam calendar time, no future date, today-minus-90 inclusive, start≤end. A saved snapshot is an immutable result, not automatically invalid just because it is older than the query window; use a source-backed exception/read contract if needed.
8. Existing normal preview setup is additive (approved tray seed). Do not remove the 27 BOX / 18 orders / nine confirmed mapping records to force nine screenshot rows.

## Safe Candidate fixture approach

Use one separately owned read-only inventory fidelity model/adapter and explicit source identity. Mount it inside the authenticated app/S16 composition through an approved preview adapter seam; do not patch auth status, route guards, account provider, session state, or insert a screenshot-only shell. No `Mock`/`Demo` product banner is required by this prompt; QA metadata must state `MOCK` and `API BLOCKED`.

Define fixture warehouse IDs HN01/HN02/HN03 and scoped empty HN04, SKU IDs, BOX IDs, tray IDs, location IDs, unit, and immutable reconciliation snapshot IDs independently of existing repository records. Relationships must use stable IDs, not code-string joins. A denied history fixture must return no row counts or snapshot data. Read failures must be errors, not successful empty models.

Required fixture consistency: HN-DRV-001 totals 120 on-hand / 20 held / 100 available across nine distinct locations; BOX001–003 are 20/5/15, BOX004 10/5/5, BOX005–009 10/0/10. Counts sum 118 against the same 120 system snapshot, difference −2; only BOX001 is 20/18/−2. KH-001 detail contains exactly its one linked BOX. The nine-SKU reconciliation population contains 3 match, 3 shortage and 3 surplus across HN01/HN02/HN03. Dây tín hiệu is 1,200−200=1,000. History detail must retain stored quantities when live data changes. Tests should verify these independent arithmetic/relationship invariants before screenshots.

## API / RBAC disposition

**API INTEGRATED: NOT_RUN. REAL_API RBAC/Data Scope: BLOCKED.** The browser-local authenticated MOCK authority is a session/scenario fence, not a multi-warehouse production permission grant. Required backend inputs: inventory/reservation definitions; warehouse/tenant scope and query contracts; BOX/tray detail outcomes; counted/snapshot/reconciliation models; saved history identity and immutable result retrieval; permission keys and QA actors; direct-route/API/ID/warehouse denial behavior. Continue approved independent UI fixture work while retaining these blockers.
