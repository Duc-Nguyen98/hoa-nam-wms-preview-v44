# Fresh baseline functional audit

Task: HN-INVENTORY-RECON-FIDELITY-001. Date:2026-10-29. Repository base `9865a827c9769c190b1173a32644b226b3e11cdc`, branch `candidate/inventory-recon-fidelity-20261029`. Application source `3f8cf44ac531d72d50a42003cafecf6d726085ca`, static build `ec7027a6f60c22cd53ab541636359823832a48424ecb8e688a39a6e7a52b0dab`. All results here were executed for this continuation; the previous task's receipts are lineage only.

## Fresh32-screen BEFORE freeze

Executed the existing `tests/inventory-visual/capture.mjs` through the normal application login, confirmation and public setup, with runtime-only QA credentials. Captured16 Desktop1920×1080 DPR1 and16 Tablet800×1280 DPR2 on static `127.0.0.1:5341`. All32 have zero recorded horizontal document overflow, page/console errors and failed requests. Screenshots are actual application PNGs, with additional full-height captures where needed; DOM is stored as text, avoiding Vite HTML-watch artifacts.

[Freeze receipt](BEFORE_FREEZE.json), [capture geometry/source custody](before/capture.json), [served build identity](before-build-info.json). Source freeze was released to the parent after all32 captures and browser closure. Browser activity remained serialized. The root release/design owner owns image-reference judgment; this count is capture coverage, not a claim of visual fidelity.

## Fresh normal-app assertions

[Raw results](baseline-edges/results.json): **3 PASS /11 FAIL**,14 assertions, zero page/console errors. Five failures share one warehouse-scope root cause. Tests are in `tests/inventory-recon-fidelity/edge-browser.mjs`; these are actual fixture UI checks, not server authorization tests.

| ID | Priority / classification | Reproduction and observed result | Required behavior / evidence |
|---|---|---|---|
| RECON-F01 | P2 confirmed dependency defect | Select warehouseHN02. Visible rows include locationsB02-01/B01-02/B02-02, but location options remain onlyA01-01…A01-09. SelectA01-09 then change warehouseHN02: A01-09 stays selected and produces no-results. | Offer locations belonging to the selected warehouse, including known SKU locations where allocation coverage is unavailable; clear an incompatible location. [Failure1](baseline-edges/failure-1.png), [failure2](baseline-edges/failure-2.png). |
| RECON-F02 | P1 confirmed frontend scope defect | Direct links `view=sku/allocation/box/tray/movement&warehouse=HN02&sku=HN-DRV-001&box=BOX-001` all show HN01 objects and quantities. The difference view already fences this mismatch, but these five views do not. | Reject or explicitly prevent selection outside the accepted warehouse scope. This is a fixture projection defect; no production RBAC bypass is asserted. [SKU](baseline-edges/failure-4.png), [allocation](baseline-edges/failure-5.png), [BOX](baseline-edges/failure-6.png), [tray](baseline-edges/failure-7.png), [movement](baseline-edges/failure-8.png). |
| RECON-F03 | P2 confirmed historical date inconsistency | Open saved `DS-20261027-01`. Detail says14:25 27/10/2026; page heading says14:25 28/10/2026. | Saved header and detail must identify the same immutable result time. [Failure9](baseline-edges/failure-9.png). |
| RECON-F04 | P1 confirmed scope/context expansion | Stock locationA01-09 shows DRV10 actual/0held/10available. Open SKU: URL drops location, summary silently becomes120/20/100 and allocation contains allnine locations. | Preserve location scope into the detail projection or explicitly distinguish a whole-SKU projection and provide the retained scoped context. Current UI gives no such distinction. [Failure10](baseline-edges/failure-10.png). |
| RECON-F05 | P2 confirmed refresh context loss | SearchHN-PSU-002→one row→detail→refresh→Back. Query becomes blank and list hasnine rows. | Restore the accepted list search/filter/page/scroll context across refresh/deep links, according to the required navigation contract. [Failure12](baseline-edges/failure-12.png). |
| RECON-C01 | URL-state contract gap; acceptance assertion FAIL | Open history with `from=2099-01-01&to=2099-01-02`. Both date inputs are blank, allnine history rows appear, no date alert. Existing code does not parse these URL fields. | Define serialized filter keys and validate restored values through shared date policy. These particular parameter names were a QA proposal, not an established backend API. Do not describe this as a date-validation bypass in an implemented API. [Failure14](baseline-edges/failure-14.png). |

Fresh PASS assertions:

- Entering a stock query leaves allnine rows until Search/Enter; Enter then appliesHN-PSU-002 and yieldsone row.
- Reconciliation warehouseHN02/resultMatch computes two total SKUs/two matches/zero shortage/zero excess from the filtered set.
- Basic stockHN01→SKU→allocation, Back twice and Forward keeps the selected view and warehouse context. This does not negate the refresh/query/location losses above.

## Bounded component/data probes

[Raw component results](baseline-components/results.json): **0 PASS /3 FAIL**, zero page errors; adapter and component SHA256 hashes are identical before and after execution. The tested hashes match the captured app source. The harness renders the actual component with bounded injected read-only fixture adapters on Vite5340. It does not bypass authentication in the normal application and is not an API/RBAC integration result.

| ID | Priority / classification | Actual observation | Boundary |
|---|---|---|---|
| RECON-C02 | P1 defensive/null representation gap | Inject count:null for DRV actual120. Reconciliation displays Counted0, variance−120 and Shortage, instead of unknown/unverified. [Failure1](baseline-components/failure-1.png). | Current DTO declares `count:number`; null deliberately extends that old DTO to exercise the newly requested robustness rule. A nullable backend field has not been discovered. Extend the frontend model explicitly before claiming null is supported. |
| RECON-F06 | P1 confirmed valid-contract unit-label defect | Set the selected SKU unit toMét; BOX allocation unit staysCái. [Failure2](baseline-components/failure-2.png). | The current SKU contract already has an arbitrary unit string. BOX unit must derive from the linked SKU/contract, never be hardcoded or aggregated across unlike units. |
| RECON-F07 | P2 confirmed number localization defect | VI actual1.200.000.000/count1.201.000.000 gives variance`+1000000`, while adjacent quantities are locale-formatted. [Failure3](baseline-components/failure-3.png). | Format signed magnitude with the active locale and keep sign semantics. No arithmetic error was observed for these safe integers. |

No injected data was written to the operational repository. Fixture nulls/units/large values are test inputs and must never be confused with real stock records.

## Remaining required coverage / architecture gaps

| Area | Status at baseline | Final independent retest plan |
|---|---|---|
| Negative variance | Existing fixture has−2 but no new dedicated edge assertion in this continuation yet | Test negative, zero, positive and null separately, including badge/label/count summaries |
| Large values / unit boundaries | Two new assertions FAIL above | Add safe large positive/negative formatted values and non-piece BOX unit; ensure no mixed-unit aggregate |
| Counts versus page totals | Scoped result counts PASS; new>9-row counts not yet executed | Inject12 rows, verify total12 across9/3 page slices and that result counters remain scope totals |
| Hash date validation | URL filter state absent | Test valid/invalid/reversed/future restored dates, shared Vietnam timezone boundaries and browser Back/Forward of accepted dates |
| Date typing versus applied date | Shared button validator exists; no new Enter-date assertion yet | Verify Search/Enter parity and that invalid drafts do not replace accepted rows |
| Tray ID identity | Current view derives tray from selected BOX; no independent tray query model | Verify exact BOX→tray link and stale/mismatched relation; do not invent multi-BOX tray data without a fixture contract |
| Retry and stale async response | Static architecture gap, not a new executed stale-response FAIL | Only async adapter operation is `retry():Promise<Scenario>`. It has no request scope/version/abort signal and commits `setScenario` when resolved. No asynchronous stock/history read contract exists, so out-of-order row freshness cannot be certified. Add bounded retry/cancel-generation tests when implementation establishes this contract; distinguish component behavior from real API retries. |
| Loading/error with accepted old data | Static scenario-only fixture path; no accepted-model/read generation contract | Require explicit stale/busy semantics if retaining rows; otherwise no fabricated zero or success timestamp |
| Backend inventory/count/reservation/saved result APIs | BLOCKED | Need real DTOs/source versions, null semantics, authoritative units, coverage, history permission and scope IDs |
| Production role matrix, API deny versus not-found, real session expiry | BLOCKED / NOT_RUN | Fixture deny panels and normal MOCK login do not prove server RBAC or data authorization |

New final tests must execute on an identified frozen implementation/build and receive their own receipts. Source edits, release builds, shared route migrations and deployment remain outside this QA lease. No current acceptance result is inferred from the previous task's20 unit tests,44 browser passes, or32 screenshots.
