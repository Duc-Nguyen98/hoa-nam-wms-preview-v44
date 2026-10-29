# Final independent visual retest — 72a8760

**Verdict: PARTIAL / review with P2 residuals; full visual fidelity PASS withheld.** Both previous P1 findings are closed in the captured default profiles. All 36 Candidate cases were captured and reviewed: 12 each at Desktop1920×1080/DPR1, Desktop1440×900/DPR1 and Tablet800×1280/DPR2. Tablet cards expose previously hidden fields but differ materially in density from the approved compact compositions; two process-history hierarchy gaps also remain. This is not a production release, backend, RBAC or accessibility verdict.

## Provenance and evidence

Local static MOCK Candidate: source `72a87608301f0ecd8b1f3a97f326a9bccbba2bbf`, build `9684ed3f5723dd24548fed0a55308c8b4bf2cfe2b7813fae884a7d24e6e7b24d`, VI/light, normal synthetic login and Chromium. [Capture](after-72a8760/capture.json) and [stability](after-72a8760/stability.json) bind named S17, shared shell and S09 stylesheet hashes to unchanged HEAD and source files throughout capture; served build-info matched local build. 10 uses entered invalid form data; 11 submits a local Candidate request that returns unknown; 12 submits a local Candidate request with a matching confirmed receipt. Remaining cases use Candidate deep links. This does not prove server transaction behavior.

[Gallery](after-72a8760-gallery.md) links all 36 actuals to their 24 approved originals and diagnostic normalized reference/actual/overlay/diff images. [Receipt](after-72a8760-receipt.json) hashes captures, originals and 144 diagnostics; 36 reference pairings match manifest and all 36 captures succeeded. The 24 references were reviewed previously; all 36 current actuals were reviewed via new full-page contact sheets and 01 Desktop1440, 02 Tablet, 10 Tablet and 12 Tablet were reopened individually. Existing [BEFORE](../functional/before/BEFORE_CAPTURE_REPORT.md) is four related operational states ×3 profiles, not 24 matching generic reversal states. Those absent matching BEFOREs are NOT REPRODUCED. The earlier [e7174fda report](VISUAL_E7174FDA_REPORT.md) and captures remain unchanged.

Registration uses proportional content-width alignment and heuristic shell crops. The source PNG viewport/DPR are unverified; overlays and differences are diagnostics, not certified pixel identity or score-based PASS. Canonical shell/icon normalization follows the scoped design decision. The 10 fixed capture is scrolled/focused after validation, and its full-page screenshot contains the result; focus and sticky-header composition reflect that capture state.

## Prior five finding dispositions

| ID | Final disposition and evidence |
|---|---|
| REV-VQ-001 | **Closed in captured S17 profiles.** At 1440, measured sidebar right edge is 320 CSS px, module root x=344 (24px separation), versus prior x=284 under the sidebar. [01 Desktop1440](after-72a8760/01-Desktop1440.png) shows heading and first filter/summary unobscured. Shared-route regression is separate functional evidence. |
| REV-VQ-002 | **Closed in captured local receipt-confirmed flow.** [12 Tablet](after-72a8760/12-Tablet.png) shows −2 per line and a single −4 current-impact summary after the matching local receipt; same result is visible in both Desktop profiles. This does not prove an actual backend posting. |
| REV-VQ-003 | **Partially fixed; P2 density/reference hierarchy remains.** Tablet tables now reflow into labelled cards with values and actions visible, rather than hiding right columns in the initial horizontal scroll. The generic four-column cards are substantially taller and less compact than the approved Tablet list/row compositions. For example 01/02/05/08 document heights are 2420/2083/2377/2851 CSS px. Original raster viewport/DPR are unknown, so height alone is not a pass threshold; the full images show the density/hierarchy difference. Preserve all fields, readable text and effective targets in any future refinement. |
| REV-VQ-004 | **Closed for measured default 02 controls.** All nine Tablet source radio inputs measure at least 44×44 CSS px; nine entries appear, including 010=8, 011=12 and 013=6 in [02 Tablet full](after-72a8760/02-Tablet-full.png). Dynamic backend pagination is not inferred from fixture count. |
| REV-VQ-005 | **Closed for captured invalid form.** [10 Tablet full](after-72a8760/10-Tablet-full.png) keeps blank-reason and 12-over-10 errors and shows total/projection `Chưa xác định` with current impact0, rather than a misleading −14 projection. |

## Additional specific residuals

- **P2 process hierarchy, 06:** the approved pending-return reference shows the four stages from request to receipt, condition check and posting; the captured Candidate reduces this to a single 6 requested / 0 received / 0 available text line. The arithmetic and warning remain visible. Restore a clear staged presentation when supported by the verified contract, without inventing receipt or posting events.
- **P2 audit hierarchy, 08:** the reference shows source posting, draft creation, review and posting; Candidate presents source, creation and posting, with the explicit review event absent. Do not manufacture an audit event; require trustworthy state evidence before displaying it.

Other normalization and composition differences remain, including no approved-reference pixel registration; no claim of perfect fidelity. 02 fixture now contains the nine illustrated sources; this is not a production record cap.

## Measurements and coverage

All 36 captures record `overflow=false`, zero captured console/page errors or failed requests, no measured visible module button/input/select/textarea below 44×44 CSS px and zero DOM cell scroll-width/height flags. These are bounded capture measurements, not proof against all clipping, focus or touch failures. Viewport-fixed and full-page images are both saved where the page exceeds the viewport. Detailed geometry is in the receipt.

| Pair | Visible Candidate state at three profiles |
|---|---|
| 01 | Nine reversal records and four status totals; Tablet card-density residual. |
| 02 | Nine eligible source entries and selected 007 source; Tablet density residual. |
| 03 | 007 two-line draft, reason/note and projected −4/current0. |
| 04 | 007 two-line review and checks, projected −4/current0. |
| 05 | 009 posted, nine lines, total45 and current −45; Tablet density residual. |
| 06 | 008 pending, three lines, warning and requested6/received0/available0; process hierarchy residual. |
| 07 | 005 cancelled, one line and current0; displayed cancellation information for that fixture. |
| 08 | 009 +90/−45/+45, nine lines and trace; audit hierarchy and Tablet density residuals. |
| 09 | 002 blocked, BOX-018-01, related document and disabled post. |
| 10 | 007 blank reason and 12 over10, second line2; invalid totals unknown. |
| 11 | Local request unknown, checking state and status-check action. |
| 12 | Local confirmed receipt, two −2 rows and −4 current impact. |

These observations do not establish long-content, locale/theme, keyboard/touch interaction, server permissions, idempotency, atomicity, concurrent posting or persistence. No application or baseline edits were made by this visual QA. Subsequent source changes require an appropriately scoped fresh capture and review.
