# Pilot defect register

| ID | Severity | Status | Owner | Evidence / exit |
|---|---:|---|---|---|
| VQ-001 / FQ-005 | P1 | OPEN / BLOCKED | S00#2, S00#3 | Public setup must become bounded and repeatable; rerun clean profiles. |
| FQ-001 | P2 | OPEN / FAIL | S00#2 | Existing warranty assertions expect old seed counts (4 vs 31); reconcile additive seed contract, then retest. |
| FQ-003 / CI-01 | P1 | BLOCKED | S00#5 | Real CI must execute required browser/a11y/console/overflow gates. |
| FQ-004 / PROV-01 | P1 | BLOCKED | S00#1/S00#5 | Hosted source metadata must match the candidate SHA. |
| DG-01/DG-02/DG-04/DG-07/DG-08 | P0/P1 | DESIGN_GAP | S00#6 | Recover or supersede missing shell, token, scenario, state and theme authority. |
| GAP-019 | P1 | OPEN | S00#5 | Enable and verify DEV protection and required checks. |

No P0/P1 issue is closed by this pilot. Harness selector corrections were retested and are not production defects.
