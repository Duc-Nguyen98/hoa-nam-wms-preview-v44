# Defect ledger

| ID / severity | Cause and final disposition | Evidence |
|---|---|---|
| RECON-F01/P2 | Warehouse-dependent locations/reset — fixed, MOCK retestPASS | functional/baseline-edges and sol-final-edges |
| RECON-F02/P1 | Five warehouse-mismatched detail projections — fixed, MOCK retestPASS | functional/sol-final-edges/results.json |
| RECON-F03/P2 | Saved snapshot heading date — fixed, MOCK retestPASS | same edge receipt |
| RECON-F04/P1 | Location scope silently expanded on drill-down — fixed, MOCK retestPASS | same edge receipt and projection units |
| RECON-F05/P2 | Refresh/back accepted query lost — fixed, MOCK retestPASS | same edge receipt |
| RECON-C01/P2 | Proposed URL-date contract was ignored — versioned URL validation implemented/retested | navigation units and edge receipt; no API-bypass claim |
| RECON-C02/P1 | Null robustness gap created falsezero/shortage — explicit nullable model, granular component/unitsPASS | component segment audit and projection units |
| RECON-F06/P1 | BOX unit hardcoded to pieces — linked unit, granular componentPASS | component segment audit |
| RECON-F07/P2 | Signed magnitude lacked localization — fixed, granular componentPASS | component segment audit |
| VQ-RECON-001/P2 |400px tray quantities/action offscreen — fixed/retested on ecb2bda | final visual receipt and postCSSfinite initial bounds |
| VQ-RECON-002/P2 |400px third tab clipped — wrapped/retested on ecb2bda | same final receipts |
| VQ-RECON-003/P2 |Tablet movement density — PARTIAL/OPEN;1948CSSpx vs2119intermediate/1604BEFORE | visual/FINAL_ECB2BDA_VISUAL_REPORT.md |

Nine functional/robustness findings closed in bounded MOCK, two of three new visual findings closed, one visualP2 remains. This ledger does not count blocked API/CI/zoom/environment gates as repaired product defects. Original failed screenshots, source0dd visual report and all retest identities remain retained. Complete component-run completion remains BLOCKED despite16granular assertion passes.
