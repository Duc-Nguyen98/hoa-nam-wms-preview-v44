# AFTER / DIFF Report — HN-PTW-26REF-001

Retest source: `6ea167125643d10d6545b28df452511af54c6f09` on `http://127.0.0.1:5291`, fresh Playwright browser context and runtime-only demo fixture. The working tree contained the parent agent's uncommitted fix; S00#3 made no source edits. Viewports were Desktop 1672×941 DPR1 and Tablet 992×1586 DPR1, locale `vi-VN`, light theme.

## Current route coverage

- S11 tray list and S11 tray detail are reachable in both viewports. The prior `INCOMPLETE_POPULATION` block is no longer reproduced.
- S14 order list, confirmed order detail, and S14 history are reachable in both viewports.
- 10 AFTER screenshots are under `after/`; raw route, geometry, overflow, console and request evidence is in `after/AFTER_MANIFEST.json`.
- Console errors: 0. Failed requests: 0. Horizontal overflow: false for all captured states.

## Diff evidence

Before/after diffs exist for affected states with prior BEFORE screenshots:

- `diff/REF-02_*_diff.png` — S14 order list
- `diff/REF-04_*_diff.png` — S14 history
- `diff/REF-07_*_diff.png` — S14 confirmed order detail

`diff/DIFF_METRICS.json` records changed-pixel counts and mean RGB delta for each viewport. REF-03 and REF-09 had no runnable BEFORE state because the previous source was blocked; their AFTER captures are compared against the supplied design references in `diff/REFERENCE_DIFF_METRICS.json` and `diff/REF-03_*_reference_diff.png` / `diff/REF-09_*_reference_diff.png`.

The diffs are evidence of changed runtime state and fixture/layout differences, not a pixel-perfect approval. The S11 reachability defect is resolved in the retest; residual visual differences remain documented in the existing register.

