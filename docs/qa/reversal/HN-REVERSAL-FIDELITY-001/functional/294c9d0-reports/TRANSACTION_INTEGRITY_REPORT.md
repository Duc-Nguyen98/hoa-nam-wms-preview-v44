# Transaction integrity and data boundaries

Current independent repair evidence: [durable model review](functional/DURABLE_MODEL_REVIEW.md) and [final run report](functional/RUN_REPORT.md). The first durable implementation exposed two malformed-read failures and a separate stale scratch overwrite; their original receipts remain historical. Frozen source 294c9d0 / build 233db62c has 28 independent model PASS and 23 unique cumulative browser PASS (22 core plus B23); the full attempt had one development-module resource failure and the bounded B16 retest passed with zero errors. Every completed browser case preserves canonical state; exact source hashes match throughout. Dedicated persistence, original intent, model CAS and receipt matching are local MOCK guarantees only; live backend transaction atomicity remains BLOCKED.

Baseline71cfa02/build551357b4; phaseA. No app source or canonical business record was changed by independent QA.

Fresh normal-browser negative proofs completed in this task:7 persistence/recovery/shared-tab FAIL,2 semantic FAIL,1 normal MOCK expiry PASS and1 count-scope observation. Every canonical business hash matches before/after; both source-custody receipts are unchanged and record zero page errors. [Full phaseA evidence/boundaries](functional/PHASE_A_NEGATIVE_AUDIT.md). No generic real-server transaction result is claimed.

## Two separate systems

The opt-in approved workspace uses `src/features/S17/approved/adapter.ts`: copied fixture rows, a numeric revision and per-instance pending/receipt maps. `save` changes that instance; `post` checks expected revision/source/quantities, changes a copied record and returns a fixture proof. It has no database transaction, network endpoint, verified actor, physical inventory, stock balance or real audit-event source. The fresh model probes show a new instance loses saved input and operation lookup; two independent instances each confirm their own stale copy. These are new persistence/shared-scope gaps, not evidence of duplicate real stock effects.

The existing operational S17 path is different. `src/contracts/operational-preview.ts` supports whole unused WARRANTY-parts returns. `src/preview-mock/reversal-policy.ts` preserves original issue/event identity, requires evidence and physical-return confirmation, checks intervening use, then plans compensating stock/physical writes. `src/preview-mock/operational-policy.ts:63–71` adds command audit; `business-repository.ts` and `business-atomic.ts` validate identity, versions and immutable commit proof in a single persistence transaction. These are local MOCK contracts. They must not be generalized into an approved partial inbound/outbound API or overwritten to make reference screens work.

## Quantity and identity interpretation

`original`, `prior` and `quantity` in approved Line are document/reversal quantities. Success before/after currently calculate original−prior and original−prior−quantity. No actual SKU on-hand/available balance is read. Calling these Tồn trước/Tồn sau conflicts with the requested distinction. A bounded correction can scope the labels to original-document/remaining or chain quantities, without inventing a stock service or borrowing canonical SKU values with unrelated ids.

Line has no unit. Uniform Cái is valid for the existing comparison fixture; it is not a general mixed-unit contract. A runtime extension probe provides Cái/Mét only to expose presentation assumptions and is explicitly outside the old DTO. Prefer explicit per-line units and grouped totals, or an unknown/unsupported-unit state, once the isolated view-model contract is established. Do not approve a backend unit/precision rule from this probe. Fractional .5 currently passes the local finite/range guard; whether pieces must be integer and how decimals round remains MISSING.

## Bounded repair interface recommendation (not implementation approval)

Keep the existing operational command registry and canonical business/account databases untouched. An isolated opt-in MOCK adapter may receive a persistence dependency plus a **trusted** current actor/session-generation/scope resolver. It should initialize through an explicit read lifecycle; list/source/draft state and a separate operation journal must be versioned and validated before rendering. Successful save must mean the durable write completed, not that React state changed.

Persist an immutable prepared operation containing original key, resource/source identity, payload, expected revision and digest **before** explicit submission. Unknown operations remain separate resource overlays even if the simulated counterparty committed; do not falsely change business status to confirmed or drop the operation from list. Recovery reads restore the original input/key and never dispatch a new POST. Proof acceptance must match key/resource/payload scope and the current verified actor/epoch. Local fixture proofs remain tagged MOCK; a storage object is not an authentic server receipt.

Use atomic compare-and-swap for shared record revision/resource operation locks across tabs. No lease expiry may erase an unresolved operation or permit a fresh key to replace uncertain intent. Missing/malformed/quota/blocked storage must be visible, preserve uncertainty, and must not silently fall back to a successful memory model. Never store credentials or auth tokens, use display-name strings as authority, leak another actor's entries, or reset canonical stores. Namespace/version migration needs its own tests and failure handling.

Existing `createIndexedDbBusinessPersistence` provides a synchronous transactional callback pattern and rejects malformed/null storage without silent memory fallback. Existing `createCommandRecovery` demonstrates actor/epoch/digest/fence/CAS checks. Reuse patterns only: its `retry()` resends the same command and is **not** a read-only status lookup. Bridging generic partial reversal into legacy whole-return commands is outside scope and must remain BLOCKED.

## Required fresh transaction tests

Current browser negative receipts must prove unknown/list/reopen/refresh, saved draft reload, selection context, stale parallel tabs and canonical equality. A repair then needs malformed state, failed durable prepare/save/receipt writes, actor/epoch replacement before/after read, same-key payload collision, cross-tab revision conflict, original source preservation and no auto-send on restore tests. Tests requiring an unimplemented persistence interface or real server contract are NOT_RUN/BLOCKED, never inherited PASS.
