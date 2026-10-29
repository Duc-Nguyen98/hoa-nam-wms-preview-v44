# Functional QA report

Independent local MOCK verdict: **PASS within the tested scope** on source `35c59fa5f38ba3c820e07ce84ef153b7af622922`, build `ee58fe43e9dee43af5c551173c9c5ca54f721f12703a1477af5d39520c9ad7eb`. There are28 fresh independent model PASS and22 browser PASS in **one clean full run**, with zero console/page errors. [Consolidated machine-readable receipt](../../../functional/35c59fa/FINAL_ACCEPTANCE.json), [full execution report](../../../functional/RUN_REPORT.md), [exact final browser receipt](../../../functional/35c59fa/browser/results.json).

The original nine baseline failures remain immutable. The independent R10 malformed-read defects are closed by retained corruption assertions in the28-case model run; the initial19 PASS/two FAIL receipt is preserved. R11's independently proved stale-scratch overwrite is closed by explicit base-version rejection, winner-preservation model assertions and normal-app B07 showing a stale PageState followed by acknowledged content after reload. [Historical R10](../../../functional/durable-contracts/round1-results.json), [historical R11](../../../functional/scratch-race-pre-repair.json), [repaired model](../../../functional/35c59fa/model/results.json).

| Acceptance area | Fresh evidence / scope |
|---|---|
| Unknown identity/input across list, reopen, refresh and tab closure | B01–B03; durable original key, same payload and one receipt; no extra model revision on status resolution |
| Draft/source persistence and tab races | B04–B07; shared fixture scope admits one posting; stale scratch cannot silently adopt the current version |
| Blank/invalid fields and per-SKU association | B08/B18; blank marker restores and can be corrected; invalid projection remains unavailable; model rejects nonpositive/nonfinite/excess posting |
| Document quantities, counts, units | B09/B12; document-qualified labels, explicit all-record/filter labels and grouped unlike-unit presentation; actual stock and live unit DTO not invented |
| Pending/cancelled/posting signs/history | B10; requested6/received0/available0, zero unposted impact, known-only cancellation history, inbound−/outbound+ and source-dialog focus relation |
| Reads and resource states | B11/B16; dedicated storage failure blocks; injected loading/session/forbidden/offline/error/empty/retry and actual not-found rendering |
| Search/date/history/pagination | B13/B19/B22; accepted query survives; invalid dates retain accepted rows; no-results clears;12-row extension paginates9/3 |
| Creation/posting | B20; chosen011 source/current Vietnam creation date, saved notes/quantity and exact durable reviewed payload; success survives reload |
| Controls and responsive/localized geometry | B14/B21;44px Tablet radio/number/source controls, native radio keyboard, single bindings and header/data-label alignment;12 VI/EN/Chinese deep profiles at400/800/1440. Fresh ARIA snapshots retain list/impact labels and hide decorative icons; compact readonly rows keep all seven values. |
| Existing operations/shared shell/session | B17 normal S16/S17/S21/S12/S14 readonly smoke; B15 fresh normal MOCK expiry removes protected module |

The final browser receipt has unchanged before/after source hashes; model hashes match the same browser source custody. All22 final browser-case executions preserve their own before/after canonical business hash. Canonical hashes are compared within each execution, not across separately seeded authenticated contexts. Model tests use dedicated explicit memory backing and never open canonical/account stores. Runtime credentials and account storage were never persisted to evidence.

Earlier candidate a98b0357 required targeted harness corrections after empty-DatePicker naming, about:blank preferences, repeated development-module resource errors and an h1-helper assumption. Its cumulative acceptance and every raw failed attempt remain historical in [the archived receipt](../../../functional/a98b035-FINAL_ACCEPTANCE.json) and [archived run report](../../../functional/a98b035-RUN_REPORT.md). None is relabelled as the final35c59fa run. The corrected full final suite has22/22 PASS and zero errors.

REAL_API generic partial inbound/outbound commands, backend atomicity/idempotency, trusted receipt identity, authoritative source permissions, second authorized normal actor/role tests and live RBAC are **BLOCKED**. Generic precision/rounding and missing view08 review-audit data are **MISSING**. No production stock command, auth bypass, canonical mutation, fabricated audit event or bridge to existing whole-unused warranty return was introduced. Browser runtime is Chromium; Edge-specific execution is not certified. Screen-reader testing, a full locale/theme/view Cartesian product, cross-actor in-flight session replacement and reauthentication recovery policy are NOT_RUN/BLOCKED rather than inferred passes.

Root-owned build/typecheck/combined-unit receipts are separate validation and are not added to these independent28 model cases. Requested worker configuration is Sol High; actual runtime model telemetry is unverified. Browser cleanup completed and its lease was released before visual recapture.
