# Visual defect register — HN-INVENTORY-32REF-001

**Current core32 disposition: final built preview, source `3f8cf44ac531d72d50a42003cafecf6d726085ca`: P0=0, P1=0, P2=3.** All32 final cases verified through source/image/build hash receipts and geometry comparison excluding only the intended muted foreground change, with representative final originals and diagnostics manually inspected.12 of15 findings fixed in observed scope;001/014/015 partial with P2 residuals. Sampled muted-label AA contrast is now closed by final Functional QA computed styles. Its separate reflow/action-reachability stress failure remains outside these core32 counts and prevents broader acceptance. Full fidelity PASS withheld. Authoritative capture folder is `final-build-3f8cf44`; valid prior built stages are historical, interrupted `final-baebfc4` is invalid and excluded. See [FINAL_VISUAL_RETEST_REPORT.md](FINAL_VISUAL_RETEST_REPORT.md), [FINAL_BUILD_REVIEW_METRICS.json](FINAL_BUILD_REVIEW_METRICS.json), and [DIAGNOSTIC_REVIEW_RECEIPT.json](DIAGNOSTIC_REVIEW_RECEIPT.json). Historical rounds below are retained as evidence and superseded by this disposition.

Reviewer: independent S00#3 (S00#6 design custodian role in prior phase). Review base DEV `57b9f399a55d41d43ecad7a31e1b279da2cda717` plus uncommitted approved/ implementation. Locked shell/header/sidebar are excluded from content-fidelity findings. This first review records direct source/reference topology differences; runtime geometry verdict awaits root-owned round1/capture.json. No source edits or passing visual result issued.

## Scope and evidence

All32 original references inspected in design phase; custody hashes and eight contact sheets are in ../design/. Current candidate source inspected: `src/features/S16/approved/InventoryDesignWorkspace.tsx`, `approved.css`, `adapter.ts`. Capture profiles will be1920×1080 DPR1 Desktop and800×1280 DPR2 Tablet. Raster refs vary and are not CSS viewports; content normalization must preserve aspect ratio and full content, avoiding shell offsets as false component defects.

| ID | Severity / state | Reference comparison | Source-confirmed finding / impact | Required bounded correction | Runtime status |
|---|---|---|---|---|---|
| VQ-INV-001 | P1 /02 SKU overview |02D location-first table;02T3×3 location tiles | SKU view renders the same `boxTable` as03, labeled Phân bổ theo BOX. This collapses location allocation hierarchy into BOX allocation and does not reproduce the approved distinct overview. | Give02 a location projection/table and Tablet location tiles with count/quantity totals; retain03 BOX view. | Await actual |
| VQ-INV-002 | P2 /05 Tablet tray |05T keeps one BOX row in a compact table | Generic<=900px CSS converts every table to3column cards. The tray detail is expected to preserve compact one-row table/object relationship. | Scope responsive representation per approved screen; keep05 one-row table readable and viewport safe. | Await actual |
| VQ-INV-003 | P2 /04 BOX detail |04D/T separate identity, quantity, current storage location and quick links | Current BOX view has identity, quantity and trace buttons only; no dedicated current-location panel. Identity places location/tray inline but misses the approved section hierarchy. | Add source-backed current-location block and responsive quick-link layout; preserve same BOX/SKU/tray values. | Await actual |
| VQ-INV-004 | P2 /06 movement |06D/T show date/type/BOX/query controls under SKU tabs | Movement branch renders history table directly without the approved filter toolbar. All visible rows/links must remain source-backed. | Add applicable read-only filters with functioning date/BOX/query behavior or record precise contract blocker; no decorative controls. | Await actual |
| VQ-INV-005 | P1 /07 reconciliation |07D/T show compare date, run ID, all-scope and compare timestamp | Current reconciliation has warehouse/result/query but no compare-date selector or run/snapshot strip, obscuring which immutable system/count data is compared. | Present approved compare-date+snapshot/run/scope metadata consistently; semantics from Candidate adapter, API remains BLOCKED. | Await actual |
| VQ-INV-006 | P2 /08 discrepancy |08D/T style no-auto-adjust warning, BOX totals and unknown-cause attention block | Current view has plain warning paragraph, no BOX-sum row/card, plain cause line. Approved hierarchy requires an explicit warning and total120/118/−2, not inferred arithmetic. | Add shared warning treatment, same-unit BOX totals and named unknown cause presentation. | Await actual |
| VQ-INV-007 | P2 /10 saved snapshot |10D result tabs All/Match/Short/Over and saved snapshot notice;10T saved notice/count footer | Current saved view omits result tabs/controls and explicit immutable-snapshot notice; generic total footer only. | Reuse accurate result filter with counts and saved-as-of notice; never join live data. | Await actual |
| VQ-INV-008 | P2 /all numeric tables | Number columns right aligned; quantity/unit retained | CSS sets th text-align:left and never aligns numeric td. Last-column pseudo selectors only set tabular figures. | Semantic numeric column alignment for Desktop and Tablet, same-unit display. | Await actual |
| VQ-INV-009 | P2 /11–16 state detail | Empty HN04 vs no-results ZX999 vs read failure vs history denial vs missing BOX | Shared PageState is correctly reused but generic descriptions omit scope/query/denied-history context visible in approved refs; state actions differ (empty lacks separate reload). | Use state-specific contextual copy/actions while preserving shared illustration/icon semantics; no new global artwork. | Await actual |
| VQ-INV-010 | P2 /all Tablet geometry | Prompt minimum44×44 touch targets, reference readable named actions | `.iad-link`/`.iad-back` bypass min-height44; copy min32 and footer min36 explicit overrides. Source risk only until measured. | Restore hit areas>=44 without unnecessary glyph enlargement; measure all visible controls. | Await measurement |

## Current verdict

`VISUAL_ACCEPTANCE_NOT_RUN` until32 actuals and capture metadata exist. Topology findings above are independently reviewable omissions; severity may be refined from runtime evidence. State artwork may normalize generated icon differences using existing shared PageState. Different icon art alone is not a defect without semantic/layout impact. No blanket pixel threshold or 100% fidelity claim is authorized.

## Round1 Desktop evidence update

Root-owned `round1/capture.json` currently contains15Desktop records at1920×1080/DPR1. All15available actual PNGs were independently viewed (02/07/08 full variants also viewed). Content findings001,003–009 are confirmed in the actuals. 002 and Tablet-specific measurements await the Tablet set. Root captures16–32 are pending; do not treat15/32 as completion.

Source provenance in capture manifest: base57b9f399; App SHA256 `70105d4e13c83fac9c7005956e42a7b58d06d4b464d3289b2264c90e16c76e23`; workspace `1d674cb73c55d2e20027dc74cc85ea06616178582832b5459326c03496b7cd71`; CSS `5131f0b9a60fef436ac1d149b91975f426e587968e72bb703d86a5dc837223ac`; adapter `2665bc49266d8a734f429b76fb268863ccb23ba8311d02f0be16220deb47e802`.

| ID | Severity / evidence | Confirmed actual finding | Bounded correction |
|---|---|---|---|
| VQ-INV-011 | P1 /01–15Desktop, e.g01Search/12empty/15forbidden | Intended primary buttons render white/neutral; tabs render white boxed buttons without approved teal underline. CSS `.iad button:not(.iad-link):not(.iad-back)` outranks `.iad button.primary` and `.iad-tabs button` declarations. | Fix feature-local selector precedence so primary CTA and tab selected style survive; no global token/shell edits. |
| VQ-INV-012 | P2 /11Desktop | Loading skeleton is a small centered6×4 generic grid instead of the approved inventory-column skeleton filling the list panel; content headers/loading affordance hierarchy is lost. | Keep shared loading semantics and add screen-specific skeleton layout through a scoped extension; no bitmap replacement. |
| VQ-INV-013 | P2 /05Desktop | Tray BOX table displays redundant tray/location but omits SKU and item name shown in approved05. Quantity figures have no repeated unit context in metrics. | Give tray table its own source-backed BOX/SKU/name/unit quantity columns; keep one BOX. |
| VQ-INV-014 | P2 /09–10Desktop | Saved-run dates show raw `2026-10-28 14:25` in VI locale while other screens use28/10/2026. History keyword placeholder incorrectly says Mã SKU for reconciliation ID search. | Shared locale date formatting and correct contextual search label. |

**Measured Desktop limitations:** all15have horizontalOverflow=false and0console/page errors/failed requests in capture metadata. PageHeight is1128CSSpx for most views versus1080viewport,1245for02,1153for07,1318for08. Tall content needs review after preserving footer/context; do not blame locked shell or require pixel-fit by shrinking fonts. 01contains21controls below44in either dimension; copy32×32, view34.02×22, sort36.86×22; footer controls~29.9×36. These are measured Desktop values; Tablet-specific breach verdict awaits actuals. `.iad` captured padding8px must be assessed relative to outer shell content gutter rather than judged from source alone.

**Interim result: FAIL for observed content fidelity; incomplete32-capture acceptance.** All confirmed findings remain open pending scoped remediation and new immutable capture round. Generated icon differences are normalized where semantics remain correct; state context/actions and skeleton structure are the actionable concerns.

## Final round1 review — all32 actuals inspected

This update supersedes pending capture statuses above. All16Desktop+16Tablet actuals have now been independently viewed. Reviewed full-page variants for tall list/detail screens preserve below-fold content. Capture manifest SHA256 `653c5ea299be64ef9b4d51b589f46efee3599c4e484ef4f32c06f58e90bb9a5f`; all32 screenshot hashes and geometry extracts are in [ROUND1_REVIEW_METRICS.json](ROUND1_REVIEW_METRICS.json). Source hashes remain those recorded above. Profiles1920×1080DPR1 and800×1280DPR2, local MOCK. Nohorizontaloverflow and0console/page/request errors across32; this is runtime stability evidence only.

**Verdict: FAIL content fidelity.** Findings001–014 remain open;002 is now confirmed by05Tablet.010 is now a measured Tablet touch-target failure:01Tablet20controls below44;02/03Tablet22each;07Tablet20;10Tablet21. Examples32×32copy and34×22view. State panels11–16 are semantically distinct; primary/tab styling and contextual copy remain open.16not-found returns to lookup and exposes no fabricated BOX, but its primary action is neutral rather than approved teal.

| ID | Severity / actual evidence | Confirmed finding | Required correction |
|---|---|---|---|
| VQ-INV-015 | P1 /01/02/03/06/07/08/09/10Tablet-full | Generic3column table conversion stacks each record across several tall grid rows. Actual page heights3124/2814/2681/2591/3291/2958/2544/3312CSS vs1280viewport; approved references use compact horizontal record structures and02uses3×3location tiles. Last rows and paging are far below the initial frame. | Replace generic conversion with per-view semantic templates while retaining unit labels/named44targets. Do not shrink type or hide records/defects. |

## Prioritized bounded layout mapping for implementation owner

1. Fix015+001 first:01lookup compact row/card with SKU/name and warehouse/location/unit at left, labeled quantity triad at right;02location overview table on Desktop and3×3location tiles on Tablet with count/quantity totals;03BOX identity/tray/location at left and quantity triad at right.02must not reuse03BOX table.
2.06movement compact rows/cards retaining time/doc/BOX plus operation/signed quantity/stock-after/actor, with functioning toolbar004.07/10SKU identity left and system/count/difference/badge right.08BOX identity/tray/location left and comparison triad/badge right.09saved-run ID/date/scope left and3result counts right. Keep all quantities in their units and same immutable snapshot.
3.05retain compact single-row table withBOX/SKU/name/unit/quantities; do not convert to generic card or repeat fake9rows.04use compact source-backed detail groups consistent with reference, including dedicated current-location panel and stacked quick links on Tablet.
4. Fix011feature-local specificity; preserve teal primary CTA and selected underline tabs. Restore01044×44effective target areas for copy/view/back/paging without inflating card whitespace. Numeric alignment008requires semantic numeric columns rather than nth-last-child guesswork.
5. Restore007snapshot result tabs/notice,005compare date/run/scope,006warning/totals/cause,012full inventory skeleton and009contextual state copy/actions. Use shared PageState/Icon vocabulary; no raster illustration extraction or new global state component.

No source fixes, locked shell changes, capture edits or deployment were performed by this reviewer. A new capture round with source hashes is required after corrections; this failed round must remain intact.

## Round2retest disposition — source956672b1

All32round2actuals independently viewed. Full receipt: [ROUND2_RETEST_REPORT.md](ROUND2_RETEST_REPORT.md), [ROUND2_REVIEW_METRICS.json](ROUND2_REVIEW_METRICS.json). Capture manifestSHA256 `e0a02a85b097d9d63b411012d02d968252b7c73862c1dc140ea8417058db60fa`.

- **Fixed in observed scope:**002traytable;004movementtoolbar;005comparedate/runcontext;006warning/BOXtotals/cause;007savedtabs/notice;008numericalignment;009contextualstates;010allcaptured44pxcontrols;011primary/tabcascade;012inventoryskeleton;013traySKU/namefields.
- **Partial/open:**001locationoverviewcorrectbuttilesoversized;003storagepanelexistsbutdetailgrid/quicklinklayoutstilltall;014historyformat/placeholderfixedbutnativeinputsdisplayUSdateinVI.
- **ResidualP1:**015genericgridstackingreducedbutnotclosed: Tablet01/02/03/06/07/08/09/10pageheights1693/1820/2058/2000/1910/2285/1779/1956CSS. Preserve44hitareas; repair inline metadata/explicit tile areas and redundant whitespace rather than shrink font/clip records.

All32report0horizontaloverflow/0sub44controls/0console-page-requesterrors. Lockedsharedshell/Toastdiffvsbaseemptyverified. OverallresultFAILforremaininglayout; no source/browser/capture changes performed.

## Final round3 disposition

All32 core final actuals independently inspected, including13 full-page variants. Capture manifest SHA-256 `ae3d2b71cea75e4e4cab1bdefbd2511e843d5ba591f9dd96f5aaf2421bad97bf`; source four-file hash receipt matches frozen commit.32 reference hashes revalidated; all match custody. All32 record zero horizontal overflow, sub44controls, console/page errors and failed requests. Shared shell/Toast diff vs initialbase remains empty.

- Fixed in observed scope:002/003/004/005/006/007/008/009/010/011/012/013.003 now has compact metadata, separate current location and full-width stacked Tablet trace actions.
-001 remains P2:02Tablet3×3 location cards are present and compact, but `Số BOX` metadata wraps narrowly and quantity labels crowd. No missing values.
-014 remains P2:06/07/09 native date inputs visibly use US order or `mm/dd/yyyy` under VI. Saved visible dates and history placeholder are corrected.
-015 downgraded from P1 to P2: material generic stacking and redundant viewport minimum height corrected.06/09Tablet still flatten the approved metadata grouping into narrow parallel columns, wrapping actor/date/runID and adding height. All full data and actions remain accessible in captures. Mere vertical scroll is not itself a defect or a requirement to shrink controls/fonts.

Final **P1=0/P2=3 distinct causes**;12 fixed/3partial out of original15. Protected shell/icon normalization accepted where authorized. Full visual PASS remains withheld; no new repair or deployment performed by this reviewer. See final report for every pair's manual observation, normalized comparison method, bounded limitations and per-file custody receipt.
