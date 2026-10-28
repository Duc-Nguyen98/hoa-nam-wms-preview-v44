# Data Integrity Report — HN-PTW-26REF-001

Candidate SHA: `6ea167125643d10d6545b28df452511af54c6f09` (`DEV`) plus the uncommitted PTW seed fix, retested 2026-10-28 Asia/Bangkok. All writes below used fresh in-memory `installPreviewMock` persistence; no production/staging data was touched.

## Evidence (MOCK)

The direct policy probe created a component BOX with quantity 5, then executed putaway commands through the canonical mock adapters:

```json
{
  "create": {"status":"DRAFT", "stockBefore":5, "stockAfter":5, "eventsBefore":1, "eventsAfter":1},
  "duplicate": {"code":"BOX_HAS_ACTIVE_TASK", "status":409},
  "staleCreate": {"code":"STALE_BOX_VERSION", "status":409},
  "confirm": {"status":"CONFIRMED", "tray":"operational-setup:tray:1", "stock":5, "events":1, "audit":["putaway.create","putaway.confirm"]},
  "doubleConfirm": {"code":"TASK_NOT_DRAFT", "status":409}
}
```

The candidate direct policy probe reproduced the same checks with a fresh component BOX quantity 5: Draft left `trayId: null`, `stockQty 5→5`, and `stockEvents 1→1`; duplicate create returned `BOX_HAS_ACTIVE_TASK`, stale observed version returned `STALE_BOX_VERSION`, confirmation mapped both task and BOX to `operational-setup:tray:1`, and a second confirmation returned `TASK_NOT_DRAFT`.

## Source/fixture audit

- `eligibleBox` requires a posted, in-stock BOX, a posted source receipt, a positive ledger quantity, and `trayId === null`.
- `putaway.create` stores `capturedBoxVersion`, `capturedContentRevision`, and `quantityAtCreate`, with no dependent BOX or stock write.
- `putaway.confirm` rechecks current version/content/quantity, sets status and BOX tray only, and emits no stock-event write.
- `createApprovedTraySeed()` contains 27 unique BOX rows, 18 orders, 9 tray rows and 9 history rows. Its unit test passed.
- `projectOperational` derives stock only from stock events and derives tray membership from confirmed BOX mappings.

## Integrity result

Core Draft→Confirm, mapping and stock-neutrality invariants PASS in MOCK. Retest of the repaired seed verified 27 approved BOXes each have a matching receipt/line/BOX link, nine exact tray codes, and nine S11 rows/details; FQ-PTW-004 is FIX VERIFIED.

The approved seed and operational setup now use the manifest display codes `TRAY-001`…`TRAY-009`; browser S11 retest and seed regression both verified the contract. FQ-PTW-001 is FIX VERIFIED.

No production or REAL_API data was read or changed.
