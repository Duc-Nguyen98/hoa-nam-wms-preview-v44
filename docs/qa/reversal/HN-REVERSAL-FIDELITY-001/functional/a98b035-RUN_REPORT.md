# Independent functional verdict

Frozen source `a98b0357b0e4738bd5236f935fc3e3adbe35576c`, build `705689f29593dfd62472b3c85851554daaa2199a68512bb43e929b49ef8033fd`, served5341. **Local MOCK acceptance:28 independent model contracts and22 unique browser cases pass.** These22 cases passed cumulatively across one full attempt and targeted harness corrections; there was no single clean22-case run. [Consolidated receipt](a98b035-FINAL_ACCEPTANCE.json) verifies identical build/source custody across the attempts, model-file hashes matching browser custody, and unchanged canonical hashes for every completed case.

| Executed receipt | Actual result | Interpretation |
|---|---|---|
| [Independent model](durable-contracts/results.json) |28 PASS | Fresh on frozen source; explicit shared memory backing; no canonical stores opened |
| [Full browser attempt](repaired-browser/results.json) |19 PASS /3 FAIL | B19 empty-date name locator; B15 preference access on about:blank; B16 resource failure during repeated development-module navigation |
| [Targeted corrected attempt](repaired-browser-corrected/results.json) |2 PASS /1 FAIL | B19/B15 pass; B16 verifies all six states/retry then helper incorrectly waits for h1 on record-not-found |
| [Final bounded read-state attempt](repaired-browser-readstates/results.json) |1 PASS | B16 all states/retry/not-found pass; zero page/console errors |

The initial whole attempt recorded15 `ERR_INSUFFICIENT_RESOURCES` console messages while reloading the development component graph. The read-state harness now remounts independent adapter instances in one module load. Both targeted receipts have zero errors. All original raw receipts and screenshots remain; none of the harness failures was changed into a historical PASS. A separate zero-case startup receipt records the earlier namespace-lookup correction in [startup note](repaired-browser/STARTUP_HARNESS_NOTE.md).

## What the fresh checks establish

Normal authenticated fixture operation preserves unknown request key, header/per-SKU input and status action through list/reopen/refresh/tab closure. A status read resolves the same durable receipt without another model revision or receipt. Saved drafts, source selection and accepted filters survive reload/navigation. Same-scope tab posting admits one commit; stale scratch shows the inherited stale state and reload preserves the acknowledged winner. Independent tests measure zero writes for status reads and one dispatch hook under replay/races.

Blank quantity uses the explicit finite scratch marker, restores as blank, remains invalid for projection, and can be corrected/saved. Source011 creation binds current Vietnam creation date, chosen source, quantity and notes through reviewed post and success reload. Invalid/excessive input retains per-SKU error association and suppresses the projection. Model guards preserve original source/SKU/unit identity, posted-only prior consumption and original-minus-three remaining quantity; malformed storage and failed persistence do not seed a success fallback.

Document arithmetic uses document-qualified labels. Mixed units retain their provided units and grouped summaries in an explicit component extension; this does not approve a live mixed-unit DTO. Pending/cancelled views show no received/available stock or invented history. Posted inbound/outbound signs, source dialog relation and focus return are checked. Unknown status stays distinct from confirmed zero impact. All-record versus filtered-result labels are explicit.

Inherited loading, unauthorized, forbidden, offline, error, empty, retry and record-not-found states are exercised through the actual workspace with bounded injected reads. Search/date/no-results,9/3 pagination,44px Tablet radios/inputs, native radio keyboard and table/header bindings are checked. Normal S16/S17/S21/S12/S14 routes retain their bounded shared shell. VI/light400, EN/dark800 and Chinese/light1440 each cover list/choose/edit/detail geometry. This is12 deep profiles, not a complete locale/theme/view Cartesian product. Fresh normal MOCK session expiry removes the protected recovery surface.

## Boundaries

The browser was Playwright Chromium, not a certified Microsoft Edge run. Login used the existing synthetic normal flow; credentials were read only at runtime and never written to evidence. Account storage was read in memory only to hash the canonical business store; it was never persisted. Each browser case used a unique safe fixture scenario, deliberately shared by its own tabs for concurrency. No production/canonical mutation, auth bypass or generic operational post was performed. Browser/context cleanup completed before releasing the lease.

REAL_API generic partial inbound/outbound DTOs, backend idempotency/atomicity, authenticated receipt authority, real source eligibility, second normal actor/role tests and live RBAC remain **BLOCKED**. Generic precision/rounding and the missing view08 review-audit event remain **MISSING**; no fabricated rule/event was added. Existing whole-unused warranty-parts return commands remain a separate contract. Local fixture scope labels are not permissions.

Baseline nine failures remain in their original freeze/receipts. The additional first-durable malformed-read and stale-scratch proofs remain historical in `durable-contracts/round1-results.json` and `scratch-race-pre-repair.json`. Root/implementation test totals are separate from these independent counts. Model Sol High is the requested configuration; actual model telemetry is unverified here.
