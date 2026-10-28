# Design authority report — HN-OUTBOUND-GSTATE-001

**Review base:** `DEV` at `002e291f9005ec5e22c45d7f93350af12f9b26ec`
**Owner:** S00#6 Design Guardian
**Scope:** S15 outbound list/detail, its global shell and reusable page-state treatment. This report records design authority and implementation mapping; it does not approve source or baseline changes.

## Decision

The six supplied references are registered and custody-preserved in `references/`. REF-01/04 are Desktop compositions; REF-02/03/05 are portrait Tablet compositions; REF-06 is a six-panel state specification sheet. Pixel dimensions are source raster dimensions and do not establish CSS viewport or DPR.

**REF-02 vs REF-03:** these are a same-route Tablet interaction pair, not two competing Tablet breakpoints. REF-02 is the default compact card (`expanded === null`); REF-03 is the same card after the recipient/details disclosure is opened (`expanded === row.id`). The implementation already has this controlled disclosure in `src/features/S15/OperationalOutbounds.tsx`; no source change is authorized. Visual QA must capture both states with identical data and viewport, and label the interaction transition.

## Authority boundaries

1. The supplied reference archive and its immutable extracted bytes are authoritative for composition, hierarchy, copy placement, and state illustration within the named state/profile.
2. `docs/quality/DESIGN_CONTRACT.md` remains the shared shell/token precedence contract. Its tray profiles are reusable measurement guidance only where this task does not supersede them.
3. S15 contracts/controllers/adapters are authoritative for status, field meaning, permissions, stale-session behavior and command semantics. Artwork example IDs and names are illustrative and must not be seeded into production.
4. Existing `GlobalShell`, `GlobalModal`, `PageState`, `DataTable`, `Pagination`, controls, `StatusBadge` and token layers remain canonical shared components. No copied shell/modal/state implementation is approved.
5. REF-06 is a visual specification sheet. It describes alternatives (empty, no-results, load error, loading, forbidden, not-found), not a requirement that all panels coexist in one live screen.

## Reference review

| Ref | Authority | Finding / QA use |
|---|---|---|
| REF-01 | Approved candidate for Desktop populated list | Four-column operational list, current-session heading, refresh/search/status/reset controls, recipient/status/action columns, sync footer. |
| REF-02 | Approved candidate for Tablet compact list | Portrait card default with code, status, recipient name and detail CTA. |
| REF-03 | Approved candidate for Tablet expanded list | Same REF-02 card after disclosure; adds address/contact/request/line/serial information. |
| REF-04 | Approved candidate for Desktop detail | Native modal over preserved shell; status, recipient, selected codes, trace fields, refresh/close footer. |
| REF-05 | Approved candidate for Tablet detail | Portrait modal with stacked recipient/selected-code/trace groups and fixed footer actions. |
| REF-06 | Approved state-kit candidate | Registers six PageState alternatives and icon/tone/action intent. Must be mapped to runtime states one-to-one. |

## Route-mode note

REF-01/02/03 depict the current-session operational list. The current route can expose a scenario/legacy cohort switch when `operational.available` is true (`OutboundSlipsScreen.tsx`); that switch is route functionality and is not visible in the supplied artwork. Visual QA must declare the selected cohort and must not remove or hide the switch solely to match the screenshot. REF-01/02/03 are authority for the selected current-session composition only.

## Gaps and acceptance conditions

- Exact reference CSS viewport/DPR, font rasterizer and capture locale are not supplied; record them in S00#3 evidence before pixel acceptance.
- REF-06 does not supply dark theme, EN or zh-CN artwork. Use semantic contracts and verify long-label wrapping independently.
- Loading skeleton geometry is reference intent only; `PageState kind="loading"` and any table busy indicator remain the runtime behavior to verify.
- Permission and not-found states must remain distinct. A forbidden action must not be presented as an empty or error list.
- Any candidate token or breakpoint not in the shared contract stays `PROVISIONAL`/`DESIGN_GAP`; S00#6 does not infer values from raster pixels.

## Gate status

Reference custody: **PASS** (archive and six extracted images hash-verified).
State/profile registration: **PASS** (Desktop list/detail, Tablet compact/expanded/detail, six global alternatives).
REF-02/03 conflict: **RESOLVED** as interaction pair.
Visual acceptance: **NOT_RUN**; S00#3 owns captures, overlays and diffs.
Functional/accessibility/RBAC acceptance: **NOT_RUN**; S00#4 owns those checks.
