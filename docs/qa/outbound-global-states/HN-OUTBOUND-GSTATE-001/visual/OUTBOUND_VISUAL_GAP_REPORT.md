# Outbound visual gap report — HN-OUTBOUND-GSTATE-001

**Owner:** S00#3 Visual QA  
**Capture date:** 2026-10-28 (Asia/Bangkok)  
**Checkout:** `DEV` at `002e291f9005ec5e22c45d7f93350af12f9b26ec`  
**Runtime:** local Vite preview `http://127.0.0.1:5188`, Chromium headless, light theme, `vi-VN`, `Asia/Bangkok`.

## Verdict

**BLOCKED / visual acceptance not passed.** REF-01..05 are reachable on the actual route `#/preview/S15` and were captured before any source change. The route renders the intended session list/detail structure, but shell geometry, tablet vertical density, and tablet modal placement visibly diverge from the approved references. REF-06 is a visual specification sheet rather than a literal screen; its six alternatives were exercised through the S15 isolated harness for semantic/state evidence, but no pixel PASS is claimed.

No source files were modified by this QA run. The browser uses the local Preview mock and a browser-local operational fixture; it is not backend or production evidence. Example IDs/names in the references were not injected into the runtime.

## Capture profiles and evidence

| Ref | Actual route/state | CSS viewport / DPR | PNG pixels | Result |
|---|---|---:|---:|---|
| REF-01 | `#/preview/S15`, current-session populated desktop table | 1672×941 / 1 | 1672×941 | **FAIL** — shell/list geometry drift |
| REF-02 | `#/preview/S15`, tablet compact card | 992×1586 / 1 | 992×1586 | **FAIL** — shell/card rhythm drift |
| REF-03 | `#/preview/S15`, same tablet row after recipient disclosure | 992×1586 / 1 | 992×1586 | **FAIL** — content exceeds viewport (`scrollHeight=1690`) |
| REF-04 | `#/preview/S15`, selected row operational detail modal | 1672×941 / 1 | 1672×941 | **FAIL** — shell backdrop and spacing drift |
| REF-05 | `#/preview/S15`, tablet operational detail modal | 992×1586 / 1 | 992×1586 | **FAIL** — modal anchoring/vertical geometry drift |

The reference raster dimensions are preserved under `../design/references/`; they are authority bytes and do not by themselves establish a CSS viewport. The actual capture manifest records viewport, DPR, DOM state and scroll geometry in [`actual-before-manifest.json`](actual-before-manifest.json).

### Actual route state coverage

| State | Actual route | Evidence | Disposition |
|---|---|---|---|
| Populated list | `#/preview/S15` | [`before/REF-01_Desktop.png`](before/REF-01_Desktop.png), [`before/REF-02_Tablet.png`](before/REF-02_Tablet.png) | Captured; visual gaps below |
| Expanded list | `#/preview/S15` + recipient disclosure | [`before/REF-03_Tablet.png`](before/REF-03_Tablet.png) | Captured; vertical overflow |
| Detail modal | `#/preview/S15` + “Xem chi tiết” | [`before/REF-04_Desktop.png`](before/REF-04_Desktop.png), [`before/REF-05_Tablet.png`](before/REF-05_Tablet.png) | Captured; visual gaps below |
| Empty / no-results / load-error / loading / forbidden / not-found | Actual route fixture does not expose deterministic state controls | [`global-states/`](global-states/) via `tests/s15/harness.html` | **BLOCKED for actual-route visual acceptance; synthetic evidence only** |

### Global-state harness evidence

The S15 isolated harness uses the production `OperationalOutbounds`, shared `PageState`, shell and CSS, with a deterministic adapter fixture. It captured all six alternatives at 1672×941: `empty`, `no-results`, `error`, `loading`, `forbidden`, and detail `record-not-found`. See [`global-states-manifest.json`](global-states-manifest.json) and the screenshots in [`global-states/`](global-states/). These captures prove state reachability and copy/action classification; they are **synthetic harness evidence**, not the actual `#/preview/S15` route and not a REF-06 pixel comparison.

## Visual findings

1. **Shared shell width/header treatment differs on Desktop and Tablet.** The approved Desktop shell has a wider left rail and content/header alignment. The actual Desktop rail is narrower and the top search/header starts at a different x origin. On Tablet, the approved reference uses a full-width header bar; the actual header is inset inside a bordered rounded shell card. This shifts the shell backdrop and available content width behind both list and detail states.
2. **Tablet compact card has a taller rhythm than REF-02.** The actual card and footer finish lower than the reference at the same 992×1586 raster profile. Heading/control vertical offsets are several pixels lower and the card body has larger inter-section spacing. The semantic fields and CTA are present.
3. **Tablet expanded disclosure overflows the reference profile.** REF-03 captures the expanded card and footer within the 1586px raster. The actual expanded state has `scrollHeight=1690`; the detail CTA/footer are below the viewport in the captured frame. This is a concrete geometry failure independent of example data.
4. **Tablet detail modal is anchored and sized differently.** REF-05 places a taller portrait modal low in the viewport with the approved stacked sections. The actual modal is centered much higher and leaves a different backdrop exposure; the body/trace content and footer proportions do not match the reference composition.
5. **Fixture identity differs by design.** The runtime row uses browser-local `Nơi nhận Demo`, `Địa chỉ thử nghiệm`, `PUBLIC-DEMO-*` IDs, while the artwork uses `Đại lý Hoàng Minh` and illustrative IDs. The custody README says artwork data is illustrative and must not seed production, so this is recorded as a fixture/authority limitation rather than a source defect.

## AFTER retest on the scoped S15 CSS repair

The exact Tablet profile was rerun after S00#2's scoped repair. REF-02 measured `scrollHeight=1586`, REF-03 measured `scrollHeight=1586` with CTA y=1388..1460 and footer y=1522..1584, and REF-05 measured modal y=294.5..1571.5 with footer bottom 1570.5. Escape closed the detail dialog and restored opener focus; no visible control was below 44px and no horizontal/vertical overflow remained. See [`AFTER_RETEST_REPORT.md`](AFTER_RETEST_REPORT.md), [`after-manifest.json`](after-manifest.json), and the before/after diff metrics. These are geometry/focus fixes only; VQ-OUT-001 desktop shell and exact reference fidelity remain open.
## State disposition

- **PASS for reachability only:** all six semantic alternatives rendered in the isolated harness with the correct state keys and intended actions.
- **NOT_RUN:** exact REF-06 visual diff; the sheet is a six-panel visual kit, not an application screen.
- **BLOCKED:** claiming those six states on the actual `/preview/S15` route, because the public route has no deterministic fixture switch and production backend/RBAC is not part of this local run.

## Runtime diagnostics

[`network-console-evidence.json`](network-console-evidence.json) records both the synthetic harness and actual route probes. Chromium observed **0 console errors, 0 page errors and 0 request failures**; all observed responses were HTTP 200. Geometry evidence is in [`actual-before-manifest.json`](actual-before-manifest.json) and [`global-states-manifest.json`](global-states-manifest.json). The local preview is a mock/browser-local runtime; HTTP 200s are asset/module responses and do not certify API integration.

## Required follow-up

Resolve the visual defects in [`VISUAL_DEFECT_REGISTER.md`](VISUAL_DEFECT_REGISTER.md), then recapture REF-01..05 on the same declared profiles. Keep REF-02 and REF-03 as sequential states on one Tablet profile. S00#4 must separately certify functional, keyboard, RBAC and production/API behavior; S00#5 must certify exact hosted SHA/CI before release.

