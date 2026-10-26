# Design-to-Code Mapping

Version: `1.0.0-audit` · 2026-10-27 · Owner: S00#6
Base: `DEV` / `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`
Decision: `DEC-DG-20261027-01` in [source register](DESIGN_SOURCE_REGISTER.md).
Status: `HANDOFF_FOR_REVIEW`, `DESIGN_READY_BLOCKED`.

## S01 source boundary

Route `#/preview/S01` is registered by `src/app/registry.ts` and rendered by `src/features/S01/OverviewScreen.tsx:201`. Approved artwork3/4 governs **page components** of Default; artwork5/6 governs outbound-document detail. Sidebar and Menu/Header in their background are excluded by the user. They retain earlier approval; recover that separate artifact before making any shell design change.

Use BL-S01-D/T and BL-S01-DETAIL-D/T in `BASELINE_MANIFEST.md`; dimensions there are original raster dimensions, not CSS instructions. Proposed S01 comparison profiles D1920×1080/DPR1 and T800×1280/DPR2 await scoped confirmation. Source-native artwork comparisons may proceed as diagnostics with explicit transforms. Neither crop scaling nor a low pixel difference establishes acceptance.

## S01 layout and code map

All observed sizes/colors below are PROVISIONAL unless the contract states otherwise. S00#2 changes only leased implementation files after the owning design decision; S00#3 captures and reviews the resulting variant.

| Map ID / reference | Layout / required components | Current binding and static observation | Specific implementation handoff / acceptance |
|---|---|---|---|
| S01-00 / separate prior shell | Shared navigation, menu/header, content corridor/footer | `src/shared/GlobalShell.tsx:240`; `s00-shell.css:13`; `tokens.css:5`. base248/68 +72/64 vs scoped260/70 +54/64; `s00-sidebar-tone.css` adds image/navy. | DG-02: recover earlier approved shell and scope; record computed variables by layout/preference. Preserve prior design, do not copy chrome from3/4/5/6 or tray. Shared-file work requires S00#1 lease. |
| S01-01 /3,4 | Page title + subtitle; warehouse/period controls alongside title Desktop, below title portrait | `OverviewScreen.tsx:203`–period block; `overview.css:407`, `:608`, `:637`; FilterSelect and DateRangePicker. Desktop title30/38, portrait36/44 observed; fields40/42. | Bind type/spacing to approved measured contract once resolved; compare title/filter alignment and full labels. Warehouse is current source context, not authority to add multi-warehouse switching. DATE-S01 below. |
| S01-02 /3,4 | Four KPI cards Desktop;2×2 portrait; stock unknown “—”; inbound8/outbound8/open warranty4 in artwork | `OverviewScreen.tsx:217`; `.ov-metrics`, `.ov-metric`; summary from model, `DESIGN_FIXTURE_SNAPSHOT.json:8`. | Preserve value/unit/helper/scope hierarchy; keep unknown distinct from0. Freeze QA scenario; never hardcode artwork counts or hide unknown helper to fit. DG-04 covers scenario/paging reconciliation. |
| S01-03 /3,4 | “Cần xử lý” list with count, source document IDs, row CTA and list action | `OverviewScreen.tsx:224`; `.ov-attention*`; `overview.css:622` and `:661`. | Artwork shows3 attention rows. Source model remains authoritative; record exact scenario and approved count semantics rather than force aggregate total to3. Verify long IDs/row labels do not hide CTA. |
| S01-04 /3,4 | Three quick-access links beside attention Desktop, three across under it portrait | `OverviewScreen.tsx:230`; `S01.presentation.json:6`; current `.slice(0,3)` and explicit allowed destinations. | Keep approved3 visible entries: inventory report, traceability, movement history. Artwork is not permission to activate unimplemented fourth entry or invent destinations. Read route/capability contract before enabling. |
| S01-05 /3,4 | Activity heading/count/action → search/type/status filters | `OverviewScreen.tsx:236`–`:252`; shared FilterInput/FilterSelect, `.ov-filters`; `overview.css:628` min-height36 Desktop and `:681`42 portrait. | DG-03: measure actual input/wrapper/hit bounds; restore shared44 target or obtain named density exception. Preserve IME/debounce/query semantics. Align three filters and error/helper slots; reset not obscured. |
| S01-06 /3 | Desktop activity table: ordinal, document number, type, time, actor, quantity, status, action | Columns `OverviewScreen.tsx:187`; DataTable at`:257`, `appearance=refined`, `density=compact`; `overview.css:539`–`:540` header40/row36 and sort36. | Numeric quantity align end; same header/data axes. DG-03 target review and DG-04 fixture decision; table viewport must not create page overflow. Do not globally change S05 table tokens to fix S01. |
| S01-07 /4 | Portrait activity cards preserve ID/type/time/actor/status/quantity/action | `OverviewScreen.tsx:258`; `.ov-mobile-list`, `.ov-mobile-row*`; `overview.css:683`–`:699`. | Same accepted rows and ordering as table, independent rendering. Confirm no overlap of absolute-positioned badges/meta for VI/EN/ZH and long actor/IDs; accessible action names and full quantity retained. |
| S01-08 /3,4 | Result range, page-size/page navigation | `OverviewScreen.tsx:264`; `Pagination.tsx:12`, `foundation.ts:24`; footer `.hn-pagination`. Artwork4/page vs shared10/15/25/50. | DG-04: decide screenshot-specific QA page size vs allowed product options. S00#2 must not add4 globally or falsify totals. Both views show actual displayedCount and known/unknown totals. |
| S01-09 /5,6 | Outbound detail: icon/eyebrow/number+copy/status/close; document fields; systemID+copy; footer close/open-document CTA | `AcceptedRowDetail.tsx:14`; `GlobalModal.tsx`; `overview.css:447`,`:500`,`:514`,`:707`. Width800 Desktop/710 portrait, footer50/56px, CTA#0067dd; strong portrait type overrides. | Approved topology/content only; exact CSS sizes remain unresolved. DG-05 registers `ov-detail-modal` variant against artwork5/6; retain shared focus/scroll. Open-document availability follows verified existing contract; no new edit/delete. Detail behind shell excluded from artwork authority. |
| S01-10 /no current state artwork | Initial load, refresh, empty/no-results, read error/offline, denied/expired, unavailable/unknown | `OverviewScreen.tsx:215`,`:255`,`:258`; `InitialReadState.tsx`, `PageState.tsx`, NoticeSlot. | DG-08: obtain approved per-state treatment/explicit acceptance. Keep semantics; do not create new design and label it approved. S00#4 verifies runtime reachability. |
| S01-11 /no current chart reference | Chart not shown in3/4, not rendered in current OverviewScreen | `src/features/S01/DocumentChart.tsx`, `document-chart.css` exist, but are not used by current screen. | Existence of unused files/old aggregate chart fixture is not a design requirement. No chart addition under this packet; any future chart needs its own approved scope. |

## Global component map

| ID / scope | Reference / code owner | Required handoff |
|---|---|---|
| GLOBAL-NOTIFY | BL-NOTIFY-D/T =1/2; `src/notifications/PreviewNotificationCenter.tsx`, `notifications.css:40`; `NotificationBell.tsx` | Desktop list/detail split; portrait list with separate detail navigation; search/all/unread/actions/status icons. Badge0/1/99/100/large/unknown must preserve full accessible count. Background shell excluded. Notification actuals never replace1/2. |
| GLOBAL-TOAST | Primary original lock MISSING; code `src/toast/toast-config.ts:2`, `GlobalToastProvider.tsx:125` | DG-06: preserve timing observation350/3000/300ms pending lock recovery; record page CTA exception conflict. Actual obstacle tests cover header popups, open Modal/Drawer/DatePicker, small viewport and3-message stack. No silently moved rail/lifetime. |
| GLOBAL-MODAL | S01 detail5/6; tray approved05–13; `src/shared/GlobalModal.tsx`, `components.css:31`; tray wrapper `src/features/putaway/TrayUi.tsx` | Keep mechanics shared; register scoped sizing/header/footer variants. Recheck notification and unrelated consumers after any shared fix. |
| GLOBAL-TABS | Tray source01–04; `src/shared/CatalogueNavTabs.tsx`; consumers `S13/PutawayQueueScreen.tsx:111`, `S14/PutawayOrdersScreen.tsx:132`; notification owns separate tabs | Single underline Desktop /2×2 portrait for tray only. Do not force notification or generic tabs into this grid. |
| GLOBAL-STATE | S01 state artwork MISSING; `src/shared/PageState.tsx`, `InitialReadState.tsx` | Record applicable state, approved copy/action/visual, trigger and role. No success inferred from empty/errors. |

## Date field register

| Field ID / route | Source / current code | Design/business decision needed |
|---|---|---|
| DATE-S01 /`#/preview/S01`, `#ov-period-picker` | Artwork3/4 show September2026. `OverviewScreen.tsx:210` supplies range, clearable=false, no explicit policy. `date-policy.ts:17` defaults rolling-90. | Exact S01 policy approval, presets, min/max, today handling, inclusivity and source date anchor MISSING. Do not change business policy to match static September or silently move artwork fixture to today. Freeze clock/scenario for comparison and disclose only in QA artifacts. |
| DATE-TRAY-HISTORY /`#/preview/S14/history` | Approved `PROMPT_S00-1.md` §5: Asia/Ho_Chi_Minh, no future, max90-day past. | Validate caller+adapter against locked business policy; clarify today-minus90 vs90 calendar dates and test boundaries. No blanket rule for unrelated fields. |
| DATE-OTHER /each existing caller | `DatePicker.tsx:32` exceptionId, `date-policy.ts:20` business-exception | S00#2 inventories field-level approved rules/exceptions; S00#6 registers presentation; no caller exception was inferred in this audit. |

## Design Acceptance Criteria for S00#2 / S00#3

| AC | Criterion / evidence | Current state |
|---|---|---|
| AC-01 | Exact source hash/state/scope is selected; excluded shell chrome is documented; earlier shell artifact restored. | Content source confirmed; shell artifact BLOCKED (DG-02). |
| AC-02 | CSS viewport/DPR/pointer/orientation, shell pin/content-width preference, locale/theme, frozen clock and accepted data/query scenario recorded before capture. | S01 profile/scenario decision BLOCKED (DG-04/07). |
| AC-03 | Match3/4 hierarchy: title/filter,4 KPIs, attention,3 quick links, activity controls, table/cards, paging. No chart added. Compare full page and content region; explain approved normalizations. | NOT_RUN by S00#3. |
| AC-04 | Match5/6 detail field hierarchy/status/copy/CTA; body scrolls, footer reachable, focus returns to surviving opener. No background scroll/CTA clipping. | Visual NOT_RUN; exact variant parameters BLOCKED (DG-05). |
| AC-05 | Measure computed type/color/radius/shadow/spacing plus bounding boxes for title/controls/panels/table rows/actions. Record competing CSS selectors and effective token values. | NOT_RUN. No invented pixel tolerance; approved numeric constraints exact. |
| AC-06 | Shared44px control targets or explicitly approved exception; no whole-page horizontal overflow or clipped IDs/status/helper/error/CTA. Long strings/zoom and both profiles included. | NOT_RUN; static risks DG-03. |
| AC-07 | Source data/list/detail/search/type/status/sort/paging remain consistent; preserve accepted query/page/scroll when closing detail. Values unknown remain unknown; no fabricated record/permission. | S00#2/S00#4 functional evidence NOT_RUN by this task. |
| AC-08 | State matrix: initial load, refresh, default/success, no records, no results, error/offline, forbidden/expired, detail unavailable, pending/copy failure; no false empty/success. | State visual references BLOCKED (DG-08); triggers require S00#4 evidence. |
| AC-09 | VI/EN/zh-CN and light/dark long text; proper glyphs/weights, IME and keyboard/focus; no overlap/clipping/shrunk fonts. | Exact type/locale baselines BLOCKED (DG-07/08); runtime NOT_RUN. |
| AC-10 | Badge99+, Notification Center list/detail, toast rail/timing/foreground pause and zero required-CTA occlusion verified with measurement. | NOT_RUN; toast lock conflict BLOCKED (DG-06). |
| AC-11 | Approved reference/actual/diff + source/actual hashes + candidate SHA/build/preview + test/measurements/console/open defects; S00#3 adjudicates visual result. | NOT_RUN. Historical report cannot satisfy current SHA. |
| AC-12 | Any shared-component change has approved file lease, decision/CR and named shared-consumer regression set. No baseline overwrite. | Required before implementation; no shared runtime edit in this package. |

S00#2 can use confirmed content topology and investigate bounded issues without inventing missing parameters. S00#3 can prepare state fixtures/capture plans and source-region comparisons; blocked design assertions remain BLOCKED, not PASS. S00#1 owns integration/task release; this document does not dispatch or approve another agent's work.
