# Visual defect register — HN-OUTBOUND-GSTATE-001

| ID | Priority | State(s) | Evidence | Finding | Disposition / owner |
|---|---|---|---|---|---|
| VQ-OUT-001 | P1 | REF-01, REF-04; all shell-backed states | `before/REF-01_Desktop.png`, `before/REF-04_Desktop.png` | Desktop rail/header geometry differs from the approved composition: rail width and top search/content x origins do not align with the reference. | **OPEN / S00#1 + S00#2**; reconcile shell contract before visual approval |
| VQ-OUT-002 | P1 | REF-02, REF-03 | `before/REF-02_Tablet.png`, `before/REF-03_Tablet.png`; `actual-before-manifest.json` | Tablet card rhythm is taller than the approved portrait composition. REF-03 expanded state reaches `scrollHeight=1690` against a 1586px viewport, clipping the lower CTA/footer from the captured frame. | **FIX VERIFIED (geometry) / S00#2** on the scoped repair; exact shell/reference fidelity remains open |
| VQ-OUT-003 | P1 | REF-05 | `before/REF-05_Tablet.png` | Tablet detail modal is centered high with different height/backdrop exposure; approved REF-05 uses a lower portrait composition and different section/footer proportions. | **FIX VERIFIED (geometry/focus) / S00#2** on the scoped repair; exact shell/reference fidelity remains open |
| VQ-OUT-004 | P2 | REF-01..05 | before captures vs design references | Heading/control spacing and panel/card offsets drift by several pixels; list and modal hierarchy is recognizable but not pixel-approved. | **OPEN / S00#2**; retest after shell/tablet fixes |
| VQ-OUT-005 | P3 / authority gap | REF-01..05 | reference manifest + before captures | Runtime uses browser-local demo recipient/SKU/IDs instead of artwork examples. Artwork README explicitly prohibits copying example data into production. | **DESIGN GAP / no source fix inferred**; S00#6/S00#1 decide whether a visual fixture profile is required |
| VQ-OUT-006 | P2 / evidence gate | REF-06 and six alternatives | `global-states/`, `global-states-manifest.json` | Six alternatives are reachable only through `tests/s15/harness.html`; actual `/preview/S15` has no deterministic state fixture. REF-06 is a visual kit, not a literal screen. | **BLOCKED / S00#1 + S00#4**; do not claim actual-route visual PASS or pixel diff |

The AFTER retest is recorded in `AFTER_VISUAL_RETEST_REPORT.md`; source changes remain owned by S00#2. Do not overwrite immutable reference bytes.

