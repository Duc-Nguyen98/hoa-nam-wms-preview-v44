# Feature hiện có

| Feature | State / revision | Route |
| --- | --- | --- |
| S01 Tổng quan | Default / DEFAULT_2026-10-08 | Trang gốc hoặc #/preview/S01 |
| S02 Bệnh/lỗi | Default / P01_REVIEW_2026-10-08 | #/preview/S02 |
| S03–S05 | Chưa dựng | Placeholder theo registry |
| Nền setup | Giữ để kiểm | #/setup |

S01/S02 dùng component thật, reuse GlobalShell, DataTable/Pagination và primitives. UI gọi controller runtime tương ứng → controller → fixture adapter; không import JSON records trực tiếp.

S01 giữ đủ 16 phiếu theo commit Scanner, query bảng tách KPI/chart, tồn unknown. S02 dùng đúng 10 records REVIEW, summary 10/8/2, page 15/một trang; tablet gộp code/name nhưng giữ mô tả/status/Sửa. UI S02 có draft search/status, Áp dụng/Enter, reset và refresh accepted query.

Cả hai searchMatch còn null. S02 sort null/size 15, Thêm/Sửa thiếu form; summary sau filter giữ catalogue là policy preview pending nghiệp vụ. S01 còn period/extra size/detail/global blockers. Không coi control có handler diagnostic là interaction hoàn tất; không tự chạy state/form mới.

## V3 review addendum (2026-10-17)

The current V3 review pass is a limited, explicitly authorized local-draft exception to the Default-only baseline above. S02 now has local-only detail/Add/Edit drafts with required-field validation and a guarded blocked-save diagnostic. It also has typed, opt-in review fixtures through the URL query `s02State` for empty records, load error, 401, 403 and 404. These fixtures do not change the API/DTO/RBAC contract or claim production transport coverage. Search/sort remain preview policies pending owner confirmation; production CRUD remains gated.

Hồ sơ S02: [contract](../../output/S02/P01_REVIEW_2026-10-08/SCREEN_CONTRACT.md), [fixture](../../output/S02/P01_REVIEW_2026-10-08/FIXTURE_MAP.md), [adapter](../../output/S02/P01_REVIEW_2026-10-08/API_ADAPTER_HANDOFF.md), [QA](../../output/S02/P01_REVIEW_2026-10-08/QA_REPORT.md). Hồ sơ S01 giữ tại `output/S01/DEFAULT_2026-10-08/`; checkpoint trước mỗi lượt ở output/history.

Lượt này dừng sau S02/Default, auto_advance=false. Chỉ thêm feature/state tiếp khi Owner giao.

## Wave 3 addendum (2026-10-17)

The Premium Wave 3 preview mounts the source-backed S07–S10 screens in the app registry:

| Feature | Route | Scope |
| --- | --- | --- |
| S07 Đăng nhập | `#/preview/S07` | AuthLayout, sourced copy/fixture/controller; submit and recovery remain typed blockers |
| S08 Xác nhận phiên | `#/preview/S08` | Readonly session fixture and logout lifecycle; confirmation target remains guarded |
| S09 Hồ sơ bảo hành | `#/preview/S09` | Seven supplied detail rows, aggregate 186, read-only search/filter/sort/page state |
| S10 Phiếu xuất linh kiện | `#/preview/S10` | Seven supplied detail rows, aggregate 84, read-only search/filter/sort/page/refresh state |

S07/S08 stay outside CMS navigation leaves. S09/S10 use the WMS shell and scoped premium presentation. Detail, mutation, API, RBAC and production auth outcomes remain unassigned where the source contract does not provide them; see `output/S00/PREMIUM_WAVE3_2026-10-17/WAVE3_INTEGRATION_RECEIPT.md`.

## Wave 4 addendum (2026-10-18)

The Premium preview now mounts S11–S17 from the canonical local contracts, controllers, adapters and fixtures. Screens retain their source counts and use the shared premium table, panel, toolbar, summary and pagination presentation.

| Feature | Route | Source scope |
| --- | --- | --- |
| S11 Danh sách khay | `#/preview/S11` | Seven rows; aggregate 12 trays / 76 BOX; unsupported search/page guarded; no sort or retry added |
| S12 Danh sách phiếu nhập | `#/preview/S12` | Seven rows / aggregate 84; source sort control remains visible; create/edit guarded |
| S13 Hàng chờ xếp khay | `#/preview/S13` | Seven rows / aggregate 24 BOX, 8 SKU, quantity 642; visible-row selection only; bulk/create guarded |
| S14 Lệnh xếp khay | `#/preview/S14` | Seven rows / aggregate 82; filter disclosure and worklist navigation; transitions guarded |
| S15 Phiếu xuất kho | `#/preview/S15` | Seven rows / aggregate 84; missing source queries and unresolved sort mapping guarded |
| S16 Tra cứu tồn & đối soát | `#/preview/S16` | Four source rows; local search/filter/sort; responsive table/cards; detail and ledger actions guarded |
| S17 Phiếu đảo tồn kho | `#/preview/S17` | One source record; local search/filter/sort; warehouse total unknown; create/open guarded |

S11–S15 retain accepted rows and query controls when incomplete source prevents a query or page change. S16/S17 no-result states describe their supplied source scope. QA60 records are isolated to tests and are never mounted on production preview routes. Final source/bundle hashes, responsive evidence, focus checks and remaining scope limits are in `output/S00/PREMIUM_WAVE4_2026-10-18/WAVE4_INTEGRATION_RECEIPT.md` and the seven linked screen receipts.

## Wave 5 addendum (2026-10-18)

S18–S26 are mounted as scoped Premium reports under the existing Reports menu. S18/S19/S20/S23/S24/S25/S26 retain five sourced rows each; S21 retains four. S22 uses the explicitly selected Desktop five-row source with its separate detail controller while preserving the canonical whole-period summary.

Whole-period KPIs/charts remain independent of detail query/paging. Only the sourced inclusive 04–10/09/2026 period is available; unsupported dates retain accepted data and controls. Report Excel exports and unsupplied detail/print/reprint/journey actions remain guarded. DEC-RPT-001..008 business approvals, production API/RBAC and S24 historical anomalies are recorded separately from visual migration acceptance.

Four-viewport evidence, isolated adapter state/retry QA, prior-screen canary, baseline/final hashes, source choice and each screen receipt are linked from output/S00/PREMIUM_WAVE5_2026-10-18/WAVE5_INTEGRATION_RECEIPT.md. The existing public preview is updated in place; publication does not certify missing business contracts.
