# Transaction integrity and data boundaries

Source `e7b145feb3d8ec4b42bb2ba8fa66bfb5b3d9bf2f`, build `1bebecb3e20357207c7f6eb09c9ed987661c32c553451aeed3fe38a9f8b8b955`; static preview5341 and isolated Vite component harness5340. **Independent local MOCK: PASS, 28 model contracts and one clean full 23-case browser run (22 core plus B23), zero console/page errors.**

[Final acceptance](functional/e7b145f-final/FINAL_ACCEPTANCE.json), [model raw](functional/e7b145f-final/model/results.json), [browser raw](functional/e7b145f-final/browser/results.json), [run report](functional/RUN_REPORT.md).

The opt-in workspace now wraps the fixture adapter with dedicated versioned persistence and an operation journal. It does not execute the canonical whole-warranty-return commands. Its numeric revision, receipt and document source quantities are local model data, not physical stock balances or authentic server receipts.

| Boundary | Fresh independent evidence | Verdict |
|---|---|---|
| Durable prepare before dispatch | R04 persists original key/payload before hook; prepare storage failure never dispatches | PASS local MOCK |
| Failed commit after prepare | R12 preserves recoverable unknown intent with zero consumption | PASS local MOCK |
| Failed save | R03 rejects, durable record/revision unchanged | PASS local MOCK |
| Atomic local posting | R08 same/different-key races create one receipt/consumption; B06 shared browser tabs confirm once | PASS local MOCK |
| Original identity/amounts | R09 rejects forged source/unit/SKU/amount and readonly writes; snapshots are defensive | PASS local MOCK |
| Corrupt state | R10 schema, nonfinite quantity, source relation, operation fingerprint fail initialization without replacing raw journal | PASS local MOCK |
| Unknown recovery | B01–B03 preserve key/input; R06 status reads write nothing and dispatch nothing; acknowledgement matches exact receipt | PASS local MOCK |
| Canonical isolation | All23 per-case hashes equal; no canonical post commands | PASS measured boundary |
| Server atomicity/stock effects | Approved generic DTO and server unavailable | BLOCKED |

Document original−prior−quantity arithmetic is labelled as document quantity. Draft/cancelled/pending values are distinct from confirmed impact; unlike units are grouped. No precision/rounding or real-stock rule is invented.

Before/after application hashes match in both runs; all six model source hashes match browser custody. Every one of the23 browser cases has equal before/after canonical business hashes, compared within each case. Canonical/account contents, cookies, credentials and tokens are not persisted. The28 model contracts use explicit dedicated memory persistence; browser cases use opt-in scoped fixture IndexedDB. Both frozen baseline receipt hashes were rechecked unchanged.

Earlier baseline nine failures, R10 malformed-read failures, R11 stale-scratch proof, source-specific294c9d0 cumulative receipts and the interrupted e7b145f browser progress/failure screenshot remain preserved. The fresh e7b145f-final run uses the same existing assertions in a distinct directory. Interrupted e7b145f B11 recorded a missing-root failure; the fresh full run passes B11 without source/assertion changes. No failed attempt is relabelled or overwritten. Prior294c9d0 report copies are retained in functional/294c9d0-reports/.

All results are isolated MOCK. Generic partial inbound/outbound REAL_API, trusted backend receipt/audit proof, backend atomicity/idempotency, source eligibility/permission API and second authorized actor/role/warehouse tests are BLOCKED. Actual/available SKU stock, generic unit precision/rounding and missing view08 review-audit event remain MISSING. Cross-actor in-flight session replacement and reauthentication recovery policy, Edge-specific execution, full screen-reader testing and a complete viewport/zoom/locale Cartesian product are NOT_RUN/BLOCKED. Scope labels do not grant permissions. Existing whole-unused warranty-parts return remains a separate authority; no production command or canonical mutation was performed.
