# Regression report

Candidate runtime: `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`.

- `quality:pr`: PASS — typecheck, contract, build, putaway `4/4`.
- S02 integration: PASS `12/12`.
- Functional browser pilot: PASS `8/8`.
- Notification isolated suite with Vite test server: PASS `5/5`.
- Existing broad regression inventory: `144 PASS / 4 FAIL`; supported S27 rerun `9/9 PASS`; three seed-contract assertions remain FAIL. The failed entries are retained, not relabeled.
- No application runtime source was changed during this pilot. No snapshot was updated.

Overall regression gate: **FAIL / BLOCKED** until the three scenario assertions are reconciled and required browser/a11y/console/overflow coverage is wired.

Detailed inventory: [REGRESSION_REPORT.md](../../../../docs/quality/REGRESSION_REPORT.md).
