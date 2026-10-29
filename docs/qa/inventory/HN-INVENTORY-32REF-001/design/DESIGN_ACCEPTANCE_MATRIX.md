# Design acceptance matrix — HN-INVENTORY-32REF-001

Owner S00#6 · base DEV `57b9f399a55d41d43ecad7a31e1b279da2cda717`. PASS below is limited to validated custody. Product/visual/API results require independent runtime evidence; this document is a reviewable criterion set, not a test run.

| ID / refs | Measurable acceptance criterion | Required owner/evidence | Current result |
|---|---|---|---|
| DA01 / all32 | Every file matches supplied SHA256, dimensions, bytes;16D+16T; preserve original bytes | S00#6 REFERENCE_VALIDATION.json + manifest | **PASS custody only**,32/32 validated |
| DA02 / all32 | Every image viewed;16 compositions mapped without treating01–16 as routes | S00#6 8 contact sheets + observations + route mapping | **CONFIRMED inspection/mapping**; application parity NOT_RUN |
| DA03 / all32 | Preserve locked shell/logo/Toast and module navy/teal/light-white hierarchy; normalize AI icon/header/tab/badge variation via shared owners | S00#1 scoped lease; S00#3 shared-consumer regression | NOT_RUN; no source change by design audit |
| DA04 /01 | Warehouse/location/SKU-name-BOX query, clear/apply/sort-if-supported/paging and named view work; labels/units/counts visible on Tablet | Query tests and D/T actual/geometry | NOT_RUN; field/API gap BLOCKED for real integration |
| DA05 /02–03 | DRV120actual−20reserved=100available across9locations; BOX001–00320/5/15, BOX00410/5/5, BOX005–00910/0/10; total correct | Single approved Candidate projection and invariant tests; scoped data provenance | NOT_RUN; existing legacy source lacks reservation/allocation model |
| DA06 /04–05 | BOX001 retains SKU/warehouse/KH001/A01-01/as-of and20/5/15; KH001 one BOX/one SKU; links/copy/back preserve list state | Relation+code copy tests, no fabricated9rows on tray | NOT_RUN; detail API mapping incomplete |
| DA07 /06 | Time-ordered movements show time/doc/BOX/type/signed quantity/stock-after/actor; only existing permitted source links | Pinned event fixture+read model, sign/time/link tests | NOT_RUN; operational events exist, full approved projection missing |
| DA08 /07–08 | Comparison=count−systemAtSnapshot;120/118/−2; BOX00120/18/−2, others matched;9SKU3matched/3short/3over | S00#2 snapshot/formula/BOX-sum tests + D/T actual | NOT_RUN; actual data null in current operational S16; REAL_API BLOCKED |
| DA09 /07–10 | HN01/HN02/HN03 are all-scope rows with per-row warehouse; no mixed units; total object counts not quantities | Scope/filter/count tests before pagination; fixture provenance | NOT_RUN; no server-authoritative scope proof |
| DA10 /09–10 | Saved run ID/snapshot/time/scope remains immutable on refresh/drilldown; historical counts never join live stock; history tab active | Saved-fixture/run contract and deep-link/back tests | NOT_RUN; saved-history API/DTO BLOCKED |
| DA11 /11 | Loading skeleton, busy controls, no false0result; safe refresh retains context | Delayed adapter runtime state/screenshots | NOT_RUN |
| DA12 /12–13 | Valid HN04empty distinct from ZX999no-results; preserve scope/query; clear filters/reload work; no ungranted inbound action | Deterministic valid-zero/query-zero fixtures+UI tests | NOT_RUN |
| DA13 /14 | Read error offers retry, no fake fresh date/0results; retained old data marked stale | Failure/retry/out-of-order tests + actual state | NOT_RUN |
| DA14 /15 | Forbidden history only for actual denial; no snapshot/count/filter-option leak; authorized/denied/expired distinct | S00#4 direct route/API/ID/warehouse tests; S00#2 capability contract | NOT_RUN mock; REAL_API BLOCKED; missing implementation must not look forbidden |
| DA15 /16 | Missing BOX uses record-not-found, retains detail context and safe return; stale ID does not select another record | Changed/missing ID and back/deep-link tests | NOT_RUN |
| DA16 /all | Matchedgreen/shortamber/overblue plus text/icon;−negative/+positive; right-aligned tabular quantities; no mix of units | D/T light/dark screenshots and computed color/meaning inspection | NOT_RUN |
| DA17 /all | Existing tokens first; otherwise gutter32D/24T, card24, gap16–24, label8, Tablet>=44×44; breadcrumb/title/tab/filter/content aligned | S00#3 computed styles/bboxes with final value/rationale for deviations | NOT_RUN |
| DA18 /all | No page-level horizontal overflow, clipped labels/footer or covered CTA; codes readable/copied intact, paging separate from last record; no font shrinking | 1920×1080DPR1,800×1280DPR2, supported768×1024, long/large/zoom measures | NOT_RUN |
| DA19 /all | Keyboard named view actions, visible focus, contrast, dialog trap/Escape/return/background lock if applicable; back preserves query/page/scroll | S00#4 accessibility/runtime checks, S00#3 placement | NOT_RUN |
| DA20 /all | VI/EN/zh-CN Light/Dark uses shared i18n and correct date/number separators; no missing keys/VI literals | Locale/theme matrix + long-label tests | NOT_RUN |
| DA21 /06/09 | Current history filters enforce applicable shared date policy (no future, rolling90, start<=end, Vietnam boundaries); saved snapshot dates unchanged | date-policy tests with named field policy/exception | NOT_RUN; shared policy exists; new caller mapping required |
| DA22 /all | Inspect/refresh/history/reconciliation/putaway mapping never writes stock; no new create/edit/delete/approve/adjust/print/export without existing contract | API/write/event counters and unit/integration tests | NOT_RUN; explicit user invariant |
| DA23 /all |32 distinct Candidate runtime captures matched to32 originals plus four foundation before/after, declared fixture/locale/theme/CSS viewport/DPR and measured transforms | S00#3 capture manifest+overlays/diffs+geometry; no bitmap screenshot substitution | NOT_RUN |
| DA24 /all | Build/typecheck/contract passes supplement visual/functional/RBAC/API/regression; gates fail closed; Preview only exact tested candidate/build after readiness | S00#1 gate + S00#5 provenance/rollback | NOT_RUN by S00#6; no deployment authorized in this lease |

## Normalization and gate decisions

**Approved normalization:** final prompt explicitly permits normalization of small generated inconsistencies. Use shared typography/icons/labels/states and official assets; keep structure and hierarchy. Existing current contract fields or formulas are not replaced by artwork inference. Candidate final32 fixture is allowed independently and must be clearly identified in QA reports; no Mock/Demo product banner.

**Existing four-row conflict:** preserve the legacy accepted dataset and its onHand−ledger formula. Final32's count−systemAtSnapshot requires a separately named projection/fixture until the backend supports it. No null-to-zero conversion or invented history.

**Status:** custody PASS; scoped composition ready; exact fidelity/functional acceptance NOT_RUN; real saved history/reservation/count/scope integration BLOCKED. All results must name route/tab/state, cohort/source, candidate SHA, capture profile, fixture/snapshot and owner. Do not infer PASS from default screenshot, build or reference registration.
