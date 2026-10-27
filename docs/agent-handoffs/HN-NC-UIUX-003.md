# HN-NC-UIUX-003 — Notification Center fidelity

Owner: S00#1. Date: 2026-10-27 UTC+07. Mode: CONTROLLED_AUTOMATION.
Base: DEV / `78752811af4b0434c958d604dc52ca445cdbeede`.

## Input and authority

User requests auto-discovery, real application capture, reference/actual/diff, targeted correction and independent retest. Reference originals: `C:/Users/Admin/Desktop/HN_Astra/1.png` and `2.png`, registered BL-NOTIFY-D/T. Only Notification Center VI/light is artwork approved; shell/sidebar/header excluded. Other themes/locales use existing contracts; missing visuals remain gaps. Sample records are not business constants.

## Routing and leases

| Owner | Files | Deliverable |
|---|---|---|
| S00#6 native design_guardian_nc | docs/quality/uiux-task-HN-NC-003/DESIGN_GUARDIAN_REPORT.md | Reference hashes, scope, mapping, authority/gaps |
| S00#3 native visual_qa_nc | docs/quality/uiux-task-HN-NC-003/visual/**; VISUAL_QA_REPORT.md | Real application before/after, geometry, overlay/diff, defects |
| S00#4 native functional_qa_nc | docs/quality/uiux-task-HN-NC-003/functional/**; FUNCTIONAL_QA_REPORT.md | Functional/impacted regression and limitations |
| S00#2 | Await confirmed defect and explicit lease extension | Minimal owning CSS/component correction |
| S00#5 | Await serialized release audit | CI, Git, provenance and artifact integrity |
| S00#1 | This packet, final acceptance and task state | Integration and evidence-backed verdict |

## Scoped implementation lease extension

S00#3 confirmed VQ-NC003-01 (tablet native-profile placement) and VQ-NC003-02 (tablet close glyph). S00#6 validated a bounded correction under explicitly declared reference normalization; exact original CSS/DPR remains unknown. S00#2 may modify **only `src/notifications/notifications.css`**, and create `IMPLEMENTATION_REPORT.md` in the task directory. Do not touch Desktop placement, shared GlobalModal, icon paths, global tokens, typography/palette or business logic. Preserve 44px close target and 24px viewport clipping guards. Independent S00#3/S00#4 retest required after CSS commit, including 992×1586, 800×1280 and neighboring/short portrait viewports.

Requested runtime model for active audit agents: Sol/high; Terra unavailable in prior actual spawn validation. Actual execution identity unverified unless authoritative metadata is exposed. Do not claim role labels prove identity.

## Acceptance

- Exact source/candidate SHA and source-tree custody for every test run.
- Capture real Notification Center via normal local test login/setup; no production data writes.
- Preserve reference bytes and all before captures. Declare viewport/DPR, clock, locale/theme, fixture and all derived transforms.
- Every defect includes reference, actual, severity, reproduction and measurable correction.
- Centered desktop two-column modal and responsive single-column tablet; no clipping, overflow, unreachable CTA or focus regression.
- Read/unread, badge boundaries, search/filter, mark-all, detail, close, loading/empty/error/offline/retry and shared regressions verified within mock/staging/real API boundaries.
- Independent Visual/Functional QA retests after implementation commit. Missing approved state baselines, hosted CI/provenance and pre-existing regression failures remain BLOCKED/NOT_RUN.
- No shell/global redesign, baseline alteration, production merge or deployment.

## Serialized accessibility lease extension (after CSS commit)

CSS-only candidate: `3ca0ef24e4f3db4e90bbb1e26f0d117c356246fe`.
S00#4 axe4.14.0 independently reproduced two owning shared semantic defects on four authenticated Notification profiles (desktop/tablet, light/dark). S00#2 may now modify only `src/shared/GlobalModal.tsx` and `src/toast/GlobalToastProvider.tsx` to correct invalid implicit banner semantics and prohibited named generic toast container. Preserve all class names, geometry, live announcements, focus and toast lifecycle. No design or business changes. Add meaningful regression coverage for those accessibility contracts in the existing test structure or a task-specific test file. Commit only those runtime changes plus any explicitly reported regression test; extend IMPLEMENTATION_REPORT.md. Shared modal and toast behavior must be independently retested by S00#4 on the final source SHA. S00#3 must capture final geometry after these changes.

Implementation evidence lease additionally permits `docs/quality/uiux-task-HN-NC-003/implementation/**` for source-negative and fixed-run raw receipts copied from ignored output. No installed dependencies or unrelated data may be copied. Persistent shared-semantic browser regression is under `tests/functional/shared-semantics.config.ts` and `tests/functional/wave-ad/shared-semantics.spec.ts`; scanner prerequisite must be explicit and fail when absent, never skip.

## Serialized focus-recovery lease

Independent S00#4 reproduced FQ-NC-003-A11Y-03 (P2) on clean interim `e5ba486fb82a05fcf6cb7aa7b56fda17dc4bcb16`: mark-all → close modal → keyboard-dismiss toast leaves focus on BODY, while the still-connected action origin is inside a hidden dialog (zero client rects). Evidence: `functional/focus-before/`. S00#2 may modify only `src/toast/GlobalToastProvider.tsx` to reject unavailable focus origins and use the existing main-content fallback. Preserve explicit restoreFocus callbacks, active-modal focus handling, layout, events, timers and business logic. Existing failing shared-semantic regression must pass without lowering assertions. Commit this minimal fix separately; independent S00#4 retest required.

## Residual composition lease

S00#6 addendum (read at interim e5ba486) classifies Tablet adjacent unread surfaces touching as a verified P3 composition deviation. S00#2 may additionally modify `notifications.css` inside existing801–1100portrait scope using the precise adjacent-unread sibling boundary selector and semantic surface2px border recommended in that addendum. Preserve occupied row geometry with only measured conditional compensation; no fixed heights, sample-ID selectors or global list gaps. Desktop footer divider P3 may receive the documented scoped padding-top correction only if measured controls retain position. Typography/optical glyph residuals and 1px card-edge uncertainty remain recorded gaps/residuals; no unrelated overrides. Commit CSS separately from focus fix. Independent after-capture and behavioral retest remain mandatory.

## Final scoped contrast lease

On clean e57f6aed S00#4 measured real light Notification contrast failures: placeholder14px400 at3.4024:1; warning status14px400 at3.4246:1. S00#6 reviewed contract and existing shared status colors and authorized a minimal component-only accessibility correction (exact feature palette is PROVISIONAL). S00#2 may edit only notifications.css: light Notification search placeholder opacity1; light warning status text #835811 and success status text #286645 (reuse existing shared status text family). Preserve fills, list icons, dark styles, global tokens, layout and all baseline bytes. Values remain implementation-derived accessibility candidates, not new approved global tokens. Verify reachable success state independently; its source ratio is risk evidence until actual UI measured. Commit CSS only; no source mutations during subsequent final QA.

## Coherent Tablet residual implementation lease

Independent76059cc Visual QA identified VQ-NC003-05/-06 (P2 toolbar/list/footer composition). S00#6's final coherent-calibration addendum authorizes one bounded candidate after S00#4 confirmed current read lease complete. S00#2 may edit only owning `notifications.css` in existing801–1100portrait rules, using the documented combined toolbar/filter/gutters/group-row rhythm/controlled row bleed/footer calibration. Preserve modal placement,44px close,2px unread separation, contrast repair, fonts/icons/business/shared shell and all baselines. No per-record IDs/data constants or competing unexplained overrides. Test injected candidate/geometry and dynamic selection/read/filter/back before commit. Reject any density rule introducing visible selection-dependent list jump; use a stable measured geometry mechanism or retain a documented small residual rather than changing behavior. One source commit after owner-local candidate validation, independent final impacted Visual/Functional retest required.
