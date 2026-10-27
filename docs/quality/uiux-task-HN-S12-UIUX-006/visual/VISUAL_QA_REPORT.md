# S12 Visual QA — BEFORE candidate

> **Latest status:** [independent AFTER retest](AFTER_RETEST_REPORT.md) verifies V01 FIXED on the recorded working-tree candidate:31/31records render on both profiles;8AFTER and8before/after diff sets complete. No observed visual regression. Overall visual verdict remains PARTIAL because source normalization/scenario gaps and P2 V02 remain open. The report below is the preserved BEFORE assessment; its P1/data FAIL and NOT_RUN statements apply to base only. Parent explicitly requested this status update; `BEFORE_MANIFEST.json` remains the historical pre-update hash record.

Task HN-S12-UIUX-006 · S00#3 · 2026-10-28 UTC+07

**Visual verdict: PARTIAL.** Eight canonical actual-route states were captured successfully. Observed responsive/modal safety checks PASS. Exact reference fidelity is BLOCKED by unregistered source CSS viewport/DPR and list/detail scenario differences. **Data-integrity gate: FAIL, OPEN P1 V01** (31 adapter receipts reduced to4 by an artwork-code allowlist). No P0/P1 layout defect was observed. AFTER/retest is NOT_RUN on this base report.

## Candidate and environment

- Checkout: `E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026`, branch DEV.
- Exact SHA: `bfec7060cdf422a112ec5e644bf0b51401d9bda2`; src tree `4360e98244c6308d14de19d50301fb0945c231f6`; tests tree `85450783eeadd34277b48bcc0ebd15bd36e3f8be`.
- Actual route: `http://127.0.0.1:5290/#/preview/S12`, local Vite serving candidate source. Route recovered from `s00-navigation.ts`, registry and App, mounting ReceiptsScreen → OperationalReceipts current-session cohort.
- Desktop:1920×1080 CSS px, DPR1, mouse/no touch. Tablet:800×1280 CSS px, DPR2, touch capable. These are declared QA profiles; they are not inferred source artwork profiles. Chromium version in results receipt; VI/vi-VN, light, Asia/Ho_Chi_Minh, browser default zoom.
- Fresh browser contexts; normal login/confirmation through real UI. Approved public synthetic demo credentials loaded only into process memory from existing public helper; no credential/session/storageState/HAR/trace persisted.
- Actual runtime is LOCAL PREVIEW MOCK. No production API acceptance is claimed. Actual model telemetry UNVERIFIED.
- Actual capture interval:2026-10-27T17:44:26.824Z–17:45:32.642Z. HEAD and source/tests clean at start/end. All capture browser contexts closed.

## Canonical actual captures — eight states

All relative links below resolve inside this visual directory. The authoritative receipt is [results.json](before-normal-bfec706/results.json). Every screenshot has SHA-256, URL, viewport/DPR, visible IDs, DOM text, computed geometry/styles, console/network and source custody in that receipt.

| Reference | Actual screenshot | Observed scope and verdict |
|---|---|---|
| REF-01 desktop create | [desktop-create.png](before-normal-bfec706/desktop-create.png) | Composition/geometry checks PASS; exact pixel fidelity BLOCKED by source profile gap |
| REF-02 desktop populated | [desktop-list.png](before-normal-bfec706/desktop-list.png) | Actual4 posted receipts; desktop five-column table PASS; reference3draft/zero comparison PARTIAL; V01 OPEN |
| REF-03 desktop detail | [desktop-detail.png](before-normal-bfec706/desktop-detail.png) | Real selected PN-0012, PRODUCT/POSTED/1recorded code; two-column info and populated codes table PASS; zero-code artwork state NOT_REPRODUCED on normal source |
| REF-04 tablet populated | [tablet-list.png](before-normal-bfec706/tablet-list.png) | Actual4cards; card layout PASS, density difference registered V02; reference3draft/zero comparison PARTIAL; V01 OPEN |
| REF-05 tablet detail | [tablet-detail.png](before-normal-bfec706/tablet-detail.png) | Real selected PN-0012, PRODUCT/POSTED/1code; label/value rows PASS; zero-code artwork state NOT_REPRODUCED on normal source |
| REF-06 tablet create | [tablet-create.png](before-normal-bfec706/tablet-create.png) | Stacked form; refresh row then cancel/save pair PASS; exact fidelity BLOCKED by source profile gap |
| REF-07 tablet validation | [tablet-validation.png](before-normal-bfec706/tablet-validation.png) | Real invalid submit:3errors/201counter/field associations/first-invalid focus PASS; exact fidelity BLOCKED by source profile gap |
| REF-08 desktop validation | [desktop-validation.png](before-normal-bfec706/desktop-validation.png) | Real invalid submit:3errors/201counter/field associations/first-invalid focus PASS; exact fidelity BLOCKED by source profile gap |

Create source/reference values are current application prefilled values. We did not mutate data to obtain an empty backdrop or change POSTED receipts into draft. List captures use fullPage so all actual cards remain visible. Modal captures preserve viewport and also include separate dialog crops.

## Data provenance and scenario discrepancy

Normal source snapshots were read through the actual `createOperationalWebAdapter({scope:'S12'})` after capture. Both profiles return31receipts. The component exposes only4, identified by code PN-0012/11/10/09, and its result count says4. The allowlist in OperationalReceipts also admits PV-PN prefixes while excluding HN-PN records; this is independent of search/status filtering. This is an OPEN P1 data-integrity defect, not an artwork-data requirement. Parent and Functional QA have been notified.

The selected detail IDs are recorded independently for desktop/tablet fresh contexts and agree with their source snapshot PN-0012 identity. Status POSTED, type PRODUCT and code count1 are displayed truthfully; no fake missing type or empty-code state was introduced. Reference PN-0012 missing type is DATA_CONTRACT_GAP. Draft detail edit-action discrepancy is preserved in diagnostic evidence; screenshot absence does not authorize removing eligible editing.

The existing `tests/reference-exact/receipts.html` harness supplies3 DRAFT/zero-code receipts to the real operational components. Its additional [8captures and receipt](before-synthetic-bfec706/results.json) are **QA_SYNTHETIC, DIAGNOSTIC ONLY**, never normal-route acceptance. Its adapter observed0execute commands. It isolates draft/empty-code composition and cannot replace the actual route result.

## Geometry, console and validation

| Actual normal state | Desktop dialog CSS size | Tablet dialog CSS size | Safety result |
|---|---:|---:|---|
| Create |640×610|672×792|No horizontal modal overflow; footer reachable; targets≥44×44 |
| Validation |640×681|672×867|No horizontal modal overflow; footer reachable; targets≥44×44 |
| Detail, actual POSTED/1code |640×721|736×854|No horizontal modal overflow; footer reachable; copy/close targets44×44 |

- Both actual profiles:0pageerror/console warning/error;0failed network requests/HTTP≥400. Fonts report loaded; no replacement characters in modals. Page scrollWidth equals viewport width.
- Desktop uses table; tablet uses cards752×314CSSpx, four cards. Synthetic3cards have the same314CSSpx height. All data fields remain visible in captures.
- Validation is triggered with missing type, empty source and a201-character NFC reference. Real UI shows `Có 3 trường cần kiểm tra.`, three `aria-invalid=true` controls and right-aligned `201/200`; invalid values and described-by associations are in receipt. Focus immediately after submit is mode. Captures then blur focus for neutral screenshot styling; this does not change recorded pre-capture focus.
- **Measurement caveat:** raw `validation.referenceLength` queried the first input because each field has its own parent; that scalar is invalid and must not be used. Full reference comes from the invalid control whose ID ends `-reference` and has201NFC characters; the DOM counter corroborates201/200. Some historical selector keys such as `.s12-detail-fields` are empty; actual markup uses `.s12-detail__fields`. Dialog text and actual screenshots remain intact. This caveat is preserved rather than silently rewriting raw evidence.

## Comparison method and limits

[Actual canonical registration](before-normal-bfec706-isotropic/registration.json) contains8 scoped reference/actual/overlay/diff-x3/review-board sets. [Synthetic registration](before-synthetic-bfec706-isotropic/registration.json) contains8 separate diagnostic sets. Original reference custody belongs to S00#6 [manifest](../design/REFERENCE_MANIFEST.json).

`compare-isotropic.py` uses component top-left registration, **uniform width scaling only**, then white canvas padding. There is no independent vertical stretch, source overwrite or baseline approval. Modal backdrop/protected shell is excluded. Desktop list scope excludes the separately illustrated empty sample per the Design Guardian distinction; inclusion in the live populated UI remains an integration decision. Normal list/detail datasets differ, so whole-image pixel PASS is not meaningful.

Width-normalized normal modal height residuals (actual−projected reference): desktop create+7.76, validation−0.81, detail+35.72CSSpx; tablet create−5, validation−1.8, detail+2.16CSSpx. Normal detail contains actual code data, so its residual is not a same-state fidelity result. Synthetic empty-code detail residuals are−8.28desktop/−7.84tablet. Synthetic tablet list residual+240.29CSSpx identifies density disparity even with equal3-row fixture; V02 is a P2 geometry/design-normalization candidate pending profile authority.

No exact color/font/icon or CSS viewport acceptance is inferred. Empty/no-results/error/dark/EN/ZH/live API/RBAC/CRUD mutation regression is NOT_RUN by this visual pass and belongs to functional/integration follow-up. Eight AFTER sets are NOT_RUN until a fixed candidate is supplied; this BEFORE evidence remains immutable.

## Independent disposition

**PARTIAL visual scope, FAIL data-integrity gate, NOT release-ready.** Source changes must address confirmed P1 V01 and be independently retested. Unresolved source normalization and scenario gaps prevent exact eight-state fidelity PASS. No source, tests, shared shell, business fixture or design reference was edited by Visual QA.
