# Defect Register — HN-PTW-26REF-001 (S00#4)

| ID | Severity | Area | Evidence | Status / impact |
|---|---|---|---|---|
| FQ-PTW-001 | P1 candidate | Tray identity / fixture contract | `createApprovedTraySeed()` declares `TRAY-001`…`TRAY-009`; `operational-policy.ts` setup reset/seed writes display codes `PREVIEW-TRAY-1`…`PREVIEW-TRAY-9`. Local S14/history browser output showed `PREVIEW-TRAY-*` while static history fixture uses `TRAY-001`. | OPEN — inconsistent user-visible tray identifiers can break reference matching and downstream search/export. S00#1/S00#2 should resolve whether `TRAY-*` or `PREVIEW-TRAY-*` is authoritative; no source change made. |
| FQ-PTW-002 | P1 candidate | Lost response / exactly-once proof | Core repository has receipt replay logic, but client recovery wrapper rejects exact same-command retry after acknowledgement (`RECOVERY_ACK_REQUIRED`); no retained browser lost-response test for S13/S14. | OPEN / PARTIAL — duplicate create/confirm guards pass, but end-to-end replay proof is incomplete. |
| FQ-PTW-003 | P2 candidate | QA coverage | Empty tray, injected timeout/error, concurrent double-click, cross-warehouse scope, real/staging RBAC and required DPR2 tablet profile were not run. | BLOCKED/NOT_RUN — environment or fixture gates unavailable, not a product failure claim. |

No P0 was observed. FQ-PTW-001 is a contract/data-display mismatch rather than a stock mutation; release disposition remains with S00#1 after fixture authority decision.
