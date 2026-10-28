# Navigation and drawer QA

See independent functional smoke: `FUNCTIONAL_NAV_QA.md`.

| Scenario | Result |
|---|---|
| Desktop render and S10 active route | PASS |
| Desktop pin/collapse and focus | PASS |
| Navigation search with non-diacritic input | PASS |
| Tablet drawer open and search | PASS |
| Tablet close button and Escape | PASS |
| Focus restoration and body scroll lock | PASS |
| Drawer viewport bounds / no horizontal overflow | PASS |
| Active ancestor selector | NOT_RUN (selector inconclusive; source logic present) |
| Direct routes/Back/Forward across all S01–S29 | NOT_RUN |
| Unauthorized search visibility / backend RBAC | BLOCKED |
