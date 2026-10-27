# HN-S01-UIUX-004 — independent Functional QA

S00#4, 2026-10-27. **FINAL functional gates PASS on e18305b1 with the scoped regression and evidence transfer below. All failed attempts remain preserved.** Model/effort UNVERIFIED. No source edit, baseline update, production write or deployment by this role.

## Source and execution

Base `06954a99885f7c9e808bf9a5556c7dd6c0d6b9a2`; source tree `65ac25d235682469452f60d50664b3e6acb3a753`; source status clean when `functional/before-source-custody.json` was written. E: explicit checkout. Dedicated Vite5272, Playwright Chromium headless, E: TEMP/TMP. All normal application tests **MOCK**. Synthetic state renderer tests explicitly **QA_SYNTHETIC**. REAL_API and production RBAC **NOT_RUN**.

## Results

| Execution | Outcome |
|---|---|
|`node --import tsx --test functional/independent-data.test.ts tests/overview-detail.test.ts tests/s01/document-navigation.test.ts tests/notification-state.test.ts tests/notification-center.test.ts tests/actions/notification-target.test.ts` (functional path under this task folder) |27/27 PASS, exit0; `functional/before-node-tests.log` |
|Normal actual-app targeted clean rerun |12/12 actual application checks PASS; clean run also includes existing-harness error PASS. `functional/before-clean-rerun/results.json` |
|Language/theme crosscheck |6/6 completed checks PASS, each1920×1080 and800×1280 modal, VI/EN/ZH-CN and light/dark; original run `functional/before/results.json` |
|Independent isolated failure/edge states |8/8 PASS, exit0; `functional/before-isolated-states-final/results.json` |
|Shared shell/keyboard/contrast sampling |Recorded separately in `functional/before-accessibility/results.json`; scope and measurements must be read, not blanket WCAG certification |

Covered actual auth gating/login/warehouse confirmation/reload; normal period;8/8/4/unknownKPIs; pending5total/3visible; folded actor/code search/no-results/reset; type/status/attention scopes; normal10+6 pagination uniqueness and sort-reset; exactPX0007detail/copyID+code/CTA/deep-link/reload/rejectmissing; emptyday;90day/future manual validation; offline localMOCK filter; modal focus containment/ESC; language/theme overflow. Independent Node tests also reconcile all16 identities/chart counts, date boundaries/Vietnam day and mocksession401/403/expiry.

## Confirmed discrepancies and ownership

1. **Data authority discrepancy:** packet/art3pending vs actual5pending. Three visible rows are a projection, not total. Preserve five source records; root/design decision required for any different fixture. No product arithmetic bug found.
2. **Default-page authority conflict:** actual BEFOREdefault4/options4+shared values vs recovered lockdefault10/options10/15/25/50. Root routed implementation; comparator4 must be isolated, never a new businessdefault.
3. **Existing QA harness defect:** internal100 read conflicts with queryOverviewRows allowed4/10/15/25/50, so empty/long/missing stale. Root routed tests/s01/harness.tsx correction; own QA derivative reads25 and exercises actual components. This is a test-path defect, not warehouse business logic.

4. **FQA-001 product accessibility defect:** desktop pendingcount12px700 is white on #ffac22 (computed contrast1.879:1), caused by overview.css:627 desktopoverride. Tablet existing warning pairing4.714:1 passes normaltext4.5 threshold. Raw pairedstyles and ratios in before-accessibility/results.json; root notified for scoped remediation. Other five sampled text/background pairs exceed4.5. Modal copy/close/CTA measured≥44CSSpx. Shared shell search/notifications/drawer ESC focus, reverseTabtrap and quicklinks S21/S26/S20 allPASS,10 recorded groups/errors[].
5. **F-TARGETS** root/implementation confirmed S01filters/selects/tablelinks/actions/sort undersized under recovered44CSSpx contract; final audit will enforce44boundingboxes independently.

## Preserved failures and recovery

Original run:12PASS/11FAIL. Initial coldVite/auth/reloads exceeded12s/5s; DatePicker test wrongly expected Applydisabled although actual contract validates onclick; absent `.ov-refresh` selector caused offline cleanup omission and cascade ERR_INTERNET_DISCONNECTED. These are retained in before rawJSON/log/screenshots, not relabeled product failures. Clean rerun fixed selectors, increased bounded navigation/read waits and used offline try/finally: all12normalapp stepsPASS, errors[].

Clean rerun4remaining failures were isolated harnessloading ambiguous selector(two regions) and empty/long/missing unsupported100path. Narrowed loading to main and derived documented25harness. First standalone recovery had no origin before localStorage(accessdenied); retained stdout and results. Final isolated run8PASS/errors[]. No failed artifact deleted or overwritten.

## Limits

Shared chrome visual bytes belong to other owners. No browser production session-expiry scenario, real permission matrix, backend integration, screen-reader session or comprehensive contrast certification is claimed. Browser synthetic session/forbidden tests verify actual state rendering; Node tests verify the existing local mock account boundary. Offline networkerror maps genericerror in current renderer; no dedicated offline state contract was invented. AFTER requires new custody and targeted independent rerun on implementation final source.


## AFTER round1 —60b76b91764644996d9c69c9c08833ed76036a89

Source tree c8046fc38e251eeda1964da55531462b137c0554; clean src/tests at execution. Full source and tested file hashes: functional/after-source-custody.json; raw browser functional/after-final/results.json.29/29scoped Node testsPASS including fidelity-policy.test.ts. Actual browser26PASS/2FAIL.

**FQA-002 confirmed:** normal actualMain page defaults10 but dropdown still[4,10,15,25,50]. App usesHTTP→browserMOCK baselineReaders.S01, which still supplies four in src/preview-mock/readers.ts:33; domainvalidation also allows four. Local runtimecontroller policytestsPASS did not cover this actual chain. Root accepted defect for repair2. Isolated reference4 is correctly separate and retains exact source counts/identity.

Otherfailure: PXcopy step navigation/read exceeded30s; copy itself not reached in that step. ExactPXCTA and sixlocale/theme modal checksPASS.16console ERR_NETWORK_CHANGED resources accompanied intentional offline transition; raw retained. OfflineMOCKfilter stepPASS. A11yaudit attempt timed out before login input;44targets and badgecontrast NOT_RUN in that attempt, not inferredPASS. All26completed browserchecks retained, including all8synthetic states and isolatedreference4.

For repair2, own independent Node regression now includes actualHTTPPreviewchain lock/reject4 coverage; fresh targeted copy/options and full affected44target/contrast audits will be rerun.


## FINAL2 independent verdict — PASS within local MOCK scope

Candidate: `f56e25cfc119f5a758f0cd48ebdc6a96e78f8a09`.
Source tree: `72189a9c0bdb2aff13a0294fd2b66929b157273e`.
Tests tree: `3a61cae4bffcbda3f9e614eaaa02a38e637f3e64`.

Source and tests stayed clean and frozen throughout the initial and recovery runs. QA used a fresh Vite server on port 5272 and E: TEMP/TMP. The source, test and script hashes are recorded in `functional/final2-source-custody.json` and `functional/final2-recovery-custody.json`. Each browser run preserves its executed script. The original S01 fixture hash is identical before and after implementation.

| Final gate | Evidence and result |
|---|---|
| Scoped Node regression | **34/34 PASS**, including the actual HTTP Preview adapter chain, mock sessions, dates, identity, notification regressions and QA3 guard. See final2-node-tests.log. |
| Browser functional coverage | **29 unique checks PASS after recovery**. Initial and recovery attempts remain separate in final2-verification-summary.json. |
| Normal paging | Actual app default 10; options 10/15/25/50. The actual HTTP mock rejects 4. **FQA-002 closed.** |
| Exact PX-0007 | Partner, quantity, actor, timestamp and status match. Clipboard code and ID, modal keyboard focus, enabled S15 CTA, reload identity and invalid-ID rejection PASS on the new SHA. |
| Touch targets | 112 warehouse/period/filter/table/mobile measurements plus 20 modal controls. All measured widths and heights are at least 44 CSS px. **F-TARGETS closed.** |
| Badge contrast | Both desktop and tablet: 4.714:1 in light theme, 6.539:1 in dark theme. **FQA-001 closed.** |
| Shared keyboard and routes | 21 audit groups PASS, console/page errors empty. ESC restores focus; reverse Tab stays in the modal; shell search, notifications, drawer and quick routes S21/S26/S20 work. |
| Language and theme | VI/EN/ZH-CN × light/dark × desktop/tablet: bounds, overflow, identity and focus PASS. Recovery used actual header language/theme controls. |
| Edge states | Loading, error, empty, long, missing, session, forbidden and offline rendering PASS through explicitly isolated QA paths. Long content was checked at scroll start, middle and end. |
| Approved Dashboard QA3 | Explicit test-only QA_SYNTHETIC snapshot: 16 IDs, 8 inbound, 8 outbound, 4 warranties, unknown stock, 3 waiting and 13 posted. Exactly two statuses are derived; original source is unchanged. |
| CTA authority | QA3 CTA is disabled and native click leaves the route unchanged. All 16 synthetic rows fail the source-link guard, including a provenance-only forgery. Original SOURCE_FIXTURE reference4 retains 5 pending and an enabled exact PX CTA. |

### Preserved failures and recovery

The initial full browser run recorded 25 PASS and 4 FAIL, with 33 resource ERR_NETWORK_CHANGED messages. ZH light failed during reload; the following ZH step reached a browser error page and could not access localStorage. Empty and long harness pages were blank and timed out. The first accessibility attempt also timed out after a full document reload, before geometry measurements. Screenshots and raw failures remain intact.

A fresh targeted recovery recorded **6 PASS, 0 FAIL, errors []**: two repeated authentication checks and the four blocked checks. Chromium connected directly to localhost with --no-proxy-server. Actual header controls changed language and theme without unnecessary document reloads. The separate accessibility recovery recorded **21 groups, errors []**, including console and page errors. No source or baseline changed during recovery. The initial full run is not described as clean.

### Final commands and artifacts

Scoped Node command:

```powershell
node --import tsx --test docs/quality/uiux-task-HN-S01-004/functional/independent-data.test.ts tests/overview-detail.test.ts tests/s01/document-navigation.test.ts tests/s01/fidelity-policy.test.ts tests/notification-state.test.ts tests/notification-center.test.ts tests/actions/notification-target.test.ts
```

Browser scripts: functional/functional-browser.mjs and functional/shared-accessibility-browser.mjs. Both require the exact QA_SOURCE_SHA and reject a dirty or different source. Their run folders retain stdout, JSON, screenshots and executed script copies.

- functional/final2-node-tests.log
- functional/final2-browser/results.json
- functional/final2-targeted-recovery/results.json
- functional/final2-accessibility-recovery/results.json
- functional/final2-verification-summary.json
- functional/final2-source-custody.json
- functional/final2-recovery-custody.json

### Remaining limits

REAL_API, production permissions, external warehouse connectivity and browser production-session expiry remain NOT_RUN. QA3 is identified by its explicit test URL and snapshot metadata; there is no added in-content banner. Contrast sampling is not comprehensive WCAG certification or screen-reader testing. Visual acceptance, asset authority, CI/public-preview provenance and release approval belong to their separate owners. This functional PASS does not approve deployment.


## Final desktop-footer correction — e18305b1

**Functional verdict: PASS within local MOCK scope.** Final commit: `e18305b1e3b09c4402317d507d7008967284341b`; source tree: `edd34681bf20a5281188e9da49cdc91876a0845d`; tests tree remains `3a61cae4bffcbda3f9e614eaaa02a38e637f3e64`.

Independent source comparison proves the only runtime difference from f56e25c is one declaration in the desktop (>1100px) S01 modal footer: padding-block:16px. Removing that exact added line produces the previous CSS byte-equivalent after newline normalization. All other tracked source and tested files have unchanged hashes. Evidence: final-footer-source-custody.json and the matrix source-diff.patch.

- Scoped Node suite rerun on final SHA: **34/34 PASS**.
- Affected modal matrix: **12/12 PASS, console/page errors []**. VI/EN/ZH-CN × light/dark × desktop1920 and tablet800.
- Desktop footer measures **83 CSS px**, padding16 top/bottom and24 inline, buttons50px high. Tablet remains **105px**, padding24, buttons56px high.
- Footer remains inside the viewport; body and footer do not overlap; footer position stays stable at body scroll start/middle/end.
- Both clipboard values, explicit close, ESC focus return, keyboard containment and exact PX-0007 CTA identity PASS for every case.
- Intended modal controls are at least44×44. All descendant buttons are also recorded with name/class/box/inert/viewport/hit-test metadata; no active hit-tested undersized descendant was found.

The f56e25c 29-check functional and21-group shared/accessibility evidence transfers only for unaffected behavior, based on the exact one-property source diff. These full suites were not rerun or relabeled as new-commit executions. Modal geometry, controls and interaction were retested on the final commit. Final footer83 versus reference82 leaves a **1px visual delta**; Functional QA does not infer pixel-level visual acceptance.

### Runtime and preserved attempts

The first final browser attempt failed with connection refused because the earlier server had stopped. A fresh development server then encountered ERR_NETWORK_CHANGED while loading modules. Both failures remain in final-footer and final-footer-recovery. Earlier Vite logs also show artifact HTML under output causing development reloads; QA watcher ignores were attempted and documented, without source/config edits.

The bounded recovery builds the exact checked-out source into the role's ignored output/hn-s01-004-functional-temp/footer-static-dist and serves it locally with Vite preview on5272. It is the actual compiled normal application in MOCK mode. The run records every built asset hash and source commit in local-build-custody.json. This local build is separate from release/public-preview provenance.

The first static matrix passed VI/light/desktop, then failed an unqualified all-descendant target assertion with a19.4375px width. That attempt did not preserve the offending button's identity, so its exact cause is **unresolved**; no named product defect is asserted from it. The open dialog was not cleaned up after failure, causing repeated outside-header click timeouts. The identified runner was stopped; stdout, screenshots, exact executed script, asset custody and an interruption note are retained. It is not counted as a completed passing matrix.

The corrected matrix captures all button identities and geometry before assertions, checks intended modal controls plus every active hit-tested small descendant, guarantees explicit dialog cleanup, and tests ESC after copied-feedback dismissal through the UI. It completed12/12 with no errors. No product behavior, toast rule or source was changed to make the test pass.

### Final artifact index and freeze

- functional/final-footer-node-tests.log
- functional/final-footer-source-custody.json
- functional/final-footer-matrix-corrected/results.json
- functional/final-footer-matrix-corrected/source-diff.patch
- functional/final-footer-matrix-corrected/local-build-custody.json
- functional/final-footer-matrix-corrected/*-geometry.json and PNGs
- functional/final-footer-verification-summary.json

All required targeted work is complete. No browser/server process from this run remains. Functional QA owns no source changes. REAL_API, production RBAC, comprehensive WCAG certification, visual approval and release approval remain outside this local functional verdict.
