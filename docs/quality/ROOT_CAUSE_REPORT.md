# Root Cause Report — HN-NC-MA-PILOT-002

Candidate: `0136e5e8bb3627f0f4f80b1ef8be770a34858e7b` on `DEV`.

## Confirmed findings

1. **Regression contract mismatch (FQ-001).** `tests/public-demo.test.ts` and `tests/warranty-parts/public-demo-flow.test.ts` expect four receipts and a narrow stock map. The current setup returns 31 receipts and additional `SKU-HN-*` rows. The failure reproduced twice and remained after independent runs. The accepted additive seed contract was not supplied, so expected values were not changed.
2. **Intermittent public setup stall (VQ-001/FQ-005).** Earlier public sessions exceeded 180 seconds. S00#2 ran three public and three local sessions in approximately 23–30 seconds with reload and no console/page errors, but could not reproduce the stall or identify a root cause. This is unresolved, not fixed.
3. **Visual authority/provenance gaps.** S00#6 recovered historical sources and hashes but could not close exact current shell geometry, S01 state/paging authority, detail modal variant, toast occlusion, or all locale/theme references. A visual diff cannot be accepted as a design approval until these are resolved.
4. **Release control gap.** GitHub Actions run `40425469630` stopped before a runner because account billing is locked. DEV is unprotected, DEV pushes do not trigger the workflow, and the visual/functional job contains an unconditional `exit 1` placeholder. The current hosted/deployed SHA is therefore untrusted.

## Not established

- No production backend, API, RBAC or persisted-data root cause was tested; these remain `NOT_RUN`.
- No runtime fix SHA exists for the setup stall or seed mismatch.
- No design baseline was changed and no test was removed or weakened.

## Required next actions

Obtain Design Guardian authority for the seed contract and setup SLO; then reproduce on a pinned candidate SHA, implement the smallest scoped fix, and run independent retest. Separately, restore CI billing, replace the placeholder job with real runners/artifacts, and verify preview provenance before any release decision.
