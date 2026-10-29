# RBAC and session authority audit

Source `e7b145feb3d8ec4b42bb2ba8fa66bfb5b3d9bf2f`, build `1bebecb3e20357207c7f6eb09c9ed987661c32c553451aeed3fe38a9f8b8b955`; static preview5341 and isolated Vite component harness5340. **Independent local MOCK: PASS, 28 model contracts and one clean full 23-case browser run (22 core plus B23), zero console/page errors.**

[Final acceptance](functional/e7b145f-final/FINAL_ACCEPTANCE.json), [model raw](functional/e7b145f-final/model/results.json), [browser raw](functional/e7b145f-final/browser/results.json), [run report](functional/RUN_REPORT.md).

App.tsx builds the fixture scope from the current confirmed session username/role/warehouse plus explicit scenario, and keys/remounts the workspace on that scope. The scope key/envelope are validated; this is storage isolation, not permission to post. Displayed creator names, source badges and frontend controls are not backend authorization.

| Probe | Verdict / scope |
|---|---|
| Normal existing MOCK login/confirmation | PASS browser initialization; credentials read only in process from existing action harness, never persisted |
| Normal MOCK session expiry | PASS B15:9-hour clock advance/reload shows S07 and removes protected workspace; no auth-storage patch |
| Actor/role/warehouse/scenario envelope mismatch | PASS R01/R11 local isolation; mismatched factory cannot initialize another envelope |
| Different scenario draft isolation | PASS B05 normal app; no second identity fabricated |
| Read403/401/offline/error | PASS B16 injected actual component presentation/retry only; backend enforcement BLOCKED |
| Storage corruption/open denial | PASS R10/B11 local fail-closed; no memory-success fallback |
| Second normal actor/role/warehouse | BLOCKED: no supplied authorized account/role contract |
| In-flight actor/session generation replacement | NOT_RUN; current scope remount is not a tested late-outcome fence or authority policy |
| Generic source eligibility/post permission/revocation | BLOCKED: authoritative generic partial endpoint and role matrix missing |
| Trusted audit proof | BLOCKED for server receipts; view08 review event remains MISSING and is not fabricated |

Existing operational whole-unused warranty return repository/authorize/actor/version checks are a separate local MOCK contract. No fixture control is bridged into production commands. Browser storage is not a security boundary, and locally matching receipts cannot establish server identity.

Before/after application hashes match in both runs; all six model source hashes match browser custody. Every one of the23 browser cases has equal before/after canonical business hashes, compared within each case. Canonical/account contents, cookies, credentials and tokens are not persisted. The28 model contracts use explicit dedicated memory persistence; browser cases use opt-in scoped fixture IndexedDB. Both frozen baseline receipt hashes were rechecked unchanged.

All results are isolated MOCK. Generic partial inbound/outbound REAL_API, trusted backend receipt/audit proof, backend atomicity/idempotency, source eligibility/permission API and second authorized actor/role/warehouse tests are BLOCKED. Actual/available SKU stock, generic unit precision/rounding and missing view08 review-audit event remain MISSING. Cross-actor in-flight session replacement and reauthentication recovery policy, Edge-specific execution, full screen-reader testing and a complete viewport/zoom/locale Cartesian product are NOT_RUN/BLOCKED. Scope labels do not grant permissions. Existing whole-unused warranty-parts return remains a separate authority; no production command or canonical mutation was performed.
