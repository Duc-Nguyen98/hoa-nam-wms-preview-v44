# Notification Center visual QA

Owner: S00#3
Candidate: `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`
Verdict: **BLOCKED — no Visual PASS**

Results:

- Public clean-session initialization stalled at 0/5/20 seconds in one run, exceeded 180 seconds in a repeat and returned to login. This is P1 VQ-001.
- One diagnostic public S01 capture at 1440×900 was obtained; it is not an approved comparison because viewport/DPR, shell and data scenario are not locked.
- Public S01 showed `Cần xử lý 5` while approved artwork shows `3`; this is P2/design gap VQ-002, not a hardcoded CSS fix.
- Notification isolated harness: `5/5 PASS`, including list/detail, unread/read behavior, keyboard focus, tablet geometry and retry behavior. This is supplemental and does not certify public deployment.
- Public desktop/tablet/fold, notification reference/actual/diff, full locale/theme and state matrix: `NOT_RUN/BLOCKED`.

Full evidence: [S00#3 report](../../../../docs/quality/VISUAL_QA_REPORT.md), [visual defects](../../../../docs/quality/VISUAL_DEFECT_REGISTER.md), and `output/design-evidence/public-setup-blocker-20261027/`.
