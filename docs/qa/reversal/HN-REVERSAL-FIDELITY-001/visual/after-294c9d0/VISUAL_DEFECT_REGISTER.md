# Visual defect register — 294c9d0

| ID | Retest result | Follow-up |
|---|---|---|
| VQ-F01 | **PARTIAL, residual P2 OPEN.** Tablet 08 now has compact information rows, correctly styled tabs, natural-height impact tiles, connected document trace and three-event timeline markers. The approved reference still places a compact impact table, trace and timeline together, while actual retains three extra item-summary boxes and separate trace and audit cards. Actor labels shown in the reference are absent from current event data. [Actual](08-Tablet-full.png), [diagnostic overlay](comparison/08-Tablet-overlay.png). | Escalate the remaining structural hierarchy after two UI repair rounds; preserve meaningful values and do not invent actor data. |
| VQ-F02 | **CLOSED for original grouping.** Four first-row filters, second-row search/actions, five summary tiles shown at Tablet. | None for this finding. |
| VQ-F03 | **P2 BLOCKED on authoritative audit data.** Reference 08 includes a review event that the current source does not establish; actual timeline shows three known events. | Obtain real audit event and actor contract/data; do not synthesize an event. |
| VQ-F04 | **CLOSED for captured 800 px date clipping.** Both full dates are visible in [Tablet 01](01-Tablet.png). Independent functional QA separately reports tests across 600, 759, 760 and 800 px and VI/EN/ZH; that evidence is distinct from this visual capture. | None for captured issue. |

Reference viewport, DPR and font conditions are uncertified; no pixel score determines approval. No new P1 was seen.
