# HN-S27-UIUX-005 — S27 Audit Log fidelity / audit integrity

Owner: S00#1. Branch: DEV. Base: bde0e4292ae4a7db569c7a5d56bce0c7ffa8e703.
Workspace: E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026.
Evidence: docs/quality/uiux-task-HN-S27-005/.

## Inputs / authority

User supplied C:/Users/Admin/Desktop/HN_Astra/9.png (desktop list), 10.png (tablet list), 11.png (desktop modal), 12.png (tablet modal). Immutable scoped references; modal backdrop does not replace locked shell. Raster size does not establish CSS viewport/DPR. Existing DESIGN_CONTRACT v1.2.0-recovery remains unchanged. Exact unpublished dimensions/tokens remain DESIGN_GAP. Theme/locale beyond VI/light use semantic contracts.

## Workflow and leases

DESIGN AUDIT + BEFORE CAPTURE + FUNCTIONAL AUDIT -> CONFIRMED DEFECT -> IMPLEMENTATION -> SOURCE COMMIT -> INDEPENDENT VISUAL/FUNCTIONAL RETEST -> RELEASE AUDIT -> FINAL VERDICT.
No runtime/test edits until four BEFORE states are captured on the clean base and S00#1 releases the implementation lease.

| Role | Ownership / allowed writes | Review / output |
|---|---|---|
| S00#1 | this packet, root reports, integration/, protected-source manifest; integration commits | scope, dependencies, acceptance, trace |
| S00#6 Design Guardian | design/, DESIGN_ACCEPTANCE_MATRIX.md, DESIGN_AUTHORITY_REPORT.md, DESIGN_GAP_REPORT.md | immutable reference hashes, measurement map, scenario authority; no source edits |
| S00#3 Visual QA | visual/, VISUAL_QA_REPORT.md, VISUAL_DEFECT_REGISTER.md | actual browser capture, geometry/CSS/overlay/diffs for four states; independent retest |
| S00#4 Functional QA | functional/, FUNCTIONAL_QA_REPORT.md, AUDIT_INTEGRITY_REPORT.md, RBAC_REPORT.md, functional defect receipts | actual current-app and targeted tests, source scenario investigation; independent retest, no runtime edits |
| S00#2 Implementation | src/features/S27/** and tests/s27-*.test.ts; isolated tests/s27/** only upon confirmed packet | minimal confirmed fixes, implementation/ and IMPLEMENTATION_REPORT.md; QA by S00#3/#4 |
| S00#5 Release | release/, CI_RELEASE_REPORT.md | read-only branch/CI/provenance/artifact audit; no source edits/push without coordinator |

No two owners edit the same files concurrently. Shared source, schema, DatePicker, shell, Notification and business rules outside S27 are protected. Any necessary exception requires S00#1 dependency analysis and recorded serialized lease. Native agents are separate from historic sidebar chats. Record real dispatch/receive/artifact and requested model; actual runtime telemetry is UNVERIFIED unless exposed. GPT-6.1 Terra is unavailable in current callable runtime; supported Sol is an explicit fallback, not a claim that Terra ran.

## Acceptance

- Four actual browser BEFORE/AFTER captures plus immutable references/overlays/diffs/geometry.
- Desktop table/tablet cards; responsive modal, original ID copy, focus/scroll/footer and no overflow.
- Source-backed deterministic test scenario; no fabricated missing IDs, mutated source fixture or production writes.
- Search/filter/date/order/page/detail/reload/immutability/scoped RBAC and supported states tested with MOCK/STAGING/REAL_API explicit.
- Exact candidate SHA on test reports; build/typecheck/scoped tests and impacted regression run now. NOT_RUN != PASS.
- No open P0/P1; fidelity/authority gaps block exact acceptance. Max three repairs per root cause before reanalysis.
- Hosted CI / deployed SHA independently verified or BLOCKED; local results never replace hosted tests.
- No production merge/deploy, baseline replacement, suppressed tests or retired W writes.

## Initial dispatch

2026-10-27: root discovered clean DEV/base above, actual S27 operational and alternate snapshot components, existing Playwright infrastructure. Base browser source will run at http://127.0.0.1:5287; source frozen pending BEFORE capture.

## Bounded repair release — round 1

S00#3 confirmed all BEFORE browser contexts closed; clean bde0e429 source start/end. Actual normal25Oct default is empty,26Oct normal source fails integrity. Real ready-state modal BEFORE therefore BLOCKED in normal environment. Four ready-state screenshots plus native diagnostics captured through existing tests/s27/harness.html using real S27 components and explicitly labeled QA_SYNTHETIC; these do not replace normal blocked evidence.

S00#4 independently confirmed S27-F002 P1: source62audit events;18legitimate approved putaway subaudits each refer to one of27events in a shared batch proof. S27 incorrectly compares each per-entity eventIds to the entire proof population. Preserve canonical population validation, actor/command/time/scope/version/FK and reject foreign/missing/duplicate event relations. No provider/schema changes.

S27-F001 P2: initial preview period hardcodes25Oct. Approved fix removes reference-specific branch and uses actual current Vietnam date consistent with reader/DatePicker. Explicit user-selected period remains unchanged. Current-date empty and source26Oct data are legitimate separate states; do not automatically select26Oct or change business clock.

Source write lease released to /root/s27_implementation only after frozen captures closed. Additional bounded visual repairs V02missing desktop note, V03tablet code typography, V04tablet divider/copy border, V06undersized copy controls; V05compact pagination without hiding page-size or reducing44CSS targets. Allowed files remain src/features/S27/** and tests/s27-*.test.ts / tests/s27/**; protected source elsewhere unchanged. Independent S00#3/#4 retest follows source commit. Design exact numeric normalization gaps remain open, no approval bypass.

## Closure receipt

Source chain cc030be→d80255b→ebcf0d3; final source ebcf0d360e52bf2036c5a3c531563675ebf3580c; src4360e98244c6308d14de19d50301fb0945c231f6 /tests85450783eeadd34277b48bcc0ebd15bd36e3f8be.577protected source files unchanged. Normal GitHubDEV storage verified; no main/Sites/production merge or deployment. Evidence-only commit may advance HEAD with these same source/test trees.

Independent final gates24Node and6actual affected800locale/theme profiles PASS; d80255b24modal profiles/16contrast and cc030beall62details/8negative controls/23flow/shared smoke transferred only with exact diff qualification. V04 actual-only CSS cascade and V10Range overlap detected by independent QA, repaired after every active browser custody closed, retested without baseline changes.11unique roots:10bounded repairs verified, V07P2geometry remains open. Module/backend/productionRBAC/append-only/fullaccessibility/state/profile authority gaps retained explicitly. Exact final hostedCI billing blocked, critical0steps; publicdeployedSHA unverified. Final verdict PARTIAL; not ROLLOUT_READY. Owner reports/assets frozen for final integrity audit; root reports are FINAL_REPORT.md/EVIDENCE_INDEX.md/DEFECT_REGISTER.md/REGRESSION_REPORT.md and AGENT_EXECUTION_TRACE.md in the task directory.
