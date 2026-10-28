# Final Visual Retest — HN-WARRANTY-PARTS-UIUX-001

**Scope:** explicit legacy routes after the Tablet card-reflow fix, plus Desktop preservation.

**Runtime:** local Vite preview `http://127.0.0.1:5292`, Chromium Playwright, VI/light, Desktop 1672×941 CSS and Tablet 992×1586 CSS, DPR 1. Metrics: [`final-retest-metrics.json`](final-retest-metrics.json). Screenshots: [`screenshots/final`](screenshots/final).

## Results

Eight captures ran successfully: S09 and S10 legacy list/detail at Tablet and Desktop. Console/page errors and failed network requests were zero.

- `#/preview/S09?catalog=legacy` and `#/preview/S10?catalog=legacy` report `data-catalog-mode="legacy"` and render the historical catalogue.
- At Tablet, both tables reflow to `display:block` cards with hidden headers, localized Vietnamese `data-heading` labels, no horizontal document overflow, and all visible `Chi tiết` actions horizontally inside the 992 px viewport. Every action is 44 px high.
- At Desktop, both tables remain native table layout (`display: table`, visible table headers) with no horizontal document overflow. Desktop visual composition is preserved.
- S09 and S10 detail dialogs remain bounded; closing each restores focus to the originating `Chi tiết` button.
- Fixture density remains seven rows per route in this runtime, while approved references depict nine rows. This is retained as a data fixture gap only.

## Defect disposition

`HN-WP-VIS-001` (legacy route reachability), `HN-WP-VIS-002` (Tablet list reflow), and `HN-WP-VIS-006` (legacy Tablet action clipping) are **CLOSED** by this retest. `HN-WP-VIS-003` remains closed from the prior operational detail retest. `HN-WP-VIS-004` remains **OPEN** for S10 internal-ID/audit density. `HN-WP-VIS-005` remains **PARTIAL** because the fixture contains seven rather than nine rows.

No application source files were edited during this retest; credentials were supplied only to the transient browser process and were not saved.
