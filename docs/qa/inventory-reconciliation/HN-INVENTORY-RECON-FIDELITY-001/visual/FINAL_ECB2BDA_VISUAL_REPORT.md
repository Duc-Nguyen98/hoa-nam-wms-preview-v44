# Final independent visual retest — ecb2bda

**Verdict: PARTIAL / review with one P2 visual residual; full fidelity PASS withheld.** This is the final retest of the three issues recorded for `0dd7092`, not a production release, functional, API, RBAC or accessibility verdict. The 400px tray row and SKU tabs are now fully visible without horizontal scrolling in the captured default fixture. Tablet movement grouping is more compact but remains noticeably taller and less dense than the approved composition.

## Evidence and provenance

Built static preview used source `ecb2bdac211e392bb71d2f885725a6ecca3f3ce8`, build `caea03c77fb6deb73deb274ef3c8e4679e4e269b105705212ff9c18d71988e15`, normal synthetic login, VI/light and Chromium. Capture profiles: Desktop 1920×1080 DPR1, Tablet 800×1280 DPR2 and 400×900 DPR1. [Capture](after-ecb2bda/capture.json), [stability](after-ecb2bda/stability.json) and [receipt](FINAL_ECB2BDA_RECEIPT.json) record exact source/build, hashes, geometry and unchanged named source/HEAD/tracked diff over capture. The served build was the static preview identified by the build-info receipt; this does not establish publication.

The [gallery](FINAL_ECB2BDA_GALLERY.md) links all 32 verified immutable originals to the current-task BEFORE and new AFTER images and their overlays/diffs. The receipt rehashes all 32 references against the manifest and records hashes for 48 fixed captures, full-page variants and 128 comparison images. BEFORE was captured by the functional owner; its manifest did not record screenshot hashes at capture time, so present hashes establish current bytes only. The prior [0dd7092 review](VISUAL_REVIEW_STATUS.md) and artifacts remain historical and unchanged.

All 32 final actuals were manually inspected in full-page contact sheets against the previously reviewed 32 reference compositions. Final 02/03/06 Mobile400 and 05 Mobile400 full, and 06 Tablet full were reopened individually. The 32 derived reference/actual/overlay/diff sets use proportional-width, content-origin registration; raster viewport and DPR are unverified, so overlays are diagnostics rather than pixel equality or a scoring gate. Canonical icons are the scoped normalization authorized by design. No screenshot test alone proves real data or interaction semantics.

All 48 capture records report no document horizontal overflow, no console/page errors, no failed requests and no measured visible module button/input/select under 44×44 CSS px. These are bounded geometry observations, not blanket accessibility approval. The 400px profile has no supplied matching reference and is a responsive review rather than a reference match.

## Defect disposition

| ID | Final disposition | Evidence |
|---|---|---|
| VQ-RECON-001 | **Closed for initial visibility in captured default 400px tray view.** | [05 Mobile400 full](after-ecb2bda/05-Mobile400-full.png) renders BOX, SKU, name, unit, 20/5/15 and `Xem` in a reflowed card inside the viewport. Its action is below the initial viewport vertically, visible in the full-page image; no horizontal pan is needed. Interaction and keyboard checks belong to functional QA. |
| VQ-RECON-002 | **Closed for initial 400px tab visibility in captured 02/03/06 views.** | [02](after-ecb2bda/02-Mobile400.png), [03](after-ecb2bda/03-Mobile400.png), and [06](after-ecb2bda/06-Mobile400.png) wrap all three tab labels to two rows, with the selected state visible and no clipped third label. Interaction and other languages remain separate checks. |
| VQ-RECON-003 | **Partial, P2 remains.** | [06 Tablet full](after-ecb2bda/06-Tablet-full.png) retains all nine records, two-row group relationships and readable actor/identifiers. Full document height is **1948 CSS px**, down from 2119 at `0dd7092`, but above the task BEFORE's 1604 CSS px. The approved reference groups the same metadata more compactly; image profile differences make height alone an inappropriate pass threshold. Improve density without shrinking text, removing values or clipping content. |

The previously recorded 02 Tablet label crowding and 09 Tablet run ID wrapping remain absent in the default captured fixture. 07 shows a populated VI date in day/month/year order; 06 and 09 show empty date controls here, so populated date presentation across VI/EN/zh-CN is not established by this visual retest. Reference 06 movement timestamps differ from this fixture after the first row; no business-data equivalence is claimed.

## Reference coverage

Both profiles were reviewed for each pair: 01 nine lookup records; 02 nine locations and 120/20/100 total; 03 nine BOX rows and totals; 04 BOX identity/location/trace links; 05 tray and one BOX; 06 nine movement records and filters with residual density; 07 nine reconciliation rows and 3/3/3 counts; 08 nine BOX comparisons and 120/118/−2; 09 nine saved runs and readable identifiers; 10 saved result and nine rows; 11 loading skeleton; 12 HN04 empty; 13 ZX-999 no result; 14 error/retry; 15 forbidden history without records; 16 missing BOX/return. The gallery supplies the per-profile evidence rather than treating these observations as 32 unconditional passes.

No source or baseline was changed by this visual retest. Long strings, locale/theme combinations, keyboard/touch interaction, backend scope and authorization require their own evidence. Any subsequent repair requires a new build and independent recapture of affected views.
