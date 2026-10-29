# Functional QA report

Independent local MOCK verdict: **PASS within the tested scope** on source `a98b0357b0e4738bd5236f935fc3e3adbe35576c`, build `705689f29593dfd62472b3c85851554daaa2199a68512bb43e929b49ef8033fd`. There are28 independent model PASS and22 unique browser PASS cumulatively. The browser evidence comprises19 passes in the full attempt, two resolved harness cases in a targeted attempt, and the final resolved read-state case. **No single clean22-case run is claimed.** [Consolidated machine-readable receipt](../../functional/a98b035-FINAL_ACCEPTANCE.json), [full execution report](../../functional/a98b035-RUN_REPORT.md).

The original nine baseline failures remain immutable. The independent R10 malformed-read defects are closed by retained corruption assertions in the28-case model run; the initial19 PASS/two FAIL receipt is preserved. R11's independently proved stale-scratch overwrite is closed by explicit base-version rejection, winner-preservation model assertions and normal-app B07 showing a stale PageState followed by acknowledged content after reload. [Historical R10](../../functional/durable-contracts/round1-results.json), [historical R11](../../functional/scratch-race-pre-repair.json), [repaired model](../../functional/durable-contracts/results.json).

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
| Controls and responsive/localized geometry | B14/B21;44px Tablet radio/number controls, native radio keyboard, single bindings and header/data-label alignment;12 VI/EN/Chinese deep profiles at400/800/1440 |
| Existing operations/shared shell/session | B17 normal S16/S17/S21/S12/S14 readonly smoke; B15 fresh normal MOCK expiry removes protected module |

All three browser receipts have unchanged before/after source hashes; model hashes match the same browser source custody. All26 completed browser-case executions preserve their own before/after canonical business hash. Canonical hashes are compared within each execution, not across separately seeded authenticated contexts. Model tests use dedicated explicit memory backing and never open canonical/account stores. Runtime credentials and account storage were never persisted to evidence.

The full attempt's three failures are preserved as harness/environment findings: an empty DatePicker accessible-name mismatch, preference access on about:blank, and repeated development-module loads causing15 `ERR_INSUFFICIENT_RESOURCES` console messages. The first targeted read-state attempt additionally exposed an h1-helper assumption on the legitimate h2 not-found state. Corrections changed QA navigation/locators/module loading only. Both targeted receipts have zero errors. Raw failed attempts remain linked in the full report.

REAL_API generic partial inbound/outbound commands, backend atomicity/idempotency, trusted receipt identity, authoritative source permissions, second authorized normal actor/role tests and live RBAC are **BLOCKED**. Generic precision/rounding and missing view08 review-audit data are **MISSING**. No production stock command, auth bypass, canonical mutation, fabricated audit event or bridge to existing whole-unused warranty return was introduced. Browser runtime is Chromium; Edge-specific execution is not certified. Screen-reader testing, a full locale/theme/view Cartesian product, cross-actor in-flight session replacement and reauthentication recovery policy are NOT_RUN/BLOCKED rather than inferred passes.

Root-owned build/typecheck/combined-unit receipts are separate validation and are not added to these independent28 model cases. Requested worker configuration is Sol High; actual runtime model telemetry is unverified. Browser cleanup completed and its lease was released before visual recapture.
