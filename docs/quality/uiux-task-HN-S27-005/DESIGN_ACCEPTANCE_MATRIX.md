# S27 design acceptance matrix

Task HN-S27-UIUX-005 · S00#6 ·2026-10-27 · DEV base `bde0e4292ae4a7db569c7a5d56bce0c7ffa8e703`. This is scoped authority and acceptance criteria, not a browser PASS. S00#3 owns visual results, S00#4 functional results, S00#1 final integration.

| ID | State / reference | Confirmed criterion | Evidence / current status |
|---|---|---|---|
|DA-01| All9–12 | Original bytes retained; SHA256 custody equals original | `design/REFERENCE_MANIFEST.json`; CONFIRMED custody only. |
|DA-02| Desktop list9 | Header/title/helper, period+reload at title side; list count pill, helper; search/action/module/actor/reset toolbar | Image authority; actual comparison NOT_RUN by Design Guardian. |
|DA-03| Desktop list9 |7columns in order ordinal,time,activity,actor,source,object,detail;3visible rows; date under time/action code under label/version under object; note and pagination | Image authority; source supports7columns. Geometry NOT_RUN. |
|DA-04| Tablet list10 | Period panel stacks date/reload; list heading count right; full-width search;2column filters;3cards with title/action/time,5metadata fields and full detail footer | Image authority. Tablet card semantics source-backed; render comparison NOT_RUN. |
|DA-05| Desktop detail11 | Title/helper/close; identity; information2groups; related panels side by side; unboxed trace4rows; refresh+close footer | Image authority; see approximate raster anchors. Render comparison NOT_RUN. |
|DA-06| Tablet detail12 | Identity source badge/label; bordered info; main sections vertical; eventinfo2cols time/previous left,actor/new right;4raw trace values/copy; reachable footer | Image authority; render comparison NOT_RUN. Tablet vertical means main sections, not all individual fields. |
|DA-07| Event content | First selected reference event raw IDs as recorded, actor, action,25Oct14:24,versions—→1,no stock/related | Screenshot facts CONFIRMED. Complete source snapshot/missing other IDs DESIGN_GAP; no fabricated data. |
|DA-08| Comparison profiles | Record all CSS dimensions/DPR/pointer/shell/scenario; canonical1920×1080DPR1 +800×1280DPR2 are inherited assumptions; native-sizeDPR1 diagnostics separately labeled | Profile recommendation CONFIRMED as harness decision only. S27 original CSS/DPR DESIGN_GAP. |
|DA-09| Interaction | Copy exact original source value; refresh retains eligible identity; close restores focus; body scroll bounded and footer reachable; no viewport overflow | Source/common contract; FQA NOT_RUN by this owner.44CSSpx targets remain confirmed common rule. |
|DA-10| Source integrity | Preserve projection/commit proof/scope/date validation; module stays unavailable until actual mapping exists; source data never altered to match artwork | Source semantic contract CONFIRMED; FQA owns tests. |
|DA-11| Shell | Preserve separately locked shell/header/sidebar. Backdrop chrome in11/12 cannot replace current shell | Packet + global contract CONFIRMED. |
|DA-12| Additional states/locales/themes | Distinct loading/empty/no-result/error/forbidden/expired/unavailable; EN/zh-CN/dark readable; long data wraps without loss | Semantics source-backed; exact visual references missing. Robustness must be tested independently, not screenshot PASS. |
|DA-13| Default period | Remove reference-specific hardcode only through source-backed current-session date/asOf contract; explicit user selection retained | Scoped repair permissible; exact source policy must be documented by implementation/FQA. Reference date does not override business clock. |

## Gate

`DESIGN_READY_FOR_SCOPED_REPAIR`, `EXACT_FIDELITY_ACCEPTANCE_BLOCKED`. Approved image topology permits concrete S27 fixes now. Unpublished numeric CSS values remain PROVISIONAL. Do not interpret source review or custody as actual-app acceptance. Candidate SHA, four actual captures, geometry/overlay/diff and independent functional results remain required. See `DESIGN_GAP_REPORT.md` for exact acceptance blockers.
