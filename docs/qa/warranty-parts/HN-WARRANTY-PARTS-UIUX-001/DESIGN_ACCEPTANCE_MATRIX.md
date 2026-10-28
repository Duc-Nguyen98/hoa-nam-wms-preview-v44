# Design acceptance matrix — HN-WARRANTY-PARTS-UIUX-001

Owner S00#6 · branch `DEV` · audit base `93371f4da9b6659d320a7c66d9b0862f89744a0d`. This is a design authority matrix, not browser visual or functional PASS. S00#3 owns captures/diffs; S00#4 owns functional, accessibility, console and RBAC evidence; S00#1 integrates the release gate.

| ID | Scope / refs | Acceptance criterion | Evidence / status |
|---|---|---|---|
| DA-01 | BH-01..BH-14 | All 14 originals are registered by path, dimensions, bytes and SHA-256; custody copies match byte-for-byte. | [`REFERENCE_MANIFEST.md`](./REFERENCE_MANIFEST.md) and `references/`; **CONFIRMED custody**. |
| DA-02 | S09 route | `#/preview/S09` resolves to `WarrantyCasesScreen`; the list owns filters, table/cards and view action; detail opens `WarrantyDetailDialog`. | `src/app/registry.ts`, `src/app/App.tsx`, `src/features/S09/WarrantyCasesScreen.tsx`; **CONFIRMED source route/ownership**. |
| DA-03 | S10 route | `#/preview/S10` resolves to `PartsSlipsScreen`; the list owns filters, table/cards and view action; detail opens `PartsSlipDetail`. | `src/app/registry.ts`, `src/app/App.tsx`, `src/features/S10/PartsSlipsScreen.tsx`; **CONFIRMED source route/ownership**. |
| DA-04 | BH-04, BH-07, BH-12, BH-14 | S09 list composition preserves title/breadcrumb, search/status/date controls, status/date hierarchy, record count, view action and responsive table/card topology. | Image authority + mapping; exact CSS/profile comparison **NOT_RUN**. BH-12/BH-14 state distinction **DESIGN_GAP**. |
| DA-05 | BH-01, BH-02, BH-05, BH-08 | S09 detail composition preserves identity/status, case information hierarchy, responsive section order, close/footer reachability and distinct completed vs in-check visual states. | Image authority; current source has no timeline/diagnosis/defect relation data; exact state parity **BLOCKED/DESIGN_GAP**. |
| DA-06 | BH-03, BH-09 | S10 list composition preserves title, search/date/reload controls, slip/case relationship, component/count/date hierarchy, view action and responsive table/card topology. | Image authority + mapping; exact CSS/profile comparison **NOT_RUN**. |
| DA-07 | BH-06, BH-10, BH-11, BH-13 | S10 detail composition is mapped to one approved variant, with line-item count/fields, related case link, metadata hierarchy and footer behavior documented before implementation comparison. | Two visual variants conflict with one source projection; variant decision **DESIGN_GAP/BLOCKED**. |
| DA-08 | All | Shared shell, modal/focus, table, pagination, tokens and 44px target use canonical owners; feature CSS does not duplicate shared ownership. | `DESIGN_CONTRACT.md`, feature source/CSS; structural review **CONFIRMED**, visual regression **NOT_RUN**. |
| DA-09 | All | Capture metadata declares CSS viewport, DPR, browser, zoom, pointer/orientation, locale, theme, route, state and fixture scenario; PNG size alone is not used to infer them. | Metadata absent from originals; **BLOCKED/DESIGN_GAP** until S00#3 records profiles. |
| DA-10 | All | Visible identifiers/dates/statuses are treated as screenshot observations; no fixture/API/permission/business-policy mutation is justified by artwork. | Source contracts and AGENTS; **CONFIRMED constraint**. |
| DA-11 | S09 detail | Timeline, diagnostic text, defect chip and linked-document content either have approved source-backed data or render as explicit unavailable/empty state. | `WarrantyDetailDialog.tsx` currently declares unavailable history/related docs; artwork shows populated values; **DESIGN_GAP**. |
| DA-12 | S10 detail | Actor/reason/created-at and component-line rows either have approved source-backed fields or are removed/marked unavailable; sparse/enriched variants cannot be silently merged. | `PartsRow`/`PartsSlipDetail.tsx` omit these fields; **DESIGN_GAP/BLOCKED** pending variant/source decision. |
| DA-13 | States/themes/locales | Loading, empty, no-result, error, forbidden, expired, light/dark, EN/VI/ZH and long labels remain distinct acceptance states. | Only light Vietnamese ready-state images supplied; coverage **NOT_RUN/DESIGN_REFERENCE_MISSING**. |
| DA-14 | Regression custody | Any baseline change requires requester, scope/state/profile, old/new checksums, diff, S00#3 result and S00#1 integration decision; originals remain immutable. | `DESIGN_CONTRACT.md` change-control rule; **CONFIRMED policy**, no change proposed. |

## Gate

**Design disposition:** `DESIGN_READY_FOR_SCOPED_COMPARISON`.  
**Exact fidelity:** `BLOCKED` by undeclared capture profile, S09 history/diagnostic source gaps, S10 sparse/enriched variant decision, and BH-12/BH-14 ambiguity. No row should be promoted to PASS solely from source inspection or reference custody.
