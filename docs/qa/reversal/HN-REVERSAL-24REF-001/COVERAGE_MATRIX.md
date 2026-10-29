# Twelve state pairs — separate capture and acceptance coverage

Application a75ded0c426f8548be2af25e85ed9482b25917ff; build 551357b4a3e3ff7448da0ebfc39a0cc5dfbed6263d1ed7cea9b293a512625def. Each row below has actual Desktop1920, Desktop1440 and Tablet800 captures plus diagnostic reference/actual/overlay/diff. Capture PASS means evidence exists, not visual or backend acceptance. All data is isolated MOCK; no REAL_API_PASS is claimed.

| Pair | Screen/state | Fixture | Capture | Interaction/model coverage | Acceptance limit |
|---|---|---|---|---|---|
| 01 | List | Nine reversals4/2/1/2 | PASS ×3 | Executed; see independent functional per-case receipt | Visual PARTIAL/profile composition limits; REAL_API BLOCKED |
| 02 | Choose source | Nine eligible sources, selected007 | PASS ×3 | Executed; see independent functional per-case receipt | Visual PARTIAL/profile composition limits; REAL_API BLOCKED |
| 03 | Edit draft | 007 twoSKU rows2+2 | PASS ×3 | Executed; see independent functional per-case receipt | Visual PARTIAL/profile composition limits; REAL_API BLOCKED |
| 04 | Review/post | 007 twoSKU rows, confirmation dialog | PASS ×3 | Executed; see independent functional per-case receipt | Visual PARTIAL/profile composition limits; REAL_API BLOCKED |
| 05 | Posted detail | 009 nineSKU quantities1..9,90/45/45 | PASS ×3 | Executed; see independent functional per-case receipt | Visual PARTIAL/profile composition limits; REAL_API BLOCKED |
| 06 | Pending return | 008 threeSKU, requested6/received0/available0 | PASS ×3 | Executed; see independent functional per-case receipt | Visual PARTIAL/profile composition limits; REAL_API BLOCKED |
| 07 | Cancelled detail | 005 oneSKU/2units, effect0 | PASS ×3 | Executed; see independent functional per-case receipt | Visual PARTIAL/profile composition limits; REAL_API BLOCKED |
| 08 | Impact/audit | 009 +90/−45/+45; review-event authority missing | PASS ×3 | Executed; see independent functional per-case receipt | BLOCKED audit review-event data; visual PARTIAL |
| 09 | Dependency blocked | 002 selectedBOX1, original remains10, PX015 | PASS ×3 | Executed; see independent functional per-case receipt | Visual PARTIAL/profile composition limits; REAL_API BLOCKED |
| 10 | Validation | 007 missing reason;12 exceeds10, second2 valid | PASS ×3 | Executed; see independent functional per-case receipt | Visual PARTIAL/profile composition limits; REAL_API BLOCKED |
| 11 | Outcome unknown | Actual model submit; same-key status check only | PASS ×3 | Executed; see independent functional per-case receipt | Visual PARTIAL/profile composition limits; REAL_API BLOCKED |
| 12 | Confirmed success | Actual matching receipt;007 twoSKU,−4, remainder8each | PASS ×3 | Executed; see independent functional per-case receipt | Visual PARTIAL/profile composition limits; REAL_API BLOCKED |

All24 references remain valid and unchanged.36 captures pair with those24 originals (Desktop has12 additional1440 supplements). There are36 diagnostic sets/144 PNGs. Actual/source hashes are in visual/after-a75ded0-receipt.json; source/build stability is in visual/after-a75ded0/stability.json.

BEFORE: actual old operational list/detail/create/source-choice each×3profiles=12. These are related views of a different whole-unused-return contract. Equivalent generic partial-state BEFORE for04/06–12 was NOT_REPRODUCED;05/02/03 are related rather than identical. No fabricated before/after equality or pixel score acceptance.

Additional read-loading/error/role/session integration is BLOCKED where the synchronous design adapter lacks a contract. Session expiry, actual200% browser zoom and complete automated WCAG certification are NOT_RUN. EN/zh/Dark were exercised semantically/geometrically, not against these VI/Light pixel references.
