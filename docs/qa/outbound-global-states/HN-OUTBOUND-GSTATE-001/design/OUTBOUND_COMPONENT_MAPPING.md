# Outbound component mapping — HN-OUTBOUND-GSTATE-001

## Route and screen ownership

| Concern | Canonical source | Responsibility / state evidence |
|---|---|---|
| Route dispatch | `src/app/App.tsx` (`selected?.key === 'S15'`) | Mounts `OutboundSlipsScreen`; route is `#/preview/S15`. |
| Screen shell | `src/features/S15/OutboundSlipsScreen.tsx` | `GlobalShell` variant `wms`, active key S15, page header and cohort switch. |
| Operational list | `src/features/S15/OperationalOutbounds.tsx` | Session snapshot, filters, cards/table, PageState branches, detail and confirmation modals. |
| Legacy/reference list | `src/features/S15/OutboundSlipsScreen.tsx` | Fixture-backed summary/table/pagination and legacy detail dialog. Keep separate from session state. |
| Session orchestration | `src/features/S15/outbound-binding.ts` | Durable recovery, epoch/fence/version checks, command acceptance and error stages. |
| Error/recovery copy | `src/features/S15/outbound-feedback.ts` | Maps durable/error codes to user-facing states; preserves stale/unknown distinctions. |
| Detail selection | `src/features/S15/outbound-detail-selection.ts`, `OutboundSlipDetailDialog.tsx` | Legacy selected row and focus restoration; operational detail is inline `GlobalModal`. |
| Feature styling | `src/features/S15/outbound-slips.css` | S15 layout/card/modal presentation. Do not duplicate shared state or shell CSS. |

## Route-mode note

`OutboundSlipsScreen` chooses `scenario` when the operational adapter is available and retains a `legacy` reference cohort otherwise; a visible cohort switch may be present in preview. The supplied list references represent the current-session scenario. Capture and acceptance must record the selected cohort; artwork does not authorize removing route controls.

## Shared components and contracts

| Shared component | Use in S15 | Required contract |
|---|---|---|
| `GlobalShell` / `ShellHeader` | Outer navigation/header/sidebar | Preserve shell ownership, responsive drawer/rail, focus and scroll lock. |
| `GlobalModal` | Operational detail + confirmation; legacy detail dialog uses shared modal path | Native dialog semantics, return focus, backdrop and body lock. |
| `PageState` + `page-state.css` | loading, empty, no-results, error, unauthorized, forbidden, stale, record-not-found | `kind` must encode semantic state; action/copy remain state-specific. |
| `DataTable` | Desktop operational/legacy lists | Table captions, busy state, sticky behavior and keyboard access remain shared. |
| `Pagination` | Populated lists over page threshold | Preserve page reset and page-size semantics. |
| `Button`, `FilterSelect`, controls | Refresh, search/filter/reset, CTA, confirmation | Minimum target and disabled/busy behavior follow shared contract. |
| `StatusBadge` | Outbound status | Status color is a presentation of contract status, never the command authority. |
| `Icon` | Search, refresh, copy, recipient and state intent | Canonical SVG names with accessible labels; no raster icon extraction. |
| `src/shared/tokens.css` | Foundation palette/spacing/type/radius | Consume semantic variables; exact unapproved overrides remain provisional. |

## State-to-component mapping

- `loading`: `PageState kind="loading"` when no snapshot; `DataTable busy`/refresh notice only when a snapshot is retained.
- `empty`/`no-results`: `PageState` in the operational list branch; action resets query or reads current session.
- `error`/`forbidden`/`unauthorized`/`stale`: `PageState` plus `outboundErrorMessage` and read/reconcile controls. Never render stale rows as current after a session fence failure.
- `record-not-found`: detail `GlobalModal` renders `PageState kind="record-not-found"` and returns to list.
- `detail`: `GlobalModal className="s15-operational-detail"` renders status, recipient, selected lines and trace sections.
- `confirm`: second `GlobalModal` renders command-specific text and disabled controls while busy/recovery.
- Tablet compact/expanded: `.s15-operational-cards` and `expanded` local state in `OperationalOutbounds`; REF-02 is initial false/null, REF-03 is the same card after toggle.

## Ownership guard

S00#6 owns this mapping and design authority only. S00#2 may change leased feature implementation after a recorded design decision; S00#3 owns visual capture/diff; S00#4 owns functional, accessibility and RBAC evidence; S00#1 integrates gate status. Shared components and approved reference bytes must not be modified to make a comparison pass.
