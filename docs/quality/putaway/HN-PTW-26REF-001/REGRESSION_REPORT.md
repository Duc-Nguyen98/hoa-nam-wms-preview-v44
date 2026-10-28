# Regression report — HN-PTW-26REF-001

| Gate | Result | Evidence |
|---|---|---|
| Reference custody | PASS 26/26 | `design/REFERENCE_MANIFEST.json` |
| Seed identity/link regression | PASS 5/5 | `tests/putaway-approved/*.test.ts` |
| S15/S16 operational regression | PASS 33/33 | `functional/` command logs and report |
| Typecheck/build | PASS | local build on fix commit; existing chunk warning |
| Browser MOCK flow | PASS in reachable scope | functional and visual AFTER manifests |
| Visual baseline coverage | PARTIAL | 14 BEFORE captures; 12 blocked; 4 fixture/density FAIL |
| Visual post-fix retest | PASS in affected scope | `visual/after/AFTER_MANIFEST.json`, `visual/diff/` |
| Empty/stale/no-tray/forbidden states | BLOCKED/NOT_RUN | missing approved fixtures/RBAC |
| REAL_API/staging/DPR2 | BLOCKED/NOT_RUN | environment unavailable |
| Hosted CI/public preview | BLOCKED | `release/CI_RELEASE_REPORT.md` |

No P0 remains. FQ-PTW-001 and FQ-PTW-004 are FIX VERIFIED. Remaining open issues are P2 visual normalization and environment/fixture gates.
