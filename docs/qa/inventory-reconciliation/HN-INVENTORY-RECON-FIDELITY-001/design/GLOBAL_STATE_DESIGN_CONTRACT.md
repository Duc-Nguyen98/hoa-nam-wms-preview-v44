# Global-state authority reconciliation and migration contract

Task HN-INVENTORY-RECON-FIDELITY-001; S00#6; source-only baseline9865a827. Existing authority: `docs/qa/outbound-global-states/HN-OUTBOUND-GSTATE-001/design/GLOBAL_STATE_DESIGN_CONTRACT.md`, `STATE_ILLUSTRATION_ASSET_MAP.md`, immutable REF-06; warranty-parts fidelity state contract; current `src/shared/PageState.tsx`, `InitialReadState.tsx`, `ReadState.tsx`, `read-failure-kind.ts`, `DataTable.tsx`, `report-status.tsx`, `features/putaway/TrayUi.tsx`.

## Registered conflicts and decisions

| Conflict | Evidence | Concrete applicable decision | Global rollout status |
|---|---|---|---|
| GS-C01 artwork family | Outbound REF-06 document/search/alert triangle/lock/file-search; inventory12Desktop open-box vs12Tablet warehouse,14Desktop cloud/offline vs14Tablet cloud warning,15shield-lock,16Desktop document/search vs Tablet file-search | Inventory copy/meaning/section geometry apply specifically to S16. Use one canonical registry icon per kind on both devices; retain `documents`, `search`, `alert-triangle`, `lock`, `file-search` while normalized vector ownership is preserved. Do not mix cloud/open-box/shield raster styles by viewport. | New illustration family CHANGE_REQUEST_REQUIRED; no global replacement authorized |
| GS-C02 CTA tone/size | Outbound blue actions; inventory teal actions; shared PageState CSS sets blue primary and48px actions, S16 plain buttons scoped teal | Inventory may retain module primary teal through a scoped variant/caller action; preserve44px minimum and source-backed behavior. Shared blue default remains for unrelated consumers. | Shared selector changes require S00#1 lease plus consumer regression |
| GS-C03 loading layout | Outbound sheet6×4 skeleton; inventory11eight inventory columns/nine rows, retained filter/header context | Use inventory column skeleton for S16 initial load; preserve generic PageState loading for other routes. During refresh with accepted data retain safe context and busy feedback. | No global eight-column replacement |
| GS-C04 panel geometry | Inventory six states are standalone module compositions; Outbound six panels are alternatives on one specification sheet | Apply one semantic state per actual route, not a six-panel runtime screen. Inventory content must fit/reflow within locked shell; no global viewport/min-height hardcoding. | Broad visual migration NOT_RUN |
| GS-C05 role/read semantics | Generic missing/blocked source may be mistaken for denial; caller wrappers vary | Authentication, permission, empty, no-match, unavailable, stale and missing-record triggers remain distinct. New images do not authorize changing backend errors or permission decisions. | Per-consumer trigger audit before migration |

`GS-C01` is a documented module-specific normalization decision under current user authority; the missing Downloads location does not make the retained reference unavailable. Prior Outbound global migration report and final Go/No-Go say PARTIAL, synthetic six-state coverage, broad actual-route injection NOT_RUN. Neither the shared CSS comment “Approved x4” nor previous component existence proves every consumer visually accepted.

## Inventory state contract

| Reference pair | Semantic owner | Content/action contract | Fixture versus production boundary |
|---|---|---|---|
|11D/T|loading|Inventory skeleton, busy semantics, no false zero, no fake successful timestamp; keep authorized safe filter context|Delayed adapter fixture only; real request behavior needs test |
|12D/T|empty|Valid authorized HN04scope zero records, choose another warehouse/reload; do not suggest unauthorized inbound operation|HN04sample is not production emptiness |
|13D/T|no-results|Valid source narrowed by ZX-999query; retain query, clear/change filters|A read failure is not a zero-match result |
|14D/T|error|Read failure and safe retry; do not display zero or fresh success time; disclose retained data staleness if applicable|Do not classify network/server error as forbidden |
|15D/T|forbidden|History-specific denial, safe return, no rows/counts/options/runIDs leaked|Synthetic fixture is not real backend RBAC proof |
|16D/T|record-not-found|Missing or no-longer-visible BOX and return context; no fabricated record|Scope-vs-existence disclosure follows backend policy; invalid IDs fail closed |
|No new image|unauthorized/offline/stale/route-not-found|Preserve shared auth/session/reconcile/offline/unknown-route distinctions and current recovery mechanics|No new visual family or business behavior inferred |

Shared `PageState` owns presentation only, not permission or data decisions. `InitialReadState` distinguishes initial loading/error/blocked(stale); `ReadState` retains compact refresh status/error with data. `ReportEmptyState` maps no-records→empty, no-matches→no-results, blocked→stale. `DataTable` defaults empty and permits no-results/custom empty content; callers must supply correct filtered/unfiltered intent. Modal state migrations must preserve focus trap, Escape, scroll lock, focus return and safe disclosure.

## Concrete safe migration recommendations and leases

1. **Continue S16-only repair immediately:** lease `src/features/S16/approved/**` to S00#2 after baseline freeze. Keep PageState/Icon canonical; repair contextual state copy, inventory skeleton and compact layout locally. Do not globalize inventory illustration/tokens.
2. **Fix caller semantics before appearance:** `features/putaway/TrayUi.tsx` currently maps `SESSION_EXPIRED` to `kind=error`, while `read-failure-kind.ts` correctly maps it to unauthorized. This is an actionable static mismatch. S00#1 must obtain the PTW-01/shared lease and preserve durable recovery/commands before a semantic-only correction; test actual auth failure and no data disclosure. Do not let S16 feature owner edit it.
3. **Audit legacy no-results defaults:** S02–S17 catalog screens frequently pass `emptyStateKind="no-results"` to DataTable. Verify each accepted snapshot and active-query predicate before replacing a label; a blanket replacement risks turning genuine filtered emptiness into empty or vice versa. Approved current route behavior remains until caller-specific evidence exists.
4. **Preserve protected consumers:** auth S07/S08, account/session gates, notification Center, shared shell/Toast and PTW-01 are LOCKED/PRESERVE outside their own packets. A report wrapper or a copied PageState import is not permission to redesign them. Notification state visuals have separate HN_Astra authority; do not apply inventory cloud/shield artwork there.
5. **Migrate only ordinary unprotected read callers with a declared packet:** wrappers `InitialReadState`, `ReadState`, `ReportEmptyState` can be reused without changing read logic. Owner must supply deterministic loading/empty/query/error/forbidden/not-found fixtures and before/after per route/cohort, plus session expiry/stale tests when supported. Record dynamic unsupported states BLOCKED, never fabricate a permission result.
6. **Defer broad visual migration:** a global new illustration family, exact new shared geometry or widespread CTA recolor needs a Design Change record with scoped authority, consumer list, regression plan and S00#1 serialized integration. Static audit is complete in [SCREEN_STATE_MATRIX.md](SCREEN_STATE_MATRIX.md) and [STATIC_STATE_CONSUMERS.json](STATIC_STATE_CONSUMERS.json); browser-tested global migration for this task is NOT_RUN.

These recommendations resolve the illustration conflict without blocking the authorized independent inventory work. They do not approve API integration, global visual PASS, protected command/state changes or deployment.
