# Visual Defect Register — HN-WARRANTY-PARTS-UIUX-001

| Defect ID | Priority | State(s) | Finding | Evidence | Status / owner |
|---|---:|---|---|---|---|
| HN-WP-VIS-001 | P1 | explicit legacy routes | Approved historical cohort is explicitly reachable via `#/preview/S09?catalog=legacy` and `#/preview/S10?catalog=legacy`, with `data-catalog-mode="legacy"`. | `FINAL_RETEST_REPORT.md`; `final-retest-metrics.json` | **CLOSED** / S00#2 |
| HN-WP-VIS-002 | P1 | legacy Tablet S09/S10 | Tablet catalogue rows reflow into labeled cards; action controls are horizontally inside the 992 px viewport and remain 44 px high. | `screenshots/final/s09-legacy-tablet-list.png`, `s10-legacy-tablet-list.png` | **CLOSED** / S00#2 |
| HN-WP-VIS-003 | P1 | S09 detail | Operational S09 detail sections/timeline and focus restoration passed in the prior post-fix retest. | `screenshots/after/s09-operational-tablet-detail.png`; `after-retest-metrics.json` | **CLOSED** / S00#2 |
| HN-WP-VIS-004 | P2 | S10 detail | Internal identifiers and audit rows remain denser than the approved business-facing detail reference, although bounded. | `screenshots/after/s10-operational-tablet-detail.png`; `screenshots/final/s10-legacy-tablet-detail.png` | **OPEN** / S00#2 |
| HN-WP-VIS-005 | P2 | legacy S09/S10 | Historical fixtures render seven rows in this runtime while approved references show nine; data-density comparison remains incomplete. | `screenshots/final/s09-legacy-tablet-list.png`, `s10-legacy-tablet-list.png` | **PARTIAL / fixture gap** / fixture owner |
| HN-WP-VIS-006 | P1 | legacy Tablet S09/S10 | Previous right-edge action clipping is resolved by card reflow; all visible `Chi tiết` actions are horizontally within 992 px and 44 px high. | `final-retest-metrics.json`; `screenshots/final/*-legacy-tablet-list.png` | **CLOSED** / S00#2 |

No source files were edited during this retest. Credentials were not saved.
