# Regression report — HN-S12-UIUX-006

Candidate commit: `d7b82de954358f5d8391888b2e7453df02d2828f` on `DEV` (ahead of `github/DEV` by one commit; not pushed).

| Gate | Result | Evidence |
|---|---|---|
| Baseline allowlist negative control | FAIL as intended | `functional/allowlist-repro.json`: valid `PN-AUTHORIZED-EXTRA` hidden; P1 V01 reproduced |
| Focused S12 regression before fix | FAIL as intended | `implementation/V01-fix-report.md` records expected 4/1 rows, received 0 |
| Focused S12 regression after fix | PASS | `functional/s12-after-fix.json`, `functional/after-retest-playwright.log`: 2 tests passed |
| Visual 8-state actual BEFORE | PASS capture | `visual/before-normal-bfec706/results.json`, 8 screenshots |
| Visual 8-state actual AFTER | PASS capture | `visual/after-normal-v01-workingtree-retry/results.json`, 8 screenshots |
| Before/after diff sets | PASS evidence generated | `visual/retest-v01-workingtree/COMPARISON.json`, 8 review boards/diff sets |
| Typecheck | PASS | `release/local-typecheck.log` and post-fix rerun |
| Build | PASS local | `release/local-build.log`; existing chunk-size warning |
| Hosted CI | BLOCKED | GitHub billing lock; see `release/CI_RELEASE_REPORT.md` |
| Exact public preview provenance | BLOCKED | Canonical manifest reports historical source commit; see `release/preview-provenance.json` |
| REAL_API/authenticated CRUD/RBAC | BLOCKED/NOT_RUN | No approved runtime credentials/API connection in this environment |

No P0/P1 UI layout regression was observed after the V01 fix. Open P2/design gaps: tablet density normalization (V02), source raster CSS profile/DPR authority, and artwork scenario differences (draft/zero-code/empty illustration). These are recorded and not silently promoted to PASS.
