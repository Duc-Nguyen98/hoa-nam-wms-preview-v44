# Date and impact-timeline probe

Source294c9d0/build233db62c, actual normal authenticated fixture app, B23 PASS. [Raw measurements and assertions](browser/results.json). No application source or assertion was changed to obtain this result.

| Width | Locales | Both date spans: scroll/client width | Minimum native control width/height | Page overflow |
|---|---|---|---|---|
|600|VI / EN / Chinese|75/75px|44/44px|0|
|759|VI / EN / Chinese|75/75px|44/44px|0|
|760|VI / EN / Chinese|75/75px|44/44px|0|
|800|VI / EN / Chinese|75/75px|44/44px|0|

The test requires scrollWidth<=clientWidth with no clipping allowance, two visible clear controls, accessible trigger names containing the complete visible date,44px minimum for every visible native control and no viewport overflow. English and Vietnamese use25/10/2026 and28/10/2026; Chinese uses2026/10/25 and2026/10/28. These are12 separately measured profiles, not a source-only layout inference.

At800 in each locale, exactly three existing fixture events remain: source document PN-20261020-001 posted20/10/2026 08:30, reversal REV-20261028-009 created28/10/2026 14:25, and that reversal posted28/10/2026 14:25. All three times remain known, source/reversal identities remain, the decorative connector stays aria-hidden and closing the source dialog restores focus to its source button. No fourth review event was invented. This is fixture presentation evidence, not server audit authority.

Positive captures: [VI dates](browser/B23-dates-vi-800.png), [EN dates](browser/B23-dates-en-800.png), [Chinese dates](browser/B23-dates-zh-CN-800.png), [VI impact](browser/B23-impact-vi-800.png), [EN impact](browser/B23-impact-en-800.png), [Chinese impact](browser/B23-impact-zh-CN-800.png). Pixel comparison remains the independent visual reviewer's gate.

The separate core B16 development-module resource failure and bounded retest remain visible in the [current aggregate](FINAL_ACCEPTANCE.json); B23 passed in the original full attempt. Every current completed browser execution preserves its canonical-state hash; model/backend/production boundaries remain unchanged.
