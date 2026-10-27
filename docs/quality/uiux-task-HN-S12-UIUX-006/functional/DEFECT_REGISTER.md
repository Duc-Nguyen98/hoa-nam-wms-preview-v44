# S12 functional defect register

Baseline candidate SHA `bfec7060cdf422a112ec5e644bf0b51401d9bda2`; after-fix retest ran on the same HEAD with source diff hash `ea80a673eac344167451974841f42364abe7d7a2` and fixed source blob `d8896efb843ec248dd684afbe9a5ab2487b1008f`; route `#/preview/S12`; preview `http://127.0.0.1:5287`.

## V01 / P1 — receipt allowlist hides valid adapter records

**Baseline status: CONFIRMED, implementation dispatch required. After-fix status: FOCUSED RETEST PASS (pending committed candidate review).** Before the fix, `src/features/S12/OperationalReceipts.tsx` derived displayed rows through `isVisibleDemoReceipt`, whose allowlist admitted only `PN-0012`, `PN-0011`, `PN-0010`, `PN-0009`, or `PV-PN-*`. A complete authorized adapter receipt with a different valid code was omitted from the list and count. The focused after-fix suite now passes arbitrary receipt codes, search/status filtering, and refresh replacement (`npx playwright test --config=tests/s12/receipt-visibility.config.ts`, 2 passed). Actual authenticated route and `REAL_API` remain blocked/not run.

Reproduction: synthetic reference harness (`tests/reference-exact/receipts.html`) starts with 3 receipts. A valid adapter-shaped receipt `PN-AUTHORIZED-EXTRA` was appended to the isolated in-memory snapshot, then the S12 read refresh was clicked. Result remained `3 phiếu trong phiên hiện tại.` and no visible row contained the added code. The source changed only inside the isolated browser fixture; no repository fixture or production data was modified. Receipt: `allowlist-repro.json`; source behavior is visible in `OperationalReceipts.tsx`.

Acceptance: render every complete authorized receipt returned by the adapter, with no undocumented code allowlist. Search/status filtering, details, count and pagination must include the extra record; unrelated S12/S15 behavior must remain unchanged. Add a source-backed negative test for hidden records before closing this defect.

## No additional confirmed defects

Create validation, detail identity, clipboard, keyboard focus, empty/error/forbidden/read retry and no-write behavior passed in the synthetic reference harness. Real application route could not be authenticated in this run because no credential environment variables were available; this is a coverage block, not a product defect.
