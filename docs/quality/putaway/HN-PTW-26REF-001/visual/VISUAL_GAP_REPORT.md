# Visual Gap Report — HN-PTW-26REF-001

Current DEV HEAD: 6ea167125643d10d6545b28df452511af54c6f09. Preview: http://127.0.0.1:5291. Capture matrix: Desktop 1672x941 DPR1 and Tablet 992x1586 DPR1, locale vi-VN, theme light. Credentials and fixture writes stayed in browser runtime memory.

## Baseline BEFORE coverage (26 reference-device states)

| Result | States | Count |
|---|---|---:|
| PASS | REF-04, REF-05, REF-06, REF-07, REF-10 (Desktop + Tablet) | 10 |
| FAIL | REF-01, REF-02 (Desktop + Tablet) | 4 |
| BLOCKED | REF-03, REF-08, REF-09, REF-11, REF-12, REF-13 (Desktop + Tablet) | 12 |
| NOT_RUN | None | 0 |
| **Total** | 26 | **26** |

All runnable states have real screenshots under before/. Full route, viewport, DPR, locale, theme, geometry and diagnostics are in BEFORE_MANIFEST.json.

## FAIL findings

- REF-01 queue: runtime rows are taller than the supplied reference, only seven rows fit in the 941px desktop viewport, footer is below the fold, and PUBLIC-DEMO-BOX-0009 precedes the reference rows.
- REF-02 orders: runtime table is clipped below the 941px desktop viewport and uses PUBLIC-DEMO/PREVIEW-TRAY identifiers absent from the supplied reference.

## BLOCKED findings

- REF-03 and REF-09 (S11 tray list/detail): operational source returns INCOMPLETE_POPULATION.
- REF-08: destination tray is required and submit remains disabled with no selection.
- REF-11: stale-version trigger unavailable.
- REF-12: empty/no-tray fixture unavailable.
- REF-13: forbidden history requires unavailable RBAC fixture.

No synthetic PASS is recorded for unavailable states.

PASS here means the requested runtime state was reachable and captured with no console/network/runtime defect observed; it is not an owner design approval or pixel-perfect claim.

## Post-fix AFTER coverage

The seed fix was retested in a fresh context on the same local matrix. `visual/after/AFTER_MANIFEST.json` contains 10 AFTER captures for REF-02, REF-03, REF-04, REF-07 and REF-09 across Desktop and Tablet. All have zero console errors, zero failed requests and no horizontal overflow. REF-03 and REF-09 are now reachable; their historical BEFORE `BLOCKED` entries remain unchanged. The AFTER evidence verifies runtime reachability and safety, while design fidelity remains subject to the reference comparison artifacts in `visual/diff/`.

Current disposition: REF-03/09 = **FIX VERIFIED**; REF-01/02 = **FAIL / P2 density and fixture gaps**; REF-04/05/06/07/10 = **PASS in captured scope**; REF-08/11/12/13 = **BLOCKED** by unavailable state or permission fixtures.



## Current HEAD AFTER retest

A fresh browser context on current HEAD `6ea167125643d10d6545b28df452511af54c6f09` reached S11 tray list/detail and impacted S14 order/history states in both viewports. `visual/after/AFTER_MANIFEST.json` records 10 captures with zero console errors, zero failed requests, and no horizontal overflow. The historical BEFORE BLOCKED status for REF-03/REF-09 is preserved; the AFTER evidence shows those routes are now runnable.
