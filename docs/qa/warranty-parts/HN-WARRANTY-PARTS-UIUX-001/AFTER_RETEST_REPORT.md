# After Retest Report — HN-WARRANTY-PARTS-UIUX-001

**Retest source:** current uncommitted DEV worktree after the warranty/parts UI changes. No source files were edited during this retest.

**Runtime:** `http://127.0.0.1:5292`, Chromium Playwright, VI/light, Tablet 992×1586 CSS, DPR 1. Evidence: [`after-retest-metrics.json`](after-retest-metrics.json) and [`screenshots/after`](screenshots/after).

## Results

| Route/state | Result | Evidence |
|---|---|---|
| `#/preview/S09` operational list | PASS for Tablet card reflow; one visible case card and visible `Xem` action are inside the viewport; document overflow is false. | `screenshots/after/s09-operational-tablet-list.png` |
| `#/preview/S09` operational detail | PASS for bounded section cards and processing timeline; modal 944×1026.78 CSS px, document overflow false, close returns focus to `Xem`. | `screenshots/after/s09-operational-tablet-detail.png` |
| `#/preview/S10` operational list | PASS for Tablet card reflow and visible action; document overflow is false. | `screenshots/after/s10-operational-tablet-list.png` |
| `#/preview/S10` operational detail | PASS for bounded modal and controls; modal 944×1538 CSS px within 1586 px viewport, document overflow false, close returns focus to `Chi tiết`. | `screenshots/after/s10-operational-tablet-detail.png` |
| `#/preview/S09?catalog=legacy` | REACHABLE; `data-catalog-mode=legacy`, seven historical rows render. The table remains wider than the Tablet frame and the sortable “Tiếp nhận / Hạn” control is clipped at the right edge. | `screenshots/after/s09-legacy-tablet-list.png`, `s09-legacy-tablet-detail.png` |
| `#/preview/S10?catalog=legacy` | REACHABLE; `data-catalog-mode=legacy`, seven historical rows render. Several `Chi tiết` actions sit beyond the 992 px viewport because the catalogue remains table-shaped. | `screenshots/after/s10-legacy-tablet-list.png`, `s10-legacy-tablet-detail.png` |

## Runtime evidence

- Captures: 8 (operational S09/S10 list + detail and explicit legacy S09/S10 list + detail).
- Console/page errors: 0. Failed network requests: 0.
- Document horizontal/vertical overflow flags: false for all eight captures.
- Operational visible actions and controls were inside the viewport. S09 and S10 detail close actions restored focus to their opener.
- Explicit legacy routes are now proven reachable without a hidden UI toggle. The legacy fixtures contain 7 rows in this runtime, while the approved references depict 9 rows; the remaining density difference is recorded as a fixture gap.

## Updated verdict

The operational Tablet remediation is visually successful: S09/S10 lists use cards with reachable actions, and S09 detail now has bordered information/defect/history sections with a visible timeline. The legacy route contract is reachable, but its historical Tablet lists still use a horizontally clipped catalogue table; this remains open against the approved card references. S10 operational detail remains denser than the approved business-facing reference because internal identifiers/audit rows are still shown.
