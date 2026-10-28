# PTW-01 Business Invariant Matrix

Evidence sources: locked packet `docs/agent-handoffs/HN-PTW-26REF-001.md`, `docs/tray-approved/IMPLEMENTATION_MATRIX.md`, `src/contracts/operational-preview.ts`, S13/S14 bindings, S11 projection and history contract. A frontend fixture or screenshot is not business authority by itself.

| ID | Invariant | Required behavior | Source/trace | Status |
|---|---|---|---|---|
| BI-01 | Draft creation is non-mutating | `putaway.create` creates one DRAFT with captured BOX version/content and no BOX→TRAY mapping, location change or stock event | Packet invariant; `operational-preview.ts` payload; `putaway-create-binding.ts` | CONFIRMED |
| BI-02 | Confirmation is whole-BOX | Confirmation maps the complete BOX to one selected eligible tray; partial quantity is not accepted | Packet; S13 copy/selection; `putaway-binding.ts` accepted proof | CONFIRMED |
| BI-03 | Confirmation is stock-neutral | Successful confirmation changes BOX location/mapping only; total inventory quantity remains unchanged | Packet; `OperationalPutawayOrders` copy; accepted proof checks | CONFIRMED |
| BI-04 | One effective mapping | Only a successful `putaway.confirm` may create the effective BOX→TRAY mapping; create/cancel/failure do not count | Packet; S11 `tray-binding.ts` filters CONFIRMED putaways | CONFIRMED |
| BI-05 | Stale version/content fails closed | Expected version, epoch/scenario/generation and captured content revision are checked; reread is required before retry and captured content is not silently rewritten | `putaway-binding.ts`; S13 selection fence; REF-11 | CONFIRMED |
| BI-06 | Duplicate command protection | Busy/recovery/accepted sequence prevents duplicate submit; replay must reconcile proof before another write | `createPutawayBinding`, `createPutawayBinding`; REF-10 | CONFIRMED |
| BI-07 | Unknown outcome is recoverable, not success | Unknown/recovery state disables mutation and requires check-pending/retry evidence | Binding messages and recovery state; REF-10 | CONFIRMED |
| BI-08 | Cancelled/failed operation exclusion | Cancelled or failed orders do not create mappings or successful history rows | Packet; `PutawayData.status`; history action/result contract | CONFIRMED |
| BI-09 | Tray projection is derived and scoped | S11 shows configured trays and BOXes whose confirmed mapping, warehouse, catalog, receipt and ledger links all validate; no capacity/inventory inference | `tray-binding.ts`; `trays.ts` comment; REF-03/09 | CONFIRMED |
| BI-10 | Current quantity vs captured quantity | S11 uses current ledger quantity; S14 detail exposes quantity at create and current BOX balance separately | `OperationalTrays`, `OperationalPutawayOrders`; REF-07/09 | CONFIRMED |
| BI-11 | Eligible tray rule | Confirmation choices require active tray and active valid location in the same warehouse; no eligible tray disables confirmation | `availablePutawayTrays`; REF-08/12 | CONFIRMED |
| BI-12 | History scope and date policy | History scopes data before count/page; tray history uses Asia/Ho_Chi_Minh, no future date and max 90-day past window | Contract §responsive/date; `PutawayHistoryScreen`; REF-04 | CONFIRMED (exact boundary wording still CR) |
| BI-13 | History permission isolation | Missing history grant returns 403/denied state on direct route/refresh with no rows or count leak; authorized return goes to S14 | Matrix row 13; `PutawayHistoryScreen`; REF-13 | CONFIRMED |
| BI-14 | Query/paging semantics | Search/filter/sort scope is applied before pagination; query changes reset to page 1; visible counts reflect filtered scope | recovered shared rules; S13/S14 controllers; history adapter contract | CONFIRMED for preview contract |
| BI-15 | State distinction | Loading, empty, no-results, stale, error, unknown outcome and forbidden remain distinct; no visual state is inferred from missing rows | `PageState`/`ReadState`, bindings, REF-10–13 | CONFIRMED |
| BI-16 | Locale/theme/text expansion | VI/EN/zh-CN and light/dark are required QA dimensions; no typography shrinking to fit translated content | locked design contract §responsive/locale | DESIGN_GAP (S01/putaway capture evidence missing) |
| BI-17 | Route reachability | Base S13/S14/S11/history routes resolve; post-create order deep link must resolve or be removed/documented | `App.tsx`, `OperationalPutawayQueue` | DESIGN_GAP |
| BI-18 | Authorization is caller-owned | UI reflects caller-authorized visibility/disabled/read-only/denied states; frontend presence does not grant permissions | design contract RBAC rule; adapter comments | DESIGN_GAP (REAL_API/RBAC not run) |
