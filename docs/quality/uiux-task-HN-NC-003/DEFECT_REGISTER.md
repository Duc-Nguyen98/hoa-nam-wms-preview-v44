# Defect register — HN-NC-UIUX-003

Owner: S00#1. Sources: independent S00#3 visual report and S00#4 axe report, 2026-10-27. This register records actual findings; initial failures remain preserved. No release acceptance is implied by implementation.

| ID | Severity | Verified finding | Correction / state | Required closure evidence |
|---|---|---|---|---|
| VQ-NC003-01 | P2 | Under declared 992×1586@1 native-raster normalization, tablet modal y162 versus reference y261; x56 versus x61 | CSS commit `3ca0ef24e4f3db4e90bbb1e26f0d117c356246fe`: bounded portrait translation; independent retest pending | Full actual, immutable reference overlay/diff, geometry and neighboring viewport guards |
| VQ-NC003-02 | P2 | Tablet visible close glyph approximately10px versus reference19px, although44px button target already present | Same CSS commit: portrait-only36px SVG with existing shared path and44px target; independent retest pending | Visible paint/box measurement, hit target, focus/Escape and no clipping |
| FQ-NC-003-A11Y-01 | P1 | axe4.14.0 `aria-prohibited-attr` on named generic `.hn-global-toast-region`, reproduced in4 actual authenticated profile scans | Assigned serialized S00#2 semantic lease; fix/retest pending | Valid grouping/name, retained status/alert roles, clean-source4profile axe and shared toast behavior |
| FQ-NC-003-A11Y-02 | P2 | axe `landmark-banner-is-top-level` on implicit modal-header banner, reproduced in same4scans | Assigned serialized S00#2 semantic lease; fix/retest pending | Neutral header semantics with retained class/title linkage; axe plus modal focus regression |

Initial count: P0=0, P1=1, P2=3, P3=0. Final open/closed totals must be derived after independent retest, not from owner-local tests.

## Separate acceptance gaps and inherited blockers

- NC-DG-01: original viewport/DPR/export transform and exact typography, color, glyph specification are not fully recovered. Native-raster comparison is diagnostic. No approved pixel tolerance exists.
- NC-DG-03: tablet detail/alternate-state/dark/EN/ZH pixel references missing. Functional/reflow results do not constitute visual baseline approval.
- Automated axe contrast is INCOMPLETE because of pseudo-content background resolution. This is not a measured contrast violation or PASS; targeted review remains required.
- Production API, server RBAC and realtime delivery are NOT_RUN without a suitable authorized environment; local Preview uses MOCK fixtures.
- GitHub hosted runner blocked by account billing; browser workflow contains an unconditional failure placeholder. Existing public build does not attest current candidate SHA.
- Historical setup/seed regression findings in previous pilot reports remain open; successful scoped observations do not close them.
- Notification date formatting uses `Asia/Bangkok` while recovered shared contract cites `Asia/Ho_Chi_Minh`; equal UTC offset on observed dates is not approval of timezone identity. No business change is made in this visual task.

## Additional independent finding

`FQ-NC-003-A11Y-03`, P2: clean interim `e5ba486fb82a05fcf6cb7aa7b56fda17dc4bcb16` reproduces actual keyboard focus loss after mark-all, closing modal and dismissing the toast. Hidden mark-all origin remains connected with zero client rects; current provider focuses it instead of falling back to the existing focusable main-content. Actual activeElement becomes BODY; zero console/request errors. Independent proof: `functional/focus-before/`. Serialized fix assigned only to GlobalToastProvider focus availability check. Initial new-scope count is now P0=0/P1=1/P2=4/P3=0 (5 confirmed defects); final closure awaits retest.

## Additional bounded composition and contrast findings

- `VQ-NC003-03`, P3: adjacent Tablet unread surfaces visually touch; immutable reference shows approximately2px separation. S00#6 authorized semantic adjacent-unread boundary correction, measured by owner without changing other list borders/ordering. Candidate e57f6aed; independent final capture pending.
- `VQ-NC003-04`, P3: Desktop footer divider is5px lower than source while controls align. Flex-aware padding correction moved only the divider; candidate e57f6aed, independent final capture pending.
- `FQ-NC-003-A11Y-04`, P2: insufficient normal-text contrast in real light Notification UI, measured on clean e57f6aed. Placeholder14px400:3.4024:1; warning status14px400:3.4246:1, versus WCAG AA4.5:1. Solid backgrounds; no pseudo uncertainty for these sampled nodes. Raw `functional/shared-final-diagnostic/contrast-1920-light.json`. Success status source candidate also needs actual detail verification, not assumed measured. S00#6 authorized light-only placeholder opacity and reused shared status text family; fills/icons/dark/global palette remain unchanged. This grouped contrast defect records its individual conditions in raw QA evidence.

Confirmed defect families at this point:8 (P0=0, P1=1, P2=5, P3=2). Final closure still depends on independent final source retest. Optical/typeface and1px raster-edge uncertainties remain separate DESIGN_GAP/residual observations, not silently accepted pixels.

## Additional complete-image Tablet findings

S00#3 final76059cc capture exposed `VQ-NC003-05` and `VQ-NC003-06`, P2 composition groups: search/filter/list gutters and cumulative row pitch/footer reserve differ from immutable Tablet reference. Exact selectors/bounds/reference method are in `visual/residual-geometry-76059cc.json`; the existing fixes are not relabeled as closing these. S00#6 produced a combined measured candidate with interaction guard; S00#1 granted only the corresponding owning-CSS lease after S00#4 completed its76059cc read/test phase. Confirmed families now10: P0=0/P1=1/P2=7/P3=2. Final open/closed totals await new-source independent retest. This is a new finding from full image comparison, not a fabricated test defect or baseline change.

## Final canonical reconciliation — source830f83d

Final IDs follow the independent owners: FQ04 is placeholder contrast and FQ05 is warning-status contrast; earlier S00#1 counts grouped them as one family. Therefore the canonical total is11 findings (original P0=0/P1=1/P2=8/P3=2), not an extra newly discovered issue. Companion success contrast was measured after repair but not separately reproduced before; do not inflate the count.

| Canonical ID | Original priority | Final state | Evidence / retained limit |
|---|---|---|---|
| VQ-NC003-01 |P2|CLOSED / verified correction|Tablet modal origin61.456/261.125; immutable reference normalization recorded|
| VQ-NC003-02 |P2|CLOSED / verified correction|44px target; painted close artwork corrected; no exact glyph identity claim|
| VQ-NC003-03 |P3|CLOSED|2px adjacent-unread surface separation independently captured|
| VQ-NC003-04 |P3|CLOSED|Desktop footer divider764.5 vs reference~765; controls/CTA unchanged|
| VQ-NC003-05 |P2|CLOSED / major box deviation corrected|Final toolbar/search/filter/gutters/group anchors close to measured source; no font/tolerance PASS|
| VQ-NC003-06 |P2|PARTIALLY_CORRECTED / P3 OPEN|Footer/cumulative box composition corrected; maximum iconY residual5.625px retained. DG: small density residual, no observed occlusion/lost content/target/workflow impact; no further per-record/state offsets justified.|
| FQ-NC-003-A11Y-01 |P1|CLOSED / independent RETEST PASS|Valid named toast group;4default axe profile scans|
| FQ-NC-003-A11Y-02 |P2|CLOSED / independent RETEST PASS|No nested page banner; actual NC and non-NC S01 modal checks|
| FQ-NC-003-A11Y-03 |P2|CLOSED / independent RETEST PASS|Actual hidden-origin focus FAIL preserved; fixed replay returns main content|
| FQ-NC-003-A11Y-04 |P2|CLOSED / independent RETEST PASS|Placeholder3.402425→5.851331:1 in executed light profiles|
| FQ-NC-003-A11Y-05 |P2|CLOSED / independent RETEST PASS|Warning3.424567→5.552797:1; reachable success6.030105:1 after companion repair|

Final canonical totals:10closed,1open(P3). New-scope open P0=0/P1=0/P2=0/P3=1. Scope-specific results are not full visual/release acceptance: typography/glyph/tolerance DESIGN_GAP, axe contrast INCOMPLETE, backend NOT_RUN, hosted CI/provenance blockers and historical defects remain separate.

Boundary clarification: read-state border2+button112 and border1+button113 preserve the114px LI slot. The button's interior1px change is EXPECTED_STATE_BOUNDARY_COMPENSATION, not a claim that every button bbox is identical. Selection-only row deltas were independently0px in4final functional profiles. The108selected candidate was superseded as a state-dependent risk; the earlier owner statement of a browser-confirmed selection jump was corrected after raw inspection (before/after bounds were identical). No fake defect or failure-control PASS is inferred from that candidate.
