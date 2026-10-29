# Final independent visual retest — f99405e

**Verdict: PARTIAL; full visual fidelity PASS withheld. ESCALATION_REQUIRED** for the remaining Tablet responsive readability issue after the third bounded responsive repair. The prior two P1 findings are closed in the captured Candidate scope. All 36 actuals were captured and reviewed: 12 each at Desktop1920×1080/DPR1, Desktop1440×900/DPR1 and Tablet800×1280/DPR2. This is not a production, real API, RBAC or accessibility acceptance result.

## Evidence and source

Local static MOCK Candidate source `f99405e7e01f53cd8e460a9ae6f651f525712268`, build `54a54ea0493cf28968d605b911719707eb96e29e2211c88a4d9f2e21d4a1e9b9`; VI/light, normal synthetic login, Chromium. [Capture](after-f99405e/capture.json) and [stability](after-f99405e/stability.json) include named S17, shared shell and S09 stylesheet hashes; HEAD, named sources and build-info remained unchanged. Served build-info matched the local receipt. State10 was produced by entering invalid values; 11 followed a local-adapter submit returning unknown; 12 followed local submit and a matching confirmed receipt. Other cases use explicit Candidate deep links. The local receipt is not a server-posting guarantee.

[Gallery](after-f99405e-gallery.md) maps all 36 fixed actuals to 24 approved originals, normalized reference/actual, overlays and diffs. [Receipt](after-f99405e-receipt.json) hashes captures, originals, full-page variants and 144 diagnostic images; all 36 reference pairings match manifest and all captures succeeded. All 36 actuals were viewed in new full-page contact sheets; 01/02/05/06/08/10/12 Tablet originals were reopened individually. The 24 approved references were viewed in the authority review, including full originals for 09–12 Tablet. Proportional-width content-origin registration is heuristic; the approved PNGs have no certified CSS viewport/DPR. No score or pixel threshold establishes acceptance.

Existing [BEFORE](../functional/before/BEFORE_CAPTURE_REPORT.md) documents four related operational states ×3 profiles. It does not reproduce the 24 new generic partial-reversal states. The earlier [e7174fda](VISUAL_E7174FDA_REPORT.md) and [72a8760](FINAL_72A8760_VISUAL_REPORT.md) reviews remain unchanged historical evidence.

## Retest disposition

| Finding | Final observed result |
|---|---|
| REV-VQ-001, P1 sidebar overlap | **Closed in captured S17 profiles.** At1440, sidebar ends x=320 and module starts x=344 CSS px; [01 Desktop1440](after-f99405e/01-Desktop1440.png) is unobscured. |
| REV-VQ-002, P1 success impact | **Closed in captured local receipt flow.** [12 Tablet](after-f99405e/12-Tablet.png) shows two −2 lines and a single −4 current-impact summary; both desktop profiles likewise. |
| REV-VQ-003, P2 Tablet hierarchy/density | **Improved, PARTIAL; ESCALATION_REQUIRED for remaining readability.** Compact 800px tables replace tall four-column cards, keeping values visible. Tablet document heights 01/02/05/08 fell from 2420/2083/2377/2851 CSS px at72a8760 to 1280/1280/1280/1712. The reference raster profile is unknown; height alone is not a gate. [10 Tablet full](after-f99405e/10-Tablet-full.png) wraps the quantity error into five narrow lines in its table cell; [05](after-f99405e/05-Tablet.png) and [08](after-f99405e/08-Tablet-full.png) have densely abutting item-name/unit columns. Reanalyse cell allocation and error layout without shrinking text, clipping values or weakening touch targets. |
| REV-VQ-004, P2 source target | **Closed in measured default02 Tablet capture.** Nine source controls have at least44×44 CSS px; nine source entries and expected 010=8, 011=12, 013=6 visible in [02 Tablet](after-f99405e/02-Tablet.png). Fixture count is not a production limit. |
| REV-VQ-005, P2 invalid projection | **Closed in captured invalid flow.** [10 Tablet full](after-f99405e/10-Tablet-full.png) shows field errors, `Chưa xác định` total/projection and 0 current impact instead of −14. |
| 06 process hierarchy | **Closed in captured state.** [06 Tablet full](after-f99405e/06-Tablet-full.png) shows four stages: request complete, return pending, condition and posting not yet performed; 6 requested/0 received/0 available remains visible. |

**Other P2 presentation:** 06 still shows two identical `Tác động tồn hiện tại 0 Cái` summary tiles; this is redundant and differs from the reference's distinct requested/received/available summary. **08 data/authority gap:** reference has a review event between creation and posting, while the captured audit displays source posting, creation and posting only. Do not manufacture the missing event without trustworthy audit data. These residuals, and the unverified reference pixel profile, prevent a full fidelity PASS.

All 36 captured cases report no document horizontal overflow, zero console/page errors or failed requests, no measured visible module button/input/select/textarea below44×44 CSS px, and no DOM cell scroll-width/height flags. These bounded measurements do not establish all clipping, keyboard or touch behavior. Screenshot10 fixed viewport is scrolled/focused after validation; its full-page image captures that state. The initial focus outline on several deep-linked headings reflects capture focus.

## Coverage

| Pair | Actual Candidate content observed at three profiles |
|---|---|
| 01 | Nine reversal records, status counts, filters and compact Tablet list. |
| 02 | Nine sources, selected 007 source and available quantities. |
| 03 | 007 draft, two item rows and projected −4/current0. |
| 04 | 007 review and checks, two lines and projected −4. |
| 05 | 009 posted, nine lines, 45 and current −45; dense Tablet columns. |
| 06 | 008 pending, three rows, four-stage progress, requested6/received0/available0; duplicate summary residual. |
| 07 | 005 cancelled, one line, 2 and current0, with recorded fixture cancellation. |
| 08 | 009 nine lines, +90/−45/+45 and trace; review-event authority gap and dense Tablet columns. |
| 09 | 002 blocked, BOX-018-01, related document and disabled post. |
| 10 | Blank reason and 12 versus maximum10, second line2; invalid projection unknown, narrow error text residual. |
| 11 | Local submit outcome unknown, checking values and status-check action. |
| 12 | Local matched receipt, two −2 rows and current −4. |

Future work must use source-backed audit events, preserve shell identity and perform fresh scoped captures after any changes. Long content, keyboard/touch, locale/theme, backend scope, permissions, concurrency, atomicity, persistence and idempotency need their own evidence; this report does not infer them from screenshots. No application or baseline was modified by visual QA.
