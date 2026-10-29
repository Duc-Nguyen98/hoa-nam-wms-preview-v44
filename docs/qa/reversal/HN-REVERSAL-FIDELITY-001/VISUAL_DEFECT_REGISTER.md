# Defect and repair index

[Independent final visual register](visual/VISUAL_DEFECT_REGISTER.md) and [visual QA report](visual/VISUAL_QA_REPORT.md) govern fidelity at source e7b145feb3d8ec4b42bb2ba8fa66bfb5b3d9bf2f. No P0/P1 visual defect was observed in the reviewed36 captures; this is not formal approval of every pixel.

| Finding | Baseline / severity | Final disposition and proof |
|---|---|---|
| FID-F01 operation key/input lost on list/reload/reopen | P1; four baseline browser failures | FIXED, independent B01–B03/model replay proofs PASS; original intent persisted before request; status read does not post |
| FID-F02 saved draft/source selection lost | P2 | FIXED, B04/B05/B20 PASS |
| FID-F03 independent tabs accept stale duplicate posting | P1 in isolated model | FIXED, CAS single winner B06/B07/R08/R11 PASS; no backend inference |
| FID-F04 document remainder mislabeled as stock | P2 | FIXED, document-qualified labels B09 PASS; actual SKU stock remains unavailable |
| FID-F05 unlike units rendered/totalled as Cái | P2 bounded extension | FIXED per-line/grouped units B12 PASS; live precision rule remains MISSING |
| R10 malformed persisted reads accepted | independent negative guard failures | FIXED, 28-contract run retains rejection/corrupt-byte preservation assertions |
| R11 stale scratch acquires latest revision and overwrites winner | independent two-session failure | FIXED, explicit base-version rejection and winner preservation B07/model PASS |
| Tablet date clipping | confirmed during source35c59fa review | FIXED by294c9d0; B23 tests600/759/760/800 in three locales PASS on final source |
| Duplicate impact totals | confirmed during final composition review | FIXED bye7b145f; B21 exactly one summary, three chain totals, nine lines/seven fields PASS |
| VQ-F01 impact/trace hierarchy and Tablet density | P2 visual | OPEN / ESCALATION_REQUIRED after bounded UI remediation; desktop remains stacked instead of side-by-side, no approval inferred |
| VQ-F02 Tablet list filter/summary grouping | P2 visual | IMPROVED through scoped UI repair; principal rows corrected, remaining visual details pending review |
| VQ-F03 missing review audit event | authority/data gap | BLOCKED; render three known events only, never invent fourth event |

Seven functional/model root-cause groups and two additional technical presentation defects have final independent regression proof. Those counts are findings, not sums of test executions. Two visual findings remain open/improved, plus one audit authority gap. [Baseline failures](functional/PHASE_A_NEGATIVE_AUDIT.md), [final acceptance](functional/e7b145f-final/FINAL_ACCEPTANCE.json). Prior failed attempts remain immutable. The visual sequence a98b035 →35c59fa →294c9d0 →e7b145f is retained; continued blind CSS adjustment for the same composition is stopped pending a bounded hierarchy review. No baseline, business event or protected shared shell was changed.
