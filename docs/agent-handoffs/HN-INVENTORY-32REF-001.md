# HN-INVENTORY-32REF-001 — task packet

Base: 57b9f399a55d41d43ecad7a31e1b279da2cda717; candidate branch candidate/inventory-32ref-20261029. DEV integration only after local QA. Rollback: base commit and existing Site63. Evidence docs/qa/inventory/HN-INVENTORY-32REF-001/.

Authority: supplied PROMPT_S00-1.md with32manifest-validated references; normalized navy/teal, Desktop1920x1080 DPR1, Tablet800x1280 DPR2. Keep locked Shell/Toast/business logic unchanged. No new real backend reconciliation semantics assumed.

Architecture decision: Existing S16 operational stock is ledger-only, actual/count null; legacy reconciliation means onHand-ledger. Approved count-system snapshots, held quantities and history require missing backend contracts. Implement separate typed read-only Candidate adapter and S16 workspace, explicitly opt-in via URL ?inventoryDesign=20261029#/preview/S16. No fallback from real API to fixture. Canonical operational S16 remains preserved without opt-in. Production integration gate BLOCKED.

File leases:
- S00#2 implementation: NEW src/features/S16/approved/* only; new typed read-only adapter/contracts and fixture within that folder. NO InventoryScreen integration/shared source edits.
- S00#1: InventoryScreen opt-in integration only, test harness/capture orchestration, release/provenance.
- S00#6: evidence design/ only; S00#4 functional/ and tests/inventory-fidelity/ only.

Required:16states and linked list->SKU->allocation->BOX->tray/history; reconciliation->difference->saved snapshot. Correct fixture totals, immutable read-only adapter, search/filter/pagination/sort where offered, return context;6state panels with shared PageState; localization/theme; no auth bypass.

Acceptance:32actual captures +reference/actual/diff, before4existing screens, data arithmetic tests, independent browser QA+regression on candidateSHA. Run build/typecheck/quality gates. Missing realAPI/RBAC/reference pixelprofile remains BLOCKED; do not publish through failed gates. Max3concurrent tasks. Bounded remediation up to3perroot cause. No production mutations/deploy.
