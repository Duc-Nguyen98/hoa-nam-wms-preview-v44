# Model routing canary — 2026-10-27

Task: Notification badge boundary canary  
Branch: `DEV`  
Source under test: `d72dbadebe59eefcf98fbfabd489eb20b13e2532`

## Terra request

Requested S00#2 dispatch: `gpt-6.1-terra` / `high`. The active native `spawn_agent` interface rejected this model as unavailable and listed only Sol, Astra, Luna and 5.6 variants. No Terra execution is claimed.

Result: `UNAVAILABLE`.

## Sol control

Requested dispatch: `gpt-6.1-sol` / `high`. The child completed read-only tests without editing source or baseline.

| Check | Result | Elapsed |
|---|---:|---:|
| Autonomous task-engine tests | 9/9 PASS | 1,383 ms |
| Badge contract tests | 7/7 PASS | 1,057 ms |
| Existing browser evidence inspected | 2/2 PASS, Desktop + Tablet, 7 counts | Evidence inspection only |

`ACTUAL_MODEL` and `ACTUAL_REASONING` are **UNVERIFIED** because the child runtime did not expose authoritative model metadata. Requested dispatch parameters are recorded separately from actual runtime identity.

## Decision

The policy is recorded and the Sol control is reproducible. `MODEL_ROUTING_ACTIVE` is **not** claimed: Terra could not be dispatched and the active runtime did not expose verifiable model/effort telemetry. Keep `CONTROLLED_AUTOMATION`; do not change acceptance gates or global Codex configuration.
