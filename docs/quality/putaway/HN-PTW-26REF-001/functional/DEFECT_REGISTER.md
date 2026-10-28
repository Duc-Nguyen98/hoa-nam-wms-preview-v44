# Defect Register — HN-PTW-26REF-001 (S00#4)

| ID | Severity | Area | Evidence | Status / impact |
|---|---|---|---|---|
| FQ-PTW-001 | P1 candidate | Tray identity / fixture contract | Retest seed regression and browser S11 both verified setup codes `TRAY-001`…`TRAY-009`, matching the approved manifest and history fixture. | FIX VERIFIED in current working tree; release disposition awaits S00#1/source commit. |
| FQ-PTW-002 | P1 candidate | Lost response / exactly-once proof | Core repository has receipt replay logic, but client recovery wrapper rejects exact same-command retry after acknowledgement (`RECOVERY_ACK_REQUIRED`); no retained browser lost-response test for S13/S14. | OPEN / PARTIAL — duplicate create/confirm guards pass, but end-to-end replay proof is incomplete. |
| FQ-PTW-003 | P2 candidate | QA coverage | Empty tray, injected timeout/error, concurrent double-click, cross-warehouse scope, real/staging RBAC and required DPR2 tablet profile were not run. | BLOCKED/NOT_RUN — environment or fixture gates unavailable, not a product failure claim. |
| FQ-PTW-004 | P1 candidate | S11 operational tray projection / approved fixture completeness | Retest seed regression verified 27 approved BOXes each have matching receipt/line/BOX links; browser S11 rendered nine tray records and opened TRAY-001 details without error. | FIX VERIFIED in current working tree; empty-tray coverage remains NOT_RUN. |

No P0 was observed. FQ-PTW-001 and FQ-PTW-004 are FIX VERIFIED in the current working tree. FQ-PTW-002 remains PARTIAL and FQ-PTW-003 remains BLOCKED/NOT_RUN; release disposition remains with S00#1.
