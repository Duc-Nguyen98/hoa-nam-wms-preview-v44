# Independent functional QA

## Current CSS repair retest

Current candidate: `ecb2bdac211e392bb71d2f885725a6ecca3f3ce8`, static build `caea03c77fb6deb73deb274ef3c8e4679e4e269b105705212ff9c18d71988e15`. Fresh postrepair results: **6/6 finite checks PASS and11/11 selected broad checks PASS**, zero recorded page/console errors. Browser closed and App integration window released after completion.

- [Finite results](sol-postcss-finite/results.json): all ten views at400×640,768×1024 and800×1280; initial400px module-tab and tray-row/detail bounds checked before any pointer trial scrolling; exact initial rectangles, viewport-visible controls and center-hit observations retained. Three DatePicker popup/Enter cases passed. Actual200% browser zoom remains **NOT_RUN**.
- [Selected broad results](sol-postcss-broad/browser-results.json): all ten views on Desktop1920/DPR1 and Tablet800/DPR2; normal authentication; VI/EN/zh-CN and Light/Dark; selected primary/muted text contrast; default operational S16/S11/S20/S21 retained11/9/35/11 rows; canonical stock/events/versions unchanged. All audited source hashes matched before/after.
- [JavaScript lineage comparison](sol-postcss-lineage.json): both current JavaScript payload SHA256 values and byte lengths equal the prior `0dd7092` manifest recorded in visual/after/capture.json. Current files were rehashed against their manifest. The index asset filename differs because of bundler output naming. This equivalence supports lineage; it does **not** relabel the prior27/79 executions as new-build runs.

The earlier visual visibility defects are retested here through bounded initial geometry; visual reference fidelity remains the visual QA owner's decision. REAL_API/backend roles/database immutability remain **BLOCKED**. Full automated accessibility certification remains outside the bounded keyboard/role/contrast evidence. Component whole-run OOM status remains as described below; no redundant full component rerun was attempted after CSS repair.

## Full functional baseline before the CSS repair

Candidate tested: `0dd709236cb43f497f9e349349eebd9144e7175d`. Static build `1ef2777576367344d9f5e63bf6b345b310d334b10a5659b9da9f55eef374ea74`. Browser runs were serialized, used the existing normal synthetic login, and retained runtime credentials only in process environment. Static app: `127.0.0.1:5341`; actual component harness: Vite `127.0.0.1:5340`.

This section records the baseline before the narrow CSS repair. Its results are retained with their actual original source/build identity.

| Suite / gate | Fresh result | Evidence |
|---|---|---|
| Data/navigation/fixture/shared/putaway/S21 operational units | **PASS:27/27** | [Output](sol-independent-unit.txt), [exact committed-source hash equivalence](sol-independent-unit-provenance.json) |
| Normal application edge cases | **PASS:18/18**, zero recorded page/console errors | [Result](sol-final-edges/results.json) |
| Current-DatePicker broad application regression | **PASS:79/79**, zero recorded page/console errors, source unchanged | [Result](sol-final-broad/browser-results.json) |
| Actual S21 component shared failures/retry/accepted-data retention | **PASS:7/7**, source unchanged | [Result](sol-final-shared-retest/results.json) |
| Finite viewport and DatePicker bounds | **PASS:6/6**, zero recorded page/console errors | [Result](sol-final-finite/results.json) |
| Complete inventory/putaway component runner | **BLOCKED by environment interruption/OOM**;16 distinct granular cases have PASS observations across interrupted13+completed3 | [Explicit segment audit](sol-component-segment-audit.json), [first13 progress](sol-final-components/progress.json), [completed tail](sol-final-component-tail/results.json) |
| Actual browser200% zoom | **NOT_RUN** | Keyboard shortcut left layout800px/DPR2/visual scale1 unchanged; [observations](sol-final-finite/results.json) |
| Original broad file with obsolete native date-input selectors | **NOT_RUN** | Original file unchanged. Per orchestration steering, current-DatePicker copy is the product gate; no redundant obsolete-selector execution claimed. |
| REAL_API / backend roles / database snapshots | **BLOCKED** | [Source/data boundary audit](SOL_DATA_SCOPE_AUDIT.md) |

## Verified behavior

The normal app edge run retested warehouse/location dependency, incompatible location reset, five out-of-scope detail projections, pinned snapshot heading date, location projection/context, search application, saved query across refresh, Back/Forward, restored date validation, shared picker manual-date rejection, invalid draft retention and stale tray relation rejection. All18 passed against the identified static build.

The79-check broad run covers all ten projections, SKU/BOX/name search, reset, warehouse empty versus no-results, stock→SKU→BOX→tray navigation, movement scope, reconciliation quantities, saved-result identity/scope, date boundaries, invalid IDs, six distinct read states, retry, clipboard feedback, pagination, sorting, VI/EN/zh-CN, Light/Dark, selected text contrast, return focus/scroll and canonical operational repository preservation. Default S16/S11/S20/S21 retained11/9/35/11 rows respectively without the opt-in query. Canonical operational stock/events/versions were unchanged in both desktop and tablet contexts. MOCK expiry used a simulated9-hour clock advance and normal application gate; it does not certify real server expiry.

The S21 harness rendered the actual legacy report component with its existing dependency injection.401/session,403/permission,404/missing resource, network failure and loading remained distinct. A network retry accepted real fixture-model rows; a later read failure retained accepted rows and displayed existing Notice feedback. The initial seventh test searched within the screen despite Notice rendering in a document.body portal. Its first FAIL is preserved in `sol-final-shared`; the source-backed locator correction passed in the separately named full7-case retest. No application source changed for this correction.

## Responsive and accessibility limits

Finite checks exercised all ten views at400×640,768×1024 and800×1280, with no horizontal document overflow. Trial pointer actions may automatically scroll an ancestor. Their PASS certifies reachability after that normal browser behavior; it does **not** certify initial visibility, card placement or tab geometry. Visual QA's400px tab/tray visibility and600–900px movement-density defects remain open for the planned CSS repair. Initial geometry is added to the postrepair finite runner before trial scrolling.

DatePicker popups stayed within all three viewports and accepted manual dates through Enter. Broad tests cover meaningful heading focus on returns, selected keyboard/date entry, accessible state roles and selected contrast samples. This bounded evidence is not a complete automated WCAG audit.

## Environment incident

New user input interrupted the first component runner after13 PASS and removed both serving processes. This was detected on resume; servers were restarted against the existing immutable dist build, without rebuilding or changing authentication/source. The remaining three component cases passed with complete before/after source hashes. A subsequent whole16-case attempt terminated after six PASS with `FATAL ERROR: Zone Allocation failed - process out of memory` from Node PID15560. No test assertion failure preceded that termination. This runner has no final result receipt and is not reported as completed. Its partial progress and the explicit segment audit are preserved.

The16 granular cases include unknown/null counts, non-piece units, large positive/negative localization, partial totals, saved unknown result,12-row pagination/context, out-of-order retry fencing, persistent retry recovery, multi-SKU tray membership and six shared TrayReadState outcomes. Exact first-run implementation hashes match the completed tail and source recheck. These per-case observations remain useful evidence despite the blocked final whole-suite receipt.

Runtime model/effort telemetry is **NOT_VERIFIED** because it is not exposed to this worker. No fixture values, source reference, baseline, production record or business assertion was changed by this independent QA worker.
