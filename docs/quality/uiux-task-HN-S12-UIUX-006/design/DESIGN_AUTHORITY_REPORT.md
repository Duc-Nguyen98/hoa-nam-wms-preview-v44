# S12 design authority report

Task: HN-S12-UIUX-006 · Owner: S00#6 · Date: 2026-10-28 UTC+07

Observed checkout: `E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026`, branch `DEV`, SHA `bfec7060cdf422a112ec5e644bf0b51401d9bda2`. Requested execution: Sol / high. Actual model telemetry is **UNVERIFIED**; this report does not certify model selection.

## Authority and boundaries

The task assigns eight original images from `C:/Users/Admin/Desktop/HN_Astra/15.png` through `22.png` to S12 page/dialog content. They have been read visually and copied byte for byte into `references/`. `REFERENCE_MANIFEST.json` records the source and copied SHA-256, byte length, raster size and state assignment. Custody verification: **PASS 8/8**. No resizing, cropping, re-encoding or source replacement occurred.

`AGENTS.md`, `docs/quality/DESIGN_CONTRACT.md` v1.2.0-recovery, `AGENT_OWNERSHIP.md`, `QUALITY_GATES.md`, `COMPONENT_SPEC.md`, `DESIGN_GAP_CLOSURE.md` and `BASELINE_MANIFEST.md` remain governing shared authority. This report registers task inputs; it does not amend those documents or promote observed implementation values into approved tokens.

The task images govern S12 content composition and the specified states. Sidebar, Header/Menu, global navigation and other shared shell consumers retain their existing authority. Shell differences among the supplied desktop/tablet artworks are outside this task's design authority. No new global geometry or palette is derived from them.

| Property | Status | Scope and interpretation |
|---|---|---|
| Eight supplied originals and state assignment | CONFIRMED task inputs | Immutable bytes identified in manifest; this is source registration, not rendered implementation acceptance |
| Page heading, worklist, table/cards, form fields, detail sections, validation hierarchy | CONFIRMED composition | See acceptance matrix; actual values and permissions remain contract bound |
| Public Sans family; brand/control family; shared 44 CSS px target | CONFIRMED within existing common contract scope | Reuse existing shared assets/mechanics; individual S12 CSS declarations still require evidence |
| Exact screenshot-derived CSS widths, type sizes, gaps, shadows, breakpoints, hex values | DESIGN_GAP / observed values PROVISIONAL | No pixel sampling or dimension-to-CSS inference provides approval |
| Desktop/tablet CSS viewport and DPR of source artwork | DESIGN_GAP | Raster sizes alone do not identify either; tray profiles do not automatically normalize S12 |
| Runtime data, status, receipt type, count and permissions | Source/business contracts | Artwork sample strings cannot authorize filtering actual data, hiding records or inventing missing fields |
| Functional/visual acceptance | NOT_RUN by S00#6 | S00#3 supplies actual/diff; S00#4 supplies behavior/a11y; S00#1 integrates |

## Canonical route and component ownership

`src/app/registry.ts:15` registers **`#/preview/S12`**. `src/app/App.tsx:170` mounts `ReceiptsScreen`. `ReceiptsScreen.tsx` chooses the current-session cohort when the operational adapter is available, then mounts `OperationalReceipts`. Historical list/detail is a separate cohort and must not be substituted as the eight-reference target.

| Concern | Canonical implementation | Design review boundary |
|---|---|---|
| Page and cohort | `src/features/S12/ReceiptsScreen.tsx` | S12 title/description and worklist; preserve other cohorts |
| Current session table/cards, actual receipt selection, count and details | `src/features/S12/OperationalReceipts.tsx` | Dataset remains adapter-owned; no artwork-specific ID allowlist justified by visual references |
| Header form and inline validation | `src/features/S12/ReceiptHeaderForm.tsx` | Reuse shared FormField/select/button, preserve contract rules |
| Form constraints | `src/features/S12/receipt-header-form.ts` | Required type/source, optional reference, single line, NFC and 200 character boundary |
| Read/command/fence behavior | `src/features/S12/receipt-binding.ts` | Preserve authorization, stale/version checks, recovery and atomic proof |
| S12 presentation | `src/features/S12/receipts.css` | Feature-scoped overrides only; existing long cascade is evidence, not a new lock |
| Modal/focus/scroll | `src/shared/GlobalModal.tsx` and focus helpers | Reuse shared native dialog; no copied focus trap or global replacement |
| Table/controls/notice | Existing shared primitives | Feature content/columns only under task lease |

## Artwork interpretation decisions and gaps

1. REF-02 / 16.png contains a populated three-row panel **and** a separately titled empty illustration. REF-04 / 18.png contains three populated cards only. The second desktop card is registered explicitly as an illustration; it is not evidence that an operational session has zero receipts while also having three. Whether the task requires that illustrative panel in a populated live screen must be recorded by S00#1 before treating its omission as a visual failure. Empty/no-results behavior remains truthful.
2. REF-03/05 shows PN-0012 with type `—` (desktop also says `Chưa có thông tin`). The runtime ReceiptData contract has PRODUCT/COMPONENT; the current detail reads this value. Preserve the real type. Do not manufacture an unknown business type to reproduce an incomplete artwork field.
3. REF-03/05 footer contains refresh and close; the current unscanned draft may also expose **Sửa thông tin** under existing eligibility. A screenshot does not authorize removal of an existing action or a permission change. Treat its visibility as a scenario/action discrepancy for S00#1 and QA.
4. Create/validation/detail references use an empty backdrop while list references use populated data. Capture each state using a declared scenario; do not erase or reset a live session to force a backdrop match.
5. REF-07 and REF-08 long reference previews visibly contain different dates/text and both show 201/200. The intended validation state is missing type, missing source and a 201-character reference; the full original long string cannot be recovered from a truncated input raster.

## Disposition

**Reference registration complete. Implementation acceptance remains NOT_RUN.** Local work can proceed using the composition/state criteria. Exact normalized pixel acceptance and the recorded composition/data conflicts require explicit evidence or a task-scoped integration disposition. No global contract, source file or business fixture was edited by S00#6.
