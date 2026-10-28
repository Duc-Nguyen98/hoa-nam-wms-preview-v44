# Functional regression / RBAC report — HN-WARRANTY-PARTS-FIDELITY-001

**Owner:** S00#4 Functional QA  
**Branch:** `DEV`  
**Checkout:** `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
**Audited commit:** `135ea2054035e99069cdb3d2eaa7c928a67bfdff`  
**Run:** 2026-10-29 (Asia/Bangkok)  
**Runtime:** Chromium/Playwright against local Vite `http://127.0.0.1:5292`; browser data and operational seed were `MOCK` only.

No application source files were edited. Evidence artifacts are in [`output/functional-qa-20261028-s004`](../../../../output/functional-qa-20261028-s004/), including [`browser-functional.json`](../../../../output/functional-qa-20261028-s004/browser-functional.json), [`unit-tests.log`](../../../../output/functional-qa-20261028-s004/unit-tests.log), and [`state-map.txt`](../../../../output/functional-qa-20261028-s004/state-map.txt).

## Executed checks

| Area | Result | Evidence / boundary |
|---|---|---|
| S09 operational list → detail | **PASS (MOCK browser)** | Seeded current-session case rendered; detail retained the exact opaque case ID; no document overflow. |
| S10 operational list → detail | **PASS (MOCK browser)** | Seeded issue rendered; detail retained the exact opaque issue ID; no document overflow. |
| S09/S10 legacy search and filter | **PASS (MOCK browser)** | `?catalog=legacy` routes loaded; visible status filter changed the result set; `ZZZ_NO_MATCH` rendered the no-results state on both routes. |
| S09/S10 detail copy controls | **PASS source / PARTIAL browser** | `data-s09-copy` and `data-s10-copy` controls call shared `copyText` and expose feedback. Browser click paths ran; S10 correctly showed the clipboard failure notice in headless Chromium. A successful system clipboard write is **NOT_RUN**. |
| Relations | **PASS with explicit unavailable state** | S10 legacy detail exposed `data-s10-related="warranty-case"` and the S09 route link. S09 legacy detail exposed `data-detail-unavailable="related-documents"`; no reverse relation was inferred without a source key. Operational S10 links to S09/S17 are present in source. |
| Modal focus / scroll | **PASS (MOCK browser)** | Closing operational and legacy details restored focus to the originating action; document width stayed within the viewport. Shared `GlobalModal` owns trap, Escape, body lock and return-focus behavior. |
| Unknown route / not-found | **PASS (MOCK browser)** | An unregistered hash rendered the shell-preserving route-not-found state. Operational stale selection maps to `record-not-found` in source. |
| Loading | **PASS contract / NOT_RUN browser** | `InitialReadState`, `ReadState` and `PageState(kind="loading")` are wired on S09/S10; this run did not capture an intentionally held network response. |
| Empty | **PASS contract / NOT_RUN browser** | Legacy tables use `DataTable emptyStateKind="no-results"`; operational S09/S10 provide explicit zero-record messages. A zero-record browser fixture was not created in this run. |
| Error / retry | **PASS unit-contract / NOT_RUN browser** | 24/24 S09/S10 warranty tests passed, including read loss, retry/recovery, stale generation, reset and session expiry. The browser run did not inject a read failure. |
| Forbidden / unauthorized | **PASS mapper + adapter contract / NOT_RUN browser** | `createOperationalWebAdapter({available:false})` returned `COMMAND_UNAVAILABLE` with HTTP status 403; `readFailureKind` maps `MOCK_COMMAND_FORBIDDEN` → `forbidden`, `SESSION_EXPIRED` → `unauthorized`, `RECORD_NOT_FOUND` → `record-not-found`. No browser role-switch was attempted. |
| Console/page errors | **PASS (MOCK browser)** | Browser functional run recorded zero page errors and zero console errors. |
| Unit/contract regression | **PASS** | `npx tsx --test tests/warranty-ui/*.test.ts tests/warranty-parts/s09-operational-binding.test.ts tests/warranty-parts/s10-operational-binding.test.ts tests/warranty-parts/public-demo-flow.test.ts`: **24 pass, 0 fail**. |

## Shared state component audit

| Component | S09/S10 usage | Finding |
|---|---|---|
| `PageState` | `InitialReadState` for legacy initial reads; operational detail for loading, read failure and stale record | **PASS**. Kinds include loading, empty, no-results, error, unauthorized, forbidden, not-found and record-not-found. |
| `ReadState` | Operational S09 and S10 list/detail read feedback | **PASS**. Preserves accepted data during refresh/error and escalates to `PageState` when no accepted model exists. |
| `GlobalModal` | Operational detail/editor/transition; legacy detail dialogs use equivalent native dialog mechanics | **PASS**. Trap, Escape, body scroll lock and return focus are implemented. |
| RBAC / API mode | `operational-preview-adapter.ts` requires `mode="MOCK"`, complete token/revision and scenario data; availability and command surface are guarded | **MOCK only**. No production permission DTO, actor-role matrix or REAL_API endpoint is supplied. |

## RBAC and release boundary

**REAL_API RBAC: BLOCKED / DESIGN_GAP.** The preview adapter and S29 fixture are not production authorization evidence. No approved S09/S10 permission keys, role matrix, tenant/warehouse assertion, or REAL_API test account was supplied. The current evidence supports a scenario-token-fenced MOCK preview only. Production certification requires an authorized REAL_API account and an approved role/warehouse matrix.

**Browser state gaps:** loading hold, injected browser read failure, zero-record operational fixture, and a successful clipboard write remain **NOT_RUN**. These are test-coverage limits, not inferred passes.

## Cross-route shared-state inventory

A source inventory (`output/functional-qa-20261028-s004/shared-state-route-inventory.txt`) confirms the shared state primitives are used across the registered route families, including S01–S06, S09–S29 operational/list/report screens, and notification/document routes. S09/S10 use the same shared contracts as adjacent operational routes: legacy initial reads go through `InitialReadState`/`PageState`, operational reads go through `ReadState`, and operational details use `GlobalModal`. This is a static cross-route audit; no additional browser regression was run for routes outside S09/S10, so those routes remain outside this run's PASS claims.
