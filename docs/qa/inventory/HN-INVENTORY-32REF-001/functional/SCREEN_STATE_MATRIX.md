# Inventory state matrix

Final source `3f8cf44`, static build `ec7027a6`; MOCK fixture implementation. PASS means the bounded frontend/fixture behavior below, not a production API or RBAC certification. Full provenance and execution counts: [final report](INDEPENDENT_FUNCTIONAL_QA_FINAL.md).

| Approved state | Outcome | Functional evidence / boundary |
|---|---|---|
| 01 Stock lookup | PASS | Nine rows; BOX/SKU/name search, warehouse/location projection, sorting, reset; Desktop1920, Tablet800 and stock action768 probes |
| 02 SKU overview | PASS | Known actual/held/available; DRV complete allocation; PSU unavailable BOX/TRAY counts |
| 03 BOX allocation | PASS | Nine coherent DRV BOX; unknown coverage separate from legitimate complete-zero; injected12-row pagination |
| 04 BOX detail | PASS | Exact BOX004 identity and one scoped movement; invalid IDs do not fall back |
| 05 Tray detail | PASS | KH001 joins BOX001 exactly; return context preserved |
| 06 Movement | PASS | BOX/type/date/query filters; future-date validation; no-match/reset |
| 07 Current reconciliation | PASS | Match/short/over3/3/3; DRV counted−actual−2; HN04 empty |
| 08 Difference by BOX | PASS | Nine DRV BOX, source/warehouse fences; PSU unknown current/saved coverage |
| 09 Reconciliation history | PASS / backend BLOCKED | Date90-day range, search/warehouse/result filters, localization, scope navigation; real history permission unavailable |
| 10 Saved result | PASS / backend BLOCKED | Immutable source/date, result tabs9/3/3/3 and zero-tab/reset; injected live change does not rewrite saved values |
| 11 Loading | PASS | Shared semantic panel, no rows or false successful timestamp; VI/EN/ZH × light/dark |
| 12 Empty | PASS | Valid HN04 empty and direct scenario; six locale/theme combinations |
| 13 No results | PASS | Retains search; reset local movement/saved filters; six locale/theme combinations |
| 14 Error/retry | PASS / real network NOT_RUN | Persistent failure remains failure; injected failure then success; six locale/theme combinations |
| 15 Forbidden | PASS UI / RBAC BLOCKED | Shared forbidden history panel, no sensitive metrics; six locale/theme combinations; fixture denial is not server authorization |
| 16 BOX not found | PASS UI / backend NOT_RUN | Unknown-ID fence and contextual BOX panel; six locale/theme combinations |

State components use the shared semantic PageState within the opted-in S16 feature. The default S16/S11/S20/S21 operational bindings and their ReadState/GlobalModal contracts remain compatibility paths; the initial [business audit](BUSINESS_CONTRACT_AUDIT.md) maps their source architecture. New detail navigation uses feature routes, explicit return context and heading focus rather than assuming the legacy modal selection contract.

| Cross-cutting item | Outcome |
|---|---|
| Normal MOCK login and expired session fence | PASS; ordinary login, clock+9h past existing8h lifetime |
| Canonical operational stock/events/versions | PASS; exact before/after revision69 equality |
| Default S16/S11/S20/S21 compatibility | PASS; observed11/9/35/11 rows and eight after screenshots |
| Focus/back/scroll | PASS; short viewport scroll657→657 and heading focus |
| Clipboard | PASS; exact normal and long injected code |
| Selected text contrast | PASS final samples; full AA audit NOT_RUN |
| Locale/state combinations | PASS36/36 on final static build |
| Narrow400px layout simulation | FAIL P2 clipping; auto-scroll click still opens detail; approved768/800 pass |
| Actual browser zoom / screen reader | NOT_RUN |
| Production APIs, backend RBAC and roles | BLOCKED |
