# Regression evidence — HN-NC-UIUX-003

Owner/integration: S00#1. Independent execution: S00#4 and S00#3. Environment: local authenticated Preview MOCK and isolated fixtures; no production writes.

## Source custody

| Source | Executed scope | Status / evidence |
|---|---|---|
| 76059cce616543356c623ec248c6350ddd07cdf5 |27main browser +4axe +4shared +1focused focus case =36 distinct successful browser cases;24Node;typecheck | PASS for executed scope; FUNCTIONAL_QA_REPORT.md and functional/execution-final-index.json. One original network failure retained; no clean-first-attempt claim. |
| 830f83d48eac84c3e2467de7f41c388439cc7eb2 |4additional actual-app portrait profiles (992VI light/dark,900EN,801ZH); selection/read/filter/search/empty/detail/mark-all/toast focus/geometry | PASS (3initial +1 targeted retry after correcting QA-only setup selector). functional/FINAL_SOURCE_DELTA_RETEST.md; all selection-only row deltas0px. |
| 830f83d48eac84c3e2467de7f41c388439cc7eb2 |typecheck,contract/reference integrity,production build,4putaway tests | PASS; local-quality-pr-830f83d.json/log. |

The final delta from76059cc changes only owning Notification CSS portrait801..1100 layout. Shared semantic/focus/business code, colors, fonts and other routes retain their tested bytes. Baseline36/24 results remain tied to76059cc; they are **not relabeled as a full rerun on830f83d**. Final runtime src tree65ac25d235682469452f60d50664b3e6acb3a753 is the identity subsequent evidence-only commits must retain.

## Impacted shared components

Independent actual-app tests on76059cc cover Notification modal names/keyboard/return focus, named toast grouping/status/dismissal, mark-all feedback without modal/CTA collision, and non-Notification S01 AcceptedRowDetail title/focus trap/Escape/exact row opener. Focus-before real FAIL at e5ba486 is retained; final focused replay returns MAIN#main-content correctly. The later portrait-only CSS does not touch these shared sources; actual portrait toast/focus is additionally exercised on830f83d.

Automated axe4profiles reported zero violated rules, preserving color-contrast INCOMPLETE from locked-shell pseudo content. Independent rendered-text measurements validate placeholder/warning/reachable success light and dark cases.640 repeated computed samples are not640 independent test cases or full WCAG certification. No baseline or rule was disabled to force a result.

## Limitations and failed attempts

- REAL_API/server RBAC/realtime/multi-session backend integration:NOT_RUN/NOT_CONNECTED; local mocks do not certify them.
- Full WCAG,screen-reader and non-text/pseudo/gradient contrast:NOT_RUN or INCOMPLETE.
- Three clean stability runs and broad unrelated regression:NOT_RUN. Historical setup/seed findings remain open; this task does not close them.
- Original semantic/focus/contrast failures remain alongside fix/retest evidence. Host ERR_NETWORK_CHANGED, visual ENOSPC and QA setup-locale selector failure are retained separately from product defects. Safe recovery uses process-only E-drive scratch; no global config/production change.
- Visual reference/artifact and residual P3 verdict are in VISUAL_QA_REPORT.md; numeric geometry/image differences are diagnostic, with no invented acceptance tolerance.
- Hosted exact-source CI is blocked by billing before runner; visual workflow still contains an unconditional failure placeholder. Public deployed source SHA remains unverified. No release or rollout PASS.

## Outcome

Executed functional and impacted-regression scope passes with the source distinctions above. Overall task acceptance remains PARTIAL until visual authority and external release gates are resolved. No result here grants production merge/deploy permission.
