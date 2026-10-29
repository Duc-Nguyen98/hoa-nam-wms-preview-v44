# Idempotency, recovery and concurrency audit

Fresh frozen repair result:28 independent model PASS and22 browser PASS in one clean full run with zero errors in [consolidated receipt](../../../functional/35c59fa/FINAL_ACCEPTANCE.json), source35c59fa/build ee58fe43. Repeated model status reads performed zero writes and no second dispatch hook; shared backing admits one consumption under same-key/different-key races and rejects stale saves. The additional [historical scratch-race proof](../../../functional/scratch-race-pre-repair.json) showed that business CAS alone allowed rejected UI scratch to overwrite a winner after reopen. New model tests reject stale/missing scratch bases, and normal browser B07 verifies explicit stale feedback plus winner preservation after reload. Browser B01–B03/B06 verify durable unknown recovery and a single committed same-scope tab posting. Backend concurrency remains BLOCKED; these are local MOCK tests, not server guarantees.

Fresh baseline scope:71cfa02/build551357b4, isolated design adapter and existing recovery source. Historical unit/browser passes are not newly executed results.

Fresh normal-app proof is now complete: unknown/list/reopen/refresh/tab continuity, saved draft/selection and stale two-tab posting each FAIL against the expanded requirement; MOCK expiry PASS and count scope is OBSERVED. Two semantic failures cover document/stock labels and bounded unit extension. See [phaseA audit](../../../functional/PHASE_A_NEGATIVE_AUDIT.md) and its raw receipts. These are isolated design-model gaps, not real-stock duplicate-post or backend concurrency claims. Canonical hashes and source remain unchanged.

| Boundary | Current evidence | Verdict |
|---|---|---|
| Same live adapter instance, same key/payload | Private fingerprint/receipt maps return defensive proof copies and reject changed payload. | Local contract exists; new-task broad acceptance NOT_RUN until fresh scoped tests |
| Unknown status in same instance | post marks the simulated record committed and returns unknown; status(key) resolves its stored fixture proof. | Local simulation, not a server status endpoint |
| Refresh/new instance | Fresh model probe has no original input/receipt; status(originalKey) is unknown without restoration. Workspace key is React-only. | CONFLICT with new recovery requirement |
| Unknown→list→row reopen | List still uses pre-unknown records; open() unconditionally clears key. | Source-confirmed loss path; fresh browser negative required |
| Two tabs/instances | Fresh model probe independently confirms both copies. No shared revision/CAS exists. | No cross-tab protection in this adapter; not a real-stock double-post finding |
| Date.now key | UI constructs reversal-id/time key; no durable immutable operation envelope or actor field. | New scoped journal/operation identity required; do not claim global uniqueness |
| Existing command recovery | Versioned MOCK journal, immutable request digest, actor/epoch checks, leases/CAS, proof validation, explicit acknowledgement. | Reusable patterns; separate current contract |
| Existing retry() | `src/data/command-recovery.ts:269–276` calls execute(before.request), which can send again. restore() only inspects. | Cannot advertise retry as read-only recovery; no automatic replay for this task |
| Real server idempotency/atomicity | No approved generic partial endpoint/proof/role contract. | BLOCKED |

## New-task recovery acceptance

Recovery must restore the same operation and input after refresh/tab reopen, retain an outstanding-operation affordance in the resource list, and offer an explicit status read. It must not derive “failed”, zero impact or success from timeout, missing memory or storage failure. A confirmed proof is accepted only for the original operation and resource under current verified authority. A changed payload must require a separately reviewed new command only after the original is resolved; replacing an unknown operation with a new key is forbidden.

Read-only status means no new business submission or stock effect. Recording a verified lookup result/recovery phase in the dedicated local journal may still require a local persistence transaction; that is distinct from resending the original command.

Durable local operation preparation must precede submission. Shared-tab compare-and-swap must block a stale revision or second outstanding operation. Reads/status lookups can be repeated without a command dispatch. Recovery corruption/storage-denial must remain visible rather than clearing/resetting intent. Actor/session/epoch changes must fence both reads and late outcomes; browser storage is not a security boundary and cannot substitute for backend authorization.

## Fresh evidence and limits

`functional/baseline-model-probes.json` records current behavior: saved note disappears in a new instance; two private instances both confirm; .5 is accepted without precision authority. The current normal-app browser runner records sanitized HTTP operations request counts only, never credentials/request bodies. Because this design model posts in memory, zero HTTP operations POSTs do **not** prove zero adapter calls or backend safety. UI mode/input/resource continuity and source facts provide the negative recovery proof.

Tab reopen means a closed/reopened page inside an authenticated browser context. Full browser-process restart, second verified actor, malformed persistence, quota/write failure and generation replacement tests are NOT_RUN/BLOCKED until an opt-in persistence/authority interface exists. Do not silently label these “not applicable” or PASS. The future interface recommendation is in TRANSACTION_INTEGRITY_REPORT.md.
