# S27 — final defect disposition

Owner S00#1, independent reviewers S00#3/#4. Final source ebcf0d360e52bf2036c5a3c531563675ebf3580c.

**11 unique roots:1P1 +9P2 +1P3;10 bounded repairs verified,1P2 remains open. Known open P0/P1=0.** F002=V01 and F003=V06 are aliases, not duplicate counts. Design/integration gaps below are separate from this product count. Latest final dispositions here supersede historical OPEN rows in owners' chronological reports.

| Root | Severity | Defect / root cause | Fix / independent result |
|---|---|---|---|
|F001|P2|Preview initial date hardcodes25Oct, separate from reader/DatePicker's Vietnam today.|CLOSED. Shared S27 current-date helper; explicit user date retained. Final24Node and actual UI date/filter checks; today27Oct can truthfully be empty.|
|F002 / V01|P1|Per-entity audit eventIds compared with whole batch proof;18valid subaudits each1event rejected against batch27events, preventing actual62-event list.|CLOSED. Preserve canonical population/proof validation and verify exact per-audit subset, membership/completeness/metadata. Actual62details,18subaudits and8negative controls verified on cc030be; unchanged binding transferred with exact diff. Final actual62source checks repeated.|
|V02|P2|Desktop reference info note absent from owning JSX.|CLOSED bounded fix. Exact reference note restored with scoped VI/EN/ZH; final browser capture confirms presence.|
|V03|P2|Tablet action/trace child code does not inherit intended readable sizing.|CLOSED bounded fix. Explicit child16px typography verified, raw values/wrapping preserved. Exact source typography approval remains a design gap.|
|V04|P2|Tablet divider/copy borders absent; first repair passed harness but later shared ghost CSS overrode actual-app border at equal specificity.|CLOSED. Owning selector specificity corrected; actual+synthetic borders verified against token,44px targets maintained. Red/failed-timing/settled-green attempts retained.|
|V05|P2|Tablet footer unnecessary padding/minheight.|CLOSED bounded compaction93→65px. Page-size and44px controls retained; exact page density/position not accepted and profile gap remains.|
|V06 / F003|P2|Desktop copy controls44×36 contradict common44CSS minimum.|CLOSED.44×44 verified by independent actual modal matrix and final captures.|
|V07|P2|Modal spacing leaves measurable excess; first accessibility repair increased height.|**PARTIAL / OPEN.** Section-faithful repair reduced native Desktop827→789 and Tablet1196/1197→1156/1157. Desktop still approximately29px taller than width-aligned reference. Do not shrink44px targets or warp reference to close.|
|V08|P3|Reload leadingIcon present despite text-only reference; old direct-child SVG hiding rule ineffective.|CLOSED. Owning leadingIcon removed, loading indicator preserved; independent final no-icon checks.|
|V09|P2|Tablet uses desktop long subtitle instead of short reference.|CLOSED. Responsive S27-owned VI/EN/ZH copy, desktop full scope text retained; final6locale/theme profiles and visual captures.|
|V10|P2|800px source label122.64px in109.73px column spills into object label;0.90625px actual glyph overlap from nowrap.|CLOSED. Single existing declaration normal wrapping. Final6actual locale/theme profiles/60cards/300fields and independent visual Range checks show0intersections, five fields/fonts retained;992 remains one line.|

## Separate blockers / gaps

- Source reference CSS viewport/DPR, exact typography/glyph/palette/variant/tolerances missing. Formal canonical width-aligned height residuals remain Desktop list−106.50, Tablet list+323.20, Desktop modal+28.93, Tablet modal+60.75 CSSpx. These are comparison diagnostics under declared assumptions, not approved error tolerances. Native near-match does not establish canonical or physical-device acceptance.
- Module mapping absent; disabled Module filter is BLOCKED_CONTRACT_GAP, not secretly implemented or labeled PASS.
- Production backend/RBAC/append-only isolation NOT_CONNECTED/NOT_RUN. Offline and actual HTTP5xx NOT_RUN; maintenance contract absent. Full axe/screen-reader/physical device testing NOT_RUN.
- Exact hosted CI blocked by billing before runner; visual workflow still placeholder and required-check enforcement not established. Public deployed candidate SHA unverified.

No baseline, test threshold or source fixture was changed to conceal deviations. No defect fixed by mutating audit records. No global/shared or Notification source changed. [Detailed visual chronology](VISUAL_DEFECT_REGISTER.md), [functional evidence](FUNCTIONAL_QA_REPORT.md), [state coverage](functional/STATE_COVERAGE.md).
