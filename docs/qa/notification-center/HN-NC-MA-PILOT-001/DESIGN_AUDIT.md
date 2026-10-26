# Notification Center design audit

Candidate: `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`
Design owner: S00#6
Status: **DESIGN_READY_BLOCKED**

The approved HN_Astra 1–6 source images are registered as page-component authority for Notification Center and S01 Default/detail. Sidebar and Menu/Header are explicitly excluded and retain a separate, unrecovered approval. The design package preserves source hashes and does not promote observed CSS values to approved tokens.

Key gaps:

- Global shell artifact/version and token precedence are unresolved.
- S01 viewport, DPR, date, pagination and scenario/count semantics are unresolved.
- Notification loading/empty/error/denied/expired and dark/locale baselines are not registered for public comparison.
- Toast placement versus required CTA non-occlusion requires a design decision.
- Exact typography, icon and ZH fallback approval is incomplete.

Evidence: [Design Contract](../../../../docs/quality/DESIGN_CONTRACT.md), [Design Gap Report](../../../../docs/quality/DESIGN_GAP_REPORT.md), [Baseline Manifest](../../../../docs/quality/BASELINE_MANIFEST.md), [Design to Code Mapping](../../../../docs/quality/DESIGN_TO_CODE_MAPPING.md).

No baseline, token or runtime design was changed to force a test result.
