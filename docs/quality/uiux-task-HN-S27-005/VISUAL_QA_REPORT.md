# S27 independent Visual QA

S00#3 · 2026-10-27 · base `bde0e4292ae4a7db569c7a5d56bce0c7ffa8e703` · branch DEV. Actual model runtime telemetry UNVERIFIED. No source or test implementation writes, commits, pushes, baseline replacement, or persisted authentication/session traces.

## Current verdict

**PARTIAL — final candidate `ebcf0d360e52bf2036c5a3c531563675ebf3580c` independently captured. Observed P1 integrity blocker and bounded fixes, including800px metadata overlap, are verified. V07 desktop modal geometry residual remains OPEN P2; exact visual fidelity is not accepted.**

The normal browser app did not expose its expected ready events on the clean base. Default25Oct displayed a valid empty state0. Selecting26Oct through actual DatePicker manual inputs rendered an integrity error. Both states were preserved at all four profiles. No normal ready modal was fabricated. The existing isolated S27 harness supplied four supplementary real-component ready states, explicitly labeled QA_SYNTHETIC, allowing bounded visual defects to be measured before implementation.

## Source custody and chronology

1. Read AGENTS and packet; inspected all four originals9/10/11/12 visually. Design Guardian agreed comparison assumptions and excluded modal backdrops from authority.
2. `visual/before/`: first actual-route attempt, normal authentication, default25Oct0; no modal. Preserved initial failures, no authentication storage/trace/HAR.
3. `visual/before-eventdate/`: actual normal default-state screenshot/DOM followed by UI-only26Oct selection; repeated integrity blocker. All four profiles completed; clean source/test status and exact base recorded before/after.
4. `visual/before-synthetic/`: existing `/tests/s27/harness.html`, actual OperationalAudit/AuditDetail, existing count3 fixture. Four profiles successfully captured list, full list, modal, modal crop, scrolled modal, computed styles/geometry, original trace values and console/network failures. Source custody stable/clean in every row and final end record.
5. All browser contexts closed before coordinator was notified to release source edits. Subsequent comparisons use saved evidence only.

Capture executable: `visual/capture.mjs`. Formal comparison executable: `visual/compare-isotropic.py`; historical anisotropic diagnostic executable: `visual/compare.py`. Credentials are supplied only through environment variables; no credentials/session storage are in owned tracked artifacts.

## Captures and measurements

| Profile | Ready evidence | List bounds CSS | Modal bounds CSS | Modal body client/scroll height | Console/network failures |
|---|---|---|---|---|---|
| Desktop1920×1080 DPR1 | QA_SYNTHETIC |322,238,1536×621|550,142.5,820×795|626/626|0/0|
| Tablet800×1280 DPR2 | QA_SYNTHETIC |24,457,752×1184|24,47.5,752×1185|991/991|0/0|
| Desktop1672×941 DPR1 | QA_SYNTHETIC; diagnostic |292,238,1348×621|426,73,820×795|626/626|0/0|
| Tablet992×1586 DPR1 | QA_SYNTHETIC; diagnostic |24,429,944×1184|108,200.5,776×1185|991/991|0/0|

Each modal exact ID was discovered from the visible real opener and asserted against its detail: `audit:00000000-660f-4264-a31d-5f037f0d64a5` (existing fixture identity). All four footer-reachability checks true; all body horizontal-overflow checks false. Full raw IDs retained in JSON and pixels. These are capture diagnostics, not functional/integrity certification.

The synthetic harness uses the real shell but does not reproduce every production shell prop, including wide-content geometry. Therefore shell offsets and absolute desktop panel widths are not defects. Comparison scope is the S27 panel/modal interior. Normal actual screenshots retain the production shell for audit.

## Comparison method

**Method correction after coordinator review:** formal sets are under `visual/before-synthetic-isotropic/`: canonical desktop/tablet list/modal plus four native diagnostics. Reference component ROIs are scaled uniformly from width only with Lanczos, anchored at the actual component top-left, and placed on a padded canvas. Height is never stretched. `registration.json` records original/actual SHA256, sourceSHA, original and actual bounds, uniform scale, projected reference height, and actual-minus-reference height residual in raster/CSS units. Each set includes byte-identical full original reference and actual copies, scoped crops, padded aligned reference/actual,50% overlay and3× difference. Modal shell/backdrop is excluded.

Historical `visual/before-synthetic-comparisons/` and `compare.py` independently scaled x/y; those outputs are preserved as diagnostic history only and cannot establish geometry fidelity. Earlier language suggesting that method retained every geometry discrepancy is superseded here. Dynamic record values remain unaltered; text differences are not a severity metric. Neither method infers original CSS viewport/DPR or grants a pixel PASS.

## Findings and outstanding work

Confirmed bounded defects V01–V06 are detailed in VISUAL_DEFECT_REGISTER.md: actual integrity blocker, missing desktop note, undersized code text, missing tablet divider/copy bounds, excess tablet footer space, and desktop36px copy targets. Coordinator preserves functional page-size selection while allowing scoped footer compaction. No P0 observed. Exact CSS values/viewport provenance remain DESIGN_GAP; final fidelity is not accepted.

After S2 commits a clean candidate, independently capture normal actual route and existing synthetic comparator at its exact SHA, regenerate separately named comparison sets, inspect four states, and close defects only from new evidence. Never overwrite BEFORE or immutable references. Hosted/deployed verification and functional acceptance remain separate gates.

## Independent AFTER — first candidate cc030be

Both normal and existing synthetic scenarios completed all four profiles at clean `cc030be40552845881d0a234a26e1e783f5e6e4f`. Source custody start/end remained stable; zero console/network failures. Evidence: `visual/after-normal-cc030be/` and `visual/after-synthetic-day25-cc030be/`; formal isotropic comparisons are the corresponding `*-isotropic/` directories. Default normal VNtoday27Oct displays0; selecting26Oct through the actual DatePicker yields62 source events. Synthetic source remains25Oct with3events. The legacy reason string in normal capture JSON mentions25Oct as a default; that wording is obsolete after the date fix. The actual default screenshot shows27Oct and is authoritative; selected26Oct and62count are correctly recorded.

Normal modal discovery uses actual toolbar search `stock-profiles.create` after the unfiltered62-list screenshot. The2matching events expose exact runtime IDs; the chosen openerID must match the detailID. A read-only actual adapter snapshot returns only selected audit/proof fields into `sourceReceipt`. All four raw detail IDs match their selected source record, `traceMatchesOriginal=true` at every profile. Random runtime IDs differ across fresh contexts; no screenshot IDs or source fixture were injected.

The note, tablet code text, information separator, footer spacing and44px targets are verified within bounded scope. V04 remains partial: actual app copy borders are transparent despite solid borders in the isolated harness. Source import order gives the later shared ghost-button rule equal specificity, so synthetic success does not close this defect. Coordinator requested one scoped specificity repair and final independent recapture. All current modal footers are reachable and bodies have no horizontal overflow. Exact geometry acceptance remains unresolved and isotropic residuals are retained.

Diagnostic native synthetic height residuals (actual minus reference after width-only scaling) changed: desktop list−60.46→−11.46CSSpx; tablet list+48.19→+20.19; desktop modal+35.93→+67.93; tablet modal+30→+42. Larger modal residuals reflect legible fonts/44px controls and remain visible in the formal padded comparison; they are not hidden by height stretching or labeled exact PASS.

## Final independent AFTER — d80255b

All final captures pin `d80255b94a3d6ad37e7c65eb34bb4f075e48deaf`, source tree `09c0f24b3c58e00e0db7498e70a747232de28920`, clean source/tests before and after. Browser Chromium156.0.8078.4, locale VI/light, timezoneAsia/Ho_Chi_Minh, pointer/touch and DPR recorded per profile. Actual runtime model remains UNVERIFIED. No runtime/test implementation edits, source commits, authentication storage, traces or HAR were written by Visual QA.

| Final evidence | Scenario / result |
|---|---|
| `visual/final-normal-d80255b/results.json` | All four actual MOCK profiles: default27Oct0; UI-selected26Oct62events; real stock-profile search→2matches; selected exact event/source proof and4raw IDs match. |
| `visual/final-synthetic-d80255b/results.json` | Existing immutable25Oct3-event real-component comparator; canonical desktop/tablet plus desktop-native successful. Last native-tablet navigation failed due28 ERR_NETWORK_CHANGED module requests; preserved. |
| `visual/final-synthetic-tablet-native-retry-d80255b/results.json` | Only failed native-tablet profile retried successfully at the same clean SHA. No errors/network failures. |
| `visual/final-review-d80255b/registration.json` | Four canonical reference/BEFORE/final-AFTER sets with full capture paths/hashes, padded isotropic alignments, triptych boards, reference-before/reference-after/before-after overlays and differences. |
| `visual/final-normal-d80255b-isotropic/` | Actual62-event normal list/profile-detail formal sets at all four profiles; source values intentionally differ from references. |
| `visual/final-synthetic-d80255b-isotropic/` plus retry equivalent | Six successful formal sets plus two retry native-tablet sets; same source/fixture, no failed-profile screenshot promoted to final. |

Zero console/network failures on all successful final profiles. Every modal footer is reachable, no horizontal overflow is observed, all four trace values are within the scrolled body, fonts are loaded, and no Unicode replacement characters occur. Every copy control remains44×44CSSpx. Actual tablet copy borders are now solid; information separator and16px code text remain. Reload leadingIcon count is0 in every list receipt; visible tablet description is exactly “Theo dõi thao tác và truy vết sự kiện.” while desktop retains full scope/time copy.

### Final geometry and limits

| Native diagnostic component | BEFORE | First candidate | Final | Reference observation |
|---|---:|---:|---:|---:|
| Desktop modal height |795|827|789|760|
| Tablet modal height |1185|1197|1157|1156±3|
| Tablet header |107|107|97|~96|
| Tablet identity |117|117|105|~99|
| Tablet information box |~222|~222|216|215|
| Tablet trace box |308|320|314|312|
| Desktop footer |85|85|77|~76|

Native tablet modal uniform-width crop residual is2px (crop rounding and approximate reference bounds are explicit); desktop remains~29.93px taller. Canonical residuals remain desktop list−106.50, tablet list+251.20, desktop modal+28.93, tablet modal+60.75CSSpx. The canonical tablet reference is width-scaled from a992px raster to752CSSpx content; the wider native diagnostic is a different assumption. Neither is approved source viewport/DPR, so these residuals are disclosed without a pixel PASS.

V07 desktop geometry remains OPEN P2 after the bounded spacing improvement. Final board inspection also confirms V10 OPEN P2 at800CSSpx: “Nguồn thực hiện” metadata heading visually joins “Đối tượng” in the five-column card row. It is present in BEFORE and final actual/synthetic; the source field is109.73CSSpx wide with nowrap16px text. This concrete readability defect is separate from missing design tokens/DPR. Coordinator’s final freeze requested classification rather than another optional repair. No P0/P1 remains from visual observation, but these P2 defects and authority gaps prevent exact visual acceptance.

Four review boards were opened and inspected alongside final actual native list/modal captures. Modal backdrops and synthetic shell offsets remain outside authority. Reference data/IDs and synthetic second-event semantics remain intentionally different. Hosted/deployed SHA, browser/device certification beyond these declared profiles, live API integrity, and EN/ZH/dark semantics are separate gates; these local VI/light screenshots do not certify them.

## Final wrap candidate — ebcf0d3 (supersedes d80255b final disposition)

Coordinator reopened only confirmedV10 because no-overlap is explicit acceptance. Source diff fromd80255b is exactly one owning card `dt` declaration, `white-space:nowrap`→`normal`; protected/shared sources remain outside Visual QA edits. Fresh canonical desktop1920×1080 DPR1 and tablet800×1280 DPR2 captures at clean `ebcf0d360e52bf2036c5a3c531563675ebf3580c` completed normal62/source-proof and existing synthetic3 scenarios. Source tree `4360e98244c6308d14de19d50301fb0945c231f6`, tests tree `85450783eeadd34277b48bcc0ebd15bd36e3f8be`; browser156.0.8078.4. All browser contexts are closed.

Authoritative final receipts: `visual/final-normal-ebcf0d3/results.json`, desktop in `visual/final-synthetic-ebcf0d3/results.json`, tablet in `visual/final-synthetic-tablet-retry-ebcf0d3/results.json`. The original synthetic tablet attempt had26ERR_NETWORK_CHANGED module request failures; it was preserved and only that failed profile was retried. Successful final profiles have0console/network failures, stable clean source custody,62actual/3synthetic counts, exact selected profile IDs/raw4-ID matches,44px copy targets, solid tablet borders, correct descriptions/text-only reload, loaded fonts, no replacement characters, no modal horizontal overflow, reachable footer and four trace values visible after scrolling.

At800px the source metadata label now uses two19px text fragments completely inside its109.734375px column: first right307.59375, second right251.8125; adjacent object starts342.0625. Independent Range checks report0label intersections across10actual visible cards and3synthetic cards, with all5metadata labels retained. Final actual/synthetic tablet screenshots were opened and visually inspected. V10 is verified fixed; d80255b overlap evidence remains immutable history.

Four final formal review sets under `visual/final-review-ebcf0d3/` provide reference/BEFORE/final-AFTER padded isotropic alignments, boards, overlays, differences, geometry and hashes. Normal actual-source formal sets remain separate under `final-normal-ebcf0d3-isotropic/`; comparator sets use successful desktop and tablet retry phases. `visual/EVIDENCE_INDEX.md` and `visual/FINAL_CAPTURE_MANIFEST.json` index final receipts, transfers and final asset hashes. Historical warped diagnostics and prior candidates remain separately named.

Native1672/992 d80255b captures are transferred with explicit qualification, not rerun or relabeled final SHA. The one-declaration source diff affects card-heading wrapping; desktop table and modal rules are unchanged; S2’s992 Range test shows enough width to retain one line. Independent final canonical captures verify the affected800case. No claim is made that final-native runtime was independently recaptured.

Final verdict remains **PARTIAL**: V01–V06/V08–V10 verified within observed local MOCK scope, V07 desktop modal residual OPEN P2, exact CSS/font/icon/color/source-DPR gaps unresolved. No P0/P1 remains from visual observation. Existing reference source-DPR uncertainty and the remaining concrete geometry residual are separately stated; neither is converted into arbitrary visual PASS.
