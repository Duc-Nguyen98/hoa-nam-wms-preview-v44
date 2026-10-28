# Data Integrity Report — HN-PTW-26REF-001

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

## Source/fixture audit

- `eligibleBox` requires a posted, in-stock BOX, a posted source receipt, a positive ledger quantity, and `trayId === null`.
- `putaway.create` stores `capturedBoxVersion`, `capturedContentRevision`, and `quantityAtCreate`, with no dependent BOX or stock write.
- `putaway.confirm` rechecks current version/content/quantity, sets status and BOX tray only, and emits no stock-event write.
- `createApprovedTraySeed()` contains 27 unique BOX rows, 18 orders, 9 tray rows and 9 history rows. Its unit test passed.
- `projectOperational` derives stock only from stock events and derives tray membership from confirmed BOX mappings.

## Integrity result

Core PTW-01 data invariants PASS in MOCK. The approved seed’s display code contract needs review: the manifest labels trays `TRAY-001`…`TRAY-009`, while `operational-policy.ts` creates setup records with display codes `PREVIEW-TRAY-1`…`PREVIEW-TRAY-9`; browser history and S14 show the `PREVIEW-TRAY-*` values. This is recorded as `FQ-PTW-001` in `DEFECT_REGISTER.md`.

No production or REAL_API data was read or changed.
