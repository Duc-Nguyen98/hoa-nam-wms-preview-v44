# Concurrency and Idempotency Report — HN-PTW-26REF-001

Candidate SHA: `6ea167125643d10d6545b28df452511af54c6f09` (`DEV`) plus the uncommitted PTW seed fix, retested 2026-10-28 Asia/Bangkok. Probe data was isolated in memory.

## Results (MOCK)

- Active-task guard prevents a second create for the same BOX: `BOX_HAS_ACTIVE_TASK` (409).
- Version fence rejects stale create input: `STALE_BOX_VERSION` (409).
- Terminal task guard prevents a second confirmation: `TASK_NOT_DRAFT` (409).
- Confirmation path rechecks BOX version, content revision and current ledger quantity, so a stale BOX cannot be confirmed.
- S16 operational regression (17/17 including putaway) passed and exercised stale/read-generation fences and neutral inventory behavior.

The candidate command probe recorded `BOX_HAS_ACTIVE_TASK` for duplicate create, `STALE_BOX_VERSION` for stale create, `TASK_NOT_DRAFT` for double confirm, and one effective BOX→tray mapping after confirmation. The same probe kept stock quantity 5 and stock-event count 1 across Draft and Confirm.

## Replay qualification

The command-recovery wrapper requires the journal entry to be acknowledged before a new request is accepted. Attempting to call the exact same create request after acknowledgement was blocked with `RECOVERY_ACK_REQUIRED`; this prevents an accidental client replay but is not a retained proof of server-side same-command replay. `business-repository.ts` contains a canonical receipt replay branch, but there is no packet-scoped test proving the end-to-end S13/S14 lost-response path. Mark this sub-gate PARTIAL and retain it as a release follow-up.

Parallel browser double-click and network-lost-response tests were not run. No concurrency test touched production or staging. REAL_API and staging replay/RBAC are BLOCKED/NOT_RUN.
