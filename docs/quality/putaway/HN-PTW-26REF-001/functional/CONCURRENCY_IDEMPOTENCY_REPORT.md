# Concurrency and Idempotency Report — HN-PTW-26REF-001

## Results (MOCK)

- Active-task guard prevents a second create for the same BOX: `BOX_HAS_ACTIVE_TASK` (409).
- Version fence rejects stale create input: `STALE_BOX_VERSION` (409).
- Terminal task guard prevents a second confirmation: `TASK_NOT_DRAFT` (409).
- Confirmation path rechecks BOX version, content revision and current ledger quantity, so a stale BOX cannot be confirmed.
- S16 operational regression (17/17 including putaway) passed and exercised stale/read-generation fences and neutral inventory behavior.

## Replay qualification

The command-recovery wrapper requires the journal entry to be acknowledged before a new request is accepted. Attempting to call the exact same create request after acknowledgement was blocked with `RECOVERY_ACK_REQUIRED`; this prevents an accidental client replay but is not a retained proof of server-side same-command replay. `business-repository.ts` contains a canonical receipt replay branch, but there is no packet-scoped test proving the end-to-end S13/S14 lost-response path. Mark this sub-gate PARTIAL and retain it as a release follow-up.

Parallel browser double-click and network-lost-response tests were not run. No concurrency test touched production or staging.
