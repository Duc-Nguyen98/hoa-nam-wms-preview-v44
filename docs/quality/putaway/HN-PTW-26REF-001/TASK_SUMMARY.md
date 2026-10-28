# Task summary — HN-PTW-26REF-001

- **Target:** Putaway Management / Xếp khay
- **Contract:** PTW-01 — LOCKED
- **Routes:** `#/preview/S13` queue, `#/preview/S14` orders, `#/preview/S11` trays, `#/preview/S14/history` history
- **Branch:** `DEV`
- **Source/evidence commit:** `69dfa35ec7029fe38e927fc8bdcaf0ed18c1c43e`
- **Environment:** local Vite MOCK; no production mutation

## Coverage

- 26/26 references registered and hash-verified.
- BEFORE: 14 real runtime captures; 10 PASS in runnable scope, 4 FAIL for density/fixture content, 12 BLOCKED by unavailable state or permission fixtures.
- AFTER: 10 fresh captures covering REF-02, REF-03, REF-04, REF-07 and REF-09 on Desktop/Tablet, with zero console/request errors and no horizontal overflow.
- No fabricated screenshot or synthetic PASS was used.

## Fixes

1. Approved tray setup display codes now derive from the PTW-01 seed (`TRAY-001`…`TRAY-009`).
2. Approved seed now persists canonical `inbound-line` records and audit FK links, allowing S11 tray projection/detail to resolve receipt, line, SKU and BOX links.
3. Added `tests/putaway-approved/operational-seed.test.ts` covering tray identity and S11 lookup completeness.

## Verified

- Draft creates no mapping; Confirm creates one whole-BOX mapping.
- Stock and stock-event counts remain unchanged through putaway.
- Duplicate create/confirm and stale BOX versions fail closed.
- Tray seed regression 5/5 PASS; S15/S16 regression 33/33 PASS.
- Browser S13/S14/S11/history flow passes on local MOCK with no page/console errors; tablet overflow false.

## Open gates

- REF-01/02 remain P2 visual density/fixture gaps.
- REF-08 validation, REF-11 stale conflict, REF-12 no-tray, REF-13 forbidden history remain BLOCKED/NOT_RUN because their approved runtime fixtures are unavailable.
- DPR2, REAL_API, staging, real RBAC and lost-response replay remain BLOCKED/NOT_RUN.
- Hosted CI and exact public preview SHA remain BLOCKED; no push/deploy was made.
