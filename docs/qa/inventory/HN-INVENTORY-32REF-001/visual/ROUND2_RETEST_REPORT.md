# Independent visual retest — round2

Source commit `956672b1b3b4a23675f43e6dbe0f678c57a2bc25` (captured tracked source diff empty). Reviewer S00#3; no browser/source/capture edits. Local MOCK profiles1920×1080CSS/DPR1 and800×1280CSS/DPR2, VI/light. Locked shell is excluded from content comparison; git diff57b9f399..956672b1 on src/shared and src/toast is empty, independently verified.

## Verdict

**FAIL: material layout residual remains.** Round2 fixes core section omissions, state context, semantic numeric alignment, primary/tab styling and44×44controls. It improves Tablet list density substantially, but several lists and detail headers remain much taller than the approved compact compositions. P1VQ-INV-015 was reported immediately to S00#1 for the final allowed scoped remediation. Exact pixel fidelity is not claimed; all conclusions combine source, visible imagery and captured geometry.

## Classification of original15findings

| ID | Round2 status | Evidence / remaining scope |
|---|---|---|
|001 SKU overview | PARTIAL, residualP2density | Location-first Desktop table, dedicated3×3Tablet tile grid and120/20/100totals now exist. Tiles still flow8cells into several tall rows, increasing02Tablet to1820CSS. |
|002 Tray Tablet table | FIXED scoped representation |05Tablet now preserves one compact table row, matching reference object relationship. All SKU/name/unit fields present; no fake9rows. |
|003 BOX current location | PARTIAL, residualP2layout |04D/T storage-location panel added and20/5/15correct. Tablet identity/location grids remain2columns with large vertical space; quicklinks remain inline rather than approved stacked rows. |
|004 Movement toolbar | FIXED visible composition |06has date/type/BOX/query/search controls. Functionality/date behavior belongs to independent functional report. |
|005 Reconciliation context | FIXED visible composition |07date field +DS20261028run/scope/as-of strip present;9SKU3/3/3retained. Native date formatting residual tracked014. |
|006 Warning/totals/cause | FIXED visible composition |08styled no-adjust warning,120/118/−2BOXtotals and unknown-cause warning now rendered. |
|007 Saved result controls/notice | FIXED visible composition |10All9/Match3/Short3/Over3tabs and saved-at notice added; results remain saved fixture. |
|008 Numeric alignment | FIXED scoped alignment | Semantic iad-number headers/cells align numbers right with tabular figures on table and compact cards. |
|009 Contextual system states | FIXED scoped content | Empty identifiesHN04and reload; no-results retainsZX999in explanatory copy; denied specifieshistory; error/notfoundretaindistinctmeaning. State icon normalization remains allowed. |
|010 Tablet targets | FIXED measured basic captures | All currently captured module buttons/inputs/selects are>=44in both dimensions; copy/view/back/paging corrected. Long/zoom scenarios still separate. |
|011 Primary/tab cascade | FIXED visual | Teal primary actions, transparent tabs and teal selected underline now visible D/T. |
|012 Loading layout | FIXED visible structure |11full-width8column/9rowinventory skeleton replaces centered6×4grid; busy status/no falsezero retained. |
|013 Tray fields | FIXED visible columns |05table containsBOX/SKU/name/unit/actual/held/available/view, exactly1BOX. |
|014 Dates/search context | PARTIAL, residualP2native dates | Saved/history dates localized and IDsearchplaceholdercorrect. Native date controls showUS10/28/2026orblankmm/dd/yyyyinVIcaptures; module date controls need locale-correct visible treatment. |
|015 Tablet density | RESIDUALP1, improved | Current per-view grid reduces page heights roughly24–46%but still uses stacked label/value cells.01=1693,02=1820,03=2058,06=2000,07=1910,08=2285,09=1779,10=1956CSS vs1280viewport. |

## Bounded residual correction

Retain44pxhitareas and font sizes. Collapse redundant identity headings and inline labeled tray/location/unit metadata, so compact record templates do not allocate separate full label/value grid rows for every field.03identity code+copy occupies44px, metadata can be one inline labeled line; qtytriad spans the compact record.02tile needs named locationheader/metadata/quantity-triad areas rather than generic8cellflow. Compact03/06/07/09/10summary/header blocks and detail fields while preserving all approved labels/units.03allocation still lacks the approved120/20/100quantitysumfooter; add accurate same-unit summary instead of bare9recordcount.

Desktop also became taller as44pxcontrols combine with24pxverticalcellpadding:02and08pageHeight1503,07=1358,10=1363. Reduce feature-local redundant cell padding/section whitespace while preserving44pxbuttons. No font shrink, fixed viewport clipping or locked shell change is approved by this finding.

## Preserved constraints

Read-only fixture values remain visible: DRV120−20=100, comparison120/118/−2, BOX00120/18/−2andothersmatched, KH001oneBOX. Match/short/over semantic badges remain text+color. Locked shared shell/Toast bytes unchanged. Actual images preserve full below-fold content where needed. Synthetic state selector reachability is not a realAPI/RBAC result.

Long identifiers/content, all locales/dark/zoom, supported768×1024, four foundation before/after and normalized per-region diffs remain separately required. Basic32capture completion and final manifest hashes are recorded in review metrics once capture finishes. A fixed finding closes only its stated observed scope, not whole-screen fidelity.

## Final32capture receipt

All32actuals (16Desktop+16Tablet) were independently viewed. Complete capture manifest SHA256 `e0a02a85b097d9d63b411012d02d968252b7c73862c1dc140ea8417058db60fa`; all32PNGhashes, source receipt and before/after height deltas are in [ROUND2_REVIEW_METRICS.json](ROUND2_REVIEW_METRICS.json). Both device sets report0horizontaloverflow,0sub44controls,0console/page errors and0failedrequests. These bounded passes do not waive P1density or establish pixel/API/RBAC acceptance.

The six system-state pairs11–16 now retain contextual HN04/ZX999/deniedhistory/BOXcopy with appropriate primary styling. Visible supplied-length contextual sentences fit their panels without truncation. Arbitrary longcode/name,translatedlabel,zoom and768pxwidth stress scenarios were not provided in this capture round and remain NOT_RUNbythisreviewer. Do not treat basiccopyfit as a longcontenttest.

**Final classification:**11originalfindings fixed in the stated observed scope;3partial (001/003/014);1P1residual (015). Overall visual gate stays FAIL pending finalscopedrepair and independent recapture. Root was notified immediately when the remaining P1 was observed.

## Feature-root minimum-height contribution

The baseline system/detail page height is inflated even when content fits. Source `.iad {min-height:calc(100vh - 70px)}` assumes a70pxheader offset but the wrapper sits inside an already padded shell main region. Captured16Desktop rootY94+rootHeight1010 plus24bottommainspacing yields1128pageheight against1080viewport; Tablet root/main spacing produces1338against1280. This48/58pxbaseoverflow is separate from the P1recorddensity. Correct only candidate `.iad` min-height to respect its actual containing block (or remove redundant viewport minimum and inherit the shell's available height); do not change GlobalShell. Preserve the state panel's semantic minimum content area and viewport-reachableCTA. A recapture must prove correct parent/root bounds rather than hardcode screenshotsizes.
