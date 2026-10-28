# Functional navigation QA — HN-SIDEBAR-NAV-FIDELITY-001

**Owner:** S00#4 Functional QA  
**Branch:** `DEV`  
**Checkout:** `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
**Audited commit:** `ce691861c02ca14f61dcc930751981cb6a18ff24`  
**Run:** 2026-10-29 (Asia/Bangkok)  
**Runtime:** Chromium/Playwright against a fresh local Vite server at `http://127.0.0.1:5333`; demo login and S10 route were used only to render the local `MOCK` preview.

No source files were edited. Raw results are in [`output/functional-nav-qa-20261029/results.json`](../../../../output/functional-nav-qa-20261029/results.json). The smoke covered the S10 shell context at 1440×900 and 800×1280.

## Smoke results

| Check | Status | Evidence / notes |
|---|---|---|
| Desktop sidebar renders | **PASS (MOCK browser)** | `.hn-sidebar` visible at 1440×900; shell reports `data-layout="desktop"`. |
| Desktop pin/collapse toggle | **PASS (MOCK browser)** | Toggle changed `data-collapsed` from `false` to `true`; menu button retained focus. |
| Desktop navigation search | **PASS (MOCK browser)** | Searching `phiếu xuất linh kiện` retained the S10 destination in the local navigation tree. |
| S10 active route | **PASS (MOCK browser)** | `a[href="#/preview/S10"]` exposed `aria-current="page"`. The implementation also marks an active ancestor through `data-active-parent`; the browser selector check for that ancestor was inconclusive after search filtering and remains **NOT_RUN**, not a product failure. |
| Desktop viewport bounds | **PASS (MOCK browser)** | Document scroll width equaled viewport width (1440/1440). |
| Tablet drawer mode | **PASS (MOCK browser)** | At 800×1280 shell reported `data-layout="drawer"`; desktop aside was absent. |
| Drawer open / initial focus | **PASS (MOCK browser)** | Menu opened `#hn-navigation-drawer[open]` and focused the close button. |
| Drawer search + S10 active route | **PASS (MOCK browser)** | Drawer search retained S10 and its `aria-current="page"`. |
| Drawer Escape close + focus restore | **PASS (MOCK browser)** | Escape closed the dialog and restored focus to the menu opener. |
| Drawer close button | **PASS (MOCK browser)** | Close button closed the drawer. |
| Tablet viewport bounds | **PASS (MOCK browser)** | Document scroll width equaled viewport width (800/800). |
| S10 context retained | **PASS (MOCK browser)** | Route remained `#/preview/S10` throughout the smoke. |
| Console/page errors | **PASS (MOCK browser)** | Zero page errors and zero console errors in the stable run. |

## Shared navigation behavior observed in source

`GlobalShell` derives `desktop`, `rail`, and `drawer` from media queries; the drawer uses a native modal dialog with body scroll lock, Escape handling, focus trapping and opener restoration. Navigation search is local menu filtering through `matchShellDestinations`; it does not query business data. S10 is registered under the `warranty-management` group with `href="#/preview/S10"`. Active leaf links use `aria-current="page"`, and group buttons use `data-active-parent="true"` when `activeKey` is contained by the group.

## Backend and authorization boundary

**REAL_API / RBAC: BLOCKED / NOT_RUN.** This smoke exercised only the browser-local preview. It did not call a production endpoint, validate account permissions, test tenant or warehouse scope, or switch roles. No backend navigation policy, permission DTO, or REAL_API test account was supplied. The result certifies shell interaction behavior in `MOCK` preview only.
