# Saved reconciliation result integrity

Snapshots contain frozen row/BOX copies and independent identity/date. Saved result views and variance drill-down select that snapshot, not current rows. Header time now agrees with the selected saved date. Warehouse/result/date filters and URL/history restore accepted context. Invalid/future/reversed query dates are surfaced; an invalid date draft does not replace accepted rows. The shared rolling90 policy is used only for lookup filters, not to rewrite stored historical timestamps.

Fixture tests prove independent frozen copies and scope/count/null behavior in memory. Browser checks prove the selected snapshot identity/date, warehouse/result rows, Back/Forward/refresh and deep-link consistency. These do not prove a server append-only snapshot store. No real API snapshot-write/read contract was recovered, and no save/run reconciliation command was invented. REAL_API_SNAPSHOT_IMMUTABILITY=BLOCKED.

See [navigation/projection test sources](../../../../tests/inventory-recon-fidelity/navigation.test.ts) and [functional source audit](functional/SOL_DATA_SCOPE_AUDIT.md). The test source link is informational; canonical machine receipts are under functional/ and gates/ in this task. No reconciliation result automatically adjusts inventory.
