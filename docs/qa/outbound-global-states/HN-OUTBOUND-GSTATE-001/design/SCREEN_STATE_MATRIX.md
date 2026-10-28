# Screen/state matrix — HN-OUTBOUND-GSTATE-001

| Screen / route | State | Reference | Desktop | Tablet | Entry / fixture | Expected controls | Acceptance owner |
|---|---|---|---|---|---|---|---|
| S15 `#/preview/S15` operational session | Populated list | REF-01 | Approved | — | Valid `OperationalSnapshot`, one or more rows | Refresh, search, status filter, reset, inspect, footer | S00#3 visual / S00#4 behavior |
| S15 operational session | Compact card | REF-02 | — | Approved | Same populated snapshot; no card disclosure | Copy, status, recipient, expand/detail CTA | S00#3 visual / S00#4 keyboard |
| S15 operational session | Expanded card | REF-03 | — | Approved | Same row as REF-02 after recipient disclosure | Address/contact/request/lines/serial, collapse/detail CTA | S00#3 visual / S00#4 keyboard |
| S15 operational session | Detail modal | REF-04 | Approved | — | Selected row held by epoch/scenario/generation fence | Copy codes, refresh, close; receive/post only when eligible | S00#3 visual / S00#4 focus/RBAC |
| S15 operational session | Detail modal | REF-05 | — | Approved | Same semantic row at portrait profile | Stacked sections, copy, refresh, close | S00#3 visual / S00#4 focus/RBAC |
| S15 list | Loading | REF-06 top-level loading panel | Candidate | Candidate | No snapshot + `busy` | No action while busy; shell remains reachable | S00#3 / S00#4 |
| S15 list | Empty | REF-06 top-left | Candidate | Candidate | Valid snapshot, zero rows, no query/filter | Read/refresh | S00#3 / S00#4 |
| S15 list | No-results | REF-06 top-middle | Candidate | Candidate | Valid snapshot, query/filter zero rows | Clear filters | S00#3 / S00#4 |
| S15 list | Load error | REF-06 top-right | Candidate | Candidate | Read failure, no snapshot | Retry/read; no stale private rows | S00#3 / S00#4 |
| S15 detail/list | Forbidden | REF-06 bottom-middle | Candidate | Candidate | Permission failure | Close/overview only; no command | S00#4 RBAC |
| S15 detail | Record not found | REF-06 bottom-right | Candidate | Candidate | Row removed or fence changed | Return to list | S00#4 |
| S15 list/detail | Stale/reconcile | No direct panel (contract variant) | Candidate | Candidate | Pending/unknown durable command or stale version | Reconcile same operation, then refresh | S00#4 |
| S15 detail | Confirm receive/post | No direct panel (modal variant) | Candidate | Candidate | Eligible `SUBMITTED`/`READY` row | Cancel/execute; command copy differs | S00#4 |

**Profile note:** “Approved” identifies reference authority, not a validated CSS viewport. Raster dimensions are recorded in `REFERENCE_MANIFEST.md`; each visual capture must declare viewport, DPR, browser, theme, locale and fixture.

**REF-02/03 rule:** capture both as sequential states on one Tablet profile. Do not compare REF-03 against a separate breakpoint or classify it as a second route.
