# Notification text contrast review — HN-NC-UIUX-003

Owner: S00#4. Final runtime: `76059cce616543356c623ec248c6350ddd07cdf5`; source tree `d3cbc007a42abb996b74d8c537220fb202e8bb18`. LOCAL authenticated Preview mock; no production mutation.

## Method and authority

The probe reads browser-computed foreground, opacity, font size/weight and actual ancestor backgrounds, composites alpha, calculates relative luminance, and retains background layers, uncertainties and screenshots. It samples the actual child status span, not only its parent dd. Desktop and Tablet each open four real notification details, including the reachable inbound success status. Tablet Back/detail behavior is exercised.

For these normal-size text samples the threshold is4.5:1; qualifying large text uses3:1. Placeholder text is included. This follows [W3C WCAG2.2 SC1.4.3 guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), verified2026-10-27. Comparisons use unrounded ratios. No approved pixel-baseline tolerance was invented.

## Before findings retained

Diagnostic on clean `e57f6aed038e81d8b6a3b4f0eeccbb4c853012dc`: actual DesktopLight placeholder14px/400, foreground rgb83,103,122 at opacity.75 on white composites to126,141,155.25: **3.402425:1 FAIL**. Actual warning status14px/400, #c66a00 on #fff0d8: **3.424567:1 FAIL**. Raw source hashes/layers and screenshots are in `shared-final-diagnostic/`. This failure was sent to S00#1 before any color remedy.

FQ-NC-003-A11Y-04: P2 placeholder contrast. FQ-NC-003-A11Y-05: P2 warning-status contrast. Design Guardian allowed a minimal Light-only NC correction in the provisional palette; its scope preserves fills, icons, Dark and shared global tokens. Success variant was included in the scoped companion remedy and independently measured afterward; an initial actual-success measurement was not captured, so it is not claimed as another separately reproduced before defect.

## Final actual measurements

|Text|Final Light colors|Ratio|Size/weight|Result|
|---|---|---:|---|---|
|Search placeholder|rgb83,103,122 opacity1 / white|5.851331|Desktop14px400; Tablet18px400|PASS|
|Warning status span|#835811 / #fff0d8|5.552797|14px400 both viewports|PASS|
|Inbound success span “Đã hoàn tất”|#286645 / #def7e6|6.030105|14px400 both viewports|PASS|

Dark remains unchanged: placeholder5.627029, warning7.267853, success6.747007. All are measured from rendered app elements.

|Profile|Repeated computed samples|FAIL|INCOMPLETE within probe|Raw evidence|
|---|---:|---:|---:|---|
|1920-light|220|0|0|shared-final/1920-light.json|
|1920-dark|220|0|0|shared-final/1920-dark.json|
|800-light|100|0|0|shared-final/800-light.json|
|800-dark|100|0|0|shared-final-retry/800-dark.json|

Total640 repeated samples across states; these are not640 independent tests or distinct elements. Shared suite first run3PASS/1environmentFAIL (main.tsx net::ERR_NETWORK_CHANGED before login), unchanged TabletDark targeted retry1PASS. Original failure and trace remain.

## Limits

This is a scoped solid-background text review. It is not exhaustive WCAG, screen-reader, all non-text contrast, every gradient/pseudo element, or pixel-fidelity certification. The default axe scan still records color-contrast INCOMPLETE because of the separately locked shell pseudo content; it was neither hidden nor ignored. These spot checks resolve the measured NC text cases without relabeling axe's incomplete result.
