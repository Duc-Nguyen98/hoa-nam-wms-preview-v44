# Visual QA review — HN-INVENTORY-32REF-001

**Latest core32 result: final built-preview receipt complete at frozen commit `3f8cf44ac531d72d50a42003cafecf6d726085ca`:32/32 cases covered; P0=0/P1=0/P2=3; full visual PASS withheld.** Final authority is `final-build-3f8cf44`, buildId `ec7027a6f60c22cd53ab541636359823832a48424ecb8e688a39a6e7a52b0dab`. All32 geometry/content records match the previous reviewed build excluding only the intended muted color change. Final representative originals and overlay/diff samples inspected; all32 capture and128 diagnostic hash/dimension receipts updated. Sampled muted-label AA is closed by actual Functional QA styles; its separate reflow/action-reachability stress failure remains open outside these core32 counts. Interrupted `final-baebfc4` is invalid and excluded. See [FINAL_VISUAL_RETEST_REPORT.md](FINAL_VISUAL_RETEST_REPORT.md), [FINAL_BUILD_REVIEW_METRICS.json](FINAL_BUILD_REVIEW_METRICS.json), [DIAGNOSTIC_REVIEW_RECEIPT.json](DIAGNOSTIC_REVIEW_RECEIPT.json) and current disposition in [VISUAL_DEFECT_REGISTER.md](VISUAL_DEFECT_REGISTER.md). The original round1 report below remains historical evidence.

Reviewer: independent S00#3; no implementation/capture edits. Date2026-10-29 UTC+07. References: final32originals under ../design/references/, all manifest-validated and inspected. Excluded: locked GlobalShell/sidebar/header and generated chrome variations. Included: module content, tabs, tables/cards, detail fields, state hierarchy and effective control targets.

## Verdict

**FAIL content fidelity for round1. All32actuals inspected.** All16Desktop+16Tablet runtime screenshots were independently viewed, including full-page tall list/detail variants. The candidate contains core approved data and distinct semantic states, but major hierarchy omissions and generic Tablet card geometry materially diverge from the approved compositions. Nothing is certified100% or API-integrated by this review.

Actionable findings and corrections: [VISUAL_DEFECT_REGISTER.md](VISUAL_DEFECT_REGISTER.md),001–015. Screenshot hashes, geometry extracts and source provenance: [ROUND1_REVIEW_METRICS.json](ROUND1_REVIEW_METRICS.json). Root-owned capture manifest SHA256 `653c5ea299be64ef9b4d51b589f46efee3599c4e484ef4f32c06f58e90bb9a5f`.

## Capture scope

Actual runtime: local Preview MOCK,1920×1080CSS/DPR1Desktop and800×1280CSS/DPR2Tablet, vi-VN, Asia/Ho_Chi_Minh, Chromium. Base57b9f399plus candidate file hashes in capture manifest; no exact committed candidate SHA at capture. These are actual application screenshots, not enlarged reference bitmaps. Reference Desktop1672×941and mixed Tablet rasters do not specify CSS/DPR. Findings concern visible fields/sections/layout, independent of antialiasing or shell offset. Exact per-region pixel registration/diffs remain NOT_RUN; no unexplained global threshold is used.

## All16pair dispositions

| Ref pair | Content finding | Desktop / Tablet result |
|---|---|---|
|01 | Core lookup labels/120−20=100present; primary CTA/tab styling and numeric alignment wrong. Tablet each record becomes multiple grid rows; page3124CSS,20targets below44 | FAIL / FAIL |
|02 | BOX table reused instead of location allocation overview; missing location-first table/3×3Tablet tiles and totals; Tablet2814CSS | FAIL / FAIL |
|03 | Correct BOX relationship core, but missing quantity-sum footer and tab/action presentation; Tablet2681CSS vs compact approved BOX cards | FAIL / FAIL |
|04 | Identity/20/5/15present; missing dedicated storage-location section and responsive quick-link hierarchy; Tablet field group excessively tall | FAIL / FAIL |
|05 | Exactly1BOX retained correctly; table misses SKU/name and repeats tray/location. Tablet converts approved compact table to large generic card | FAIL / FAIL |
|06 | Signed movement core present; date/type/BOX/query toolbar missing. Tablet records have excessive multirow layout;2591CSS | FAIL / FAIL |
|07 |9SKU/3/3/3and120/118/−2visible; compare date/run/scope/as-of missing; Tablet3291CSS | FAIL / FAIL |
|08 |120/118/−2core present; styled warning, BOX-total120/118/−2and cause-attention hierarchy missing; Tablet2958CSS | FAIL / FAIL |
|09 | History rows present; rawISOdates inVI, query placeholder saysMãSKU; Tablet generic run cards2544CSS | FAIL / FAIL |
|10 | Saved result/3/3/3core present; result tabs/snapshot notice missing, saved dateISO; Tablet3312CSS | FAIL / FAIL |
|11 | Distinct loading title/skeleton; generic centered6×4grid loses approved inventory-column skeleton geometry; primary/tab styling wrong | FAIL / FAIL |
|12 | HN04filter retained; empty copy lacksHN04context and separate reload action; neutral primary | FAIL / FAIL |
|13 | ZX999query retained; missing query-specific explanatory copy; neutral primary | FAIL / FAIL |
|14 | Distinct retryable error/no fakezero/freshdate observed; generic copy and neutral primary diverge | FAIL presentation / FAIL presentation |
|15 | History tab/title context retained and no business rows/counts exposed; denied-history explanatory copy absent; neutral primary | FAIL presentation / FAIL presentation |
|16 | BOXnot-found title/object-specific copy/return action present; no fabricatedBOX; neutral primary and small back target | FAIL presentation / FAIL presentation |

## Measured geometry

All32report documentHorizontalOverflow=false and0console/page errors/request failures. This proves limited rendering stability, not fidelity. Desktop pageHeight1128for most views against1080viewport;02=1245,07=1153,08=1318. Tablet pageHeight1338for detail/system states against1280viewport; list records are substantially taller:

| Tablet ref |01 |02 |03 |06 |07 |08 |09 |10 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Page height CSSpx |3124 |2814 |2681 |2591 |3291 |2958 |2544 |3312 |

This is not merely different shell geometry: actual records have several sparse3column grid rows where references use compact horizontal identity/metadata and quantity groups. Replace generic table conversion with per-screen templates. Preserve font size, labels, units, accessible actions and all records; do not clip bottom content or force height to conceal it.

Tablet measurements confirm copy32×32, view~34×22 and footer~30×36targets.01Tablet has20targets below44,02/03each22,07has20,10has21. These violate the user44×44Tablet requirement. Increase effective hit areas while fixing record structure. Native icons may remain visually small.

## State illustration normalization

Existing semantic PageState icons are used instead of inconsistent AI raster illustrations. The prompt permits this Design System normalization. The actionable gaps are state-specific context/actions, shared CTA styling and table-shaped loading geometry; no new raster art or global state duplication is requested. The six state titles remain distinct, which is a positive semantic observation, not visual PASS.

## Required next gate

Prioritize015Tablet templates and001location overview,011CTA/tab cascade,010hit areas, then source-backed missing fields/controls005–009/013/014and012skeleton. Preserve failedround1and recapture impacted32states with new source hashes after scoped corrections. Four selected foundation before/after views, per-region normalized reference/actual/diff evidence,768×1024, dark/locales/zoom/long content and independent functional/RBAC/API results remain separately required and NOT_RUN here. No shared shell/source edits or deployment were performed by S00#3.
