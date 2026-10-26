# Shared UI — HN_UI_SHARED_v1.0.1

Patch focus `S00-FOCUS-001`: `FilterInput` uses its existing wrapper ring; the nested input does not add a second outline. Keep standalone control focus and compound multi-action focus. Screens must reuse this rule, not add local focus CSS. Regression: `tests/browser/shared-focus.spec.ts`; release/evidence: `output/S00/SHARED_FOCUS_FIX_2026-10-10/`. Runtime API and query behavior remain v1.0-compatible.

Current contract: `docs/ui-foundation/CONTRACT_UI_COMMON_v1.0.md`; integration guide and release lock are beside it. Release status comes from `UI_FOUNDATION_LOCK.json`, not this heading. S00 owns shared; screen owners integrate in their files and provide separate acceptance evidence.

New defaults: immediate filters, normalized field-based substring search with controller debounce250ms; typed global sort then pagination10/15/25/50; sort changes resetpage1; missing-last and stable-IDties. `SCREEN_FOUNDATION` records each screen's field mappings/defaults. `createListFixtureAdapter` and `createListController` implement the same static interface for reference detail and isolated QA60.

Basic `DatePicker` and contiguous `DateRangePicker` share one calendar. No fixture-based locking, new business fields, API or Multiple requirement. Accepted query/model survive unavailable periods and stale requests; range needs two valid endpoints. `clearable=false` suppresses optional clear controls for a caller whose existing contract requires a period.

S03/S04/S05/S06 detail scopes7/7/5/7 are Owner-authorized, complete within those scopes while catalogue summaries remain separate. Never put aggregate326/1284/27/128 into the detail footer. Source and synthetic QA evidence remain separate. R1 and older guidance below is history where superseded.

## Opt-in Premium semantic variant — Wave 1

`premium.css` is imported once at the app entrypoint and is inert until a
screen root sets `data-visual-variant="premium"`. It exposes scoped
`--hn-premium-*` aliases for canvas, surfaces, borders, text, controls, table
rhythm and modal/state composition. The aliases do not write `:root` tokens,
change the shared 44px target or focus ring, or enable any action/API/RBAC
capability. Feature CSS remains responsible for fields, columns, fixture data,
query semantics and unsupported-state wording. Remove the opt-in attribute to
return the screen to its existing foundation styling.

# Shared UI — HN_SHARED_UI_2026_10_10_R1 (history)

Chat 1 owns this release. Handoff: `output/S00/SHARED_INTERACTIONS_2026-10-10/HANDOFF.md`; integration API: `INTEGRATION_GUIDE.md` in the same folder. Keep this version shared across screen chats; do not copy controls into feature folders or override shared CSS.

BasicSelect/FilterSelect and Pagination share the Basic presentation with native select semantics and a native fallback. Page defaults are 10, options 10/15/25/50. Controllers must opt into immediate adapter reads before passing `CatalogueToolbar.applyMode='immediate'`; that mode removes Apply/draft messaging and buffers unfinished IME input. Existing explicit feature policies are retained until their owner integrates.

DataTable supports typed sort descriptions and non-sortable ordinal/selection/action kinds. `queryTable` supplies filter→stable sort→pagination for complete sources only; callers still own search fields, comparators and query transitions. Use `displayedCount` for an accepted partial page's actual visible range. A partial source never proves whole-catalogue filtering/sorting.

DatePicker is Basic single-date only, with no business date limits. The inspected Vuexy Disabled Range example selects one date while disabling an interval; a range picker is pending the user's reference decision. No production date field is added by this release. See `SOURCE_LIMITS.md` and `QA_REPORT.md` for data/browser/integration limits.

The prior guidance below remains as history except where the new user requirements and this release supersede it.

# Shared UI — unified S01–S05, 2026-10-09

Current handoff: output/UNIFIED_UI_2026-10-09. Import unified.css last; it supplies consistent HN presentation while S00 retains its accepted shell geometry. CatalogueHeader, CatalogueSummary, SummaryMetric, SummaryDistribution, CatalogueListHeader and CatalogueToolbar are used by S02–S05. Screen controllers still own drafts, accepted queries, source options and read boundaries. Notice owns placement, semantic tone and focus return; feature Notice exports are compatibility aliases.

DataTable columns render(row,index) and expose data-column keys, native sortable header buttons and aria-sort. ordinalColumn(acceptedPage,acceptedPageSize) creates display STT only. Sort semantics live in the S01/S02 adapters, never inside DataTable or a current-page array. S03–S05 partial fixtures remain unavailable for global sorting. See IMPLEMENTATION_DECISIONS.md for exact owner-approved rules.

# Shared foundation — S00 current shell

Current UI/UX fixes: `output/S00/UX_AUDIT_2026-10-09/`. `ShellActionContext` injects a diagnostics-only reporter at the app boundary; GlobalShell owns navigation feedback so it is visible on every feature without duplicate feature toasts. Modal focus fallbacks must remain inside an open modal. Search ignores composition keys and checks that its return target is visible and enabled. Hover expansion starts in navigation, preserving the pin's pointer target; Escape dismisses temporary expansion. Short dialogs keep controls fixed and scroll only results; viewport scroll-padding keeps keyboard controls below the sticky header. See FIX_LOG and QA_REPORT for reproduction evidence.

S00 now owns the shared Menu/Sidebar/Header/Footer. See `output/S00/IMPLEMENTATION_2026-10-08/IMPLEMENTATION_DECISIONS.md` and `HANDOFF.md` for the implemented behavior and QA. The owner authorized applying the prior proposal. Historical scaffold notes below remain for provenance and no longer describe the current shell search, pin storage, dimensions or font loading.

Current shell: white260/70 sidebar, temporary hover/focus expansion without content shift, local pin preference, session disclosure groups, sticky54/64 header,280 Drawer,1440 boxed container and static footer. `ShellHeader.tsx` supplies navigation-label search, shortcuts and read-only caller-supplied profile; business search/auth/API are unchanged. `s00-shell.css` scopes overrides to S00 without editing feature styles. `s00-fonts.css` reuses existing local Public Sans assets and license. All three existing WMS screens share the source-backed S00 registry. Setup preserves its harness navigation.

## Historical foundation — SETUP, S01 and S02 Default

These are reusable semantic HTML / React components. The setup scaffold remains available; S01 Default establishes the shared WMS shell and S02 Default extends its navigation metadata. S03–S05 are not implemented here. Import `styles.css` once at the app entrypoint; it imports `tokens.css`.

## APIs

- `GlobalShell({ title, children, navigation, activeKey? })`: `navigation` is an array of `{ key, label, href }`. Preview routes are supplied by the app. One active leaf is derived from `activeKey`. Desktop collapse state is session memory only. `Kho Hoa Nam` is read-only text.
- `Button`: native button props and `variant?: 'primary' | 'secondary' | 'ghost'`. Default `type='button'`.
- `Card`: native section props, optional `title` and `description`, and children.
- `Feedback`: supplied `title`, optional `children`, `action`, `tone` and `live`. No screen state or permission is inferred.
- `DataTable<Row>`: caller owns `rows`, `columns`, stable `rowKey`, sort state and callback. Column `sortKey` is optional. A sort callback receives the selected key; the controller decides direction according to the eventual source-backed query contract. `aria-sort` reflects supplied state. Empty content is supplied explicitly, never inferred from a missing response.
- `Pagination`: controlled page, page size, known-or-null filtered total, explicit previous/next availability and page callbacks. Page-size options are supplied only when confirmed. The caller must reset to page 1 when query/page-size changes. Unknown total displays `—`; no missing records are fabricated.
- `PhoneNotice({ onCopyLink })`: exact contract text, exported separately and never mounted automatically. The caller owns clipboard behavior. Device classification and approval remain unresolved.

## Decision provenance

Contract r2 supplies brand `#0A3765`, active control `#004E74`, nominal sidebar 248/68 px, drawer 280 px, header 72/64 px and minimum 44 px touch targets. These values are directly traceable to `02_CONTRACT_CHUNG_5_MAN.md` §3 and `CONTEXT_LOCK_5_MAN.json`.

Other spacing, radius, neutral colors and typography sizes are provisional technical scaffold choices. They are not inferred from reference PNG pixels and do not close any foundation asset or visual approval issue.

`Public Sans` is declared, followed by system sans fallbacks. The supplied archive contains no font file, weight files or license. No font is downloaded, fabricated, embedded or claimed to be verified. The visible font therefore falls back unless Public Sans exists locally. This must be replaced by an approved asset with provenance before visual sign-off.

`Icon.tsx` contains original inline SVG paths authored locally, with no external dependencies or font glyphs. The HN mark and generic navigation glyph remain temporary setup marks. The WMS variant uses semantic SVG functions observed in the S01 reference images and an approximate warehouse mark; these are not approved original icon/logo assets. Exact icon assets remain unresolved.

## Responsive and accessibility implementation decisions

The scaffold combines primary input capability `(pointer: coarse) and (hover: none)` with orientation: touch landscape uses a rail, touch portrait uses a drawer. A fine-pointer compact layout at `56rem` or below uses the drawer for zoom-safe reflow, while staying in the CMS shell. The `38rem` CSS condition only wraps header and card spacing. Both reflow values are implementation proposals, not approved business/device breakpoints. Hybrid device policy needs later device validation. Width never triggers `PhoneNotice`.

Desktop expanded/collapsed state is local memory. Navigation uses normal links supplied by the app. Collapsed labels appear as tooltips only on hover/keyboard focus. The native modal `dialog` makes the background inert; an explicit Tab/Shift+Tab boundary loop keeps keyboard focus in its controls. Escape, close button and scrim close it, and focus returns to the opener. Drawer opening locks background scroll. A skip link focuses the main landmark without changing the preview route hash. The shell title is non-heading text; the mounted page owns its main heading. All action targets use a 44 px minimum. Table horizontal scrolling is isolated inside its focusable region; the page itself can reflow.

Runtime verification belongs in the setup QA report. Component availability does not imply that screen interactions, screenshot fidelity, all device combinations, or production/API behavior passed.

## S01 shell extension and provenance

`GlobalShell` accepts `variant='wms'`, optional `profile: { displayName, initials }`, and `onUnresolvedAction(key)`. The setup variant is the default and preserves the setup route harness. Both variants share the responsive layout, dialog, keyboard, sidebar and navigation implementation. `S01_SHELL_NAVIGATION` supplies declarative UI navigation metadata, including the technical preview link `#/preview/S01`; it contains no business records or invented production routes.

Source: live Page `page_d79b0a4265688191a26d6bae9aeed838`, sequence 3, read on 2026-10-08, plus all five `library-file:` references returned by that Page. All five images were actually viewed with `read_page_reference`: Desktop expanded/collapsed, Tablet landscape/portrait and Drawer. Layout, labels and hierarchy are `OBSERVED_PREVIEW` from the 2026-10-08 temporarily approved visual set. The reference Page still has no font file/license/weight or icon asset registry, and the package has `font_asset_path=null`; the fallback policy is unchanged.

Observed WMS shell: only `Tổng quan` is active; `Nghiệp vụ` initially expands its four source children (`Nhập kho`, `Xuất kho`, `Xếp khay`, `Bảo hành`). The expanded state is independently controlled by its real button. `Danh mục` and `Báo cáo` remain collapsed presentation entries. The remaining observed entries and account/search/notification entry points call `onUnresolvedAction`, so the review harness can record a blocked flow outside the product UI. No new module, endpoint, account permission, dialog or success response is inferred. The read-only warehouse name lives in the sidebar/drawer footer. The caller supplies the source persona display text; it is not an authenticated identity.

Generated reference images disagree on a few glyphs (Overview home versus bars; catalogue document versus cylinder; tray outline versus cube). Runtime keeps one semantic icon per function across layouts (home, catalogue document, tray, distinct chart/report), as required by the common contract. This normalized semantic choice is documented rather than claiming exact glyph fidelity. Original brand/font assets and full visual acceptance remain open.

The header's search field accepts text and submits its unresolved entry point on Enter; it performs no business search. Notifications/profile do likewise on activation. Closed unsupported menu groups report the unresolved entry point without creating an invented submenu. Navigation tooltips are fixed to the hovered/focused rail item so they remain visible outside the scrollable sidebar; no tooltip appears by default. WMS sidebar navigation can scroll vertically when zoom reduces available height. Compact reflow still never classifies a phone.

Visual comparison with the five source images corrected three shell details: the portrait header retains the source profile name at 800 CSS px, the Drawer close control is circular with a distinct cyan keyboard focus ring, and the read-only warehouse footer appears only in expanded sidebar/Drawer (no added rail icon). The profile name is hidden only in the source landscape rail or compact widths at/below 44 rem; that last value is a technical reflow choice, not a device classifier. The focus-ring color reuses the runtime active-indicator cyan and is not claimed to be a verified source asset/token.

## S01 reusable controls

- `FilterInput({ label, icon?, ...nativeInputProps })` and `FilterSelect({ label, children, ...nativeSelectProps })` provide real accessible controls. Values, options and query behavior remain owned by the view model/controller.
- `StatusBadge({ tone, children })` renders the provided source label with `success`, `warning` or `neutral` visual tone; it does not infer or introduce a status enum.
- `Pagination` accepts `variant='overview'` and `unit='phiếu'` for the S01 range/footer topology, supplied source page-size options, numbered pages derived from the known filtered total, and icon previous/next controls. Total `null` remains unknown rather than zero. This does not certify that data for any page exists; the controller and adapter retain that responsibility.
- All newly added interactive controls have a 44 px minimum target. Unspecified spacing, header wrap thresholds (70/52 rem) and neutral colors remain technical implementation choices, not pixels reverse-engineered as approved design tokens.

## S02 shared extension

`S02_SHELL_NAVIGATION` reuses S01 navigation and the same `GlobalShell`, initially expanding both `Nghiệp vụ` and `Danh mục`. Its only catalogue child is `Bệnh / lỗi`, with preview href `#/preview/S02` and active key `S02` supplied by the caller. The source S02 references show document-family glyphs for both catalogue parent and this leaf; the shared original `catalog` SVG represents that silhouette without claiming exact approved glyph fidelity. S01 keeps `Danh mục` initially collapsed and can now open this implemented child; no S03–S05 entry or module has been introduced.

`Pagination variant='defects'` reuses the shared numbered footer with source formatting `Hiển thị 1–10 / 10 hồ sơ`. Page size, options, total and navigation callbacks still come from the controller; no 10-record fixture or page size is hardcoded in the component. For the source model total 10/page size 15, only page 1 is available and previous/next are disabled. A known zero total remains range `0–0 / 0` on page 1, never a fabricated second page. Unknown total is still `—`.

New `plus`, `edit` and `info` icons are original inline SVG for source-backed semantic controls, with the same provisional glyph provenance as the other shared icons. No external assets, font substitutions, API bindings or permission claims are added.

S02's generated Drawer reference illustrates a squared close button, unlike S01. Runtime keeps the S01 shared circular close control and keyboard focus ring consistently across both screens. This is a documented shell normalization delta, not a new claim that the reference images were identical.

## Wave 4 shared additions (2026-10-18)

- `CatalogueToolbar` implements opt-in lookup/worklist layouts, trailing controls and filter disclosure policies. Search-only screens do not render empty filter panels. The default layout remains compatible with S01–S10. `CatalogueSummary` variants and responsive layouts are styled in `wave4-catalogue.css`.
- `CatalogueNavTabs` renders the supplied navigation/guard items with a 44 px minimum target, current-item semantics and optional counts. Navigation destination and count authority stay with each caller.
- `DataTable` measures sticky column offsets and suspends pins when the scrollport cannot retain enough unpinned space. Refined compact appearance, quiet guarded actions and nested scroll behavior are opt-in. `wave4-presentation.css` supplies the presentation rules.
- S16/S17 opt into persistent inline Notice hosts and focus resolvers for table/card switches and removed rows. The focus resolver checks current foreground ownership before restoring focus. Default Notice timing/placement remains compatible with prior screens.
- `Pagination` opt-in boundary focus preservation keeps a newly disabled page control reachable through the intended fallback while honoring newer user focus intent. Default paging behavior remains unchanged.
- `InitialReadState` accepts an optional retry callback; screens without an approved retry contract omit it.

The Wave 4 receipt records the final shared hashes and scoped regression evidence. These APIs do not establish backend, permission or mutation behavior.

## Wave 5 shared additions (2026-10-18)

ReportEmptyState, ReportScopeNote, reportReadErrorMessage, ReportCompactSort and report chart scale helpers are promoted from the selected report source. Eight missing report icon glyphs are additive; existing glyphs, Foundation tokens and shell layout are unchanged. ReportExcelButton provides an accessible explanatory guard for all nine reports and performs no export/network/write operation. The existing S00 navigation registers the nine report preview leaves.
