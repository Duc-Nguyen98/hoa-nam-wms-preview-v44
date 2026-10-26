# API Integration Report — Preview transport boundaries

Date: 2026-10-27 UTC+07. Tested source: DEV @ `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`.

Source is the current local checkout with QA tests added but not committed. Runtime src/ has no working-tree diff. Existing dirty design/visual files are preserved. Local: http://127.0.0.1:5204; public: https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/. API success below means Axios Preview MOCK or fixture behavior, never production integration. All rows inherit this commit/environment unless explicitly overridden.

**Production integration: NOT_RUN.** No API INTEGRATED claim. Local integration uses installPreviewMock on an Axios instance with version 1 envelopes, approved defect policy, atomic memory repository and explicit test actor. These requests never reach a real backend. The injected deny binding is a negative authorization fixture, not proof of any production role.

| Test ID | Route/API | Expected | Actual | Environment | Result | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| F-S02-001 | S02 form | Required code/name and invalid status rejected | Required errors and invalid-status error returned | LOCAL / Axios MOCK + isolated memory fixtures | PASS | [evidence](../../output/functional-qa-20261027/s02-integration.tap) |
| F-S02-002 | POST defects/commands; GET defects | Create + read + update/status; immutable saved code | Version 1→2; canonical values agree; code mutation rejected | LOCAL / Axios MOCK + isolated memory fixtures | PASS | [evidence](../../output/functional-qa-20261027/s02-integration.tap) |
| F-S02-003 | POST defects/commands | Trim/case/NFC duplicate code rejects atomically | 409 DUPLICATE_DEFECT_CODE; snapshot unchanged | LOCAL / Axios MOCK + isolated memory fixtures | PASS | [evidence](../../output/functional-qa-20261027/s02-integration.tap) |
| F-S02-004 | POST defects/commands | Same command replays once; changed payload cannot reuse ID | Replayed receipt identical; one row; changed payload 409 | LOCAL / Axios MOCK + isolated memory fixtures | PASS | [evidence](../../output/functional-qa-20261027/s02-integration.tap) |
| F-S02-005 | POST defects/commands | Concurrent writes with expectedVersion 1 have one winner | One fulfilled; one 409; final version 2 | LOCAL / Axios MOCK + isolated memory fixtures | PASS | [evidence](../../output/functional-qa-20261027/s02-integration.tap) |
| F-S02-006 | POST auth/logout; GET defects; POST defects/commands | Anonymous/logout cannot read or write | 401 for anonymous read and logged-out mutation | LOCAL / Axios MOCK + isolated memory fixtures | PASS | [evidence](../../output/functional-qa-20261027/s02-integration.tap) |
| F-S02-007 | POST defects/commands | Invalid name 422; absent entity 404; no mutation | 422/404 observed; before/after read identical | LOCAL / Axios MOCK + isolated memory fixtures | PASS | [evidence](../../output/functional-qa-20261027/s02-integration.tap) |
| F-S02-008 | S02 query/review adapter | Normalized search/filter/sort request/page/reset/no-result/401/403/404/error | Queries accepted; 31 synthetic rows page 3 has 1; query reset page 1; review reasons agree | LOCAL / Axios MOCK + isolated memory fixtures | PASS | [evidence](../../output/functional-qa-20261027/s02-integration.tap) |
| F-S02-009 | S02 command service + POST defects/commands | Lost response stays unknown; retry original request, no duplicate | Unknown state blocks reset; replacement ignored; exact request replay; one row | LOCAL / Axios MOCK + isolated memory fixtures | PASS | [evidence](../../output/functional-qa-20261027/s02-integration.tap) |
| F-S02-010 | POST defects/commands | Host deny binding blocks API mutation regardless of UI | 403 MOCK_COMMAND_FORBIDDEN; no created row | LOCAL / Axios MOCK + isolated memory fixtures | PASS | [evidence](../../output/functional-qa-20261027/s02-integration.tap) |
| F-AUTH-011 | auth/login, auth/confirm, defects/commands | Wrong password/unconfirmed/expired session rejected | 401 invalid credentials; 403 confirmation required; expired read/write 401 | LOCAL / Axios MOCK + isolated memory fixtures | PASS | [evidence](../../output/functional-qa-20261027/s02-integration.tap) |
| F-S02-012 | S02 durable command recovery | Restore is read-only; explicit acknowledgment requires canonical read | No snapshot change on restore/ack; premature ack false; verified ack unlocks commands | LOCAL / Axios MOCK + isolated memory fixtures | PASS | [evidence](../../output/functional-qa-20261027/s02-integration.tap) |

API source: src/data/http/api-contract.ts, api-client.ts, business-adapters.ts; src/features/S02/defects-command-http.ts, defects-command-service.ts and defects-approved-policy.ts; src/preview-mock/approved-business-policy.ts and business-repository.ts. Saved codes are immutable; duplicate comparison is trim + NFC + uppercase; create/update receipts bind command ID/epoch/entity/version. No delete rule is assumed.

| Test ID | Route/API | Expected | Actual | Environment | Result | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| API-REAL-01 | Production S01/S02 and auth | Real network roundtrip/schema/error envelope | Endpoint, credentials and deployment contract unavailable | Real backend | NOT_RUN | No supplied environment |
| RBAC-REAL-01 | Direct GET/POST /api/v1/* | Server authorization and tenant/warehouse data scope | Only client-resident Preview policies verified; no server security certification | Real backend/staging | BLOCKED | F-S02-006/010; F-AUTH-011 |
| API-AUDIT-01 | S02 audit trail | Approved audit-event contract and actor capture | Command receipt actor/version verified; separate S02 audit-event acceptance unspecified | MOCK | NOT_RUN | src/contracts/defects.ts |
| API-BAD-01 | S02 malformed HTTP success/5xx/429/offline | Reject malformed receipts; retain unknown outcomes safely | Lost-response service behavior covered; full wire-fault matrix not injected | MOCK | NOT_RUN | F-S02-009 |

Re-run: `node --import tsx --test --test-reporter=tap tests/functional/s02-integration.test.ts`. Fixtures create a new client and memory persistence per test, uninstall in finally, use independent command UUIDs and advance only an injected clock for expiry. Synthetic login comes from existing PUBLIC_DEMO_LOGIN, never production accounts.
