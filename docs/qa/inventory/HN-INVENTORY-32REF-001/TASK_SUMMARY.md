# HN-INVENTORY-32REF-001 — inventory / reconciliation candidate

Owner S00#1. User authority: supplied `PROMPT_S00-1.md`, approved 2026-10-29. Base `57b9f399a55d41d43ecad7a31e1b279da2cda717`; branch `candidate/inventory-32ref-20261029`. Final source candidate `3f8cf44ac531d72d50a42003cafecf6d726085ca` (first implementation commit `956672b1b3b4a23675f43e6dbe0f678c57a2bc25`).

## Implemented scope

The S16 opt-in workspace implements stock lookup, SKU/location overview, BOX allocation, BOX detail, tray detail, movement lookup, current counted-stock reconciliation, BOX variance, saved reconciliation history/detail, and six semantic states. It uses frozen typed fixtures and separate snapshot copies. Available = actual − held; counted variance = count − actual. It exposes no write or stock-adjustment action.

The existing operational S16 derives ledger values and has no authoritative actual/count/held snapshot contract. Replacing those semantics with image data would invent business behavior. The new workspace therefore uses the explicitly authorized Candidate fixture option. It does not silently fall back from an API to mock data. Default operational S16/S11/S20/S21 and locked shared source remain unchanged.

Local authenticated candidate: `http://127.0.0.1:5341/?inventoryDesign=20261029#/preview/S16?view=stock`. Normal QA login/setup is required. Hash `view` values: `stock`, `sku`, `allocation`, `box`, `tray`, `movement`, `reconcile`, `difference`, `history`, `snapshot`. State fixtures: `scenario=loading|empty|no-results|error|forbidden|not-found`. These parameters select Candidate fixtures; they are not backend authorization controls.

## Evidence custody

- [Design authority, immutable originals and 32-reference validation](design/REFERENCE_MANIFEST.md).
- [Component/route/API mapping](design/COMPONENT_ROUTE_MAPPING.md), [acceptance matrix](design/DESIGN_ACCEPTANCE_MATRIX.md).
- [Operational BEFORE captures and data-neutrality baseline](functional/FUNCTIONAL_BASELINE_REPORT.md): four screens × two devices, source base above.
- `visual/round1`: 32 initial Candidate captures; uncommitted source hashes are recorded in its manifest. These are not mislabeled as the base's operational UI.
- `visual/round2`: 32 captures at source `956672b1…` following the first independent defect handoff.
- `visual/round3`: 32 fixed-viewport captures at intermediate source `00e06e9a…`, with full-page supplements where content scrolls, DOM, computed styles, control geometry, console/request failures, DPR and source hashes.
- Original reference raster sizes differ from the runtime profile. Runtime is Desktop 1920×1080 CSS/DPR1 and Tablet 800×1280 CSS/DPR2, browser Chromium, VI/light, Asia/Ho_Chi_Minh. No claim that PNG dimensions establish a certified CSS viewport.

## Boundaries and rollback

Source changes are `src/app/App.tsx` plus `src/features/S16/approved/{adapter.ts,InventoryDesignWorkspace.tsx,approved.css}`. App only resolves the opt-in S16 query and selects the workspace; default business adapters remain intact. No shared shell, Toast, database, backend schema, permission or production data changes.

Rollback without data migration: use the previous deployed Site63, or remove the opt-in query to return to operational S16. To remove the source feature, revert the four candidate source commits through normal review. No reset of another agent's work is required.

Final acceptance, remaining defects and release disposition are in `FINAL_GO_NO_GO.md`; build success alone is not acceptance.

Authoritative final capture set: `visual/final-build-3f8cf44/`, from the built static Candidate at port5341. Build ID `ec7027a6f60c22cd53ab541636359823832a48424ecb8e688a39a6e7a52b0dab`, exact source `3f8cf44ac531d72d50a42003cafecf6d726085ca`. The interrupted `visual/final-baebfc4/` Vite capture is INVALID_ENVIRONMENT and excluded. Artifact HTML writes triggered development-server reloads; final capture writes DOM text and uses static built output. The invalid attempt is retained for traceability.

Additional targeted repair after the presentation rounds introduced explicit complete/unavailable allocation coverage, protected current variance against mismatched warehouse/result context, and added working local resets for movement/saved-result no-result panels. Unknown allocation never replaces known SKU balances with zero. DRV allocation remains complete; other SKU balances remain known while missing BOX population is explicitly unavailable.

Bounded release metadata correction: `scripts/write-build-info.mjs` now separates current Git/build-environment source SHA from historical imported-source provenance. Missing archive identity is unverified; invalid identity is rejected. Four process-level checks passed. `SOURCE_PROVENANCE.json` history is unchanged.


Final AA repair darkened only the feature Light muted-text token (#637c98 to #536d89) and removed trailing blank EOF lines. Computed contrast:5.362:1 on white and4.871:1 on the page surface; Dark unchanged. Exact-source build/capture and fresh critical/locale/reflow retest followed this change. Final disposition is PARTIAL / RELEASE BLOCKED; see FINAL_GO_NO_GO.md.


