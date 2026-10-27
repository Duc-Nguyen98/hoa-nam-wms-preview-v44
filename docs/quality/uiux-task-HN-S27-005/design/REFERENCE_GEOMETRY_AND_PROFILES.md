# S27 reference geometry and comparison profiles

Task HN-S27-UIUX-005; S00#6; inspected base `bde0e4292ae4a7db569c7a5d56bce0c7ffa8e703`, DEV. Four originals were opened visually and copied byte for byte. `REFERENCE_MANIFEST.json` is the custody record. Requested model Sol/high fallback; actual model runtime telemetry UNVERIFIED.

## Profile disposition

| Profile | Use | Authority limit |
|---|---|---|
| Desktop 1920×1080 CSS, DPR1 | Primary inherited regression/comparison profile | Recovered foundation/tray/S01 test configuration; no S27-specific approval recovered. |
| Tablet portrait 800×1280 CSS, DPR2 | Primary inherited portrait robustness/comparison profile; output1600×2560 | Same limitation; does not make source992px a CSS viewport. |
| Desktop1672×941 CSS, DPR1 | Diagnostic browser capture matching original raster dimensions | Explicit harness assumption; useful component comparison, never claimed original viewport. |
| Tablet992×1586 CSS, DPR1 | Diagnostic browser capture matching original raster dimensions | Explicit harness assumption; useful component comparison, never physical-device certification. |

Record pointer, orientation, shell layout, locale VI, light theme, browser, fonts, candidate SHA and scenario in each capture. Retain full originals and full actuals. For canonical comparison, derive a separately named image with declared scale/crop; never overwrite original PNGs. Desktop raster-to1920 scale is approximately1.1483x horizontally/1.1477x vertically; tablet-to1600×2560 is approximately1.6129x/1.6141x. Aspect rounding is evidence of near-proportional exports, not proof of a source profile. No absolute whole-screen pixel PASS is authorized from those transforms.

## Approximate raster anchors

Coordinates below are observations in original raster pixels, origin top left. Boundaries manually read to approximately±3px; they are review targets for S00#3 to refine, not approved exact CSS values or text baseline measurements.

| Ref | Component | Approximate bounds / relationship |
|---|---|---|
|9| S27 list panel | x292,y230,w1355,h685; panel starts below title and helper. |
|9| Filters / table | filter control top366; table header top440,bottom506;3 rows to770; note770–823; pagination823–915. |
|9| Desktop table |7columns: STT,time,activity,actor,source,object,detail. Time over date; action label over raw action; object over version; detail chevron. |
|10| Period panel | x26,y215,w941,h184; date full row then full-width reload. |
|10| List panel | x27,y416,w940,h1131; search spans width; action/module2cols, actor/reset next row. |
|10| Three cards | first x44,y777,w905,h226; second y1019–1247; third y1263–1478; approx15px gaps. |
|10| Card internals | icon + title/action left, date/time right; actor,source,object,command,version in5column row; detail footer divider. |
|11| Modal outer | x484,y115,w821,h760; content edges approx508/1281; footer divider y799. |
|11| Modal regions | header115–197; identity215–300; info title320; related panels x508/908,y469,w382/373,h79; trace title573,4rows y600–775. |
|11| Information / trace | unboxed information/trace; event details in left label/value group and versions right; related cards side by side; raw IDs on single lines with copy icons. |
|12| Modal outer | x108,y314,w776,h1156; content x135–858; footer divider y1384; bottom1470. |
|12| Modal sections | identity y435–534; info box x135,y557,w723,h215; stock y794–897; related y919–1027; trace y1048–1360. |
|12| Tablet reflow | stacked bordered main sections; event information remains2cols: time/previous left, actor/new right; source badge/label in identity. Copy buttons visibly separate;4trace rows. |

## Scoped repair guidance

Approved topology, order, labels and hierarchy are sufficient to repair missing/wrong columns, tablet cards, section stacking, ID clipping, missing borders, toolbar overlaps and inaccessible footer. S00#2 may choose minimal scoped CSS values as PROVISIONAL implementation proposals, then S00#3 measures and compares them. Exact CSS geometry, font size/weight, icon paths, breakpoint and sampled colors are not promoted to approved tokens by this document. Do not block these concrete repairs solely because export DPR is unknown.

The shared44CSSpx target is confirmed by the recovered common contract. Preserve accessible targets even where a raster glyph looks smaller. Do not change shell/header/sidebar to reproduce9–12;11/12 backdrop is an older, visibly different screen and supplies no current-shell authority.
