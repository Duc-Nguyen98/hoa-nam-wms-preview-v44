# Final independent visual retest — built preview 3f8cf44

Task `HN-INVENTORY-32REF-001`; independent reviewer S00#3. Final authority is frozen source `3f8cf44ac531d72d50a42003cafecf6d726085ca`, static built preview at port5341, Candidate fixture mode, VI/light. **32/32 final core capture cases covered; P0=0, P1=0, P2=3 reference-gap causes. Visual result: REVIEW WITH RESIDUALS, not full fidelity PASS.** Three bounded presentation repair rounds and the separate muted-text contrast correction are complete. Functional reflow stress acceptance is separate and has an outstanding failure documented below. This report does not authorize another implementation round or deployment.

## Evidence receipt and limits

Final capture manifest `final-build-3f8cf44/capture.json` SHA-256: `d8bbb4e9d5d0943f9ff6d45c72dd0ebc7e5b5ebb345d805340cf6f4694602d9d`. The interrupted `final-baebfc4` development-server capture is invalid and excluded from final evidence; valid `final-build-baebfc4` is historical lineage. All four final captured source hashes independently match the frozen working files; tracked source diff is empty. All32 approved reference PNGs were rehashed against the validated custody manifest:32 matches. [FINAL_BUILD_REVIEW_METRICS.json](FINAL_BUILD_REVIEW_METRICS.json) records each final reference,32 fixed PNG,13 full PNG and32 DOM text hashes, source receipt, build receipt and geometry. All15 local build assets match `dist/build-info.json`; buildId `ec7027a6f60c22cd53ab541636359823832a48424ecb8e688a39a6e7a52b0dab`, sourceCommit `3f8cf44ac531d72d50a42003cafecf6d726085ca`, build-info SHA-256 `c8ffef37e6bc512d6580a96388020474dea90f3eec3af74b8f48f821e8742eb5`.

Manual coverage is carried forward transparently from the32 original round3 images inspected at `00e06e9a` and the subsequent built-preview review at `baebfc49`. The final source delta from `baebfc49` is only the feature light muted token `#637c98` to `#536d89` plus EOF whitespace trimming; no UI logic or layout declarations change. All32 complete final geometry records exactly match the prior built capture after replacing only the expected computed foreground `rgb(99, 124, 152)` with `rgb(83, 109, 137)`; all remaining text, bounds, control sizes, fonts, overflow and heights match. Final01Desktop/02Tablet-full/08Tablet-full/14Desktop originals were reopened and inspected, along with their overlay/diff pairs. Existing reference gaps remain; no presentation regression observed. Final CSS SHA-256 is `6a9e82331b14bfaa0bba5f12433f70e7e0c121751fe392107d58f2eb0a6a81b5`. This is source-delta/geometry proof plus representative final manual review, not an assertion that32 final images were all reopened. Original approved references were inspected in the design review, with02/04/06/09 Tablet originals reopened for geometry/hierarchy comparison. [BAEBFC49_REVIEW_METRICS.json](BAEBFC49_REVIEW_METRICS.json) and [ROUND3_FINAL_REVIEW_METRICS.json](ROUND3_FINAL_REVIEW_METRICS.json) preserve prior lineage.

Desktop1920×1080CSS/DPR1; Tablet800×1280CSS/DPR2; zoom1, Chromium156.0.8078.4. All32 final capture records report zero horizontal overflow, zero captured module controls below44×44CSS, zero console/page errors and zero failed requests. These are bounded capture checks, not comprehensive accessibility or network/API acceptance. Module source hashes are in the machine receipt. `git diff 57b9f399a55d41d43ecad7a31e1b279da2cda717 3f8cf44ac531d72d50a42003cafecf6d726085ca -- src/shared src/toast` is empty, independently verified. Reviewer made no source, browser, capture or deployment changes.

## Muted-text contrast closure and separate stress result

Functional QA's final source-bound [computed-style observation](../functional/final-3f8cf44/critical-contrast-reflow/muted-contrast-observation.json) confirms the muted-text correction. Its companion [browser receipt](../functional/final-3f8cf44/critical-contrast-reflow/browser-results.json) identifies commit `3f8cf44ac531d72d50a42003cafecf6d726085ca`, reports source unchanged and marks the computed muted-label contrast check PASS. Observation SHA-256 `8661e9928df04de4e350683ef762475bca1e22a47c27bbc2be36452a121926ab`.

| Computed sample | Foreground / background | Ratio | Scoped result |
|---|---|---|---|
| Light metric label,12px | rgb(83,109,137) / white |5.36195|AA normal-text contrast met |
| Light as-of label,11px | rgb(83,109,137) / rgb(238,245,250) |4.87090|AA normal-text contrast met |
| Dark metric label,12px | rgb(164,183,201) / rgb(29,48,66) |6.56198|AA normal-text contrast met |
| Dark as-of label,11px | rgb(164,183,201) / rgb(20,35,51) |7.73567|AA normal-text contrast met |

The muted-label AA defect is closed for these actual sampled styles. This is not blanket accessibility approval. The same Functional QA receipt separately records a FAIL in the combined768px/200%-equivalent row-action reachability check, reporting all nine view-action bounds at left535/right581. That stress failure remains owned by functional acceptance and is not erased by contrast closure or the unchanged core32 geometry. The P0/P1/P2 counts in this report describe the32 requested reference captures; they do not reclassify or waive the separate functional stress result.

## Geometry and normalized comparison

The approved rasters have no certified CSS viewport or DPR. Manual review compares content relationships, quantity meaning, section order, table/card representation, relative geometry and visible hierarchy after excluding the protected header/sidebar. Native shared font/icon/primary-color normalization is accepted where semantics remain correct; the source shell is protected. A1920Desktop full page need not fit one viewport simply because an AI raster does: the live shell consumes a different width and controls retain44px hit areas. Below-fold content is preserved and inspected, not cropped away. The final content pages still differ in whitespace and density; no pixel equality claim is made.

Parent-owned `compare.mjs` diagnostics use explicit content-origin crops, proportional width normalization (1000Desktop/650Tablet), a canvas tall enough for the full reference and full actual,50% alpha overlay and absolute RGB difference. Reference crop uses Desktop14.2% left/60px top and Tablet5% top; actual crop uses captured module bounds multiplied by DPR. These heuristic registrations may retain some reference shell edge or padding, and different fonts/text/density necessarily create substantial differences. They are transparent diagnostics, not a similarity threshold or a PASS oracle. The original fixed/full captures remain authoritative for manual inspection. Diagnostic generation and independent receipt checks are complete as recorded below.

## Completed diagnostic receipt and sample inspection

Final diagnostics are in `final-build-3f8cf44/comparison/`:32 Reference/Actual/Overlay/Diff sets,128 derived PNGs and `registration.json` SHA-256 `a827368d5cedf0906f7e430be2a23ca7a416fa3fb7a824d465423856cb0f0c46`. Independent [DIAGNOSTIC_REVIEW_RECEIPT.json](DIAGNOSTIC_REVIEW_RECEIPT.json) hashes all128 files and checks all32 unique pairs. Registration source provenance matches the authoritative final capture exactly;32 reference hashes and32 actual hashes match the final review receipt. Where a full-page actual exists, registration uses that full actual rather than its fixed viewport version. All128 derived PNG dimensions match registration. Prior diagnostic receipt is retained as [BAEBFC49_DIAGNOSTIC_REVIEW_RECEIPT.json](BAEBFC49_DIAGNOSTIC_REVIEW_RECEIPT.json).

For every pair the reviewer independently recomputed `ceil(max((referenceHeight-referenceCropY)*outputWidth/referenceCropWidth, (actualHeight-actualCropY)*outputWidth/actualCropWidth))`. All32 canvas heights match and retain both complete post-origin content heights; all crop bounds are valid. This proves no additional bottom clipping by diagnostic canvas construction. It does not certify the heuristic top crop as an exact shell/content boundary. There is no per-row masking, screenshot height compression, bottom truncation or content deletion in the inspected generator. Original fixed and full screenshots remain available.

The final01Desktop,02Tablet,08Tablet and14Desktop overlays, differences and corresponding original actuals were manually viewed.01 retains all nine SKU rows and paging.02 retains all nine location tiles, paging and120/20/100 totals, while making the metadata crowding visible.08 retains BOX001–009,120/118/−2 totals and the final unknown-cause warning.14 retains its error message and retry action. No row/footer/totals/cause/action clipping was observed in these samples. Their canvas heights636/1095/1225/636 respectively exceed the complete scaled actual content heights635.309/1094.282/1224.801/635.309.

The overlays visibly show displaced headings, summary geometry, label density, row ordering and state illustration differences; these differences have not been hidden. Existing permitted component/icon normalization and the manual semantic review still govern classification. `diagnosticMeanAbsoluteRGB` is an uncalibrated descriptive value, **never an acceptance gate or evidence of full fidelity PASS**. Diagnostic completion does not close the threeP2 residual causes or change the final P0=0/P1=0/P2=3 result.

## Final disposition of the15 findings

| ID | Final status | Direct evidence / remaining scope |
|---|---|---|
| VQ-INV-001 | PARTIAL, P2 |02Desktop has distinct location-first table;02Tablet has correct3×3 location cards and9/9/9 counts/120/20/100 totals. Tablet card metadata is crowded: `Số BOX` wraps into a narrow final column and quantity labels run closely together. Values remain readable. |
| VQ-INV-002 | FIXED |05Tablet preserves the compact one-BOX table, with full SKU/name/unit/20/5/15. |
| VQ-INV-003 | FIXED in normalized scope |04 has identity, quantity, dedicated current storage location and trace hierarchy. Tablet metadata now uses four columns; trace actions are stacked full-width. All labels/full codes fit. Icon/descriptive embellishments are normalized to existing components. |
| VQ-INV-004 | FIXED visible structure |06 date/type/BOX/query toolbar exists; functionality is covered by the separate functional review. |
| VQ-INV-005 | FIXED visible context |07 compare date, run ID, all-warehouse scope and timestamp strip present, with nineSKUs and3/3/3 classification. |
| VQ-INV-006 | FIXED |08 no-auto-adjust warning, BOX sum120/118/−2 and explicit unknown cause hierarchy present. |
| VQ-INV-007 | FIXED |10 saved notice, saved metadata, All9/Match3/Short3/Over3 controls and immutable fixture result composition visible. |
| VQ-INV-008 | FIXED | Numeric table columns align right with tabular quantities; signs and badges retain meaning. |
| VQ-INV-009 | FIXED scoped states |12HN04/13ZX-999 context retained;14read failure is distinct from zero;15denies history without rows;16missing BOX distinct. Shared state icon normalization is permitted. |
| VQ-INV-010 | FIXED measured core32 | Captured module controls meet44×44CSS. This closes basic-profile geometry only. |
| VQ-INV-011 | FIXED | Teal primary CTA and selected underline tabs survive scoped cascade; source uses darker teal. |
| VQ-INV-012 | FIXED |11full inventory skeleton has eight labeled columns and nine skeleton rows, loading text, no falsezero. |
| VQ-INV-013 | FIXED |05 includes BOX/SKU/name/unit/actual/held/available/view, with one BOX/oneSKU. |
| VQ-INV-014 | PARTIAL, P2 | Saved/display dates and history keyword context corrected. Native date inputs still show `mm/dd/yyyy` and `10/28/2026` under VI on06/07/09 in both profiles. |
| VQ-INV-015 | PARTIAL, downgraded to P2 | Generic tall3column conversion and root minimum-height inflation resolved.06/09Tablet retain a lower-severity hierarchy/density mismatch: narrow parallel columns wrap timestamp, actor and saved-run ID instead of the approved grouped metadata blocks. All data remains visible; no P1 information loss/obstruction observed. |

**Count by distinct unresolved cause:**3P2 (001card metadata allocation,014date control locale,015movement/history grouping).12original findings closed in observed scope;3partial. A residual recurring in multiple captures is counted once, not per screenshot. No newP1 found. Final disposition supersedes earlier severity/status in the historical register, without erasing failed evidence.

## Residual correction notes for a future authorized cycle

001: `approved.css` location tile template reserves three narrow metadata cells for tray, warehouse and BOX count. Give the compact count a sufficient named inline area and preserve a separate evenly spaced quantity triad; avoid font shrink or removing labels. Confirm all nine locations and same-unit totals after correction.

014: `InventoryDesignWorkspace.tsx` uses native `input type=date` with a `lang` attribute. Chromium's visible native control order remains US despite VI page language. Use the established locale-visible date treatment while retaining valid ISO values, keyboard/calendar access and scoped90-day/no-future validation. Do not rewrite saved snapshot dates merely to match a raster.

015: movement/history Tablet grid rules lay metadata in long thin columns.06actor `Nguyễn Văn Nam` wraps across lines;09`DS-20261028-01` breaks after `DS-`, timestamp wraps and scope becomes multiple lines. Approved06 groups time/document/BOX above operation/quantity/actor; approved09 groups run/date/scope at left and result counts at right. Express those named groups while keeping full accessible codes and44px actions. Current wrapping is complete and readable, so this is P2 rather than the earlier P1 extreme stacking.

## Core32 coverage and observed composition

Each row covers both original actual profiles. Heights are full document CSS heights and are reported as evidence, not an automatic fit threshold.

| Pair | Desktop / Tablet height | Final manual observation |
|---|---|---|
|01 lookup |1080 /1297|Nine source-backed SKU records; warehouse/location/unit retained; DRV120−20=100 and WIR1200−200=1000; compact Tablet records. |
|02 SKU overview |1343 /1370|Location representation distinct from BOX allocation, all nine locations and totals; residual001Tablet metadata crowding. |
|03 BOX allocation |1198 /1559|BOX001–00320/5/15,00410/5/5,005–00910/0/10; quantity footer120/20/100 now added. |
|04 BOX detail |1080 /1280|BOX001/SKU/HN01/KH001/A01-01 identity,20/5/15, current location, stacked Tablet trace actions. |
|05 tray detail |1080 /1280|KH001oneBOX/oneSKU; compact table retained on Tablet. |
|06 movement |1080 /1604|All nine movements, signed positive quantities and stock-after to120; filters present; residual014native date and015Tablet grouping. |
|07 reconciliation |1198 /1514|All9/3/3/3, system/count/delta, warehouse-per-row and signed badges; residual014native date. |
|08 discrepancy |1343 /1521|120/118/−2; BOX00120/18/−2, eight others matched; totals/unknown cause/no-adjust warning retained. |
|09 saved history |1080 /1581|Nine dated run records; all-scope and9/3/3/3perrecord; residual014date and015Tablet ID/date/scope wrapping. |
|10 saved snapshot |1203 /1481|Saved result metadata/notice/tabs, nine immutable fixture rows and signed statuses retained. |
|11 loading |1080 /1280|Inventory-column skeleton and loading status; no falsezero. |
|12 empty |1080 /1280|HN04context, choose another warehouse and reload actions; no inventory rows. |
|13 no result |1080 /1280|ZX-999query and explanation with clear filters action. |
|14 read error |1080 /1280|Distinct warning illustration/message/retry action. |
|15 forbidden |1080 /1280|History tab context, permission message and return action; no hidden result rows exposed in capture. |
|16 missing BOX |1080 /1280|Distinct BOX not-found message and return action; no fabricated BOX details. |

The baseline16state now fits1080/1280document heights; old root minimum-height overflow48/58CSS is gone. Tablet01/02/03/06/07/08/09/10 decreased from round2 heights1693/1820/2058/2000/1910/2285/1779/1956 to1297/1370/1559/1604/1514/1521/1581/1481. These improvements justify closing the earlier material stacking failure, while preserving the narrower grouping residual.

## Acceptance boundary

This review accepts the observed core32 representation/semantic corrections and reports the threeP2 residuals transparently. It does not certify all locale/dark/long-content/zoom/768×1024 states, keyboard/screen-reader behavior, four foundation before/after comparisons, realAPI contracts, realRBAC denial, persistence/concurrency or operational readiness. Fixture state reachability and zero failed requests do not prove API/RBAC. Parent-owned functional/foundation evidence must be assessed separately. Protected shell differences are outside this content verdict. **Full visual PASS is withheld because residuals remain.**
