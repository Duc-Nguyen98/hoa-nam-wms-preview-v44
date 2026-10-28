# Regression precheck — HN-WARRANTY-PARTS-UIUX-001

**Checkout:** `DEV`, commit `93371f4da9b6659d320a7c66d9b0862f89744a0d`  
**No source files changed by S00#4.** Only this QA report set is being added.

| Check | Status | Evidence / limit |
|---|---|---|
| TypeScript typecheck | **PASS** | `npm run typecheck` exited 0. |
| Quality contract | **PASS** | `npm run quality:contract` reported `QUALITY_CONTRACT_PASS: 13 states, 26 references, immutable source policy`. |
| Full build | **NOT_RUN** | Parent release gate should run `npm run build`. |
| Focused S09/S10 unit and binding tests | **PASS (22/22)** | `npx tsx --test tests/warranty-ui/selection.test.ts tests/warranty-parts/s09-operational-binding.test.ts tests/warranty-parts/s10-operational-binding.test.ts`: 22 pass, 0 fail. |
| Public-demo flow regression | **PASS (2/2)** | `npx tsx --test tests/warranty-parts/public-demo-flow.test.ts`: 2 pass, 0 fail after updating stale expectations to assert the intentional approved 26-tray seed subset (9 SKUs, 27 receipts/boxes, 9 confirmed putaways) plus the two public-demo SKUs. |
| Legacy route parsing | **PASS** | Temporary unit smoke accepted exactly `#/preview/S09?catalog=legacy` and `#/preview/S10?catalog=legacy`, rejected extra query/fragment variants, and confirmed canonical S09/S10 registry hrefs. |
| Legacy adapter contract smoke | **PASS** | Temporary non-source harness exercised S09/S10 default reads, exact search, no-results, valid filter, invalid-option blocking, and explicit controller reset. All assertions passed. |
| Detail identity and reset fencing | **PASS (MOCK)** | S09/S10 binding suites pass stale ID, read-loss, reset, refresh, session-expiry and incomplete relationship cases. |
| Browser S09/S10 flow | **BLOCKED** | `tests/warranty-ui/browser.mjs` fails with Playwright execution-context destruction during navigation; its login/setup selectors remain stale (`.s08-confirm`, `.ov-result-count`) and a direct local attempt could not complete PublicDemoGate setup reliably. No OOM signal was observed and no production endpoint was touched. |
| Console/page errors | **NOT_RUN** | Blocked browser flow did not reach the intended S09/S10 assertions. Focused unit suites have no browser console surface. |
| Accessibility / focus / overflow | **NOT_RUN** | Existing binding tests cover focus fallback during delayed reads, but a fresh browser pass for this commit was blocked. Visual capture is outside this functional report. |
| Copy behavior | **PASS (source/static); browser NOT_RUN** | Legacy and operational detail sources now expose copy buttons, shared clipboard/fallback utility and feedback. Browser clipboard interaction could not be completed because the harness/setup was blocked. |
| Linked navigation | **PASS for S10 → S09/S17; PARTIAL reverse** | S10 legacy and operational details expose the S09 warranty relation link; S09 does not expose a reverse parts-slip link because relation data is unavailable in its legacy contract. |

## Release gate notes

* The approved-tray fixture is intentionally additive. Keep its explicit seed assertions; do not revert to two-SKU/four-receipt expectations or reset shared data to make tests pass.
* Obtain an approved date-range contract, pagination dataset with more than one page, and REAL_API RBAC/warehouse-scope evidence before marking those items PASS.
* Re-run the browser harness after updating only its owned selectors/setup synchronization, then capture console, focus, overflow, loading/error/not-found and copy/link evidence.

