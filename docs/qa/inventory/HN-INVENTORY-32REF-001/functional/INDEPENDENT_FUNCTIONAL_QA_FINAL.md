# Independent functional QA — HN-INVENTORY-32REF-001

Date: 2026-10-29. Final source: `3f8cf44ac531d72d50a42003cafecf6d726085ca`. Static build: `ec7027a6f60c22cd53ab541636359823832a48424ecb8e688a39a6e7a52b0dab`. Mode: **MOCK**. Normal application URL: `http://127.0.0.1:5341/?inventoryDesign=20261029#/preview/S16?view=stock`.

The approved inventory fixture flows pass at Desktop 1920×1080 DPR1 and Tablet 800×1280 DPR2. The additional 768×1024 stock action probe passes. One **P2 narrow reflow limitation** remains at 400×640, a layout simulation of halving the 800px viewport: card quantities and detail controls are initially clipped. This is not a claim of actual browser zoom testing. REAL_API and production RBAC remain BLOCKED.

## Evidence custody and actual execution counts

Only test/evidence files were edited by this QA role. No application source, authentication implementation, business adapter, or canonical records were patched. Normal-app runs used the ordinary login, start-work confirmation and public setup. Each batch used one fresh browser context, then closed the browser. Canonical business IndexedDB was read without mutation for before/after comparison; raw stored business data and credentials were not written into evidence.

The final change from `baebfc49aa15452a4c2720b62e045f6301bfb49e` is the light muted text token `#637c98` → `#536d89` plus trailing blank-line removal. **Both production JavaScript assets have byte-identical SHA256 hashes across the two builds**. [Equivalence receipt](final-3f8cf44/javascript-equivalence.json), [source diff](final-3f8cf44/source-equivalence.diff), [final build metadata](final-3f8cf44/static-build-info.json). Earlier logic receipts below retain their original SHA; they are reused by equivalence, not represented as executions on the final SHA.

| Execution group | Executed source | Actual result | Receipt |
|---|---|---|---|
| Normal-app desktop core | baebfc4 | 19 PASS, 0 FAIL | [JSON](final-baebfc4/static-desktop/browser-results.json) |
| Normal-app tablet core | baebfc4 | 12 PASS, 0 FAIL | [JSON](final-baebfc4/static-tablet-core/browser-results.json) |
| Normal-app tablet tail | baebfc4 | 10 PASS, 1 FAIL; muted-text defect superseded by final retest | [JSON](final-baebfc4/static-tablet-tail/browser-results.json) |
| Six original isolated edge regressions | baebfc4 | 6 PASS | [JSON](final-baebfc4/edge-original-six/results.json) |
| Four business repair edges | baebfc4 | 4 PASS | [JSON](final-baebfc4/edge-new-short-fixed/results.json) |
| Injected retry, frozen snapshot, pagination/sort, long copy, legitimate complete-zero | baebfc4 | 5 PASS | [JSON](final-baebfc4/injected-five/results.json) |
| Critical flow, muted contrast, invariant, reflow | **3f8cf44** | 4 PASS, 1 FAIL at narrow 400px | [JSON](final-3f8cf44/critical-contrast-reflow/browser-results.json) |
| Vietnamese six states × two themes + invariant | **3f8cf44** | 13 PASS | [JSON](final-3f8cf44/locale-vi/browser-results.json) |
| English six states × two themes + invariant | **3f8cf44** | 13 PASS | [JSON](final-3f8cf44/locale-en/browser-results.json) |
| Chinese six states × two themes, pointer follow-up + invariant | **3f8cf44** | 14 PASS | [JSON](final-3f8cf44/locale-zh-reachability/browser-results.json) |
| Non-DRV current and saved variance coverage, isolated component | **3f8cf44** | 1 PASS | [JSON](final-3f8cf44/variance-coverage/results.json) |

Thus final-source normal-app batches contain **44 PASS / 1 FAIL**, including all **36/36** translated semantic-state combinations. The separate final-source component probe adds **1 PASS**. The reused baeb receipts contain **41 normal-app PASS**, **10 edge PASS**, and **5 injected PASS**. These are execution counts, with repeated invariant checks; they are not a count of distinct requirements. All cited valid browser batches have zero recorded page/console errors and unchanged source hashes where the runner records custody.

## Confirmed behavior

- Stock BOX/SKU/name search, warehouse and location filters, retained no-result query/reset; HN04 empty is distinct from zero search matches.
- SKU → BOX allocation → BOX → exact tray joins, return context and browser back; BOX movement is scoped to the selected BOX. Invalid SKU/BOX/tray/snapshot IDs return not-found instead of the first row.
- DRV actual120, held20, available100; counted118 and discrepancy−2, spread across nine BOX. BOX001–003 each20/5 and BOX00410/5 are distinct; location A01-09 projects only10/0/10.
- Reconciliation has three match, three shortage, three excess rows. History warehouse/result/date filters carry scope into saved detail and difference. Saved snapshot identity/date/values stay pinned when an isolated coherent live adapter changes to240. Current and saved difference reject a mismatched warehouse/SKU scope.
- PSU actual340/held50/available290 stays known while BOX/TRAY counts and BOX allocation/variance totals remain explicitly unavailable. Incomplete fixture coverage never becomes zero. Conversely, an injected SKU with explicit complete coverage and a true zero balance retains legitimate zero counts.
- History date validation enforces the rolling90-day lower bound, chronological range, and no future date; invalid submission preserves the last accepted rows. Saved-result tabs filter9/3/3/3 and preserve snapshot identity. Movement BOX/type/date/query filters affect rows and reject future dates.
- Exact clipboard payload and toast; injected long identifier remains exact. The 12-row adapter paginates9→3→9, boundaries disable, global sort reverses order. The normal nine-row fixture correctly disables both boundary buttons.
- Loading/empty/no-results/error/forbidden/not-found clear unverified rows and avoid a false successful timestamp. The fixture error retry remains an error when the fixture adapter keeps failing; the injected retry transitions error→loading→error, then ready on the second successful attempt.
- List→detail focuses the heading; returning restores meaningful focus and scroll657→657 in an800×640 viewport. Visible tablet controls satisfy44×44 in the original edge probe.
- The actual MOCK session lifetime is eight hours. A normal authenticated session with browser clock advanced nine hours cannot reopen the candidate route and returns to login; no session/auth storage patch was used.
- Default, non-opt-in S16/S11/S20/S21 remain accessible with unchanged observed row populations11/9/35/11. Canonical operational snapshot revision69 and all stored stock/events/versions remain exactly equal before and after fixture reads/navigation.

## Defect disposition and remaining limit

INV-F-001 through INV-F-009 are closed by the cited core/edge receipts: history no-results, reconciliation empty, location quantity scope, saved scope fence, touch targets, localized pagination/dates, unknown allocation coverage, movement/saved-tab no-results reset, and current scope fence.

INV-F-010 muted text contrast is **closed on final source**. Computed light text `rgb(83,109,137)` gives **5.36195:1** on white at12px and **4.87090:1** on `rgb(238,245,250)` at11px. Dark samples give6.56198:1 and7.73567:1. [Computed observation](final-3f8cf44/critical-contrast-reflow/muted-contrast-observation.json). The separate primary button sample was5.29479:1 on baeb. These selected samples do not constitute a full WCAG AA audit.

**INV-F-011 — P2, OPEN: narrow400px reflow clipping.** At400×640, the stock wrapper has clientWidth360/scrollWidth563 with `overflow-x:hidden`; every initial detail action is at x535–581, beyond the viewport. Quantities/actions are visually clipped in the [screenshot](final-3f8cf44/critical-contrast-reflow/failure-1.png). The follow-up normal Playwright click can auto-scroll the hidden wrapper and open the detail successfully, so loss of all programmatic/focus access is not asserted. At768×1024 the action is fully visible at x685–731 and opens normally. [Reachability geometry](final-3f8cf44/locale-zh-reachability/reflow-reachability.json). This extra narrow simulation lies below the supplied768/800 tablet profiles; it is a documented reflow limitation, not an approved-profile blocker. Actual browser zoom remains NOT_RUN.

## Regression images and limits

Before: [Desktop S16](before-desktop-S16.png), [S11](before-desktop-S11.png), [S20](before-desktop-S20.png), [S21](before-desktop-S21.png); [Tablet S16](before-tablet-S16.png), [S11](before-tablet-S11.png), [S20](before-tablet-S20.png), [S21](before-tablet-S21.png).

After, captured on baeb with final JavaScript equivalence: [Desktop S16](final-baebfc4/static-desktop/after-desktop-S16.png), [S11](final-baebfc4/static-desktop/after-desktop-S11.png), [S20](final-baebfc4/static-desktop/after-desktop-S20.png), [S21](final-baebfc4/static-desktop/after-desktop-S21.png); [Tablet S16](final-baebfc4/static-tablet-tail/after-tablet-S16.png), [S11](final-baebfc4/static-tablet-tail/after-tablet-S11.png), [S20](final-baebfc4/static-tablet-tail/after-tablet-S20.png), [S21](final-baebfc4/static-tablet-tail/after-tablet-S21.png).

The parent's32 final static design captures are the visual reference evidence, separate from these functional regression screenshots. Component injection runs exercise the actual component with bounded fixture adapters; they do not prove account authorization, real service integration, backend storage, or final screenshot fidelity.

REAL_API/backend reconciliation/history/count/reservation/allocation contracts and role-specific authorization are **BLOCKED**. Real server session expiry, backend deny-versus-not-found behavior, real failure/retry/network concurrency, screen-reader audit and actual browser zoom are **NOT_RUN**. See [RBAC report](REGRESSION_RBAC_REPORT.md) and [state matrix](SCREEN_STATE_MATRIX.md).

Earlier runs affected by Vite HTML-artifact HMR/stale modules, browser resource/protocol errors, initial harness import errors, or about:blank localStorage setup are invalid environment/harness evidence. They are preserved in their original folders and excluded from these valid pass/fail counts. No blank/error page from those runs is promoted to a product defect.

## Current unit and provenance receipts

The release owner supplied final receipts for exact source `3f8cf44ac531d72d50a42003cafecf6d726085ca`; this QA role reviewed their recorded SHA and counts. **20 unit/regression tests PASS, 0 FAIL**: [scoped unit receipt](../gates/unit-regression-final.tap) has18 passes (five fixture contracts and13 existing regressions), [operational seed receipt](../gates/operational-seed-final.tap) has one pass, and [tray seed receipt](../gates/tray-seed-final.tap) has one pass. These total five fixture tests plus15 existing regressions; they are separate from the browser execution counts. [Unit summary](../gates/unit-summary-latest.json), [test exit results](../gates/tests-latest.json).

Build identity provenance has **4 PASS, 0 FAIL** on the same source: invalid explicit identity rejected, identity-free archive remains unverified, explicit archive identity honored, and current Git identity separated from the historical import. [Provenance receipt](../gates/build-provenance-latest.json). These local checks do not establish remote CI status, production API readiness, RBAC coverage, or deployment approval. The release owner's overall disposition remains **PARTIAL**, with the functional400px clipping observation separate from the visual review findings; no deployment is claimed.
