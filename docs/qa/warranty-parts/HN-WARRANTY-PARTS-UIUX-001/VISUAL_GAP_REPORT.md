# Visual Gap Report — HN-WARRANTY-PARTS-UIUX-001

Comparison uses the supplied `bh-01..bh-14` PNGs as immutable references and the corresponding actual captures. Exact pixel tolerances, source DPR and typography tokens were not supplied; findings below are structural and content-presence gaps.

## Observed gaps

### VG-001 — Historical catalogue cohort cannot be selected (BLOCKED)

The approved references show nine-row historical catalogue lists with search/status/date controls and catalogue detail dialogs. `#/preview/S09` and `#/preview/S10` enter the current-session operational cohort, and the cohort toggle is hidden in `src/shared/preview-ui.css`. The capture therefore shows one operational row with no historical filters. This is a reproducibility gap and prevents a valid reference-vs-actual verdict for all 14 approved states.

Evidence: `screenshots/reference/bh-03.png`, `bh-04.png`, `bh-07.png`, `bh-09.png`, `bh-12.png`, `bh-14.png`; runnable operational actuals with same state IDs; `metrics.json`.

### VG-002 — Tablet list reflow cannot be assessed against the approved card design

The approved Tablet list references use stacked cards and keep the action in the card. The runnable operational actuals use a table; at 992 px the S09 and S10 table headers/columns are compressed and the right-side fields/actions are clipped from the visible frame. Because the approved historical cohort is blocked, this is recorded as an open structural gap rather than a pass/fail pixel score.

Evidence: actual `screenshots/bh-07-actual.png` and `bh-09-actual.png`; references `screenshots/reference/bh-07.png` and `bh-09.png`.

### VG-003 — S09 detail hierarchy differs from approved detail references

Approved S09 details show a sectioned information panel, content cards, linked-defect chip and a visual timeline (side-by-side on Desktop, stacked on Tablet). Runnable operational S09 details render a compact two-column definition list and numbered event lines. Returned and checking actuals are both structurally different even though they remain bounded and readable.

Evidence: `screenshots/bh-01-actual.png`, `bh-02-actual.png`, `bh-05-actual.png`, `bh-08-actual.png` against references `screenshots/reference/bh-01.png`, `bh-02.png`, `bh-05.png`, `bh-08.png`.

### VG-004 — S10 detail data density differs from approved detail references

Approved S10 details present business-facing slip/case metadata and component rows. Runnable operational details expose opaque issue/case/physical IDs and a longer audit-event section; the Tablet modal is 1294.78 CSS px tall. No clipping or horizontal overflow was observed, but content hierarchy and density do not match the approved historical detail composition.

Evidence: `screenshots/bh-06-actual.png`, `bh-10-actual.png`, `bh-11-actual.png`, `bh-13-actual.png`; references with the same IDs; `metrics.json`.

## Measurement notes

All captures report `overflowX: false` and `overflowY: false` at the document level. Modal and control dimensions are in `metrics.json` and `returned-metrics.json`; no console or request failures were recorded. The references are retained unchanged; no baseline image was overwritten.
