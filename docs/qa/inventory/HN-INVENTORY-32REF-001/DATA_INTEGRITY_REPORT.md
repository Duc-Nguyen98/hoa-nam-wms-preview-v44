# Data contract and integration status

Candidate source: `3f8cf44ac531d72d50a42003cafecf6d726085ca`. Environment **MOCK**, read-only fixture adapter. Backend integration and backend RBAC are **BLOCKED**, not INTEGRATED or REAL_API_PASS.

## Verified fixture facts

`functional/fixture-contract-round1.tap` and `functional/round2/unit-regression.tap` execute independent assertions. Nine SKUs span HN01/HN02/HN03: three match, three short, three over. DRV actual120 − held20 = available100; count118 − actual120 = −2. BOX001–003 each20/5/15; BOX00410/5/5; BOX005–00910/0/10. BOX001 count18, other BOX counts unchanged. WIR1200 −200=1000. KH001 contains only BOX001. No assertion treats one BOX as one unit of stock.

Snapshots have separately frozen row/BOX copies. Independent injected-adapter testing changed live actual to240 while saved actual/count remained120/118; saved variance stayed−2. This verifies frontend snapshot isolation, not database immutability. Invalid and out-of-scope detail identifiers must reject; related edge retests are recorded in the independent functional report.

Baseline browser reads preserved the complete canonical operational snapshot at revision69. Reading the Candidate creates no mutation API. Actual source-adapter behavior and remaining coverage are detailed in [business audit](functional/BUSINESS_CONTRACT_AUDIT.md) and [independent QA](functional/INDEPENDENT_FUNCTIONAL_QA_ROUND1.md).

## Missing authoritative integration

No approved backend contract was found for held reservations, counted-stock runs, historical snapshot identity, warehouse/BOX reconciliation scope authorization, or real server retry/loading/error behavior for this design. Existing on-hand vs ledger differences are not counted-stock variance. Candidate movement records are deterministic fixture events, not a claim of an integrated backend audit trail.

Required integration work: define/read authoritative endpoints and field semantics; map quantity precision/unit/timezone; validate snapshot stability and server-side scope; test role-specific accounts, stale/partial refresh and errors against the permitted staging backend. No fixture result can satisfy those gates.

The final adapter explicitly declares allocation coverage. Only DRV has complete BOX coverage in this fixture. Missing population for PSU and the other SKUs displays Unknown/unavailable in allocation counts/totals and BOX variance; its known SKU340/50/290 is preserved. Explicit complete coverage with an empty BOX population remains a legitimate zero allocation. Coverage arrays are frozen and copied into snapshots, not shared live metadata.

