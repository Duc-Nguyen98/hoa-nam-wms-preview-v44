# Independent visual QA — HN-REVERSAL-FIDELITY-001

**Verdict: PARTIAL.** Final source `e7b145feb3d8ec4b42bb2ba8fa66bfb5b3d9bf2f`, build `1bebecb3e20357207c7f6eb09c9ed987661c32c553451aeed3fe38a9f8b8b955`, supplied 36 AFTER captures. State 08 composition remains materially different and the review event lacks authoritative data; formal fidelity approval is not established. See the [defect register](VISUAL_DEFECT_REGISTER.md).

The 12 states were captured at 1920×1080 DPR1, 1440×900 DPR1 and 800×1280 DPR2, using normal synthetic login and isolated local MOCK scenarios. State 10 entered invalid values; 11 and 12 submitted local adapter requests to reach unknown and confirmed outcomes. The [capture](after-e7b145f/capture.json), [stability](after-e7b145f/stability.json) and [receipt](after-e7b145f-receipt.json) show 36/36 cases, stable source/build, 36 matched original references and no failures. The archive and all 24 originals match the immutable manifest ([reference receipt](../design/REFERENCE_RECEIPT.json)). The [manifest](REFERENCE_MANIFEST.md) maps each original to profiles, fixed viewport screenshots and reference and BEFORE/AFTER overlays/diffs. The 36 BEFORE captures use source `71cfa02f96c51a17c188ac8a90fca558941d8638` ([freeze](before/BEFORE_FREEZE.json)). [BEFORE/AFTER receipt](BEFORE_AFTER_RECEIPT.json) hashes 144 diagnostic images.

All 36 actuals were independently examined in [contact sheets](GALLERY.md), and state 01/08 actual and original were reopened. State 08 contains +90/−45/+45, nine lines, source trace, reversal trace and three available events. The reference shows a fourth review event without corresponding authoritative data. This is not evidence of that event. State 01 tablet grouping now follows the principal reference rows; visual details still need owner review. Reference viewport, DPR and raster profile are not certified; proportional crops and overlays are diagnostic only and are not pixel-approval tests. State 10 historical BEFORE crop has a negative viewport origin; its BEFORE/AFTER overlay is flagged unreliable, although final reference registration uses document coordinates. Inspect raw full-page images.

For the captured cases, document horizontal overflow, table-cell scroll flags, visible module controls below 44×44 CSS pixels, page/console errors and failed requests were each zero. These bounded measurements do not prove accessibility or live integration. Desktop module x=344 with sidebar width 320. Document heights in state order 01–12:

| Profile | Heights, CSS pixels |
|---|---|
| Desktop1920 | 1178, 1360, 1322, 1080, 1159, 1121, 1080, 1623, 1080, 1348, 1080, 1080 |
| Desktop1440 | 1254, 1360, 1322, 1029, 1159, 1121, 986, 1645, 921, 1348, 910, 912 |
| Tablet | 1280, 1280, 1620, 1280, 1280, 1289, 1280, 1592, 1280, 1674, 1280, 1280 |

This evidence does not establish backend DTOs, transaction atomicity, permission enforcement or production audit. Previous capture attempts are preserved.
