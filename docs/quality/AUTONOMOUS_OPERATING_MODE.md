# Autonomous operating mode

Version: 1.0.0 · Owner: S00#1 · Reviewer: S00#4 (engine), S00#5 (CI/provenance)

## Active scope

**CONTROLLED_AUTOMATION** is the only mode the engine can create. HN-NC-MA-PILOT-002 remains NO-GO: three seed assertions fail, approved public visual acceptance is blocked, hosted CI is billing-blocked and preview provenance is unverified. This implementation does not grant FULL_AUTONOMOUS_READY, merge permission, production deployment permission or new design authority.

S00#1 receives the user input and invokes real native delegation tools. The scripts below persist task packets and enforce acceptance transitions. They do not impersonate agents or dispatch work to independent chats. The operator must record the actual session identifier returned by delegation; role strings in local JSON are not authenticated identities.

## Files and responsibilities

| File | Purpose |
|---|---|
| `scripts/autonomous/task-engine.mjs` | Validated intake, gates, state transitions, defect custody and output contract |
| `scripts/autonomous/task-cli.mjs` | JSON-file CLI, serialized writes, atomic replacement and duplicate-intake resume |
| `scripts/autonomous/task-engine.test.mjs` | Executable positive/negative controls for the local engine |

Every intake stores the original request, references/URLs, target route/component, authority version, constraints, priority, repository, branch, exact base SHA, dependencies, criteria, declared gates and leases. Required design, QA and CI gates cannot be omitted. Task IDs combine the date with a UUID. Repeating `create` on the same state path with identical intake returns the same Task ID/history; changed intake is refused. Choose one durable state path per intake key and resume it. Cross-directory duplicate-key detection is not a global service.

## State and acceptance rules

`RECEIVED → TRIAGED → DESIGN_READY → IMPLEMENTING → READY_FOR_QA → QA_RUNNING → FIX_REQUIRED / QA_PASS → CI_VALIDATING → READY_FOR_REVIEW → COMPLETED`.

Blocked branches: `BLOCKED_DESIGN`, `BLOCKED_ENVIRONMENT`, `BLOCKED_PERMISSION`; they can resume only at their recorded prior state. `FAILED` and `CANCELLED` retain their history. Fix loops permit three attempts, then require a BLOCKED disposition; the engine rejects another implementation attempt.

Each state mutation records the actor/session, timestamp, exact candidate SHA and hashed evidence. History events are chained by SHA-256 for inspection; the JSON store is local and not a signed, tamper-proof trust service. Gate evidence must exist on disk and still match its SHA-256; no missing/changed artifact can satisfy acceptance. Evidence uses absolute paths locally. When sharing a bundle, re-register its relocated files and hashes rather than pretending the original paths are portable.

Gate status is exactly `PASS`, `FAIL`, `BLOCKED` or `NOT_RUN`. Declared reviewer roles own gate results; a session recorded as the implementer cannot approve its own work. Required FAIL/BLOCKED/NOT_RUN, stale candidate SHA, missing/changed evidence or open P0/P1 defects block acceptance. A new candidate SHA clears prior gates. Entering QA clears prior QA/CI results even on the same SHA, requiring a fresh retest. Gates must be supplied for every acceptance criterion and relevant build/typecheck/lint, visual, responsive/a11y, functional/regression, CI and preview-provenance requirement; a successful local engine test does not fulfill those product gates.

The engine validates structure and provenance bindings. It cannot determine whether a report tells the truth, whether a user approved a design or whether an actor ID is authentic. Independent agent artifacts, actual test output, trusted CI and human policy remain necessary.

## CLI usage

Run from the repository root with Node 22.12+. JSON inputs avoid embedding user text in shell commands.

```powershell
node scripts/autonomous/task-cli.mjs create docs/agent-handoffs/tasks/<task-id>/state.json intake.json
node scripts/autonomous/task-cli.mjs evidence <absolute-evidence-path> <40-character-candidate-sha>
node scripts/autonomous/task-cli.mjs transition docs/agent-handoffs/tasks/<task-id>/state.json transition.json
node scripts/autonomous/task-cli.mjs gate docs/agent-handoffs/tasks/<task-id>/state.json gate.json
node scripts/autonomous/task-cli.mjs defect docs/agent-handoffs/tasks/<task-id>/state.json defect.json
node scripts/autonomous/task-cli.mjs status docs/agent-handoffs/tasks/<task-id>/state.json
node scripts/autonomous/task-cli.mjs output docs/agent-handoffs/tasks/<task-id>/state.json
node --test scripts/autonomous/task-engine.test.mjs
```

`status` exits 2 when acceptance is blocked; malformed input exits 1; valid commands exit 0. A `.lock` file prevents concurrent mutations and `.tmp` replacement prevents partial JSON writes. After an interrupted process, investigate its lock before manually removing it; no automatic stale-lock bypass is implemented.

Intake JSON is `{ "actor": {"role":"S00#1","sessionId":"actual-session-id"}, "spec": {...} }`. `spec` requires `intakeKey`, `originalRequest`, `target`, `repository`, `baseBranch`, `baseSha`, `designAuthority`, `priority`, arrays `references`, `constraints`, `dependencies`, `acceptanceCriteria`, `leases`, and `gates`. A lease is `{ "owner":"S00#2", "path":"src/feature/**" }`; overlapping path prefixes across owners are rejected. Do not issue implementation work outside this packet. S00#1 still reviews actual Git changes against leases; path declarations alone cannot constrain other programs.

A gate definition is `{ "id":"functional", "stage":"qa", "required":true, "reviewerRole":"S00#4" }`. Stages are `design`, `qa`, `ci`; use separate IDs for each independently required check. Gate mutation JSON is `{ "actor": {...}, "gate": {"id":"functional","status":"PASS","candidateSha":"...","evidence":[...] } }`. Evidence entries are `{ "path":"absolute file", "sha256":"64 hex", "candidateSha":"40 hex" }`.

A transition is `{ "actor": {...}, "to":"READY_FOR_QA", "evidence":[...], "options":{"candidateSha":"...","changedFiles":["repository/relative/file"]} }`. Candidate changes are allowed only at READY_FOR_QA and must be the exact tested commit. Transition evidence documents the preceding operation on the previous SHA; subsequent gate evidence must identify the new SHA. A defect is `{ "id":"...", "severity":"P1", "owner":"S00#2", "status":"OPEN", "evidence":[...] }`; closure requires an independently retested `fixSha` equal to the current candidate SHA.

## Output

`output` emits Task ID, original request/target, actual recorded actors, mode/state, candidate SHA, declared changed files, leased scopes, references, gate results, defects, preview status and final verdict. `COMPLETED` requires all declared required gates PASS with current evidence. Otherwise it reports PARTIAL/BLOCKED. Preview is NOT_VERIFIED unless a task supplies verified preview evidence and a required provenance gate; no URL alone certifies source provenance.

The local negative-control test proves failed fixture gate rejection and recovery history, not GitHub branch enforcement. The Notification badge canary must independently run product tests and a test-only injected failure, preserve failed output, restore the fixture and rerun. FULL_AUTONOMOUS_READY remains blocked until that new task traverses the complete trusted pipeline including hosted CI and preview provenance.
