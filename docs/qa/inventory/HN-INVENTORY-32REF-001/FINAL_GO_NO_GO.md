# Final acceptance — HN-INVENTORY-32REF-001

**Overall: PARTIAL. MODULE_ACCEPTED is not declared. RELEASE BLOCKED; public Preview was not updated.**

Final application source: `3f8cf44ac531d72d50a42003cafecf6d726085ca`, branch `candidate/inventory-32ref-20261029`, pushed to GitHub. Base `57b9f399a55d41d43ecad7a31e1b279da2cda717`. Local static build ID `ec7027a6f60c22cd53ab541636359823832a48424ecb8e688a39a6e7a52b0dab` identifies the tested source. A later evidence-only commit does not change that tested build identity.

## Verdicts and executed evidence

| Gate | Result | Actual evidence / limits |
|---|---|---|
| Input custody | PASS |32/32 original hashes/dimensions/sizes match supplied manifest;16Desktop+16Tablet |
| UI implementation / visual | PARTIAL |32 final fixed-viewport captures,13 full-content supplements,32 reference/actual/overlay/diff sets;12 visual findings fixed,3P2 partial; no P0/P1 in approved profiles |
| Build / typecheck | PASS |`gates/build-contrast-final.log`, `gates/results-contrast-final.json`; exact source above; pre-existing large-bundle warning retained |
| Contract / whitespace | PASS in command scope |`gates/tests-latest.json`, `contract-latest.log`; base-to-source `git diff --check` clean. Existing contract command covers legacy state/reference policy, not automatic approval of these32 designs |
| Unit / impacted regression | PASS |20/20 across three current-source TAP receipts:5 fixture assertions plus15 existing S16/S21/putaway/history/seed tests. [Aggregate receipt](gates/unit-summary-latest.json) |
| Build provenance | PASS |4 current-source process checks: reject malformed SHA, preserve unknown archive identity as unverified, honor explicit archive SHA, separate current Git SHA from historical import. [Receipt](gates/build-provenance-latest.json) |
| Fresh final browser QA | PARTIAL |44PASS /1FAIL(P2) at final source on static build; includes36/36 VI/EN/zh-CN × Light/Dark semantic state checks. Separate final-source variance-coverage probe PASS |
| Same-task logic coverage carried forward | PASS with explicit equivalence |41 normal-app and15 isolated checks at baebfc49 retained under their original SHA. Production JS2/2 hashes match final build; only Light muted CSS/EOF changed. These are not relabeled as newly rerun or added to a misleading unique-test total |
| Data neutrality | MOCK_PASS |Canonical operational revision69 unchanged after reads; fixture actual/held/count/snapshot contracts pass. No real backend stock/audit immutability claim |
| Authentication / scope | MOCK_PASS / BLOCKED |Normal QA login/setup, client8h expiry and fixture scope rejection tested. Backend RBAC/data scope/real API cannot be verified from this fixture frontend |
| Hosted CI | BLOCKED / NOT VERIFIED |No exact-source hosted statuses established. Existing workflow deliberately exits1 for visual harness wiring; current billing status NOT VERIFIED, not assumed from old billing reports |
| Existing public Preview | Candidate NOT_DEPLOYED |Sites still version63 with old source bfddf139…; no candidate deployment or public current-SHA acceptance |

[Independent functional report](functional/INDEPENDENT_FUNCTIONAL_QA_FINAL.md), [machine counts](functional/final-3f8cf44/functional-summary.json), [independent visual report](visual/FINAL_VISUAL_RETEST_REPORT.md), [release audit](release/CI_PREVIEW_REPORT.md).

## Remaining defects and blockers

| ID / severity | Remaining condition | Next action |
|---|---|---|
| VQ-INV-001 / P2 |Tablet SKU location-card metadata and quantity labels are crowded, with BOX count wrapping |Refine named metadata areas without shrinking text or changing44px controls; preserve3×3 allocation and totals |
| VQ-INV-014 / P2 |Native date inputs show US control order under VI despite `lang`; displayed snapshot/history dates are localized |Use established locale-visible date treatment while retaining valid ISO values and scoped date rules |
| VQ-INV-015 / P2 |Tablet movement/history group hierarchy differs from reference; full IDs/timestamps/actors wrap more |Group metadata according to reference, keeping all fields and actions |
| INV-F-011 / P2 |At experimental400×640 layout simulation, some initial row content/actions are clipped inside a hidden overflow wrapper |Add a compact/reflow treatment if this narrower profile is supported. Pointer auto-scroll reaches detail; this is not claimed as an actual browser200% zoom test or a failure of768/800 target profiles |
| API / RBAC / BLOCKED |No authoritative held/count/snapshot/history endpoints and role/scope contract for this design |Define adapters against permitted staging endpoints and verify real role-specific accounts; do not replace known operational ledger semantics with fixture numbers |
| CI / BLOCKED |Hosted visual job is intentionally unwired; current hosted check/billing state not established |Wire portable capture/functional harness and credentials in the approved CI environment, then run exact candidate checks |

No unresolved P0/P1 was found in the tested Candidate profiles. This does not mean an untested backend or narrower viewport is certified. No reference/baseline or assertion was weakened to close defects. Three bounded presentation rounds were followed by a separate Sol logic repair and a measured AA token correction.

## Delivered implementation and integrity

`src/app/App.tsx` adds an explicit browser-Candidate opt-in. New S16 approved workspace/adapter/CSS supply the16 states and linked lookup→SKU→BOX→tray/movement and reconciliation→variance→saved-result flows. Default operational screens and locked shared shell/Toast source are unchanged. `scripts/write-build-info.mjs` now records current build source separately from import history.

DRV120−20=100, WIR1200−200=1000, DRV count118−120=−2, BOX00120/18/−2, nineSKUs3/3/3 and KH001oneBOX are verified. Unknown BOX allocation for non-DRV SKUs is explicitly unavailable, preserving known SKU balances; complete-empty coverage is tested separately. Current and saved detail reject mismatched scope. No production mutation, stock adjustment, new role grant, snapshot creation, protected-branch push, merge or deploy was performed.

## Access, screenshots and rollback

- [Local tested Candidate](http://127.0.0.1:5341/?inventoryDesign=20261029#/preview/S16?view=stock), normal QA login required; environment MOCK.
- [32-case image index](visual/VISUAL_EVIDENCE_INDEX.md): original references, initial Candidate, final actual, full-content supplements, overlay and diff. Diagnostics preserve full content and use transparent proportional normalization, not a pixel PASS threshold.
- [Four-screen operational before/after regression](functional/REGRESSION_RBAC_REPORT.md), [state matrix](functional/SCREEN_STATE_MATRIX.md), [data integration boundaries](DATA_INTEGRITY_REPORT.md), [actual agent trace](AGENT_EXECUTION_TRACE.md).
- [GitHub Candidate branch](https://github.com/Duc-Nguyen98/hoa-nam-wms-preview-v44/tree/candidate/inventory-32ref-20261029). No PR was created and DEV was not merged.
- [Existing public Preview](https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S16) remains Site63; it does **not** contain this Candidate revision.

Rollback: the existing Site63 is unchanged. Remove `inventoryDesign=20261029` locally to use the preserved operational S16. Revert the four candidate source commits through normal review to remove the feature; no data migration is needed. Keep the evidence-only commit and immutable reference custody available for audit.
