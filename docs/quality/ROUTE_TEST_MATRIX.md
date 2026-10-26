# Route and test matrix

Baseline SHA for this audit: `36f3dc6e2a531db9d1c463f30248566d7d4556ae`. Current evidence is `NOT_RUN` unless a report names this SHA. `BLOCKED_DESIGN` means an approved reference or Design Guardian decision is missing.

| Route family | Routes | Owner | Unit/contract | E2E | Visual | A11y/console/overflow | Status |
|---|---|---|---|---|---|---|---|
| CMS screens | `#/preview/S01`–`S06`, `#/preview/S09`–`S29` | S00#2 per feature; S00#1 integration | existing feature tests vary | NOT_RUN current SHA | BLOCKED_DESIGN for many screens | NOT_RUN | BLOCKED |
| Auth | `#/preview/S07`, `#/preview/S08` | S00#2 | auth contract/tests | NOT_RUN current SHA | BLOCKED_DESIGN | NOT_RUN | BLOCKED |
| Tray history | `#/preview/S14/history` | S00#2 | putaway history tests | 4/4 historical/current source test command available | BLOCKED_DESIGN | NOT_RUN | BLOCKED |
| Account | `#/account/profile`, `/security`, `/settings`, `/notifications` | S00#2 account owner | account model/http contracts | NOT_RUN current SHA | BLOCKED_DESIGN | NOT_RUN | BLOCKED |
| S01 pilot | `#/preview/S01` plus linked document/query routes | S00#2 implementation; S00#3 visual; S00#4 functional | `tests/overview-detail.test.ts`, `tests/s01/*` | NOT_RUN for this SHA | BLOCKED_DESIGN pending pinned S01 set | NOT_RUN | BLOCKED |
| CRUD pilot | S02 create/update/status scope | S00#2 implementation; S00#4 functional | S02 service/adapter policy tests to be packeted | NOT_RUN | BLOCKED_DESIGN | NOT_RUN | BLOCKED |

The registry is the route inventory; it defines preview hashes, not production API or RBAC certification. Query/document/notification subroutes must be tested separately from their parent screen.
