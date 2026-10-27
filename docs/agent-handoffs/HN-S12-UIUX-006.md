# HN-S12-UIUX-006 — Inbound Receipts

- **Project:** S00_Hoa_Nam_Web
- **Task ID:** HN-S12-UIUX-006
- **Target:** `#/preview/S12` — Danh sách phiếu nhập / Inbound Receipts
- **Candidate branch:** `DEV`
- **Base SHA:** `bfec7060cdf422a112ec5e644bf0b51401d9bda2`
- **Checkout:** `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`
- **Coordinator:** S00#1
- **Status:** IN_PROGRESS — source frozen pending design custody and eight BEFORE captures

## Scope

Design references supplied by the user are registered as `15.png` through `22.png` and must be copied/hashed into the task evidence directory. They cover desktop/tablet populated list, create modal, detail modal, and validation error states. Existing locked GlobalShell/shared components and fixture/business logic remain out of scope unless a confirmed dependency defect is recorded.

## Ownership

| Work | Owner | Evidence | Write scope |
|---|---|---|---|
| Design custody, acceptance matrix, design gaps | S00#6 Design Guardian | `design/` | task evidence only |
| Browser discovery, 8 BEFORE captures, geometry/visual defects | S00#3 Visual QA | `visual/` | task evidence only |
| Functional and data-state QA | S00#4 Functional QA | `functional/` | task evidence only |
| Confirmed scoped fixes | S00#2 CRUD Lead | S12-owned source only after defect confirmation |
| Git/CI/preview provenance | S00#5 GitHub | `release/` | task evidence only |
| Coordination/final verdict | S00#1 | handoff + final reports |

## Required gates

1. Design references copied and SHA-256 recorded; no viewport/DPR inferred from file size.
2. Eight real browser BEFORE captures on the exact candidate SHA: desktop create/populated/detail/validation and tablet populated/detail/create/validation.
3. Visual and functional defects are reproduced and severity-ranked before any source edit.
4. Fix → unit/build → independent visual/functional retest on exact candidate SHA.
5. Git/CI/preview provenance recorded; hosted CI or preview is NOT_RUN/BLOCKED when unverified.
6. Final verdict is PASS/PARTIAL/BLOCKED/FAIL only with evidence; no production merge/deploy.

## Scenario constraints

Reference receipt rows are illustrative (`PN-0012`, `PN-0011`, `PN-0010`, statuses and supplier labels); do not hard-code them. Reference 16's populated rows plus empty-state illustration must be classified by Design Guardian as documentation/example or coexisting UI. Do not change business logic or source fixtures to force reference data. Public demo credentials are runtime-only and must never be persisted in reports/screenshots.

## Handoff sequence

`DESIGN_READY -> BEFORE_CAPTURE -> QA_FINDINGS -> IMPLEMENTATION (only confirmed defects) -> RETEST -> RELEASE_AUDIT -> FINAL_VERDICT`.

Any unavailable environment, missing baseline, missing credential, or unverified deployment is explicitly `BLOCKED` or `NOT_RUN`, never PASS.
