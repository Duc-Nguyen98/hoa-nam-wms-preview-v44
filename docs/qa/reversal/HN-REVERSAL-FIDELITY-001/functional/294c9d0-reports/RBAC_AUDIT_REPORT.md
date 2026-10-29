# RBAC and session authority audit

Frozen294c9d0/233db62c repair update: independent actor/role/warehouse/scenario mismatch tests reject access to another stored fixture envelope. This verifies local namespace/model isolation, not authenticated permissions. Source App integration uses confirmed session labels and a keyed workspace. Fresh browser B15 passes normal MOCK expiry, while B16 passes explicitly injected unauthorized/forbidden/offline/error states and retry through the actual workspace. [Run report](functional/RUN_REPORT.md) distinguishes normal session proof from component read injection. Real actor revocation, second-account role tests and backend receipt authority remain BLOCKED; no model pass is treated as backend RBAC approval.

Baseline71cfa02/build551357b4. No production role, permission or posting operation was tested. All current browser/model evidence is synthetic MOCK.

## Current authority surfaces

The normal app uses `src/app/App.tsx` authentication gates: signed-out users see S07, confirmation-required users S08, active users entering auth routes redirect to S01. These gates are distinct from permission to post a generic reversal. A fresh normal expiry probe may validate the MOCK account gate without patching storage; it cannot certify real server expiry.

The approved opt-in adapter has no actor, capability, role, session or epoch parameter. Its source badges and hardcoded creator name are reference presentation, not authority. App's adapter memo depends only on reversalCandidate. A display label cannot supply a trusted recovery scope; a role selector or disabled button must not be treated as backend authorization.

The existing operational repository is fail-closed: `src/preview-mock/business-repository.ts:189–199` requires an unexpired confirmed MOCK BusinessActor and authorize() before applying/replaying a command; expected-version/epoch validation follows inside the transaction. `business-reads.ts:91–95` binds operational enablement, confirmed actor and WEB/QA command surface. `operational-preview-adapter.ts` checks surface; `reversal-policy.ts` only registers legacy whole warranty-return WEB commands. These are MOCK implementation contracts, not approval of generic inventory.reversal.post or a production role matrix.

Existing recovery resolves actor before/after authority/storage work, rejects actor mismatch/expired/unconfirmed sessions and fences late responses. It deliberately treats local storage as durable intent, not permission. Its account/recovery namespace is separate from canonical business storage. Any new isolated design journal must not store credentials/tokens, select another actor's entries, bypass these checks or overwrite those databases.

## Gate matrix

| Probe | Current status |
|---|---|
| Fresh normal synthetic login and confirmation | Executed in new baseline browser receipts; no inherited PASS |
| Fresh MOCK expiry with clock advance and protected route | PASS:9-hour clock advance/reload shows S07 and removes protected module; no auth-storage patch; not real server expiry |
| Cross-actor journal isolation via two real normal accounts | BLOCKED: no second authorized normal synthetic account/role contract supplied; no fabricated identity will be inserted |
| Session/epoch switch while recovery read/post outcome is in flight | NOT_RUN for new design model; interface absent, must be added/tested with injected authority in isolated tests |
| Generic source eligibility/permission deny | BLOCKED: no authoritative source-role API; fixture badges cannot prove access |
| Backend generic partial post allowed/403/401/not-found distinction | BLOCKED: DTO/permission/server endpoint authority missing |
| Existing whole warranty-return server policy | Preserve current contract; do not bridge generic fixture actions into it |
| New local journal malformed/missing/storage-denied states | NOT_RUN until persistence exists; must fail closed without memory-success fallback |

A future opt-in MOCK resolver may expose verified immutable actor identity plus session generation/scope to the isolated adapter. It must come from the installed authenticated boundary, not user-editable profile text or a caller-invented role. Namespace separation and read fences do not establish production security. REAL_API/RBAC remain BLOCKED until their actual contracts and normal test roles are supplied.

Fresh proof and actor-test limits: [phaseA audit](functional/PHASE_A_NEGATIVE_AUDIT.md), [normal baseline receipt](functional/baseline-negative/results.json). Canonical business hashes match for every case, including expiry. Source is unchanged; no cross-actor PASS is inferred.
