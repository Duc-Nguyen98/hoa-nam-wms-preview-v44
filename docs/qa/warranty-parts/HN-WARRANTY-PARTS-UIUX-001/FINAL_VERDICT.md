# Final Verdict — HN-WARRANTY-PARTS-UIUX-001

Date: 2026-10-28 (Asia/Bangkok)
Project: S00_Hoa_Nam_Web
Branch: DEV
Application source commit: 73bf351083efb48af360f3ad2512addb8b028560
Routes:
- #/preview/S09 — Warranty cases
- #/preview/S10 — Parts issue slips
- #/preview/S09?catalog=legacy and #/preview/S10?catalog=legacy — approved historical catalogue projection

## Delivered changes

- Registered and hashed all 14 supplied references (bh-01.png–bh-14.png).
- Added scoped copy controls with success/error feedback for available warranty, slip, SKU, physical and trace identifiers.
- Added explicit legacy catalogue routes without changing the operational default.
- Reflowed S09/S10 operational and legacy Tablet lists to labeled cards with 44px actions and no horizontal clipping.
- Added S09 operational detail section cards and a visual processing timeline.
- Added S10 warranty relation navigation only where the relation is present; unavailable relations remain explicit.
- Updated fixture tests to assert the intentional approved 26-tray seed instead of treating it as leakage.
- Preserved GlobalShell, business invariants, MOCK/REAL_API boundary and source fixtures.

## Evidence and test status

- Design custody: 14/14 reference hashes verified — PASS.
- Visual before captures: 14/14 local captures with zero console/network errors.
- Final visual retest: 8 captures (S09/S10 legacy list/detail, Desktop/Tablet), zero console/page/network errors, no overflow, 44px actions — PASS.
- npm run typecheck — PASS.
- npm run quality:contract — PASS (13 states, 26 references).
- npm run build — PASS; only the existing large-chunk advisory.
- Public demo flow — PASS (2/2).
- S09/S10 operational binding tests — PASS (22/22 evidence run).
- Browser harness against current auth/setup — BLOCKED by stale selectors/navigation context.
- REAL_API, production RBAC and hosted visual/functional CI — BLOCKED; current evidence is browser-preview MOCK.
- Open visual P2: S10 operational detail is denser than the business-facing reference.
- Partial fixture gap: current historical adapters expose 7 rows while references depict 9; no screenshot data was hard-coded to hide this gap.

## Preview deployment

- Preview URL: https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site
- Site version: 61.
- Deployment: appgdep_6ae21fff8aa081918448306a00900581 — succeeded.
- Site source snapshot: 63fe0af5acc674de1999e6adc561c111900ba890.
- /build-info.json: HTTP 200, sourceCommit=73bf351083efb48af360f3ad2512addb8b028560, build ID 0f2cce9cbfc97315331cea96fa863190cbdc3d400640c753c2fdbc7eaa1b6bc1.

## Verdict

- VISUAL_VERDICT: PARTIAL — all P1 layout defects closed; one P2 density gap and one fixture-density gap remain documented.
- FUNCTIONAL_BUSINESS_VERDICT: PARTIAL/BLOCKED — local MOCK business tests pass; browser certification and REAL_API/RBAC evidence are unavailable.
- RELEASE_VERDICT: PREVIEW_DEPLOYED / NOT_RELEASE_READY — Preview is deployed and provenance verified. Production rollout remains blocked until hosted CI/browser harness, REAL_API/RBAC evidence and the remaining P2/design gaps are resolved.

Rollback target: prior Site version 60, deployment appgdep_6ae1dcf2e520819184796cdcfa1d84c1, with build ID eef02039dbaabea7807ebd88ec9f2869871cb9009043b809796c48064a13e163.

