# Functional baseline / capture harness

Owner: S00#2 business audit · source baseline `57b9f399a55d41d43ecad7a31e1b279da2cda717` · 2026-10-29.

## Existing tests executed

Command: `npx tsx --test tests/warranty-parts/s16-operational-binding.test.ts tests/warranty-parts/s21-operational-binding.test.ts tests/putaway-approved/*.test.ts`.

Result: **15 PASS / 0 FAIL**, log: [`existing-tests.tap`](existing-tests.tap). These are authenticated local MOCK service/repository and projection contracts, not production API certification. Coverage includes stock-neutral putaway, receipt/outbound/parts/reversal quantities, exact SKU/warehouse/unit and scenario tokens, coherent-revision retries, missing FK/incomplete proof refusal, read/session failures, superseded/suspended response fencing, immutable pinned export, Vietnam midnight and additive tray seed mapping. S11 approved seed joins nine confirmed tray rows; its other 18 BOX/putaway records remain preserved. No independently named S20 binding unit suite was found; this baseline exercises S20 browser reachability but does not certify all movement-history flows.

## Actual app harness

New bounded script: `tests/inventory-fidelity/baseline.mjs`. It requires `HN_QA_USERNAME` and `HN_QA_PASSWORD` environment variables, opens the real S07 login page, submits the existing S08 confirmation and public browser setup, then accesses S16/S11/S20/S21 through registered hashes. It does not patch authentication, session guards, providers, router code or persisted account flags. The read-only operational adapter is imported only after successful normal login to compare complete canonical snapshots before/after browsing. Normal setup creates synthetic scenario data in an isolated fresh browser profile; subsequent search/detail/route reads must leave its canonical operational snapshot unchanged.

The existing `tests/lookup-ui/browser.mjs` is useful selector guidance and follows normal authentication. Its hardcoded two-row counts and unrelated S23 print mutation make it unsuitable to run wholesale for this read-only task. The new harness adapts to the approved additive seed and performs no print, stock or putaway mutation after setup.

Actual app captures and metadata: [`baseline-browser.json`](baseline-browser.json), `before-desktop-S16/S11/S20/S21.png`, and `before-tablet-S16/S11/S20/S21.png`. These are **before screenshots of the current app**, not approved-reference fidelity evidence. Current operational populations are S16 11 ledger rows, S11 9 tray rows, S20 35 event rows, S21 11 stock rows. The approved new inventory fixture's nine-SKU population is a separate source and must not overwrite the canonical seed.

S16 search `ZX-999` exercised the visible no-results state and clearing search. S16/S11 detail opened and Escape returned focus to the exact opener at both profiles. All four routes were reachable with no document overflow; the canonical snapshot was preserved and console/page errors were zero. Desktop target is 1920×1080 CSS DPR1; Tablet target is 800×1280 CSS DPR2, with measured values recorded by the final JSON (never infer DPR from raster size).

## Readiness and pending work

- Current registered route baseline: **PASS (MOCK)** for the bounded flows above.
- Sixteen approved inventory states / 32 new-reference captures: **NOT_RUN**, pending implementation of the separate approved model/UI. Existing default route screenshots do not satisfy this gate.
- New fixture arithmetic, cross-state identity, snapshots, held stock, scope, nine locations and 3/3/3 reconciliation totals: **NOT_RUN**, pending model/fixture implementation; audit requirements are in `BUSINESS_CONTRACT_AUDIT.md`.
- New history forbidden / BOX not-found / load error injection / session expiry / race / history snapshot mutation proof: **NOT_RUN** in browser. Existing source binding tests do prove their narrower current contracts.
- Production endpoint, direct API/ID/warehouse permission enforcement and REAL_API actors: **BLOCKED**, no production backend contract or accounts supplied.

Future independent functional QA should use the real authenticated app, fixture adapters at the data boundary and existing shared state primitives. It should assert view context and immutable snapshot identity while changing live stock, check all three locale/theme combinations as applicable, and compare canonical data before/after read-only flows. Do not force Forbidden for unsupported features or manufacture reconciliation history from live ledger state.

