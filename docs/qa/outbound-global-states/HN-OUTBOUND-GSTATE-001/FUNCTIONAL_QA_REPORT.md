# S00#4 Functional QA Report — HN-OUTBOUND-GSTATE-001 (S15)

Date: 2026-10-28 (Asia/Bangkok)  
Candidate: `DEV` / `002e291f9005ec5e22c45d7f93350af12f9b26ec`  
Actual route: `http://127.0.0.1:5188/#/preview/S15`  
Owner: S00#4 Functional QA

## Scope and evidence boundary

Browser evidence is Chromium/Playwright, `vi-VN`, Asia/Bangkok, light theme unless stated. The route uses the browser-local Axios adapter and reports `X-Preview-Mode: MOCK`; the approved synthetic Demo account is used only to initialize local IndexedDB data. No staging host, production host, customer data, or production write was used.

Existing S15 visual evidence is referenced separately where it is useful: `visual/RUNTIME_EVIDENCE.md` and `visual/global-states-manifest.json`. Synthetic harness results are never treated as actual-route acceptance.

## Route, source and identity

| Check | Status | Evidence |
|---|---|---|
| `#/preview/S15` route dispatch | PASS (MOCK) | `App.tsx` mounts `OutboundSlipsScreen` for S15; actual route rendered the operational list. |
| Current source | PASS (MOCK) | Actual route populated the current-session operational snapshot with one `PV-PX-…` row, `Nơi nhận Demo`, `Đã xuất kho`, `PUBLIC-DEMO-SKU-A`, and `PUBLIC-DEMO-SERIAL-0012`. Detail repeated the same trace IDs. |
| Legacy/reference source | NOT_RUN (MOCK) | `S15.seed.json`/fixture adapter contain 7 detail rows and an 84-document aggregate. The public source-picker row is hidden by `src/shared/preview-ui.css`; the reference list cannot be reached through the normal browser route. |
| Staging | NOT_RUN | No staging URL or credentials were supplied. |
| REAL_API | BLOCKED | `S15.seed.json` has null endpoint, DTO and permission keys; the controller remains fixture/API-contract pending. |

## Actual-route browser checks (MOCK)

| Behaviour | Status | Observation |
|---|---|---|
| List identity/detail consistency | PASS | Current code, recipient, status, SKU and serial remained consistent from list to detail. |
| Search | PASS | `ZZZ-NO-MATCH` rendered the dedicated no-result message and clear-filter action. |
| Status filter | PASS | `POSTED` kept the row; `DRAFT` rendered no-result. |
| Reset | PASS | `Đặt lại` cleared query/filter state. |
| Refresh/loading | PASS | `Đọc lại dữ liệu` showed the refresh status and returned to the same snapshot. |
| Reload | PASS | Browser reload restored S15 and the same local snapshot. |
| Detail | PASS | Read-only detail included status, recipient snapshot, requested quantity, selected serial, posting count and trace IDs. No form control was present. |
| Copy | PASS | Copying the outbound code produced `Đã sao chép.`; only clipboard state changed. |
| ESC close / focus return | PASS (MOCK) | `tests/s15/route-browser.mjs` reached S15 before its unrelated S27 selector timeout; the S15 branch closes with ESC and asserts the opener is focused. |
| Locale | PASS | Header language selection changed `html[lang]` to `en` and translated the surface. |
| Theme | PASS | Header theme selection changed document theme to dark; computed color scheme became dark. |
| Console/page errors | PASS | Actual route probe recorded 0 console errors/warnings, 0 page errors and 0 failed requests in the existing runtime evidence. |
| Responsive/overflow | NOT_RUN (functional) | Visual evidence records a tablet expanded-card vertical overflow; S00#4 did not add a second geometry run. |

## State semantics: actual route vs synthetic harness

| State | Actual `#/preview/S15` | Synthetic harness | Evidence / interpretation |
|---|---|---|---|
| Populated | PASS (MOCK) | — | Current-session row and detail above. |
| Loading | PASS (MOCK) | PASS | Actual refresh status; harness `?state=loading` shows `Đang đọc dữ liệu…`. |
| Empty | NOT_RUN / BLOCKED | PASS (synthetic) | Harness `?state=empty&count=1` renders `Chưa có phiếu`; actual route has no deterministic zero-row switch. |
| No-result | PASS (MOCK) | PASS | Actual search/status filters; harness records the same clear-filter semantics. |
| Read error | NOT_RUN / BLOCKED | PASS (synthetic) | Harness `?state=error` renders retry; actual route cannot safely inject invalid/network failure. |
| Forbidden | NOT_RUN / BLOCKED | PASS (synthetic) | Harness `?state=forbidden` renders `Không có quyền` and overview CTA; actual 403 was not injected. |
| Operational record-not-found | NOT_RUN / BLOCKED | PASS (synthetic) | Harness `?state=ready` records `record-not-found`; actual row-removal race was not induced. |
| Global route-not-found | PASS (MOCK) | — | `#/preview/NOPE` rendered `Không tìm thấy trang`. |
| Stale/reconcile | NOT_RUN | NOT_RUN | No command or durable-recovery mutation was triggered. |

Harness provenance: `visual/global-states-manifest.json` records all six synthetic states at 1672×941 with expected copy and no overflow. It is state reachability evidence only and does not certify the actual route.

## Mutation safety and overall classification

The QA run performed reads, local search/filter/reset, refresh, detail, copy, locale and theme only. No receive/post/create/update/delete command was executed. The Demo setup writes only synthetic browser-local IndexedDB state.

- **MOCK:** PASS for current-session route, identity, search/filter/reset, refresh/reload, detail, copy, ESC close, locale/theme, no-result, console and global route-not-found.
- **MOCK:** Synthetic harness PASS for empty, loading, no-result, read error, forbidden and record-not-found; actual-route acceptance for those injected states is NOT_RUN/BLOCKED where noted.
- **STAGING:** NOT_RUN.
- **REAL_API:** BLOCKED by missing endpoint/DTO/permission mapping and absent production evidence.

The current-session MOCK path is coherent for the one-row Demo scenario. It is not production or RBAC acceptance; complete source coverage, backend contract, denial paths and actual-route fault injection remain open.


## Post-fix rerun (S00#2 scoped S15 CSS, 2026-10-28)

The current working tree includes the scoped `src/features/S15/outbound-slips.css` repair for the 992px portrait card/detail geometry. I reran the browser smoke without changing source or data:

| Post-fix check | Result | Evidence |
|---|---|---|
| Desktop list | PASS | 1440×900; one current-session row; document width/height exactly 1440×900 (no overflow). |
| Search/no-result | PASS | `ZZZ-NO-MATCH` rendered no-result; reset restored the row. |
| Status filter | PASS | `POSTED` retained one row; `DRAFT` rendered no-result; reset restored the row. |
| Detail | PASS | Operational detail opened and remained read-only. |
| Copy + ESC | PASS | Copy placed `PUBLIC-DEMO-SERIAL-0012` on the clipboard; the toast is intentionally queued while the modal is foreground and appeared as `Đã sao chép.` after ESC; ESC closed the dialog and returned focus to the opener. |
| Locale | PASS | `html[lang] = en`; S15 text translated to English. |
| Theme | PASS | `html[data-hn-theme] = dark`; computed color scheme `dark`. |
| Console/page errors | PASS | 0 page errors and 0 console errors in desktop and tablet contexts. |
| Tablet compact/expanded | PASS | 992×1586 before and after recipient disclosure; `scrollWidth = 992`, `scrollHeight = 1586`, no horizontal or vertical overflow. Disclosure remained visible. |

The prior visual evidence recorded 992×1690 after expanded disclosure; the post-fix rerun now stays within the 992×1586 frame. The actual route remains MOCK-only and the staged/REAL_API/RBAC classifications are unchanged.
