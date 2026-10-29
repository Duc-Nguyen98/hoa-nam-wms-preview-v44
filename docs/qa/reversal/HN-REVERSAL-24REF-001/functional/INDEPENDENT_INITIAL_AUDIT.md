# Independent initial functional audit

Task HN-REVERSAL-24REF-001. Branch candidate/reversal-24ref-20261029, base `d9e267cf4765fe5a10ad050fa1a408f5377ca316`. This audit inspects the uncommitted candidate implementation; source SHA256 values are in [initial source receipt](independent-initial-source.json). No browser result is claimed before a frozen build and serialized browser slot.

Command: `npx tsx --test tests/reversal-approved24-qa/independent-guards.test.ts`. Fresh result: **16 PASS /1 FAIL**,17 independent tests. [Raw output](independent-unit-initial.txt). These tests were written independently of the implementation worker's five existing tests. All execution is pure in-memory MOCK; there was no canonical operational database write.

## Confirmed independent guard failure

**REV-QA-F01 — mutable idempotency proof (P2, local adapter).** `post()` returns the same Receipt object held by its private receipts map. Mutating that returned object's recordId/key/version rewrites subsequent `status(originalKey)` proof. The independent final test expected recordId REV-20261028-007 but received FORGED. Return frozen or defensive receipt copies consistently on initial post, replay and status. This is a local adapter invariant; no server exploit or real backend mutation is claimed.

Passing probes cover returned-record/source copy isolation; draft-only edits; source/type/creation identity; accepted/stale save fencing; duplicate/unknown SKU and source-field spoofing; zero/negative/non-finite/excess quantities; required reason; unregistered draft/key/version checks; posted/pending/cancelled downgrade attempts; outbound/dependency guard; remaining quantity consumed once by posted records only; exact idempotent replay; payload collision including notes; unknown same-key/status behavior; and positive/negative/zero impact signs.

**Independent repair retest:** the implementation worker changed receipt returns to defensive copies and added an optional persisted header-note field to payload fingerprinting. The original mutation test plus a new header-note save/replay-collision probe now pass: **18/18 PASS**. [Raw retest](independent-unit-receipt-repair.txt), [exact adapter hash](independent-unit-receipt-repair-source.json). This closes the local receipt-object alias failure for the recorded adapter hash; it does not certify the still-unexecuted UI note binding or backend receipt behavior.

## Source findings queued for browser reproduction

| Finding | Source evidence and expected verification |
|---|---|
| Header draft note is dropped | Header textarea updates standalone `note`; `save(current)`/`post(current)` omit it and RecordRow has no header-note field. Verify actual saved payload rather than merely visible text. Per-line notes are separately represented. |
| Navigation context is transient | `go()` only changes React view and scrolls to0. No route/history synchronization or return-focus/scroll persistence. Verify selected record/filter through Back/Forward and refresh. |
| Unknown record fallback | Missing requested id silently resolves to `records[2]`. Verify not-found rather than a successful unrelated draft detail. |
| Invalid list date range | Native date fields have no shared validation; Search directly applies arbitrary/reversed/future ranges. Verify visible validation and preservation of previously accepted results. |
| Partial locale coverage | Fixed prose, breadcrumbs, headings and some options remain VI outside the small EN/zh maps. Verify each required language/theme against actual module content. |

These are source findings, not newly executed browser FAIL receipts. A separately named browser runner is prepared with normal synthetic authentication, protected route entry, canonical-state equality, and bounded actual-component adapters for request/receipt/conflict instrumentation. No authentication/storage patch or historical prepare-ui mutation flow is used.

## State and backend boundaries

The approved adapter exposes synchronous `list()`/`sources()` and in-memory save/post/status. It has no backend read lifecycle, authorization scope, session/role matrix, or partial inbound/outbound DTO. Loading/read-error/forbidden cannot be honestly certified as live API behavior through this contract. The initial list's empty/no-results paragraphs do not establish distinct shared state panels. Session expiry remains an application gate, separate from business pending-return/outcome-unknown states.

REAL_API, server atomic posting/concurrency/idempotency, backend permission mapping and production stock updates remain **BLOCKED**. BPD v1.12 review-ready is not approval evidence. The frontend model can test bounded behavior while these gaps remain open; such results must be labeled MOCK and must not be promoted into API integration or business approval.

Runtime model/effort telemetry is **NOT_VERIFIED**; a requested model label alone is not execution evidence. No application source, fixture assertion or design baseline was changed by this independent QA worker.
