# Visual defect register — 35c59fa retest

| ID | Status and evidence | Action |
|---|---|---|
| VQ-F01 | **P2 OPEN, partially improved.** Tablet 08 information rows and tabs are compact, and document height reduced 1768→1689 CSS px, but impact tiles retain substantial unused height and the reference compact trace plus marker/actor timeline is presented as separate plain cards/paragraphs. See [actual](08-Tablet-full.png) and [reference overlay](comparison/08-Tablet-overlay.png). | Adjust compact trace, timeline styling and tile sizing to the approved hierarchy while preserving actual values and event truth. |
| VQ-F02 | **Original filter and summary grouping CLOSED in this retest.** Tablet 01 now has four first-row filters, second-row search/actions and five summary tiles. A new date readability issue remains below. | No further action on original grouping; address VQ-F04. |
| VQ-F03 | **P2 BLOCKED on audit data authority.** Reference 08 depicts a review event, but the available data does not establish one; actual has creation and posting entries. | Obtain real audit event/actor data; never synthesize the event. |
| VQ-F04 | **P2 OPEN, new.** At 800 CSS px Tablet 01, both selected date controls visibly display truncated years (e.g. `25/10/2...` and `28/10/2...`). [Actual](01-Tablet.png). | Give date text sufficient space within the responsive filter layout while retaining clear/calendar control usability and all filter fields. Retest 800 px and nearby widths. |

The original screenshots are not certified at a particular browser viewport, DPR or font profile; findings concern visible hierarchy and readability, not a score or exact-pixel threshold. No P1 was observed in this capture review.
