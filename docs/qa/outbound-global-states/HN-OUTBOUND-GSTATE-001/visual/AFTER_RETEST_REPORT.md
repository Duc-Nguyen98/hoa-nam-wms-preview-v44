# AFTER visual retest — HN-OUTBOUND-GSTATE-001

**Retest owner:** S00#3 Visual QA  
**Candidate:** `DEV` working tree after the scoped S15 CSS repair  
**Route:** `http://127.0.0.1:5188/#/preview/S15`  
**Profile:** Chromium, `vi-VN`, light theme, 992×1586 CSS px, DPR 1 (992×1586 PNG).

The retest used the same Tablet profile as BEFORE and captured the same three sequential states. The scoped CSS repair was already present in the working tree; S00#3 made no source edits.

## Geometry and behavior

| State | Scroll height | CTA geometry | Footer geometry | Modal / focus | Result |
|---|---:|---|---|---|---|
| REF-02 compact | 1586 (= viewport) | y=816..888, 72px | y=950..1012 | n/a | **PASS geometry** |
| REF-03 expanded | 1586 (= viewport) | y=1388..1460, 72px | y=1522..1584 | n/a | **PASS geometry; no vertical overflow** |
| REF-05 detail | 1586 (= viewport) | n/a | modal footer y=1477.5..1570.5 | modal y=294.5..1571.5; Escape closed dialog and restored opener focus | **PASS geometry/focus/overflow** |

All visible controls met the 44px minimum check. Playwright recorded zero console errors/warnings, page errors and request failures. Machine evidence: [`after-manifest.json`](after-manifest.json).

## Captures and diff evidence

- [`after/REF-02_Tablet.png`](after/REF-02_Tablet.png)
- [`after/REF-03_Tablet.png`](after/REF-03_Tablet.png)
- [`after/REF-05_Tablet.png`](after/REF-05_Tablet.png)
- [`REF-02_before-after-diff.png`](REF-02_before-after-diff.png)
- [`REF-03_before-after-diff.png`](REF-03_before-after-diff.png)
- [`REF-05_before-after-diff.png`](REF-05_before-after-diff.png)
- [`before-after-diff-metrics.json`](before-after-diff-metrics.json)

The pixel diffs are diagnostic, not a reference PASS: fixture IDs are browser-local and the shared shell remains different from the supplied artwork. The geometry repair is independently verified: REF-03 no longer clips the CTA/footer and REF-05 modal/footer are fully reachable with focus return.

## Disposition

- VQ-OUT-002 (Tablet card density/expanded overflow): **FIX VERIFIED for geometry** on this working tree; retain shell/reference fidelity review as a separate gap.
- VQ-OUT-003 (Tablet detail modal placement/overflow): **FIX VERIFIED for geometry, footer reachability and focus return**; exact artwork comparison remains subject to shell/data gaps.
- VQ-OUT-001/VQ-OUT-004 (shared shell and remaining spacing) remain open from the initial report.
- No release or hosted-preview approval is implied by this local retest.
