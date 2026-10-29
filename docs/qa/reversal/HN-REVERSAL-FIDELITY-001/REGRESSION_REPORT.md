# Regression report

Source `e7b145feb3d8ec4b42bb2ba8fa66bfb5b3d9bf2f`, build `1bebecb3e20357207c7f6eb09c9ed987661c32c553451aeed3fe38a9f8b8b955`; static preview5341 and isolated Vite component harness5340. **Independent local MOCK: PASS, 28 model contracts and one clean full 23-case browser run (22 core plus B23), zero console/page errors.**

[Final acceptance](functional/e7b145f-final/FINAL_ACCEPTANCE.json), [model raw](functional/e7b145f-final/model/results.json), [browser raw](functional/e7b145f-final/browser/results.json), [run report](functional/RUN_REPORT.md).

| Acceptance area | Fresh proof and boundary |
|---|---|
| Unknown operation recovery | B01–B03 original key/input survives list, refresh and tab close/reopen; status confirms one receipt without a new model revision. Model R04–R07 measures immutable intent, zero-write repeated status and no extra dispatch hook. |
| Draft/context/concurrency | B04–B07 preserve saved notes, source selection, shared-tab single commit and stale-scratch winner after reload; R03/R05/R08/R11 reject stale/missing bases and compare-and-swap races. |
| Quantity identity/validation | B08/B18 blank restores/corrects, per-SKU error association and unknown projection; model rejects invalid/excess quantities and duplicate/missing/forged SKU/source/unit identities. |
| Document/count/unit semantics | B09/B12/B19/B22 explicit document labels, all-record versus filtered counts, grouped Cái/Mét and9/3 pagination. Actual SKU stock and live unit DTO are not asserted. |
| Return/history/direction | B10 pending requested6/received0/available0, cancelled impact0, known-only history, inbound−/outbound+ and source relation/focus. |
| Read failures/resource states | B11 dedicated IDB-open failure blocks rather than seeds; B16 actual component loading/401/403/offline/error/empty/retry injection and real record-not-found rendering. No server401/403 certification. |
| Query/create/post | B13/B19/B20 accepted filters/history, search/date validation/no-results and source-bound draft/current Vietnam date/exact notes/receipt persistence. |
| Controls/accessibility/geometry | B14/B21 native radio keyboard,44px actual controls, table/header bindings and twelve VI/light400, EN/dark800, Chinese/light1440 list/choose/edit/detail profiles. ARIA snapshots retain labels and hide decorative icons. B21 final impact page has exactly one summary, three labelled chain totals, nine table rows and seven readonly field values. |
| Date/impact regression | B23 directly measures date span text fit at600/759/760/800 in three locales,44px controls and no page overflow; exactly three known timeline events, no invented review event, source-dialog focus return. |
| Shared/session regression | B17 normal S16/S17/S21/S12/S14 readonly shell smoke; B15 fresh normal MOCK9-hour expiry removes protected module without auth-storage patch. |

The final e7b145f change removes duplicate impact totals. B21 now explicitly requires one summary, all three labelled chain values (+90/−45/+45 Cái), nine impact table rows, all seven readonly values and accessible source controls; it passed on this final source. B23 retains the known three history events and source relation with no invented review event. Visual fidelity verdict belongs to independent visual QA.

R10 malformed persisted reads and R11 stale scratch are closed by retained independent negative assertions and normal-app B07. Browser tests leave canonical business state unchanged. Historical full29-route or unrelated suites are not relabelled as current results. No confirmed product failure remains in the executed local scope.

Before/after application hashes match in both runs; all six model source hashes match browser custody. Every one of the23 browser cases has equal before/after canonical business hashes, compared within each case. Canonical/account contents, cookies, credentials and tokens are not persisted. The28 model contracts use explicit dedicated memory persistence; browser cases use opt-in scoped fixture IndexedDB. Both frozen baseline receipt hashes were rechecked unchanged.

Earlier baseline nine failures, R10 malformed-read failures, R11 stale-scratch proof, source-specific294c9d0 cumulative receipts and the interrupted e7b145f browser progress/failure screenshot remain preserved. The fresh e7b145f-final run uses the same existing assertions in a distinct directory. Interrupted e7b145f B11 recorded a missing-root failure; the fresh full run passes B11 without source/assertion changes. No failed attempt is relabelled or overwritten. Prior294c9d0 report copies are retained in functional/294c9d0-reports/.

All results are isolated MOCK. Generic partial inbound/outbound REAL_API, trusted backend receipt/audit proof, backend atomicity/idempotency, source eligibility/permission API and second authorized actor/role/warehouse tests are BLOCKED. Actual/available SKU stock, generic unit precision/rounding and missing view08 review-audit event remain MISSING. Cross-actor in-flight session replacement and reauthentication recovery policy, Edge-specific execution, full screen-reader testing and a complete viewport/zoom/locale Cartesian product are NOT_RUN/BLOCKED. Scope labels do not grant permissions. Existing whole-unused warranty-parts return remains a separate authority; no production command or canonical mutation was performed.
