# HN-PTW-26REF-001 Design Authority Report

- **Role:** S00#6 Design Guardian
- **Branch / base:** `DEV` / `bca3db9062c9246d1fe780fc9e52110128d40859`
- **Checkout:** `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`
- **Contract:** PTW-01 — LOCKED
- **Scope:** `#/preview/S13` queue, `#/preview/S14` orders, `#/preview/S11` trays, `#/preview/S14/history` history, and the 13 supplied state pairs (26 PNGs).
- **Disposition:** `DESIGN_READY_BLOCKED` for exact visual acceptance; source custody and route/component discovery are complete.
- **Source edits:** none. The reference files under `design/references/` are immutable inputs.

## Authority and custody

`REFERENCE_MANIFEST.json` is the custody authority for all 26 inputs. It records the reference ID, exact filename, SHA-256, byte length, raster dimensions, and `Putaway PTW-01` scope for every Desktop/Tablet pair. All 26 entries are present and readable. The manifest reports Desktop rasters at `1672×941` and Tablet rasters at `992×1586`; these dimensions are custody metadata only and do not establish CSS viewport or DPR.

The 13 pairs are registered as `APPROVED` visual inputs for their named PTW-01 state/content. Approval does not extend to an unregistered shell, logo, CSS measurement, breakpoint, font weight, endpoint, DTO, or permission. The locked contract and `docs/tray-approved/IMPLEMENTATION_MATRIX.md` provide the recovered state/route/business authority. `docs/tray-approved/reference/PROMPT_S00-1.md`, named by the matrix and contract, is absent from this checkout; its absence is a `DESIGN_GAP` and prevents treating historical prose as recovered authority.

## Route and ownership result

`src/app/App.tsx` resolves the routes as follows: S13 → `PutawayQueueScreen`, S14 → `PutawayOrdersScreen`, S11 → `TraysScreen`, and the exact history subroute → `PutawayHistoryScreen`. The detailed mapping, controller/binding ownership, modal/state ownership, and reference rows are in [COMPONENT_ROUTE_MAPPING.md](COMPONENT_ROUTE_MAPPING.md).

Shared presentation ownership remains with `GlobalShell`, `DataTable`, `CatalogueNavTabs`, `Pagination`, `StatusBadge`, `Notice`, and `GlobalModal`. Putaway-specific modal styling and copy are wrapped by `TrayDialog`/`TrayUi`; no second focus trap or copied shared modal is authorized. Business state belongs to the S13/S14 bindings and the S11 projection. History owns its read adapter and permission/error state.

## Locked design facts adopted for this audit

- Desktop QA profile: `1920×1080` CSS px, DPR 1; portrait Tablet: `800×1280` CSS px, DPR 2 (`1600×2560` output). The supplied PNG sizes do not prove either profile.
- Desktop tabs use one underline; portrait Tablet uses one 2×2 tab grid.
- Page margins are 32 px Desktop and 24 px Tablet; card/dialog spacing 24 px; group gaps 16/24 px; label-to-field gap 8 px.
- Interactive target minimum is 44 CSS px; numeric cells are right aligned; bounded body scrolling keeps the modal footer reachable.
- Draft creation does not create a BOX→TRAY mapping. Only successful whole-BOX confirmation creates the effective mapping and it is stock neutral.
- Stale versions, duplicate commands, unknown outcomes, cancelled/failed operations, and unauthorized history access fail closed. History is an S14 subroute; S20 is not reused.

These facts are **CONFIRMED** only within PTW-01/tray scope. Exact unregistered geometry, colors, type weights, icon paths, shell chrome, and technical breakpoints remain **PROVISIONAL** or **DESIGN_GAP**.

## Reference interpretation

| Ref | State | Route | Authority read |
|---|---|---|---|
| REF-01 | Eligible BOX queue | S13 | Queue content/table and create eligibility |
| REF-02 | Putaway orders list | S14 | Order list, status/filter/paging |
| REF-03 | Tray list | S11 | Tray summary and derived counts |
| REF-04 | Authorized history | S14/history | History table, date/search/action filter |
| REF-05 | Create confirmation | S13 | Whole BOX review; no location/stock mutation |
| REF-06 | Create success | S13 | One DRAFT, order identity, unselected tray |
| REF-07 | Confirmed order detail | S14 | Order identity, tray/location, captured/current values |
| REF-08 | Draft validation | S14 | Required tray validation and retained context |
| REF-09 | Tray detail | S11 | Nine BOX projection, current ledger quantity |
| REF-10 | Confirming | S14 | Busy/duplicate-submit lock and safe dismissal |
| REF-11 | Stale/conflict | S14 | Reread/retry and captured-content retention |
| REF-12 | No eligible tray | S14 | Empty tray state, disabled confirmation |
| REF-13 | Permission denied | S14/history | 403/denied state with no rows/count leak |

## Telemetry and approval boundary

The requested authority policy names **Sol**. The execution context exposed no reliable model telemetry to this report; therefore this report makes no claim that the actual model was Sol. This is recorded for provenance only and does not change design authority. No visual screenshot was fabricated and no baseline was updated.

## Gate result

- Reference custody: **PASS** (26/26 manifest entries present; source bytes untouched).
- Route/component discovery: **PASS** (see mapping).
- PTW-01 invariant traceability: **PASS** for documented contracts; see matrix.
- Exact viewport/DPR normalization: **DESIGN_GAP / CHANGE_REQUEST_REQUIRED**.
- Exact shell/backdrop/logo authority: **DESIGN_GAP / CHANGE_REQUEST_REQUIRED**.
- Public actual/reference/diff comparison: **NOT_RUN** in this design-only task.
- Overall design readiness: **BLOCKED** until the gaps in [DESIGN_GAP_REPORT.md](DESIGN_GAP_REPORT.md) are resolved by S00#1/S00#3 or an explicit design change request.
