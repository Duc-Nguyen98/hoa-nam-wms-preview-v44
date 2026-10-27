# HN-S12-UIUX-006 — V01 implementation

- Owner: S00#2 CRUD Lead
- Candidate: `DEV` at `bfec7060cdf422a112ec5e644bf0b51401d9bda2` plus the uncommitted files below.
- Commit: NOT_CREATED; source remains uncommitted for orchestrator review. No new SHA exists.
- Status: scoped fix and local verification complete; independent functional/visual acceptance belongs to S00#4/S00#3.

## Root cause and impact

`OperationalReceipts.tsx` applied an artwork-specific receipt-code allowlist before user search/status filtering and when computing the total. The allowed values were PN-0012, PN-0011, PN-0010, PN-0009 and the PV-PN- prefix. Authorized adapter records with other codes disappeared, including from the count, and could incorrectly produce the empty state.

`projectOperational` in `src/preview-mock/operational-policy.ts` already selects the active actor/scenario/generation scope. The screen now renders the supplied adapter receipt pool, with its existing search/status predicates. The full adapter pool supplies the denominator.

## Files

| File | Change |
|---|---|
| `src/features/S12/OperationalReceipts.tsx` | Removed four allowlist declarations; removed its row filter; replaced filtered total with `snapshot?.receipts.length ?? 0`. Tracked diff: 2 insertions, 6 deletions. |
| `tests/s12/receipt-visibility.spec.ts` | Added two browser regressions using the existing supplied-adapter receipt harness. Arbitrary codes in all four statuses, table/card counts, source/reference/code search, combined status/no-results, replacement on refresh, empty state, and zero commands. |
| `tests/s12/receipt-visibility.config.ts` | Dedicated existing-Playwright runner with managed Vite server on port 5289; no package/config shared edits. |

Source fixtures, screenshot harness files, business commands, GlobalShell, other screens and shared components are untouched. Test data changes exist only in each isolated browser's adapter response.

## Verification

| Command | Result |
|---|---|
| `npx playwright test --config tests/s12/receipt-visibility.config.ts --reporter=list` before source fix | Both tests FAIL at their arbitrary-code row assertions: expected 4/1, received 0. Initial three harness rows loaded successfully. Confirms regression catches V01. |
| Same command after source fix | PASS — 2 tests (16.1 seconds). |
| `npm run typecheck` | PASS. |
| `npm run build` | PASS — typecheck and 618 modules built; existing large-chunk warning remains. Build ID `425f6db063820c56a5ffc71ebaca2925e68a7977e8406c24f0351d8f21854838`. |
| `git diff --check` | PASS. |

## Reviewed file SHA-256

- `OperationalReceipts.tsx`: `AC13B0F446E9BB2A7590F4DC2051CF9126244E17B9A55094FDBCD7278F196656`
- `receipt-visibility.spec.ts`: `8CB31F658E6CC9671FB8EBF4E5A230C8AFB1E3ADD32FF9FA0475B29B9BC906D8`
- `receipt-visibility.config.ts`: `179C624DC50A40A69A80AA3B4356C38B7EC9D227271F39F49B909249D5B6C7F1`

## Acceptance limits

The browser tests exercise the real S12 component with its supplied-adapter harness. They do not claim live authentication/RBAC or full workflow acceptance. Adapter authorization and current-session projection remain the existing upstream contract. Independent retest, visual comparison and release provenance are pending with their owners. No push, merge or deploy was performed.
