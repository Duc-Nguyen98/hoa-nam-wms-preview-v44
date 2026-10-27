# HN-NC-UIUX-003 — S00#2 implementation evidence

Date: 2026-10-27. Owner: S00#2 native `implementation_nc`.
Base: `78752811af4b0434c958d604dc52ca445cdbeede`, branch `DEV`.
CSS fix: `3ca0ef24e4f3db4e90bbb1e26f0d117c356246fe`.

## Authority and correction

Read AGENTS.md, task packet and Design Guardian bounded correction addendum. Only `src/notifications/notifications.css` changed in this commit. Desktop placement, shared modal/icon source, font/palette, sample data, business logic and baseline bytes were preserved.

- VQ-NC003-01: the 992×1586 CSS/DPR1 diagnostic actual modal origin was x56/y162 versus reference approximately x61/y261, while dimensions already matched. Existing 801..1100 portrait rule lacked reference-normalized translation. Added positive translation capped by available free space less 24px. This is an authorized implementation hypothesis; original reference CSS viewport/DPR remains unknown.
- VQ-NC003-02: shared close path occupies half the SVG viewBox. Existing 18px SVG painted a cross near 10px, versus reference near 19–20px. Notification-only portrait SVG is now 36px, with padding4 and flex-shrink0 inside the retained 44px control. No shared glyph/path change.

Independent S00#3 owns painted-pixel comparison and after/reference/diff acceptance. These owner-local checks establish geometry and regression safety, not all-pixel visual approval.

## Executed commands and results

1. `git diff -- src/notifications/notifications.css`: scoped changes confirmed.
2. `npm run build`: exit0; TypeScript no-emit PASS, Vite build PASS (618 modules). Existing large bundle remains; this patch adds no dependency.
3. `node --import ./tests/s27/css-hook.mjs --import tsx --test tests/canary/badge-contract.test.ts tests/notification-center.test.ts tests/notification-state.test.ts tests/actions/notification-target.test.ts`: exit0, 20 tests PASS, zero failed/skipped. Includes badge0/1/9/10/99/100/999, read-state/idempotency, actor isolation and safe deep-link identity.
4. `npm run dev -- --host 127.0.0.1 --port 5262 --strictPort`: local Vite server; isolated `tests/visual/notification.html` fixture only, no production writes.
5. Inline Playwright Chromium geometry diagnostic opened `#open-center`, waited for open dialog and fonts, measured modal/close/SVG bounds, document/modal horizontal overflow and page errors. Eleven viewport profiles passed ≥24px edge guards, 44×44 close target, no horizontal overflow and zero page errors. Initial harness invocation failed strict selector resolution because closed shell and fixture dialogs both exist; corrected selector to `.hn-notification-center[open]`, reran all profiles successfully. No application change was made for that harness error.
6. `git diff --check -- src/notifications/notifications.css`: exit0. CSS-only commit created; no push/deploy.

## Geometry measured after correction

All values CSS pixels, headless Chromium, DPR1, isolated safe visual fixture. Values rounded to three decimals.

| Viewport | Modal x/y | Modal w/h | Translation x/y | Close / SVG | Containment |
|---|---|---|---|---|---|
| 992×1586 | 61.456 / 261.125 | 880 / 1262 | 5.456 / 99.125 | 44 / 36 | PASS |
| 800×1280 | 30 / 110 | 740 / 1060 | none | 44 / 18 | PASS |
| 801×1280 | 24 / 24 | 753 / 1232 | 0 / 0 | 44 / 36 | PASS |
| 900×1400 | 24 / 114 | 852 / 1262 | 0 / 45 | 44 / 36 | PASS |
| 1024×1366 | 77.632 / 80 | 880 / 1262 | 5.632 / 28 | 44 / 36 | PASS |
| 1100×1600 | 116.050 / 269 | 880 / 1262 | 6.050 / 100 | 44 / 36 | PASS |
| 900×1000 | 24 / 24 | 852 / 952 | 0 / 0 | 44 / 36 | PASS |
| 801×802 | 24 / 24 | 753 / 754 | 0 / 0 | 44 / 36 | PASS |
| 1774×887 | 391 / 113.5 | 1088 / 728 | 48 / 34 | 44 / 18 | PASS |
| 1920×1080 | 464 / 210 | 1088 / 728 | 48 / 34 | 44 / 18 | PASS |
| 1100×800 landscape | 24 / 48 | 1052 / 728 | 0 / 12 | 44 / 18 | PASS |

## Handoff / limitations

S00#1 received CSS SHA and results for independent real-application Visual/Functional QA. Screenshots/diffs are owned by S00#3 and must not be substituted by the isolated harness measurements above. No production API integration, hosted CI, preview provenance, alternate-state artwork or Dark/locale pixel approval is asserted here.

Requested model: Sol/high fallback under parent routing because Terra unavailable. `ACTUAL_MODEL=UNVERIFIED`, `ACTUAL_REASONING=UNVERIFIED`; no authoritative runtime telemetry was exposed.

## Serialized semantic correction

Interim semantic source/test commit: `e5ba486fb82a05fcf6cb7aa7b56fda17dc4bcb16`. Source clean at handoff. This is not release-ready because the focus regression remains FAIL.

After CSS commit, S00#1 extended ownership to `src/shared/GlobalModal.tsx` and `src/toast/GlobalToastProvider.tsx` for S00#4 independently confirmed axe defects. No focus/lifecycle or design lease was added.

- `landmark-banner-is-top-level`: actual application renders shared modal outside main/section landmarks, so its native header was exposed as a page banner nested inside a dialog. Replaced the wrapper with a neutral div retaining the same class, heading, description, close button and events. CSS search found all owning header selectors use classes, preserving layout.
- `aria-prohibited-attr`: toast container was a generic div with aria-label. Added role=group, preserving the localized name, individual status/alert cards, atomic announcement, suspension/inert state and placement.

Regression files: `tests/functional/wave-ad/shared-semantics.spec.ts` and `tests/functional/shared-semantics.config.ts`. The focused configuration serves local port5262. It uses safe Preview login and real shell bell; no production connection/data mutation. Existing wave-ad wildcard discovers this spec too. It verifies heading/name, no nested banner, axe landmark/ARIA rules, Escape/opener focus, named feedback group, mark-all feedback, live status/atomicity, dismiss and focus fallback.

Scanner prerequisite: pinned axe4.14.0 runtime at `output/hn-nc-003-axe-runtime/node_modules/axe-core/axe.min.js`, or `QA_AXE_SCRIPT`. Missing runtime fails rather than skips. S00#5 must provision it before invoking this spec in hosted CI; no package or lockfile change was made within this lease.

### Reproduction evidence and test calibration

- Initial port5206/wave-ad invocation had one fixture startup timeout and other selector/assertion failures; this was not accepted as defect evidence. Dedicated config used known local port5262.
- `output/hn-nc003-semantics-reproduced/browser-results.json`: generic toast did not resolve as a named group on both widths, expected FAIL. Fixture nested-banner locator passed because its dialog sits inside main; this demonstrates why isolated context cannot certify real application landmark placement.
- `output/hn-nc003-semantics-actual-before/browser-results.json`: real authenticated application nested-banner assertion failed on both1920/800 profiles before source edit (banner count1, expected0). S00#4 owns independent full axe before evidence.
- `output/hn-nc003-semantics-axe-before/browser-results.json`: fixture axe detected prohibited aria-label and named-group lookup failed; all4 expected FAIL.
- First after run fixed actual banner and toast semantics, but fixture-only final focus expectation failed because fixture retains a hidden dialog/origin while actual application unmounts it. Retained that evidence; moved regression to actual application to test its real lifecycle. No runtime focus logic was changed or failure hidden.
- `npm run build` after semantic source edits: exit0, typecheck PASS, Vite build PASS,618 modules; existing large-chunk warning remains.

Independent S00#4 full axe/shared regression and S00#3 final geometry remain separate acceptance gates; implementation validation does not replace them.

### Actual lifecycle follow-up

The subsequent all-actual-app four-case run at `output/hn-nc003-semantics-actual-after/browser-results.json` produced **2 PASS / 2 FAIL**: real-app dialog semantics/targeted axe and Escape/opener focus passed at1920/800; feedback group, live status, mark-all and dismiss succeeded, but the final `#main-content` focus expectation failed at both widths. The earlier suspected fixture-only difference therefore does not explain the full failure. Reported to S00#1 and S00#4 for independent confirmation; do not classify this as resolved or remove its test. A possible cause is restoreToastFocus checking origin connectivity without visibility; this remains a hypothesis until independently reproduced. No focus runtime change was made under the semantic-only lease.

Preserved raw reports/screenshots/traces under `implementation/hn-nc003-semantics-reproduced/`, `implementation/hn-nc003-semantics-actual-before/` and `implementation/hn-nc003-semantics-actual-after/` relative to this report. These are local MOCK Preview accounts only. No installed scanner/runtime/dependencies were copied. First report records a fixture comparison; the latter two record real application shell flows.

## Independent reproduction → focus recovery

S00#4 independently confirmed FQ-NC-003-A11Y-03 (P2) on clean interim e5ba486: toast Close via keyboard left BODY focused; origin remained connected inside a hidden dialog with zero client rects, while main-content remained focusable. Raw independent evidence belongs to S00#4 under `functional/focus-before/`.

S00#1 extended the serialized lease. Fix commit: `8e40b6a8def02db8c3db4acc96f9c3031702d32b`, only GlobalToastProvider.tsx. Origin selection now requires client rects, visible computed visibility, enabled state and no inert ancestor. Existing explicit restoreFocus callback branch, active-modal branch and existing main-content fallback remain in order. No events/timing/lifecycle or business change.

Unchanged four-case shared-semantic regression rerun after this fix: **4/4 PASS**, no assertion removed or weakened. Checks actual application name/heading, no nested banner, targeted axe rules, Escape → bell focus, named feedback group, mark-all, live status/atomicity, dismiss and main-content fallback. Receipt: `implementation/hn-nc003-focus-fixed/browser-results.json`. This owner validation preceded the separate residual CSS commit; final independent QA must bind results to the final source SHA.

## Residual composition correction

Final source SHA: `e57f6aed038e81d8b6a3b4f0eeccbb4c853012dc`, CSS-only commit following focus fix. No further source edits planned. Source clean at handoff.

Read S00#6 residual geometry addendum and S00#1 residual composition lease. Applied the precise adjacent-unread li selector only inside801..1100 portrait:2px `var(--hn-surface)` border, second unread child min-height115 instead of116. At992x1586 the slot stays117px, the following rows/list/footer remain fixed, and boundary becomes2px. At801px a naturally wrapped row134px remains134px (not clamped); total slot grows1px to accommodate separation. No fixed heights, sample-ID selectors, typography/palette or shared shell changes.800px profile remains unchanged.

Optional scoped desktop footer calibration was measured before source edit at1774x887,1920x1080 and1366x768. Raising existing desktop padding-top14→19 moves divider up5px while every measured footer control and CTA bound remains identical. Applied that measured candidate in the same CSS commit. At1774x887: footer top769.5→764.5, footer bottom824.5 unchanged; nav/buttons y784.5 unchanged; notice y795 unchanged; CTA y688.5 unchanged. This is a reference-derived local calibration, not a recovered global token or pixel-perfect approval.

Final `npm run build` on e57f6ae: typecheck PASS/build PASS,618 modules; buildId `f2ff88178730c28728261e0d0d39d3bc2a7161a1e10a0a7974595efbbd44c5e0`. Existing large bundle warning remains. `git diff --exit-code HEAD -- src` exit0. Separate commit SHAs were sent to S00#1/S00#4 before final independent tests. No push/deploy.

Final owner geometry receipt: `implementation/residual-geometry.json`, sourceSHA e57f6ae and CSS SHA256 captured, working source diff empty. Nine profiles (992×1586,801×1280,900×1000,1024×1366,800×1280,1774×887,1920×1080,1366×768 plus992×1586 long state) all retain24px viewport containment, no modal/document horizontal overflow and zero page errors. All measured footer controls/CTA remain unchanged. Method explicitly records actual final source first, then a local injected reversal of only the residual CSS patch for comparative geometry; no original screenshot/baseline/source was rewritten. This isolated fixture check is not independent real-app visual acceptance. S00#3 and S00#4 own final screenshot/diff and full functional/axe verdicts on finalSHA.

## Final light contrast correction

Superseding final source SHA: `76059cce616543356c623ec248c6350ddd07cdf5` (CSS only,4 added lines). Base e57f6ae remains the source for the earlier geometry/build receipts; those results must not be relabeled as tests of76059cc.

Read S00#6 scoped contrast disposition and S00#1 final contrast lease. S00#4 had independently measured placeholder3.4024:1 and warning status3.4246:1 on real light UI. Reused existing shared status text family within `html:not([data-hn-theme='dark']) .hn-notification-center`: placeholder opacity1; warning text#835811; success text#286645. Added a provenance comment marking these as scoped accessibility candidates, not new locked design tokens. Source palette variables, fills, list icons, shared status classes, dark styling, layout, font metrics, baseline bytes and business behavior remain unchanged. Decorative inline status icons may inherit corrected text color under existing styles; no glyph or feature icon variable changed.

Calculated sRGB ratios using supplied solid backgrounds: placeholder5.851331:1 onwhite, warning5.552797:1 on#fff0d8, success6.030105:1 on#def7e6. These calculations are not browser results. Success was still a source-backed sibling risk until S00#4 opens its supported safe state; no success feature/state was added. Final computed actual contrast, theme preservation and regression are assigned to independent QA.

`implementation/contrast-source-receipt.json` records finalSHA, CSS SHA256, clean source diff, exact changed-file scope and executed arithmetic. `git diff --check` passed before commit. No duplicate build was run by S00#2 on this SHA per S00#1 serialized handoff; final quality:pr/build is owned by S00#1, browser/contrast by S00#4 and final screenshots/diff by S00#3. All earlier test results retain their own source provenance. Final source SHA was sent to parent and S00#4; no further source edits, push or deployment.

## Coherent Tablet composition — final serialized batch

Superseding source SHA: `830f83d48eac84c3e2467de7f41c388439cc7eb2`, CSS-only,9 insertions/6 deletions. Read S00#6 coherent calibration and stable113 disposition through S00#1. One owning batch inside the existing801..1100 portrait rules adjusts toolbar top/gutters, filter slot, group spacing, controlled14px row bleed and footer reserve. Uniform row min-height113px is independent of selected/read state. The second adjacent unread row min-height112 compensates its existing2px surface separator, retaining occupied-slot pitch. No nth-record/sample-ID selectors, selected/read density, fixed heights, font/glyph/palette/business/shell/baseline edits. Desktop/800px remain outside the changed scope.

### Measured candidate and state decisions

Before editing source, measured complete DG candidate and stable112/113 alternatives by injected CSS on real authenticated local MOCK Preview. Preserved original76059cc before screenshot/measurements. Stable113 was chosen with S00#1/S00#6; no later one-pixel override stack was added.

Evidence correction: an earlier implementation message said a selection jump was measured for the108px selected/read candidate. Raw `proposedDefault` and `proposedAfterSelection` actually show identical bounds after normal detail/Back restores default selection. That earlier description was inaccurate and was corrected to S00#1/S00#6 before commit. Reject108 as a superseded state-dependent candidate/risk, **not a browser-confirmed selection defect**. Stable113 occupied-LI invariance during actual selection/Back and a real unread→read command is directly measured. A row's own painted edge can move1px when the separator changes2→1; matching LI slots verifies downstream list geometry instead of incorrectly equating border paint with list jumping. Initial112 probe's row-box equality check falsely classified that boundary change; raw FAIL is retained, not hidden or called a production bug.

### Actual992×1586 CSS/DPR1 geometry

| Shape | Before76059cc | Actual chosen113 candidate |
|---|---|---|
| Search x/y/w/h | 98.456 /422.125 /806 /56 | 94.456 /431.125 /814 /56 |
| Filter bottom | 557.125 | 574.125 |
| First group bottom | 622.125 | 643.125 |
| Second group top/bottom | 1118.125 /1183.125 | 1125.125 /1192.125 |
| Icon x, all six | 116.456 | 112.456 |
| Icon y, in order | 645.125 /762.125 /879.625 /996.125 /1206.125 /1323.125 | 664.625 /778.625 /893.125 /1006.625 /1213.625 /1327.625 |
| Effective row heights | 116 /116 /115 /116 /116 /116 | 113 /113 /112 /113 /113 /113 |
| Row/fill right | 904.456 | 922.456 |
| Footer top/height | 1453.125 /69 | 1439.125 /83 |

Modal stays61.456/261.125/880/1262; icons remain70×70. Diagnostic mean absolute error over14 declared geometric anchors reduced11.017857→1.333000 CSSpx relative to S00#3/DG raster estimates. This metric is not an approved tolerance or visual PASS. Max icon-Y residual5.625px stays **P3 OPEN**; original export/DPR, typography/glyph metrics and missing pixel threshold remain DESIGN_GAP. Reference bytes unchanged.

### Owner-local source validation and handoff

`implementation/coherent-tablet-source/candidate-results.json` records real owning-source candidate before commit, base76059cc plus exact diff. Selection/Back and unread→read occupied slots remain identical; search, unread filter, detail/Back and12 Tab/ShiftTab steps stay inside dialog. Seven neighboring/short profiles801×1280,801×802,900×1000,1024×1366,1100×1600,800×1280 and1774×887 have no page/modal horizontal overflow or page errors; modal envelopes retain24px viewport guards. These owner samples useDPR1; independent800DPR2, themes/locales/full behavior and final visual comparison remain QA-owned. No blanket reachability/scroll-restoration certification is inferred from geometry alone.

Raw folders `implementation/coherent-tablet/` (112 diagnostic), `coherent-tablet-113/` (injected candidate, original before/actual capture, geometry-improvement.json), and `coherent-tablet-source/` (owning-source actual screenshot/measurements) preserve evidence. `coherent-tablet-probe.mjs` documents executed flow. Postcommit custody receipt verifies tested patch equals committed patch and source diff empty. S00#1 received finalSHA and test limits before independent final impacted QA; no further calibration/build duplication, source edits, push or deploy by S00#2.
