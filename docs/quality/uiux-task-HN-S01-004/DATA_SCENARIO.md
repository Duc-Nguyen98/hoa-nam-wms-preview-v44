# HN-S01-UIUX-004 — independently verified scenario

S00#4 Functional QA, 2026-10-27. Base `06954a99885f7c9e808bf9a5556c7dd6c0d6b9a2`, source tree `65ac25d235682469452f60d50664b3e6acb3a753`. Actual model/effort UNVERIFIED: native runtime exposes no authoritative telemetry to this agent.

## Classification and custody

**MOCK**, browser-local synthetic fixture; no REAL_API verification. `src/preview-mode.ts` enables Preview. Main installs the browser mock; App injects the S01 HTTP controller; business adapters call canonical Axios; installed mock reads `baselineReaders.S01`, backed by `S01_SCANNER_PINNED.json`. This is the actual application, not a screenshot reconstruction. No production writes or source changes by Functional QA. Full SHA256 source manifest: `functional/before-source-custody.json`; each browser results file also hashes six relevant files before execution.

Pinned document source: Scanner commit `c3f14f742003c717aae933c44c010ccd5761fb8c`, version `p12-data-r02`. Snapshot identity `scanner:c3f14f742003c717aae933c44c010ccd5761fb8c:p12-data-r02`.

## Reproducible normal application recipe

1. Explicit E: checkout; Vite `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5272 --strictPort`.
2. Per-process TEMP/TMP point to ignored `output/hn-s01-004-functional-temp` on E. Fresh Playwright context, no persisted browser profile.
3. Open `http://127.0.0.1:5272/#/preview/S07`; public synthetic demo login `demo` / `HoaNamDemo@2026`; click Đăng nhập, Bắt đầu làm việc, Tiếp tục. This creates only browser-local MOCK auth/setup state.
4. Actual S01 is `#/preview/S01`. Select Kho Hoa Nam. Open `#ov-period-picker`, fill manual dates `01/09/2026` and `30/09/2026`, click Áp dụng. These dates are valid within Vietnam today-minus90 through today at task date. No clock override used.
5. BEFORE already defaults to September and four rows. These are existing source defaults, not introduced by QA. Default4 conflicts with recovered shared default10; isolated comparison4 is distinct from any production correction.
6. Exact modal opener: `button[data-overview-detail-opener="p12-stock-PX-0007"]:visible`, first match. The detail `data-overview-detail-id` must equal that full ID. Do not select another PX record by row position.

Warehouse is a single source option; no second warehouse or cross-warehouse behavior is inferred.

## Verified values and discrepancy

| Item | Verified actual value |
|---|---|
| Documents in September | 16 unique source IDs |
| Inbound / outbound | 8 / 8 |
| Current open warranties | 4; independent of selected document period |
| Stock | `stockTotal:null`, display `—`, help Chưa có số liệu xác nhận; never zero |
| Pending documents, source total and badge | **5** |
| Visible pending rows | **3**, intentional `attention.slice(0,3)` projection |
| PX number / ID | PX-0007 / p12-stock-PX-0007 |
| PX partner / quantity | Cửa hàng An Bình / 2 Cái |
| PX actor / time | Lan Nguyễn / 19/09/2026 · 14:35 |
| PX status | waiting / Chờ xử lý trên Web |
| PX CTA | S15 with source=overview, exact documentId and snapshotId |

Packet “3 pending” cannot truthfully describe the fixture total. It describes the three visible items only. No record status, badge or total was changed to force three.

## Isolated state pathway

Existing `tests/s01/harness.tsx` requests100 rows internally; `queryOverviewRows` only accepts4/10/15/25/50, so empty/long/missing return stale before reaching the requested state. Raw failures retained.

`functional/isolated-harness.html` imports the actual OverviewScreen/controller and a documented derivative of that harness with internal read25, enough for all16 source records. It preserves the existing synthetic long/missing projections, and adds explicit read-error codes for session/forbidden/offline render checks. It has no Main binding and no production authority. All such state tests are **QA_SYNTHETIC**, separate from normal application evidence. Browser-level offline with the normal MOCK adapter was also tested: local filtering continues, providing no real service connectivity evidence.


## Final2 approved scenario separation —2026-10-27

Final candidate `f56e25cfc119f5a758f0cd48ebdc6a96e78f8a09`, src `72189a9c0bdb2aff13a0294fd2b66929b157273e`, tests `3a61cae4bffcbda3f9e614eaaa02a38e637f3e64`. Normal actual application now uses locked default10/options10,15,25,50; normalHTTPmock explicitly rejects4. Original source remains16records/8in/8out/4warranty/**5pending**/11posted/unknownstock; exactPX0007anditsCTA retained. September existing default not changed by this task.

The later root/Guardian-approved **Dashboard comparison** is the explicit test-only URL `/tests/s01/harness.html?state=reference-pending3`. It derives a distinct `QA_SYNTHETIC` snapshot `isolated-s01-reference-pending3-v1` with4visible rows and16documents/8in/8out/4warranty/**3pending**/13posted/unknownstock. Only two original rows are reclassified waiting→posted: `p12-stock-PN-0006` and `fixture-inbound-0005`; statusLabel updated consistently. Independent tests verify all16IDs retained, PX0007 byte-equivalent, chart unchanged and original source read before/after deep-equal. This is not original source custody. The scenario is identified by its explicit URLstate and source snapshot metadata; no additional in-content banner is rendered. Reports/capture manifests must label it QA_SYNTHETIC.

**Modal comparison** remains `/tests/s01/harness.html?state=reference`, four-row paging of original SOURCE_FIXTURE with5pending. Its exactPX0007CTA stays enabled and source-bound. The QA3scenario has no resolver for synthetic statuses: itsPXCTA is disabled, unavailable reason carries the QA3snapshot, disablednativeclick leaves route unchanged. Independent Node guard tests also reject QA3even if only the provenance flag is changed toSOURCE_FIXTURE, because the snapshot remains mismatched.

These test entry points do not occur in Main; no production query/default or original fixture status is replaced by QA3. Final source/test SHA256 manifest is `functional/final2-source-custody.json`; initial/final original fixture hash is unchanged. Actual browser validated both recipes and normal10 independently.


## Final footer-only source qualification

Final commit e18305b1e3b09c4402317d507d7008967284341b / source edd34681bf20a5281188e9da49cdc91876a0845d changes only one desktop modal footer padding declaration. All data/fixture/query/QA3 files and tests are unchanged from f56e25c. Independent final Node regression34/34 and modal matrix12/12 PASS; prior unaffected29browser/21audit gates transfer by exact source comparison, not by claiming fresh full-suite execution. Desktop footer83px/reference82 remains a1px visual residual. See functional/final-footer-verification-summary.json and FUNCTIONAL_QA_REPORT.md final section.
