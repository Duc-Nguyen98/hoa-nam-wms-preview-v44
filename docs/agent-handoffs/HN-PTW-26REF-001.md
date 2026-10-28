# HN-PTW-26REF-001 — Putaway Management

- **Project:** S00_Hoa_Nam_Web
- **Contract:** PTW-01 — LOCKED
- **Target routes:** `#/preview/S13` queue, `#/preview/S14` orders, `#/preview/S11` trays, `#/preview/S14/history` history
- **Branch:** `DEV`
- **Base SHA:** `bca3db9062c9246d1fe780fc9e52110128d40859`
- **Checkout:** `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`
- **Status:** IN_PROGRESS — Wave A custody/discovery

## Ownership and evidence

| Area | Owner | Evidence | Write scope |
|---|---|---|---|
| Reference custody, design authority, PTW-01 matrix | S00#6 | `design/` | evidence only |
| Browser discovery, 26 BEFORE states, visual diff | S00#3 | `visual/` | evidence only |
| Functional/E2E/business invariants/RBAC | S00#4 | `functional/` | evidence only |
| Confirmed scoped implementation | S00#2 | Putaway-owned source/tests only |
| Git/CI/preview provenance | S00#5 | `release/` | evidence only |
| Orchestration and final verdict | S00#1 | packet + final reports |

## Invariants

Draft creation must not create BOX–TRAY mapping. Only confirmed putaway creates one effective mapping. Confirmation is whole-BOX and stock-neutral; stale versions, duplicate commands and unauthorized access must fail closed. Cancelled/failed operations do not count as mappings or successful history.

## Reference order

REF-01..13 map to the user-supplied `01_`..`13_` groups; each has Desktop and Tablet source files. PNG dimensions are custody metadata only; CSS viewport/DPR must be established by capture evidence.

## Workflow

`DESIGN_READY -> ROUTE_DISCOVERY -> BEFORE_CAPTURE -> QA_FINDINGS -> FIX (confirmed defects only) -> RETEST -> RELEASE_AUDIT -> FINAL_GO_NO_GO`.

Hosted CI, public preview provenance, REAL_API/RBAC and any unavailable fixture must be recorded as BLOCKED/NOT_RUN. No production mutation, merge or deploy is authorized by this packet.
