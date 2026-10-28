# RBAC Report — HN-PTW-26REF-001

## MOCK evidence

- `tests/putaway-approved/history-api.test.ts` passes the distinct history route forbidden case.
- `business-reads.ts` throws `PUTAWAY_HISTORY_FORBIDDEN` with HTTP 403 when `putawayHistoryRead` is absent.
- Local browser Preview used the approved `preview:ducquang` actor and successfully read S13/S14/S11/history. This is a mock policy grant, not a real role grant.
- The code keeps history as a separate API surface; broad operational snapshots cannot be used as a history side channel when history permission is absent.

## Gate status

| Gate | Status |
|---|---|
| Mock forbidden history (403, no rows/count) | PASS |
| Mock permitted history | PASS (10 rows after setup; page size 9) |
| Unauthorized/expired session UX on PTW routes | NOT_RUN |
| Cross-warehouse scope enforcement | NOT_RUN |
| Real API roles/capabilities | BLOCKED |
| Staging role matrix | BLOCKED |
| Production RBAC | BLOCKED |

The packet requires denied, expired, empty, unknown and error states to remain distinct. Only the forbidden-history MOCK path was directly verified here; no real permission claim is made.
