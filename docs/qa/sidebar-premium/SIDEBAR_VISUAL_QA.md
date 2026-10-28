# Sidebar visual QA

## Browser run

- Browser: Playwright Chromium headless.
- Source under test: working tree after sidebar changes; temporary `sidebarQa=1` gate bypass was used only for local capture and removed before build/commit.
- Authentication: demo account entered at runtime only; credentials are not stored in evidence.
- Mode: browser Preview mock; this is not REAL_API or production RBAC evidence.

## Desktop

- Viewport: 1672×941 CSS px.
- Route: `#/preview/S10` (active leaf `Phiếu xuất linh kiện`).
- Sidebar width: 320px.
- Background: `rgb(10, 55, 101)`, `background-image: none`.
- Active weight: 600; active dot width: 6px.
- Horizontal overflow: false.
- Function search: `phieu nhap kho` returned visible `Phiếu nhập kho` leaf.
- Hover on `Phiếu nhập kho`: background `rgba(0, 0, 0, 0)`, text `rgb(250, 252, 254)`.
- Result: PASS for the measured desktop sidebar contract.

## Tablet drawer

- Viewport: 992×1586 CSS px.
- Drawer width: 350px.
- Drawer opened through the real menu toggle.
- Function search present.
- Body overflow while open: `hidden`.
- Escape closed the drawer: PASS.
- Backdrop and drawer surface are flat blue; no background image.
- Result: PASS for the measured tablet drawer contract.

## Artifacts

- [sidebar-desktop-after.png](sidebar-desktop-after.png)
- [sidebar-tablet-after.png](sidebar-tablet-after.png)

Full S01–S29 browser traversal, all locales/themes, and zoom matrix are `NOT_RUN`; the static route audit is separate and does not substitute for that coverage. Video capture is `NOT_RUN`.
