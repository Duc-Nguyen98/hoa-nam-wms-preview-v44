# HN-PTW-26REF-001 Functional Test Matrix

Reviewer: S00#4 Functional QA  
Checkout: `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
Branch/candidate: `DEV` / `6ea167125643d10d6545b28df452511af54c6f09`
Execution: 2026-10-28 (Asia/Bangkok)

Retest execution: same HEAD plus the working-tree PTW seed fix (`src/preview-mock/operational-policy.ts`, uncommitted at retest); no source edits were made by S00#4.

## Environment and evidence classification

- **MOCK:** local Vite (`http://127.0.0.1:5188`) with `installPreviewMock`, browser-local IndexedDB, `PREVIEW_DEMO` actor. No real warehouse or customer data was touched.
- **STAGING:** BLOCKED/NOT_RUN. No staging URL, credentials, or fixture contract was supplied.
- **REAL_API:** BLOCKED/NOT_RUN. The configured adapter uses `https://hoa-nam-mock.invalid/api/v1` in tests and the browser mock transport (`X-Preview-Mode: MOCK`).
- Hosted CI, public deployment SHA, physical device, and production RBAC are BLOCKED/NOT_RUN per packet.

## Matrix

| ID | Invariant / scenario | Evidence | Result |
|---|---|---|---|
| PTW-01.1 | BOX is one SKU/one receipt and queue shows whole-BOX quantity | `src/preview-mock/putaway-policy.ts` (`eligibleBox`); local browser S13 showed 9 rows, each BOX with one SKU, receipt and current quantity | PASS (MOCK) |
| PTW-01.2 | A tray may contain multiple BOX/SKU rows | Retest browser rendered nine `TRAY-001`…`TRAY-009` records; tray 1 included the newly confirmed BOX alongside its approved BOX. | PASS (MOCK) |
| PTW-01.3 | Draft creation does not map BOX to tray | Direct command probe: created task `DRAFT`, box `trayId` remained null; S13 success dialog says `Khay đích: Chưa chọn khay` | PASS (MOCK) |
| PTW-01.4 | Confirmation creates the single effective BOX–tray mapping | Direct probe: status changed `DRAFT` → `CONFIRMED`, box tray set to `operational-setup:tray:1`, two audit actions present | PASS (MOCK) |
| PTW-01.5 | Confirmation is whole BOX | UI dialog and `confirm` policy accept only `trayId`; no partial quantity field; captured quantity equals current quantity before confirmation | PASS (MOCK) |
| PTW-01.6 | Stock neutrality / no inventory movement | Direct probe: stock 5→5 and stock-event count 1→1 through create and confirm; S16 neutral putaway regression passed | PASS (MOCK) |
| PTW-01.7 | Stale BOX/version or content is rejected | Direct probe: stale create returned `STALE_BOX_VERSION` (409); policy has `STALE_BOX_CONTENT`; S16 reload/version tests pass | PASS (MOCK) |
| PTW-01.8 | Duplicate create/submit is rejected or replay-safe | Direct probe: second create for active BOX returned `BOX_HAS_ACTIVE_TASK` (409); second confirm returned `TASK_NOT_DRAFT` (409). Same-command retry through command-recovery wrapper was blocked as `RECOVERY_ACK_REQUIRED`; exactly-once UI replay evidence is not complete | PARTIAL (MOCK) |
| PTW-01.9 | History is scoped and records successful transitions | Local browser history after setup and fresh confirm: 11 rows (9 approved + 1 existing demo + 1 QA confirm), page size 9, range `1–9 / 11`; node history adapter/route tests 3/3 pass | PASS (MOCK) |
| PTW-01.10 | Tray counts/details reflect confirmed BOXes | Retest browser rendered 9 S11 records with exact codes `TRAY-001`…`TRAY-009`, no read error, and opened TRAY-001 details including `BOX trong khay`. | PASS (MOCK; FQ-PTW-004 fix verified) |
| PTW-01.11 | Empty tray is distinct from no tray/no data | S11 operational fixture failed before tray cards/details; no isolated empty-tray fixture or browser assertion was run | NOT_RUN (MOCK fixture blocked) |
| PTW-01.12 | Errors and timeout state recover without writes | Source has read error/timeout/recovery paths; S16 read/session failure tests pass. PTW-specific browser timeout/error injection was not run | PARTIAL / NOT_RUN |
| PTW-01.13 | Search/filter/pagination | History browser: 11 records, `1–9 / 11`; source filters search/action and resets page. Queue browser shows 9 rows; dedicated filter/paging interaction was not retained | PARTIAL (MOCK) |
| PTW-01.14 | Forbidden/history RBAC fails closed | Node test verifies `PUTAWAY_HISTORY_FORBIDDEN`; `business-reads.ts` returns 403 without explicit grant. Actual role/warehouse scope is unavailable | PASS (MOCK denial); BLOCKED (REAL RBAC) |
| PTW-01.15 | Browser responsive and console smoke | Local browser probe at 1920×1080 and 800×1280 had no page/console errors and tablet `scrollWidth <= innerWidth`; Playwright context reported DPR=1, so DPR2 tablet profile remains unverified | PARTIAL (MOCK) |

## Commands

- `npm run typecheck` — PASS.
- `npm run quality:contract` — PASS (`13 states, 26 references, immutable source policy`).
- `npm run test:putaway` — PASS, 5/5 (includes approved seed/S11 link regression).
- `npx tsx --test tests/putaway-approved/operational-seed.test.ts` — PASS, 1/1 (9 tray codes, 27 approved BOX line links, 9 S11 rows).
- `npx tsx --test tests/warranty-parts/s16-operational-binding.test.ts tests/warranty-parts/s10-operational-binding.test.ts` — PASS, 17/17.
- Temporary in-memory policy probe (`npx tsx .qa-ptw-policy-probe.ts`, deleted after run) — PASS: Draft→Confirm, stock 5→5/events 1→1, `BOX_HAS_ACTIVE_TASK`, `STALE_BOX_VERSION`, `TASK_NOT_DRAFT`.
- Temporary Playwright retest (`node .qa-ptw-browser-retest.mjs`, deleted after run; Vite `127.0.0.1:5188`) — PASS: S13 Draft, S14 confirm, S11 9 codes/details, history `1–9 / 11`, tablet overflow false, zero console/page errors. Confirm button was disabled until tray selection.

### Candidate run counts

Automated unit/invariant: **22 PASS / 0 FAIL** (5 putaway, including the seed regression, + 17 S16/S10). Direct policy assertions: **5 PASS / 0 FAIL**. Browser retest: **13 PASS / 0 PTW fixture FAIL**; empty tray and DPR2 remain NOT_RUN/BLOCKED. No REAL_API, staging, RBAC role matrix, preview-host, or production data was used.

No source, fixture, baseline, production, staging or hosted deployment files were changed.
