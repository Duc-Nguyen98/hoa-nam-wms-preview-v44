> Shared hiện hành **v1.1.2 / e2b9c3e08256**, [patch notes](PATCH_NOTES_v1.1.2.md). Tham chiếu lock/handoff hiện hành; giữ các phần chưa kiểm/visual chưa duyệt.

> Shared hiện hành: **HN_UI_SHARED_v1.1.1 / 235481861ec6**. Đọc [patch notes](PATCH_NOTES_v1.1.1.md), lock và handoff POST_APPROVAL_UX_AUDIT_2026-10-12. Các kết quả lịch sử bên dưới không thay kiểm patch.

> Shared hiện hành: **HN_UI_SHARED_v1.1.0**. Đọc [hướng dẫn control v1.1](CONTROLS_INTEGRATION_v1.1.md), lock và handoff rollout trước khi tích hợp. Các kết quả kiểm lịch sử bên dưới không tự chuyển thành kết quả release mới.

# Tích hợp HN_UI_SHARED_v1.0

## Owner khóa contract S00–S06 — 10/10/2026

**OWNER_LOCKED_WITH_RECORDED_EXCLUSIONS**; quyết định `HN_UI_CONTRACT_LOCK_S00_S06_2026-10-10`. Khóa các quyết định đã thống nhất và baseline tích hợp **HN_UI_SHARED_v1.0.2+sha256.58aa9a6cb17f** (source-final2, manifest SHA256 **58aa9a6cb17f0e43cd75c1a79c703e4c90e16c8dfae1890b3c5d55471c8cfc30**). Tham chiếu `output/S00/INTEGRATED_UI_UX_REVIEW_2026-10-10/OWNER_CONTRACT_LOCK_2026-10-10/OWNER_DECISION.md` và OWNER_DECISION.json. Các màn tiếp theo kế thừa cùng component/token/layout/interaction đã chốt; S00 sở hữu shared, chủ S01–S06 giữ hồ sơ màn. Không hỏi lại cùng quyết định từng chat.

Giữ nguyên NOT_RUN, NOT_ASSERTED, N/A, OWNER_REVIEW_PENDING và các đề xuất chưa duyệt; khóa không chuyển chúng thành PASS hoặc nghiệm thu toàn bộ. Runtime/fixture/bundle giữ nguyên; chỉ bổ sung tài liệu ngoài manifest source đã khóa. Lượt này không chuẩn bị S07.

> Nhận bản hiện hành **4270 / source-final2 / SHA58aa9a6cb17f** từ bộ `output/S00/INTEGRATED_UI_UX_REVIEW_2026-10-10/`. Dùng `OWNER_PATCH_RECEIPTS_FINAL2.json`, không dùng receipt trung gian4262 cho patch S06 cuối. Root runtime chưa bị thay. Core snapshot giữ nguyên; con trỏ tài liệu và generated lock có hash riêng trong `DOCUMENTATION_PUBLICATION_FINAL2.json`.

## Bàn giao preview cách ly v1.0.2 — audit tích hợp 10/10/2026

Bộ hiện hành: `output/S00/INTEGRATED_UI_UX_REVIEW_2026-10-10/`. Chỉ nhận mốc source/lock đã kiểm và trạng thái READY_FOR_SCREEN_INTEGRATION trong HANDOFF/QA_REPORT của bộ này. **Root src và preview cũ được giữ nguyên theo yêu cầu Owner**; không suy runtime root đã cập nhật khi đọc lock mới. Những hướng dẫn lịch sử nói shared được sửa tại chỗ chỉ áp dụng các lượt trước.

- Patch shared: `src/shared/focus.ts`, `Catalogue.tsx`, `Pagination.tsx`, `foundation.ts`. Toolbar và Pagination tự reveal control sau native focus-scroll để vòng focus nằm đủ trong viewport. Chỉ dùng helper shared, không thêm CSS focus riêng ở màn.
- Các patch S02/S05/S06 thuộc owner màn, ghi riêng trong OWNER_PATCH_RECEIPTS.json; không lấy file feature từ snapshot khác để ghi đè workspace. S02 select viewport patch đã có trước audit được giữ nguyên.
- Với workspace khác, đối chiếu hash trước/sau từng file tại CHANGED_FILES.json, áp đúng delta vào preview cách ly, typecheck/build bằng app vite.config.ts gốc. Không copy toàn snapshot. Không triển khai production hoặc nối API.
- Giữ app và DEV harness build riêng. Chạy shared-focus suite và `qa/audit-shell-keyboard.mjs` của bộ audit trên route thực, cùng Basic picker/Escape, resize và native zoom. `qa/integrated-uiux.mjs` chạy so sánh concept/interaction Desktop1920×1080 và Tablet800×1280DPR2; runner tạo ảnh PNG1600×2560 gốc.
- Ghi lỗi, lưu bằng chứng và cung cấp đường dẫn S00 là công việc đã được phép. Chỉ ghi đã gửi/đã nhận khi có tool receipt hoặc xác nhận. S00 sở hữu sửa shared; feature owner sửa phần màn trong patch riêng. New screen kế thừa focus này và kiểm hồi quy tương ứng.
- Technical PASS chỉ áp dụng route/source đã kiểm. Không dùng harness hoặc PASS của S00 để tự nâng Owner visual approval, không sửa lịch sử FAIL cũ thành PASS; thêm kết quả superseding có milestone mới.

Phần dưới giữ lại quy tắc/API v1.0/v1.0.1 không bị thay đổi.

Patch `HN_UI_SHARED_v1.0.1` xử lý `S00-FOCUS-001` trong `src/shared/unified.css`: wrapper FilterInput giữ focus, input con trực tiếp không vẽ outline thứ hai. Nhận phiên bản từ lock và bộ `output/S00/SHARED_FOCUS_FIX_2026-10-10/`; giữ API component/query của v1.0. Khi ở workspace khác, chuyển đúng shared file đã thay theo manifest, kiểm hash và build lại preview riêng. Không copy snapshot hoặc CSS của màn khác. Chạy ca `tests/browser/shared-focus.spec.ts` với source milestone mới; kết quả chỉ áp dụng những route thực tế đã kiểm, không tự nâng visual approval.

Ghi lỗi và bằng chứng, cung cấp đường dẫn cho S00 là công việc đã được Owner cho phép. Nếu không nhắn trực tiếp được, lưu hồ sơ trong project và ghi rõ chưa gửi; không hỏi lại quyền bàn giao cùng lỗi hoặc tạo override CSS riêng.

Kiểm patch focus trên app build bằng `vite.config.ts` gốc; harness `vite.shared-focus.config.ts` build và chạy riêng. Không gộp entry QA vào build app vì có thể thay thứ tự CSS shared/feature. Biến `HN_PREVIEW_BASE_URL` trỏ app, `HN_FOCUS_HARNESS_BASE_URL` trỏ harness; thêm `HN_SOURCE_MILESTONE` và `QA_OUTPUT_DIR` để ghi đúng nguồn/bằng chứng. Giữ các lỗi riêng màn trong bảng kết quả, không dùng kết quả harness hoặc patch focus để đóng toàn bộ tích hợp query/visual của màn.

Đọc `CONTRACT_UI_COMMON_v1.0.md` và kiểm `UI_FOUNDATION_LOCK.json.status`. Chỉ nhận bản `READY_FOR_SCREEN_INTEGRATION`. Mốc source, danh sách file và bằng chứng nằm trong bộ bàn giao S00, không suy PASS cho màn từ QA nền.

Hiệu đính tài liệu sau khi đóng băng `source-final2`: tên prop Pagination bên dưới khớp interface thực. Mã runtime/test trong snapshot giữ nguyên; SHA của bản hướng dẫn hiệu đính nằm trong `DOCUMENTATION_AMENDMENTS.json` của bộ bàn giao.

## 1. Nhận shared, giữ quyền sở hữu

Trong workspace này import từ `src/shared`; các file shared đã được S00 cập nhật tại chỗ. Snapshot chỉ để kiểm/đối chiếu; **không copy toàn snapshot đè workspace**. Không tạo BasicSelect/datepicker/table/query helper mới trong feature; không sửa CSS/token shared từ chat màn. Nếu cần thay common, báo S00 đúng file/case.

Giữ UI → controller → adapter → fixture. Màn giữ contract/model riêng; có thể bọc adapter hiện hành bằng helper chung, không phải thay interface màn hay fixture bằng interface QA. API adapter sẽ thay fixture adapter sau khi DEV có backend contract đã xác nhận.

## 2. Adapter và phạm vi nguồn

```ts
import {
  createListFixtureAdapter, createListController, SCREEN_FOUNDATION,
  screenSearch, screenSort, DEFAULT_PAGE_SIZE,
} from './shared'; // Điều chỉnh relative path theo nơi import

const config = SCREEN_FOUNDATION.S03;
// approvedRows và catalogueSummary do adapter đọc từ nguồn S03 đã có.
const adapter = createListFixtureAdapter({
  sourceId: 'S03-source-detail',
  source: {
    rows: approvedRows, completeness: 'complete', scope: 'detail',
    total: approvedRows.length, aggregateTotal: catalogueSummary.productsTotal,
  },
  summary: catalogueSummary,
  search: query => screenSearch(config, query.search),
  filters: query => [
    row => query.group === 'all' || row.group === query.group,
    row => query.status === 'all' || row.status === query.status,
    row => query.unit === 'all' || row.unit === query.unit,
  ],
  sort: query => screenSort(config, query.sortKey, query.sort),
  stableId: row => row.key,
  filterOptions: { group: row => row.group, unit: row => row.unit },
  // optionCatalogue: {...} nếu đã có danh mục option có nguồn;
  // key được cung cấp ưu tiên, key còn lại derive toàn bộ approvedRows.
  validate: validateExistingScreenQuery,
});
```

Ví dụ trên là cấu trúc wiring, cần khai báo generic `Row, Query, Summary` theo contract màn. Không thêm field hoặc giả định `aggregateTotal` luôn đã có. `validate` phải từ chối enum/sort key/ngày không hợp lệ, và kiểm coverage từng vùng. `screenSort` không tự xác nhận query key lạ.

`queryTable` có thể dùng trực tiếp trong adapter cũ. Dùng `sort:{type,value,direction}` + `stableId` để đảm bảo missing-last hai chiều và tie ổn định. `compare` cũ giữ tương thích nhưng caller tự chịu trách nhiệm null/missing; không dùng cho tích hợp mới nếu không có kiểm tra tương đương. Không sort `model.rows` sau paginate.

`summary` sao chép từ nguồn độc lập, `pagination.total` là count sau lọc trong detail scope. Không dùng total326/1284/27/128 làm total của tập7/5. Ghi scope note từ screen config hoặc lời tương đương ngắn, không badge kỹ thuật.

## 3. Controller và UI

```ts
const controller = createListController(adapter, {
  initialQuery: defaults,
  queryOptions: {
    filterKeys: ['group', 'status', 'unit'],
    sortKeys: ['sortKey', 'sort'],
  },
});
// Subscribe rồi load; cleanup unsubscribe + clear.
await controller.load(defaults);
controller.update({ search: text });       // 250 ms, invalidates old intent now
controller.update({ status: selected });   // immediate + latest pending search
controller.update({ sortKey, sort });      // immediate, page1
controller.update({ pageSize: 50 });        // immediate, page1
controller.update({ page: 2 });             // keeps current conditions
controller.reset(defaults);                 // immediate, cancels debounce/read
```

- `getSnapshot().intendedQuery`: control search/select trong lúc đang nhập. `model.query`/`acceptedQuery`: bảng, STT, nhãn kết quả và pagination.
- `loading`/`debouncing` báo tiến trình phù hợp; không hiển thị thông báo cũ cho intent mới. `blocker`/`error` không xóa accepted model.
- Refresh dùng `controller.load(acceptedQuery)`; reset theo scope màn. S01 reset riêng bảng phải giữ kỳ hiện tại đúng nguồn.
- Không dùng timer debounce riêng tại Catalogue/component. Controller kết hợp intent nên option trong lúc search đang chờ không làm mất chữ vừa nhập.
- `CatalogueToolbar applyMode="immediate"` truyền `searchValue` từ intended và `onSearchChange` gọi update. Không truyền `onSubmit` cho mode mới; buffer IME đã có trong shared.
- `DataTable.columns` thêm `ordinalColumn(model.pagination.page, model.pagination.pageSize)`; sort/header từ **accepted query**. Cột STT/selection/actions dùng `kind` tương ứng và không có sortKey.
- `Pagination` nhận `page`, `pageSize`, `filteredTotal`, `canGoPrevious`, `canGoNext`, `onPageChange`, `pageSizeOptions` và `onPageSizeChange`. Map `model.pagination.total` sang `filteredTotal`; các giá trị còn lại lấy từ accepted model hoặc callback controller. Component tự tính dải hiển thị; không có prop `start`/`end`/`pages`. Nếu dùng `displayedCount`, lấy `model.rows.length`, không lấy pageSize hay aggregate. Không giữ số trang cũ sau filter.

```tsx
const p = model.pagination;
<Pagination
  page={p.page}
  pageSize={p.pageSize}
  filteredTotal={p.total}
  canGoPrevious={p.page > 1}
  canGoNext={p.page < p.pageCount}
  pageSizeOptions={p.pageSizeOptions}
  onPageChange={page => { void controller.update({ page }); }}
  onPageSizeChange={pageSize => { void controller.update({ pageSize }); }}
  displayedCount={model.rows.length}
  variant="products"
  unit="sản phẩm"
/>
```

Ví dụ variant/unit trên cho S03; màn khác giữ nhãn nghiệp vụ của mình.

## 4. DatePicker/Range và thiếu coverage

```tsx
<DateRangePicker
  id="existing-period"
  label="Khoảng ngày"
  value={acceptedQuery.period}
  onChange={period => {
    if (period) controller.update({ period });
    // null chỉ xử lý theo hành vi reset/clear vốn có của màn, không tự thêm nghiệp vụ.
  }}
/>
```

Range chỉ gọi onChange sau đủ hai ngày hợp lệ; không gắn filter vào hover/draft endpoint. Component controlled hiển thị accepted period. Adapter thiếu coverage trả blocked; controller giữ dữ liệu và phục hồi intended. Thông báo dùng accepted period đã format: “Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ …”. Có thể vô hiệu clear qua prop khi nghiệp vụ không cho kỳ rỗng, không vô hiệu ngày vì fixture.

Basic là `DatePicker` với `value:string|null` ISO date và callback; Range là `DateRangePicker` với `{from,to}|null`. ISO nội bộ chỉ để query frontend, chưa là DTO API. Format/zone dùng constants chung. Nhiều ngày rời rạc chỉ triển khai khi có nguồn nghiệp vụ Multiple; hiện không cần thêm vào màn.

S01 phải đối chiếu coverage **từng vùng**. QA S00 wrapper chỉ nhận toàn tháng09 để kiểm rollback, không buộc policy toàn màn S01 chỉ toàn tháng. Truy vấn detail có ngày chỉ được dùng các record đủ nguồn; không suy KPI ngày từ monthly aggregate. True empty khác thiếu nguồn.

## 5. Mapping và kiểm riêng từng màn

`SCREEN_FOUNDATION` đã khai báo search/filter/sort/default/ID/combined primary và scope note cho S01–S06. S05 bắt buộc name/market/contact theo các cột gộp. `previewDateSortValue` hỗ trợ label ngày hiện có và trả null cho label không hợp lệ, chỉ dùng để compare. Mã/barcode luôn giữ text, dùng sort code tự nhiên.

Mỗi chủ màn tự kiểm:

1. Detail count/summary/provenance gốc; giữ raw fixture không đổi, không nhân dòng.
2. Search có dấu/không dấu/đ/space, AND, option từ toàn scenario, reset, empty hợp lệ, race250ms.
3. Sort mỗi cột cả hai chiều, missing cuối, tie ổn định, default source order hoặc date-desc đã chốt; page reset.
4. STT/count/footer với10/15/25/50 trên detail thực. Không claim page2 của nguồn5/7/10.
5. QA riêng60 qua cùng adapter/component: page2 size50 bắt đầu51, kết thúc60; không trộn summary/source.
6. Desktop/Tablet, zoom125/200, keyboard/focus/Escape/overflow, BasicSelect/Basic/Range nơi nghiệp vụ có; ảnh runtime + file đã sửa + checkpoint của màn.

Giữ trạng thái `SCREEN_INTEGRATION_PENDING` tới khi chủ màn hoàn tất. S06 tổng hợp sau đủ sáu bộ bàn giao; không tự PASS màn khác. Sau bàn giao nền, S00 dừng.
