# Independent visual review — 0dd7092

**Verdict: visual fidelity REVIEW WITH RESIDUALS; full PASS withheld.** 32/32 Desktop/Tablet reference cases and 16 additional 400px cases were captured from the built MOCK preview. All 32 actuals were reviewed via full-page contact sheets alongside the 32 reference contact sheets; 02/06/09 Tablet original actuals and references were inspected individually, as were those 400px views. The 02/06/09 overlays and a desktop diff were inspected. This is a visual review, not functional, accessibility, API, RBAC or production acceptance. Findings are P2 visual/layout residuals; no P1 information loss was established in these captures. Offscreen controls below require functional reachability verification.

## Provenance and evidence

Source `0dd709236cb43f497f9e349349eebd9144e7175d`, build `1ef2777576367344d9f5e63bf6b345b310d334b10a5659b9da9f55eef374ea74`; served build-info confirmed those identifiers. [capture.json](after/capture.json) contains 48 cases and geometry, browser, and source/build hashes; [stability.json](after/stability.json) records unchanged HEAD, tracked diff and named source hashes across capture. Synthetic normal login was used. Capture profiles VI/light: Desktop 1920×1080 DPR1, Tablet 800×1280 DPR2, Mobile400 400×900 DPR1. The Mobile400 profile has no supplied matching reference, so it is a reflow observation, not a reference comparison.

[AFTER_REVIEW_RECEIPT.json](AFTER_REVIEW_RECEIPT.json) maps each reference and current-task BEFORE image to its AFTER image, hashes all original and derived files, and records measured heights and crop bounds. All 32 originals rehash to the approved manifest; 32 reference/actual/overlay/diff sets are in [comparison](after/comparison/). The [BEFORE receipt](BEFORE_REFERENCE_RECEIPT.json) records a custody limit: its manifest lacked screenshot hashes at capture time, so current hashes establish present bytes only. Prior evidence is immutable lineage, not a current retest. The original images and fixed/full actuals are authoritative; diagnostic proportional-width crop registration is heuristic, not pixel identity, and no score or threshold establishes PASS. State icon normalization follows the scoped design decision.

All 48 records report document horizontal overflow false, zero captured console/page errors or failed requests, and no measured visible module button/input/select smaller than 44×44 CSS px. This geometry check is not proof that controls inside scroll containers are visible or reachable. Page heights are not themselves failures.

## Defect register

| ID / severity | Evidence and disposition | Required next check |
|---|---|---|
| VQ-RECON-001 / P2 | At 400px, [tray detail](after/05-Mobile400.png) shows only the left side of the table; its BOX action has measured x=638..684 outside the 400px viewport. Quantity and action columns are not visible initially, although document overflow reports false. The capture cannot establish whether the internal horizontal scroller is discoverable or keyboard/touch reachable. | Verify scroll, focus and action reachability; provide an obvious, usable way to reach all columns and actions without losing data. |
| VQ-RECON-002 / P2 | At 400px, SKU overview/allocation/movement tabs show a clipped third tab; its measured x=339..489 in 02/03 and 337..490 in 06. No indication of more tabs is visible in the static captures. | Verify touch and keyboard access, selected-tab visibility and a clear affordance for remaining navigation. |
| VQ-RECON-003 / P2 | [06 Tablet full](after/06-Tablet-full.png) now groups time/document/BOX and operation/quantity/actor, with identifiers and actor readable. It is 2119 CSS px tall versus 1604 in this task's BEFORE. The reference uses the same two-row grouping more compactly. The new card spacing creates a material density mismatch; all nine rows remain visible through vertical scrolling. | Tighten grouped card spacing while retaining readable text, data and effective targets; compare at 800×1280 DPR2 with full-page capture. |

02 Tablet now shows nine location tiles, readable `Số BOX`, quantity labels and 120/20/100 total; the former narrow-label wrapping is not observed in this default fixture. 09 Tablet shows unbroken run IDs and date/scope on the left with three counts on the right; the former wrapping is not observed. The 06 actor is likewise unbroken, but its density remains open. 07 shows a VI-formatted populated date; 06 and 09 captured empty date controls, so populated VI/EN/zh-CN date behavior is **not verified by these captures**. Reference 06's individual movement timestamps differ from this fixture after the first row; these screenshots do not prove fixture or business-data equivalence.

## Coverage observations

| Pair | Visual observation in both profiles |
|---|---|
| 01 | Nine lookup rows, warehouse/location and quantities visible. |
| 02 | Nine location tiles/table, 9/9/9 counts and 120/20/100 total; mobile tab concern above. |
| 03 | Nine BOX rows and quantity footer; mobile tab concern above. |
| 04 | BOX identity, quantity, location and trace links shown. |
| 05 | One BOX/tray relation and table retained; mobile table concern above. |
| 06 | Nine movement entries and filters; Tablet density and mobile tab concerns above. |
| 07 | Nine reconciliation rows and 3/3/3 classification visible. |
| 08 | Nine BOX rows, 120/118/−2 and cause warning visible. |
| 09 | Nine history records and unbroken Tablet run IDs; date inputs empty in capture. |
| 10 | Saved-result notice and nine rows visible. |
| 11 | Loading skeleton shown without fabricated inventory values. |
| 12 | HN04 empty state and actions shown. |
| 13 | ZX-999 no-result state and clear action shown. |
| 14 | Error state and retry shown. |
| 15 | Forbidden-history message shown without history rows. |
| 16 | Missing BOX state and return shown. |

Observations do not certify interactions, long content, locale/theme variants, server persistence or real authorization. No source or baseline edits were made by visual QA. Subsequent repairs require a fresh frozen build and independent retest; this report remains bound to `0dd7092`.
