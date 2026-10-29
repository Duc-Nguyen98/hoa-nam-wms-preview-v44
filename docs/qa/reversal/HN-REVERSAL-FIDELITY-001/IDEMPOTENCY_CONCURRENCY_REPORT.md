# Idempotency, recovery and concurrency audit

Source `e7b145feb3d8ec4b42bb2ba8fa66bfb5b3d9bf2f`, build `1bebecb3e20357207c7f6eb09c9ed987661c32c553451aeed3fe38a9f8b8b955`; static preview5341 and isolated Vite component harness5340. **Independent local MOCK: PASS, 28 model contracts and one clean full 23-case browser run (22 core plus B23), zero console/page errors.**

[Final acceptance](functional/e7b145f-final/FINAL_ACCEPTANCE.json), [model raw](functional/e7b145f-final/model/results.json), [browser raw](functional/e7b145f-final/browser/results.json), [run report](functional/RUN_REPORT.md).

| Probe | Current result |
|---|---|
| Same key and original payload | R07 exact replay returns original receipt; changed payload/new unresolved key conflict; one dispatch |
| Shared same-key/different-key races | R08 one local commit/revision/receipt; competing different key conflicts; B06 confirms same browser-scope behavior |
| Durable prepare/interruption | R04 intent saved before dispatch; new factory restores key/input; lookup does not dispatch |
| Unknown list/reload/reopen | B01–B03 retain original operation and notes/quantity; B02 status leaves model revision unchanged |
| Repeated status | R06 zero persistence writes and no extra dispatch hook; acknowledgement is separate metadata mutation |
| Receipt mismatch | R06 wrong key/record/version rejected without write |
| Stale draft and scratch | R08 rejects stale save; R11 rejects stale/missing scratch base. B07 shows stale feedback and acknowledged winner after reload |
| Storage and malformed recovery | R03/R04/R10/R12 reject failed writes/corrupt envelope while retaining uncertainty and original raw state |
| Backend idempotency/concurrency | BLOCKED: no approved generic partial API or trusted receipt contract |

HTTP transport observations contain only sanitized operations method/path. Zero HTTP POSTs in this fixture do not establish zero adapter calls; independent model hooks/writes provide that local measurement. Existing command-recovery retry() can resend and is not a read-only status method; this design adapter uses its own measured status lookup. Closed/reopened tab means a new page within the authenticated context, not a complete browser-process restart or reauthentication certification.

Before/after application hashes match in both runs; all six model source hashes match browser custody. Every one of the23 browser cases has equal before/after canonical business hashes, compared within each case. Canonical/account contents, cookies, credentials and tokens are not persisted. The28 model contracts use explicit dedicated memory persistence; browser cases use opt-in scoped fixture IndexedDB. Both frozen baseline receipt hashes were rechecked unchanged.

Earlier baseline nine failures, R10 malformed-read failures, R11 stale-scratch proof, source-specific294c9d0 cumulative receipts and the interrupted e7b145f browser progress/failure screenshot remain preserved. The fresh e7b145f-final run uses the same existing assertions in a distinct directory. Interrupted e7b145f B11 recorded a missing-root failure; the fresh full run passes B11 without source/assertion changes. No failed attempt is relabelled or overwritten. Prior294c9d0 report copies are retained in functional/294c9d0-reports/.

All results are isolated MOCK. Generic partial inbound/outbound REAL_API, trusted backend receipt/audit proof, backend atomicity/idempotency, source eligibility/permission API and second authorized actor/role/warehouse tests are BLOCKED. Actual/available SKU stock, generic unit precision/rounding and missing view08 review-audit event remain MISSING. Cross-actor in-flight session replacement and reauthentication recovery policy, Edge-specific execution, full screen-reader testing and a complete viewport/zoom/locale Cartesian product are NOT_RUN/BLOCKED. Scope labels do not grant permissions. Existing whole-unused warranty-parts return remains a separate authority; no production command or canonical mutation was performed.
