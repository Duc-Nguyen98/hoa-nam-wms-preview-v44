# Independent visual QA — e7174fda

**Verdict: FAIL; full visual acceptance withheld.** 36 actual Candidate states were captured: 12 each at Desktop1920×1080/DPR1, Desktop1440×900/DPR1 and Tablet800×1280/DPR2. All 36 actuals were manually viewed in full-page contact sheets against the 24 approved reference compositions; 01 Desktop1440 and 01/10/12 Tablet actuals were inspected individually. The review identified two P1 issues and three P2 issues below. The static screenshots do not certify business correctness, accessibility or live integration.

## Evidence and limits

Source `e7174fda97ab3ab147cb1dd332e7b942f5088c87`, build `46f2aa4b604a659bbf07be7c13973258e4b63b4e18e18714345df92eb296a056`; static local MOCK Candidate with normal synthetic login. [Capture](after/capture.json) and [stability](after/stability.json) record source/build hashes including `copy.ts`; named sources and HEAD remained unchanged. 11 was reached by a real local-adapter submission returning unknown, and 12 by a local-adapter submission returning a matching confirmed receipt; neither demonstrates a server transaction. 10 was populated and validated through the form. Other states use explicit Candidate deep links.

[Gallery](VISUAL_E7174FDA_GALLERY.md) links 36 fixed actuals to approved originals and 36 normalized reference/actual/overlay/diff sets. [Receipt](VISUAL_E7174FDA_RECEIPT.json) hashes originals, actuals, full-page variants and all 144 diagnostic PNGs; all references match manifest. Proportional-width registration and heuristic shell crops are diagnostic only: source PNG viewport/DPR are not certified. They are not pixel-accurate matching or an automatic scoring gate. Existing [BEFORE](../functional/before/BEFORE_CAPTURE_REPORT.md) covers four related operational states at each profile, not 24 equivalent generic reversal states; missing BEFORE cases remain NOT REPRODUCED.

All 36 records report no document horizontal overflow, console/page error or failed request. This does not detect content covered by fixed elements or hidden inside local scroll containers. Each profile's 02 has eight radio control rectangles of 20×44 CSS px; the rest of the captured controls meet the measured 44×44 bounds. Measurements do not replace keyboard/touch/accessibility tests. Screenshot 10 after submit is scrolled/focused to the invalid control; full-page screenshot is retained and its fixed viewport must not be mistaken for a top-of-page composition.

## Confirmed findings and bounded fixes

| ID | Severity | Evidence and impact | Bounded direction |
|---|---|---|---|
| REV-VQ-001 | P1 | [01 Desktop1440](after/01-Desktop1440.png): the fixed sidebar covers the module heading, first filter and first summary card. Captured module root starts x=284 while sidebar visually ends at x=320, overlapping about36 CSS px; the issue is apparent in all 1440 captures. `overflow=false` does not reveal this obstruction. | Correct shared-shell/content spacing through the serialized shared owner; preserve shell identity and check all affected routes at 1440. |
| REV-VQ-002 | P1 | [12 Tablet](after/12-Tablet.png): receipt-confirmed success has two −2 line changes, but the two identically named current-impact summary tiles both show **0 Cái**. The approved result shows −4; this is materially misleading confirmed-result content. Same observed in Desktop captures. | Derive the success summary from the confirmed posted state/receipt and show one unambiguous −4 change; test direct receipt and checked-unknown paths without asserting server semantics. |
| REV-VQ-003 | P2 | [01 Tablet full](after/01-Tablet-full.png): horizontal table initially hides right-hand columns/actions; codes wrap across three lines and the approved compact Tablet list is substantially different. 02–08/10–12 also use tables with right edges beyond the local viewport; a small ↔ cue is present. | Use screen-appropriate compact Tablet layouts or make full codes, quantities and actions clearly visible and reachable; preserve all fields and 44px controls. Verify keyboard and touch local-scroll access independently. |
| REV-VQ-004 | P2 | 02 source-choice radio controls measure **20×44 CSS px**, eight inputs in Tablet capture. Markup provides no associated wrapping label around the whole row; no larger effective hit target is established. | Supply an explicit accessible 44×44 or larger input/associated label target without changing source-selection logic. |
| REV-VQ-005 | P2 | [10 Tablet full](after/10-Tablet-full.png): validation correctly exposes missing reason and quantity12 over maximum10, yet summary presents **14 Cái / −14 Cái projected** as if a meaningful projection. Reference validation shows current impact0 and requires correction before proceeding. | Suppress or mark projected values unavailable while any line is invalid; keep entered values and field-specific messages. |

02 displays eight selectable source rows while the reference depicts nine; 01 correctly shows nine reversal records. This is a visible fixture/composition difference, not proof that production lists must have nine rows. Other divergences include simplified state/status and timeline presentation; no claim of pixel fidelity is made. In 06 the pending-return explanation and 6/0/0 are visible, but approved process hierarchy is reduced to text. In 08 +90/−45/+45 and trace appear; in 09 BOX-018-01 and the blocking document appear. 11 presents unknown and checking, with the local adapter request used as setup.

## State coverage

| Pair | Captured Candidate observation (Desktop1920, Desktop1440, Tablet) |
|---|---|
| 01 | Nine records, counts and filters; 1440 obstruction, Tablet table reflow gap. |
| 02 | Eight source rows, selected 007 source and totals; radio targets and Tablet table gap. |
| 03 | 007 draft has two item rows, reason, note, 4 and projected −4. |
| 04 | 007 review has two rows, projected change and check panel. |
| 05 | 009 posted has nine lines and 45; summary duplicates current-impact label. |
| 06 | 008 pending has three lines and requested6/received0/available0 text. |
| 07 | 005 cancelled has one line, 2 units and 0 current impact. |
| 08 | 009 shows +90/−45/+45, nine lines and audit/trace. |
| 09 | 002 blocked has BOX-018-01, related document and disabled post. |
| 10 | Invalid blank reason and 12 versus10, second line2; projection issue above. |
| 11 | Local submission returns unknown; `Đang kiểm tra` and check-status action shown. |
| 12 | Local confirmed receipt produces success, but −4 summary incorrectly shows0. |

No source or baseline edits were made by visual QA. Fixes require a new frozen build and independent recapture; real backend permissions, idempotency, atomicity, concurrency and persistence remain separate blocked evidence.
