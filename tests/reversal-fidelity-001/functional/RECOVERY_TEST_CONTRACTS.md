# Independent async recovery test contracts

Prepared after the fresh71cfa02 negative proof. The NOT_RUN cells below preserve the **planning-time** requirements, not the current outcome. Latest frozen execution is recorded in `docs/qa/reversal/HN-REVERSAL-FIDELITY-001/functional/e7b145f-final/FINAL_ACCEPTANCE.json`:28 independent model passes and one clean full23-case browser pass (22 core plus B23) on e7b145feb3d8ec4b42bb2ba8fa66bfb5b3d9bf2f/build1bebecb3e20357207c7f6eb09c9ed987661c32c553451aeed3fe38a9f8b8b955. No approved backend DTO is inferred; earlier cumulative candidate receipts and interrupted e7b145f attempt remain historical. Existing baseline scripts assert their baseline identity and were not silently reused against new source.

Current scope mapping: R02–R10/R12–R15 have corresponding local model/browser coverage in `durable-contracts.ts` and `repaired-browser.mjs`. R01 verifies the dedicated default fixture path, scope-key separation and canonical immutability; explicitly injected test persistence is trusted, not a production security boundary. R11 verifies envelope scope mismatch and stale scratch base-version guards; cross-actor in-flight session replacement and trusted server authority remain NOT_RUN/BLOCKED. Prepared browser clauses B01–B10 map to the22 named runtime cases; runtime B identifiers are granular implementation names rather than a one-to-one copy of the original planning table. B11 real roles/API/stock semantics remain BLOCKED. Read-state401/403 probes are bounded component injections; normal session expiry is separately tested.

## Isolation and instrumentation

Every normal-app case receives a distinct bounded `reversalScenario` id; reload/new-tab steps within that case reuse it. A fixture id must not change actor/permission authority. Use fresh normal authentication where needed; never patch account/canonical stores or persist auth storageState. Actor/role adversarial cases use an explicitly injected trusted MOCK scope provider in model tests, not a browser role selector that pretends to grant real rights.

Observe submitted operation identity/payload and status-read counts through the new adapter's legitimate public test dependency or dedicated isolated journal reads. Do not scrape React private internals. Sanitize evidence: no credentials/tokens, no request bodies from real services. Read canonical business state only to hash/compare. A zero actual HTTP count does not measure an in-memory adapter call.

## Model/storage acceptance

| ID | Required procedure and observable result | Status |
|---|---|---|
| R01 | Namespace is dedicated/versioned MOCK; account/canonical namespace is rejected, actor/role/warehouse/scenario dimensions do not collide. | NOT_RUN |
| R02 | Init and refresh await trusted scope plus storage read; no ready rows/success timestamp before acceptance. Missing first-use data may seed only the explicit comparison fixture; malformed existing data must not be treated as missing. | NOT_RUN |
| R03 | Save awaits durable commit. A rejected/quota/blocked write preserves input, reports failure and never shows saved success. | NOT_RUN |
| R04 | An immutable operation/key/resource/payload/revision is durably prepared before the one explicit post. Prepare-write failure produces zero sends and retains draft/error. | NOT_RUN |
| R05 | Restore/init/refresh performs reads only. An unknown operation returns its original key/input and remains outstanding; send count does not increase. | NOT_RUN |
| R06 | Repeated explicit status reads use the same key. They cannot call the generic recovery retry/resend method. Mismatched key/resource/payload/scope proof never produces success. | NOT_RUN |
| R07 | Same key/same payload replays one proof; same key/changed payload conflicts. A second key cannot replace unresolved resource intent. | NOT_RUN |
| R08 | Two adapters sharing the same backing/scope read revisionN; after A saves/prepares/posts, B's stale write conflicts. No second commit/effect is recorded. Same-key race does not double-consume. | NOT_RUN |
| R09 | Persisted original documents/line quantities/units do not mutate when saving/posting a reversal; only posted prior amounts consume remaining once. Draft/cancelled amounts do not consume. | NOT_RUN |
| R10 | Corrupt schema, digest, resource relation, non-finite quantity or proof is visible blocked/error state. No reset, overwrite, hidden seed fallback or assumed success. | NOT_RUN |
| R11 | Actor/role/warehouse/scenario switch prevents reading another scope, clears old accepted UI immediately and rejects late outcomes. Session generation fences in-flight work but must not become a stored credential/token. | NOT_RUN |
| R12 | Storage failure after uncertain dispatch keeps the operation uncertain; no new key, auto-POST or false zero/success. | NOT_RUN |
| R13 | Operation overlay and business status are distinct: unresolved resource remains visible in list/reopen even when simulated counterparty outcome is unknown to UI. Count semantics are explicit and do not double-count the same document. | NOT_RUN |
| R14 | Document original/prior/remaining/net quantities are labeled as such, not presented as actual/current/available SKU inventory without a stock source. | NOT_RUN |
| R15 | Explicit unlike line units are retained; totals are grouped by unit or unavailable. Unsupported/missing units are not silently defaulted into a false aggregate. Fractional/integer precision remains a contract decision, not invented by QA. | NOT_RUN |

Durable scope should remain stable enough to recover a known actor's operation after normal reopening, while session-generation checks reject stale in-flight reads. Whether a role/session replacement may re-adopt older intent requires an explicit policy; do not accidentally bind recovery forever to an obsolete secret/session token.

## Normal-app browser acceptance

| ID | Case | Status |
|---|---|---|
| B01 | Unknown submit→list→row reopen retains operation affordance/key/input and offers read-only status. | NOT_RUN |
| B02 | Unknown page reload and tab close/reopen restore the same operation with zero automatic sends. No fake success/zero impact is inferred. | NOT_RUN |
| B03 | Saved draft header/per-line notes, quantities, reason/source and selection context survive appropriate refresh/back navigation. | NOT_RUN |
| B04 | Two same-auth tabs of the same scenario cannot both confirm stale postings of one resource. | NOT_RUN |
| B05 | Different scenario ids never contaminate saved/posted007 or pending state; same scenario persists within its case. | NOT_RUN |
| B06 | Summary label states its all-record/filter/page scope. Unknown resource overlay remains reachable independently of list filters. | NOT_RUN |
| B07 | Fresh normal session expiry removes protected state. Reauthentication/recovery policy is tested only after its scope decision exists; no auth-storage patch. | NOT_RUN |
| B08 | Read lifecycle uses inherited loading/empty/no-result/error/not-found/session behavior where applicable. Corruption/storage error is not rendered as a clean empty fixture. | NOT_RUN |
| B09 | Existing operational S17 plus S16/S21 and canonical hashes remain unchanged by all new prototype tests. | NOT_RUN |
| B10 | Keyboard/focus,44px targets, per-SKU error association, table/header bindings, unit/date formatting and required viewports/languages/themes have fresh current-build receipts. | NOT_RUN |
| B11 | Two separately authorized real normal actors/roles, backend403/401/not-found, server idempotency/atomicity and real partial-reversal precision/units. | BLOCKED: missing roles/API/business approval; local CAS or mocked role tests cannot close it |

The existing whole-unused warranty-parts return command/recovery semantics remain separate. No test may bridge generic partial reversal into those commands or manufacture the missing view08 review event.
