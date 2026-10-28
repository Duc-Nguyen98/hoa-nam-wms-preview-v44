# Runtime visual QA evidence — HN-OUTBOUND-GSTATE-001

- Candidate: `DEV` / `002e291f9005ec5e22c45d7f93350af12f9b26ec`
- Actual route: `http://127.0.0.1:5188/#/preview/S15`
- Synthetic state route: `http://127.0.0.1:5188/tests/s15/harness.html?state=...`
- Browser: Chromium via Playwright; `vi-VN`, `Asia/Bangkok`, light theme.

## Geometry

| Capture | CSS viewport | DPR | Scroll width × height | Overflow |
|---|---:|---:|---:|---|
| REF-01 actual list | 1672×941 | 1 | 1672×941 | none |
| REF-02 actual compact | 992×1586 | 1 | 992×1586 | none |
| REF-03 actual expanded | 992×1586 | 1 | 992×1690 | vertical overflow |
| REF-04 actual desktop detail | 1672×941 | 1 | 1672×941 | none |
| REF-05 actual tablet detail | 992×1586 | 1 | 992×1586 | none |
| Synthetic six-state harness | 1672×941 | 1 | 1672×941 | none |

Machine-readable records: [`actual-before-manifest.json`](actual-before-manifest.json) and [`global-states-manifest.json`](global-states-manifest.json). Capture hashes: [`CAPTURE_SHA256.json`](CAPTURE_SHA256.json).

## Console and network

Playwright listeners recorded **0 console errors/warnings, 0 page errors and 0 failed requests** during the actual and synthetic probes. The network probe saw 260/260 HTTP 200 responses for the isolated S15 harness and 561/561 HTTP 200 responses for the actual route bootstrap. This is local Vite/module/mock evidence only; it does not certify API integration or hosted deployment. Full request/response records are in [`network-console-evidence.json`](network-console-evidence.json), with a compact summary in [`CONSOLE_NETWORK_SUMMARY.json`](CONSOLE_NETWORK_SUMMARY.json).

## State reachability

The harness rendered `empty`, `no-results`, `error`, `loading`, `forbidden`, and detail `record-not-found` with their expected `data-state` keys. The actual `/preview/S15` route was tested only in its populated session mode; deterministic empty/error/permission fixtures are unavailable there, so actual-route acceptance remains **BLOCKED/NOT_RUN** for those states.

## AFTER retest

After S00#2's scoped tablet CSS repair, the same 992×1586 profile measured REF-02/03/05 with `scrollHeight=1586`, no horizontal/vertical overflow, and no visible control below 44px. REF-03 CTA/footer ended at y=1460/1584. REF-05 modal ended at y=1571.5, footer at y=1570.5; Escape restored opener focus. See `after-manifest.json` and `AFTER_RETEST_REPORT.md`.
