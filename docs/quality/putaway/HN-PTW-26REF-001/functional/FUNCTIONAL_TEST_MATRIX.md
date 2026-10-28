# HN-PTW-26REF-001 Functional Test Matrix

Reviewer: S00#4 Functional QA  
Checkout: `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
Branch/base: `DEV` / `bca3db9062c9246d1fe780fc9e52110128d40859`  
Execution: 2026-10-28 (Asia/Bangkok)

## Environment and evidence classification

- **MOCK:** local Vite (`http://127.0.0.1:5188`) with `installPreviewMock`, browser-local IndexedDB, `PREVIEW_DEMO` actor. No real warehouse or customer data was touched.
- **STAGING:** BLOCKED/NOT_RUN. No staging URL, credentials, or fixture contract was supplied.
- **REAL_API:** BLOCKED/NOT_RUN. The configured adapter uses `https://hoa-nam-mock.invalid/api/v1` in tests and the browser mock transport (`X-Preview-Mode: MOCK`).
- Hosted CI, public deployment SHA, physical device, and production RBAC are BLOCKED/NOT_RUN per packet.

## Matrix

| ID | Invariant / scenario | Evidence | Result |
|---|---|---|---|
| PTW-01.1 | BOX is one SKU/one receipt and queue shows whole-BOX quantity | `src/preview-mock/putaway-policy.ts` (`eligibleBox`); local browser S13 showed 9 rows, each BOX with one SKU, receipt and current quantity | PASS (MOCK) |
| PTW-01.2 | A tray may contain multiple BOX/SKU rows | `OperationalTrays` projects `boxCount` and distinct `skuCount`; seed has 9 trays and 9 confirmed rows, projection tests pass | PASS (MOCK; one BOX/SKU per seed row) |
| PTW-01.3 | Draft creation does not map BOX to tray | Direct command probe: created task `DRAFT`, box `trayId` remained null; S13 success dialog says `Khay đích: Chưa chọn khay` | PASS (MOCK) |
| PTW-01.4 | Confirmation creates the single effective BOX–tray mapping | Direct probe: status changed `DRAFT` → `CONFIRMED`, box tray set to `operational-setup:tray:1`, two audit actions present | PASS (MOCK) |
| PTW-01.5 | Confirmation is whole BOX | UI dialog and `confirm` policy accept only `trayId`; no partial quantity field; captured quantity equals current quantity before confirmation | PASS (MOCK) |
| PTW-01.6 | Stock neutrality / no inventory movement | Direct probe: stock 5→5 and stock-event count 1→1 through create and confirm; S16 neutral putaway regression passed | PASS (MOCK) |
| PTW-01.7 | Stale BOX/version or content is rejected | Direct probe: stale create returned `STALE_BOX_VERSION` (409); policy has `STALE_BOX_CONTENT`; S16 reload/version tests pass | PASS (MOCK) |
| PTW-01.8 | Duplicate create/submit is rejected or replay-safe | Direct probe: second create for active BOX returned `BOX_HAS_ACTIVE_TASK` (409); second confirm returned `TASK_NOT_DRAFT` (409). Same-command retry through command-recovery wrapper was blocked as `RECOVERY_ACK_REQUIRED`; exactly-once UI replay evidence is not complete | PARTIAL (MOCK) |
| PTW-01.9 | History is scoped and records successful transitions | Local browser history after setup: 10 rows (9 approved + 1 demo), page size 9; node history adapter/route tests 3/3 pass | PASS (MOCK) |
| PTW-01.10 | Tray counts/details reflect confirmed BOXes | S11 operational projection and source tests cover `boxCount`, distinct SKU count, current stock, links; a fully waited browser S11 capture was not retained due an aborted follow-up probe | PARTIAL (MOCK) |
| PTW-01.11 | Empty tray is distinct from no tray/no data | UI has `Khay hiện chưa có BOX.` empty state; no isolated empty-tray fixture or browser assertion was run | NOT_RUN |
| PTW-01.12 | Errors and timeout state recover without writes | Source has read error/timeout/recovery paths; S16 read/session failure tests pass. PTW-specific browser timeout/error injection was not run | PARTIAL / NOT_RUN |
| PTW-01.13 | Search/filter/pagination | History browser: 10 records, `1–9 / 10`; source filters search/action and resets page. Queue browser shows 9 rows; dedicated filter/paging interaction was not retained | PARTIAL (MOCK) |
| PTW-01.14 | Forbidden/history RBAC fails closed | Node test verifies `PUTAWAY_HISTORY_FORBIDDEN`; `business-reads.ts` returns 403 without explicit grant. Actual role/warehouse scope is unavailable | PASS (MOCK denial); BLOCKED (REAL RBAC) |
| PTW-01.15 | Browser responsive and console smoke | Local browser desktop 1920×1080 and tablet 800×1280 navigation/login/queue probes had no page errors; one tablet probe reported DPR=1 because Playwright context did not preserve DPR after resize | PARTIAL (MOCK) |

## Commands

- `npm run typecheck` — PASS.
- `npm run quality:contract` — PASS (`13 states, 26 references, immutable source policy`).
- `npm run test:putaway` — PASS, 4/4.
- `npx tsx --test tests/warranty-parts/s16-operational-binding.test.ts tests/warranty-parts/s10-operational-binding.test.ts` — PASS, 17/17.
- Direct temporary mock policy probe — PASS for create/confirm/neutrality/stale/duplicate; output summarized in `DATA_INTEGRITY_REPORT.md` and `CONCURRENCY_IDEMPOTENCY_REPORT.md`.

No source, fixture, baseline, production, staging or hosted deployment files were changed.
