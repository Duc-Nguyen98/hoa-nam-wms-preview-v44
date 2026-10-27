# HN-S01-UIUX-004 — Design acceptance matrix

Owner: S00#6 / native `s01_design_guardian`. Recorded 2026-10-27, UTC+07.
Base inspected: `DEV` / `06954a99885f7c9e808bf9a5556c7dd6c0d6b9a2`; packet source-tree identity `65ac25d235682469452f60d50664b3e6acb3a753` is supplied by S00#1, not independently recomputed here. `git rev-parse HEAD` matched the base and no runtime diff existed at initial inspection.

Disposition: **SOURCE CUSTODY VERIFIED; SCOPED CORRECTION AUTHORITY AVAILABLE; EXACT VISUAL SIGN-OFF BLOCKED.** This is the four-state design handoff. Visual and functional results belong to S00#3/S00#4; no implementation PASS is issued here. Requested model fallback is recorded in the task packet; `ACTUAL_MODEL=UNVERIFIED`, `ACTUAL_REASONING=UNVERIFIED` because authoritative execution telemetry was not exposed.

## Authority and boundary

Read: repository `AGENTS.md`, the task packet, `DESIGN_CONTRACT.md` v1.2.0-recovery, `DESIGN_TO_CODE_MAPPING.md`, `BASELINE_MANIFEST.md`, `DESIGN_SOURCE_REGISTER.md`, `DESIGN_GAP_CLOSURE.md`, ownership/gates, recovered `UI_FOUNDATION_LOCK.json`, recovered S01 snapshot and common screen contract.

1. Current explicit user/packet scope and `DEC-DG-20261027-01` approve originals 3/4 for Dashboard page content and 5/6 for outbound detail content. New user approval of these components supersedes the older S01 snapshot's table-only portrait composition for these selected states.
2. Separately approved GlobalShell/header/sidebar and Notification Center remain locked. The shell pixels in 3–6, and the obscured list behind 5/6, cannot authorize changes to those components. Full actual frames must still be retained for regression evidence.
3. Recovered shared Foundation/R3 rules govern shared semantics (exact lock: `docs/quality/references/recovered-foundation-20261027/docs/ui-foundation/UI_FOUNDATION_LOCK.json`, version `HN_UI_SHARED_v1.1.2`, owner approval `HN_CONTROLS_R3_OWNER_APPROVED_2026-10-12`; `decisions.pageSize=10`, `decisions.pageSizeOptions=[10,15,25,50]`): Public Sans family, official Tabler outline family, 44 CSS px interactive targets, inclusive date endpoints, `dd/MM/yyyy`, `Asia/Ho_Chi_Minh`, shared paging default 10/options 10/15/25/50, normalized Vietnamese substring search/debounce 250 ms/AND and sort-before-paginate. Family approval does not settle exact glyph paths, font metrics or every scoped color.
4. Current implementation values are observations. They cannot become approved design values through this report. Independent, source-supported box/topology corrections may proceed under a later S00#1 runtime lease despite the remaining typography/icon/tolerance gaps.

## Original identity and custody

All four originals were opened visually in this execution using `view_image`. Dimensions and original SHA-256 were read from the current C: files using `System.Drawing` / `Get-FileHash`, and matched the currently tracked custody copies byte-for-byte. The existing `references/recovered-foundation-20261027/VERIFICATION.json` also records these same identities; it is historical support, not a substitute for this check. No image was modified or copied by this role.

Original root: `C:/Users/Admin/Desktop/HN_Astra/`. Custody root relative to `docs/quality/`: `references/hn-astra-20261027/`.

| State / baseline | Original = custody filename | Native raster / bytes | SHA-256 |
|---|---|---|---|
| Dashboard Desktop / BL-S01-D | `3.png` | 1672×941 / 1,401,766 | `f17af2135653f38503c72139603ad429e437d86248e22f36abe270449c39257e` |
| Dashboard Tablet / BL-S01-T | `4.png` | 992×1586 / 1,302,701 | `111daa7bf29165c614ab6d7d1fc047e381addd292385c9037b43bd51860a47f7` |
| PX-0007 Desktop / BL-S01-DETAIL-D | `5.png` | 1672×941 / 1,386,278 | `eaba73d476bf0b9b92fc12e3271a9177493c75b7cd16bc040e939acdbfd5643b` |
| PX-0007 Tablet / BL-S01-DETAIL-T | `6.png` | 793×1983 / 1,239,865 | `ba996d6843288f0d5248246c2bde876d759f016e41e3e44a0577725fe13fabea` |

## Declared capture and normalization

The recovered common contract explicitly says the images are generated previews rather than final pixel exports. Source CSS viewport, source DPR, source pointer and original font-renderer configuration are **unknown**. Native PNG width is not CSS viewport width.

| State | Required standard runtime profile | Permissible reference comparison / limits |
|---|---|---|
| Dashboard Desktop | 1920×1080 CSS, DPR1; landscape; VI/light | Reference3 native composition/anchors and scoped content crop. The Desktop DPR1 is a declared 1x capture choice, not recovered source metadata. |
| Dashboard Tablet | 800×1280 CSS, DPR2 →1600×2560 output; portrait; VI/light | Reference4 native composition/anchors; 2×2 KPIs, stacked panels, three quick links and activity cards. Original ratio is approximately 0.6255 versus profile0.625; this proximity does not prove source DPR. |
| PX-0007 Desktop | Same Desktop profile; same accepted scenario, exact selected record | Reference5 modal-local composition/anchors. Background is retained but excluded from detail design authority. |
| PX-0007 Tablet | Same Tablet profile; exact selected record | Reference6 modal-local composition and one-column ordering. Its ratio is approximately 0.3999, materially different from0.625. A full-frame fit/stretch cannot certify this state. Standard-profile actual must separately demonstrate body scrolling and reachable footer. |

For all profiles, capture owner records browser/version, pointer/hover/touch configuration, orientation, shell layout/pin/content-width preferences, locale/theme, font-load status, accepted query/scenario hash, frozen clock/timezone, exact URL, candidate SHA/source tree, capture time and scroll position. Pointer settings and clock are declared test inputs; they are not inferred design facts. Vietnam timezone should be explicit even where another zone shares its UTC offset.

Required diagnostic transform recipe:

1. Preserve original and full actual at native output dimensions, with hashes.
2. Record reference region `(x,y,width,height)` and actual region in both CSS and output pixels. Exclude only the approved shell/background scope; never mask content defects.
3. Use a named content/modal-local transform. Prefer translation and a **single isotropic** scale anchored to the panel/modal width: `s = actualRegionOutputWidth / referenceRegionWidth`. Publish `s`, offsets, resulting height and interpolation method. Unequal X/Y scale is prohibited for fidelity conclusions. Whole-frame Desktop fitting can also misalign content because the shell is independently locked.
4. Record every anchor's residual in output pixels and CSS pixels after DPR conversion. Source reference measurements remain raster facts; `referencePx / guessedDPR` is prohibited. Modal/section-relative ratios are diagnostic evidence, not newly approved CSS tokens.
5. Keep text/icon raster error, box residuals and semantic content differences distinguishable. No numeric pixel-diff/tolerance threshold has been approved. Report differences explicitly; an alignment transform or small average diff is not a PASS.

Reference6 needs two evidence views when the standard actual cannot show its complete height: normal viewport capture with footer/body-scroll measurements, plus clearly labeled modal-content/full-scroll diagnostic. Do not enlarge the CSS viewport to1983 based solely on the raster, stretch the reference, or call the diagnostic a physical Tablet test.

## Measured native reference anchors

Coordinates below are **native source raster pixels** with origin top-left; bounds use visible border center/edge, rounded to the nearest integer. Manual pixel-grid inspection was cross-checked with `System.Drawing.Bitmap.GetPixel` edge probes. Reading uncertainty is approximately ±2 raster pixels due to antialiasing/textured edges; this is measurement uncertainty, **not an accepted implementation tolerance**. Border X/Y entries are deliberately more precise than text bounds. They authorize relative box/layout diagnosis, not exact CSS dimensions/colors.

| Source | Native anchor / border coordinates | Measured implication |
|---|---|---|
| 3 | KPI left/right edges: `[304,621]`, `[635,959]`, `[973,1300]`, `[1314,1640]`; common top183/bottom334 | Four peers on one row; gaps14,14,14 between successive border coordinates; first card slightly narrower in artwork. No forced equal-CSS-width inference. |
| 3 | Attention: left304, top350, right1175, bottom578; quick panel: left1189, top350, right1640, bottom578 | Peers share top/bottom; 14 native-px gutter; attention wider than quick links. |
| 3 | Activity: left304, top594, right1640, bottom933; search top667; table header top711/bottom750; four body row baseline bands approximately750–884; paging approximately890–926 | Activity spans combined panel width; controls precede table; pagination is visible after four scenario rows. |
| 4 | KPI column edges `[46,489]` and `[502,947]`; upper top289/bottom438; lower top452/bottom598 | 2×2 grid; native inter-column13 and inter-row14 border deltas. Same content identity/order as Desktop. |
| 4 | Attention `[46,612,947,867]`; quick links `[46,881,947,1006]`; activity `[46,1021,947,1536]` (left,top,right,bottom) | Stacked sections share outside edges; gaps14/15. Quick links retain three columns. |
| 4 | Activity search approximately `[68,1101,928,1142]`; filter row top1176/bottom1217; cards start1227,1294,1362,1428 with bottom1489; pager1495–1530 | Search spans width; two filters share next row; four activity cards followed by visible pager. |
| 5 | Modal left484/right1279, top166/bottom864; header divider289; footer divider782; body horizontal rules approximately350,620,682 | Modal border span795×698; header123, content493, footer82 native px. Maintain section separation and visible footer; do not prescribe800CSS from795raster. |
| 5 | Header icon approximately `[510,194,577,262]`; number starts600/229; status approximately `[979,214,1160,252]`; close approximately `[1204,203,1254,253]` | Desktop icon+title+status+close share header; status stays beside title. Internal left edge510, right1254: approximately26/25 native-px inset. |
| 5 | Footer close approximately `[935,798,1040,847]`; primary `[1053,798,1254,847]` | Two buttons aligned right, equal native height49; 13px gap. Measured visible height does not waive shared44CSS target. |
| 6 | Modal left43/right751, top524/bottom1855; header divider763; footer divider1725; body inner edges80/715 | Border span708×1331; insets37/36 native px. Tall source content is measured without deriving viewport height. |
| 6 | Icon approximately `[80,562,169,653]`; number starts202/608; close approximately `[642,562,715,636]`; status approximately `[80,675,367,732]` | Portrait title/status reflow: status is on its own row below title; close remains top-right. |
| 6 | Document heading approximately y796; field rules y951,1059,1175,1288,1402,1527; system heading approximately1560; system rule1609 | One-column fields in type, warehouse, partner, quantity, actor, time order; label above value, icon beside each. System ID follows document section. |
| 6 | Footer secondary approximately `[80,1752,340,1829]`; primary `[362,1752,715,1829]` | Two same-height buttons, primary wider;22px native gap. Footer visible in tall source; standard-profile actual must prove reachability independently. |

The border probes explicitly found3.png edge colors at x304/621/635/959/973/1300/1314/1640 at y250;4.png x46/489/502/947 at y400;5.png white modal transition x484–485 and1278–1280 at y500;6.png transition x42–44 and750–753 at y900. Top/bottom/divider probes confirmed the major Y coordinates above. Sampled RGB values are measurement evidence only and are not palette approval.

## Four-state acceptance and implementation mapping

All states use actual `#/preview/S01`, discovered through `src/app/registry.ts` and `OverviewScreen`. Detail is the S01 accepted-row modal, not a substitute S04/S12 detail or a recreated test modal.

| Acceptance / states | Reference-backed requirement | Owning implementation / bounded correction authority | Evidence / present gate |
|---|---|---|---|
| A01 / all4 | Correct original/state identity and scope above; exact source custody preserved | S00#6 documentation; S00#3 captures; S00#1 grants runtime lease after four BEFOREs | Custody VERIFIED; BEFORE/AFTER and diffs owned by Visual QA, NOT_RUN here |
| A02 / DashboardD/T | Page title/subtitle; warehouse + period controls; September comparison scenario; D controls beside heading, T below | `OverviewScreen.tsx`, `.ov-page-heading`, `.ov-period*` in `overview.css`; shared FilterSelect/DateRangePicker mechanics retained | Compare boxes/labels independently of exact font gap; DatePicker contract/defaults preserved |
| A03 / DashboardD/T | Stock unknown + inbound8 + outbound8 + open warranty4; D1×4/T2×2; label/value/unit/helper/scope hierarchy | `Metric`, `.ov-metrics`, `.ov-metric*`; derive values from accepted model | Full values and unknown helper remain visible. Do not replace unknown by0, hide helper, or hardcode counts |
| A04 / DashboardD/T | Attention panel with three displayed items PX-0010/PN-0009/PX-0007, list action and row affordances; source artwork badge3 | `OverviewScreen.tsx:197,225`, `.ov-attention*`; geometry corrections independent of count semantics | Badge uses `model.summary.waiting`; current source waiting5 is a data scenario mismatch (G04). Three displayed rows is not proof of total3 |
| A05 / DashboardD/T | Three quick entries: inventory report, traceability, movement history; D vertical list alongside attention, T3 columns below | presentation-driven `.ov-quick*`; existing route/capability handling | No invented destination/permission; full labels/icons/affordances remain reachable |
| A06 / DashboardD | Activity count16; search/type/status controls; eight table columns ordinal/number/type/time/actor/quantity/status/action; four comparison rows | `OverviewScreen.tsx` column definitions, shared DataTable, feature `.ov-activity*`/`.ov-filters`; feature density only under lease | Same header/data axes; numeric quantities end-aligned; no page overflow; no global table token edit |
| A07 / DashboardT | Same accepted activity identities/order, represented by four cards with ID/type/time/actor/status/quantity/action | `.ov-mobile-list` / `.ov-mobile-row*`; feature scoped reflow only | No clipping/overlap; preserve information and full action names. Current approved4 source supports cards despite historical snapshot table language |
| A08 / DashboardD/T | Actual displayed range1–4 of16/page1/four pages in isolated artwork scenario | `Pagination` consumes accepted response and source policy; shared production10/options10/15/25/50 retained | Isolated4 requires scenario receipt; current product default4 remains G03. No global option4 or falsified total |
| A09 / DetailD/T | PX-0007, outbound icon/eyebrow/number+copy/pending status/close; fields and system ID; two footer actions | `AcceptedRowDetail.tsx`, `.ov-detail-modal*`, shared GlobalModal mechanics | Record body/header/footer boxes, copy targets and pending style; typography/icon exactness G05/G06 |
| A10 / DetailD | Two-column field layout: left type/warehouse/actor; right partner/quantity/time; status in header row | `.ov-detail-fields` / `[data-field]` placement in `overview.css` | Reference5 anchors allow scoped box/alignment repair without resolving exact color/font |
| A11 / DetailT | One-column type/warehouse/partner/quantity/actor/time; status below title; system section; two footer buttons | Existing responsive detail variant, no copied dialog/focus framework | Reference6 composition diagnostic + standard800×1280 body scroll/reachable footer; no stretch-to-fit |
| A12 / all4 | Preserve shared44CSS interaction target, keyboard names, focus trap/Escape/return, valid copy feedback, scrolling and no unintended errors | Existing shared mechanics; S00#4 validates, S00#1 serializes any shared fix | Raster art is no waiver for small controls; runtime evidence NOT_RUN here |
| A13 / all4 | GlobalShell/header/sidebar and Notification bytes preserved; no chart introduced | Separate shared owners; no runtime lease from this report | S00#5 hash/source audit and impacted regression; content bounds never justify shell copying |
| A14 / all4 | Every accepted fix has named BEFORE defect, selector/component owner, source anchor/semantic evidence, AFTER measurement and independent QA | S00#1 defect routing + S00#2 bounded lease + S00#3/4 | Missing exact font/icon/tolerance does not hold up independently supported geometry repair; exact whole-screen sign-off remains bounded by gaps |

## Semantic scenario and state register

| Scope | Required meaning / receipt |
|---|---|
| Comparison period/context | Kho Hoa Nam; inclusive 01/09/2026–30/09/2026; VI/light; read-only MOCK/source fixture. Freeze and record clock/timezone through QA. No production writes. The existing source's September default is an observation, not authority to change DatePicker defaults or impose a new fixed period. |
| KPI / activity scope | inbound8/outbound8 are document counts across source states in period; documents16; warranty4 is currently open and not period-filtered; stock unknown `—` and explanatory helper. These are comparison scenario values, not new business/API definitions. |
| Pending scope | Artwork badge3 plus three attention entries. Current functional investigation reports source waiting5 and UI slices first3. Record aggregate waiting, attention supplied, attention displayed separately. The current source total5 must remain5. This report authorizes no fixture/count change to obtain3. Preserve and disclose the artwork/source mismatch; any different pending scenario requires a separate S00#1 data-authority decision. No badge rewrite5→3 to match artwork. |
| PX-0007 identity | `id=p12-stock-PX-0007`, `number=PX-0007`, outbound/Xuất kho, Kho Hoa Nam, Cửa hàng An Bình, quantity2, actor Lan Nguyễn, 19/09/2026 ·14:35, waiting/Chờ xử lý trên Web. S00#4 reported fixture verification; its own evidence receipt remains authoritative for runtime verification. |
| Detail action semantics | Copy number and system ID copy their exact accepted fields; source-verified document link only; unavailable link stays unavailable with explanation. Close/Escape returns focus to surviving opener or defined fallback. No edit/delete permission added. |
| Unknown vs empty/error | Unknown stock is not0; unknown totals not0; empty results, unavailable period, read error/offline, denied/expired and missing detail remain distinct. Preserve last accepted query/model on blocked or failed refresh. |

| Additional state | Functional/robustness work authorized | Exact visual-reference status |
|---|---|---|
| Loading/refreshing/no records/no results/error/offline | Trigger deterministically; verify honest status, stable accepted state and reachable actions | DESIGN_REFERENCE_MISSING |
| Denied/expired/unavailable detail/copy failure | Validate capability, stale selection, safe failure and focus handling | DESIGN_REFERENCE_MISSING |
| EN/zh-CN/dark/long strings/zoom/landscape | Check wrapping, glyph coverage, controls, overflow and keyboard; no shrinking to fit | Approved matching state/locale/theme art missing; do not infer visual PASS |

## Correction handoff and exit conditions

S00#2 may correct measured, feature-owned layout defects after S00#1 supplies a runtime lease and four real-app BEFORE captures exist. A correction should name the relevant native anchor, actual computed CSS box, declared transform and desired relative relation; preserve semantic content and shared mechanics. New exact font weights, icons, palette tokens, breakpoints, design variants or shared edits require the corresponding owner/decision. A content box correction does not require inventing those missing values.

S00#3 provides four original/actual/diff sets, geometry, explicit transforms, actual/source hashes and source-qualified visual conclusions. S00#4 supplies scenario consistency, keyboard/contrast/console and shared-impact regression. S00#5 audits final source and locked-byte preservation. S00#1 integrates exact candidate/source identity and gate results. Unknown pixel tolerance and source6 normalization prevent unqualified pixel-perfect/four-state visual PASS; separately measured correction results must still be reported. No source baseline replacement, global contract revision, runtime edit, commit or deployment was made by this role.

## Scoped decision addendum — deterministic pending3 and semantic locks

Decision `DG-S01-004-QA-SCENARIO-01`, following S00#1's explicit renewed handoff of the user's instruction to isolate a proper deterministic scenario when the current fixture differs. This supersedes the earlier **test-scenario** restriction against deriving pending3 in this report; original source waiting5 and all production restrictions remain preserved.

- The user instruction authorizes a **declared QA-synthetic derivative** with3 waiting documents, not a claim that Scanner source approved new statuses. Keep source16documents/8in/8out/warranty4/stockUnknown and exact PX-0007 fields. The deterministic delta can set `fixture-inbound-0005`/PN-0005 and `p12-stock-PN-0006`/PN-0006 from waiting to posted **only in the isolated QA read model**, leaving PX-0007/PN-0009/PX-0010 waiting. Recompute waiting/posted, attention, filter/sort/page results from the derivative; never patch summary.waiting alone. This produces waiting3/posted13 while keeping the first4 September rows unchanged.
- Record original dataset hash, derived dataset hash, explicit two-record delta, `provenance=QA_SYNTHETIC`, distinct scenario/snapshot identity, test-only entry and clock/query. Do not call the derivative exact `SOURCE_FIXTURE`, change the pinned JSON, reuse original source snapshot as if unchanged, or invent approved source status/event history. QA data is authorized test input and belongs in evidence, without UI banners that shift layout.
- Current detail-link contract is a real constraint: `acceptedOverviewDocumentHref` requires `SOURCE_FIXTURE` plus matching target/source snapshot, and `readOverviewSourceDocument` resolves only the original snapshot from the pinned JSON. Therefore ordinary QA_SYNTHETIC adapter injection correctly makes the document CTA unavailable. Preserve that behavior. An enabled CTA must not be obtained by forging provenance/snapshot or weakening the production guard.
- **Immediate recommendation:** run DashboardD/T in the isolated derived pending3 read-model scenario for deterministic visual comparison, while retaining canonical source5 Dashboard/PX captures and canonical real PX-0007 document-navigation tests. Source5 versus synthetic3 are separate evidence cohorts. Their results cannot be collapsed into an unqualified single four-state/CTA scenario PASS. This avoids blocking deterministic Dashboard comparison and keeps the document-link proof honest.
- A complete pending3 four-state cohort with enabled source-document CTA would require explicit test-only end-to-end snapshot/resolver wiring that maintains honest QA identity across list/detail/destination. The current adapter injection alone does not provide this. Such additional harness wiring can be routed by S00#1 if needed; no product permission/business change or second user approval for synthetic test data is required. Until implemented and verified, retain the canonical PX CTA evidence and disclose the remaining cohort boundary.
- Removing the inaccessible Desktop white-on-orange attention-count override so the existing accessible warning text/fill pair applies is a **semantic accessibility correction**. It does not approve a new sampled palette or change status meaning. Confirm the computed pair and actual contrast after the override removal.
- Restoring shared44CSS interaction targets is a **semantic locked-control correction**, even where it increases visual density/row height relative to generated artwork. Preserve readable text and reachable controls, measure actual hit bounds, and disclose the resulting reference-density difference. Artwork does not waive the44CSS lock.

## Scoped residual decision — Desktop detail footer

`DG-S01-004-FOOTER-01`, source inspected at `f56e25c`: A09/A14 already permit a feature-local Desktop footer whitespace correction once S00#3 confirms the effective computed box and S00#1 supplies the implementation lease. Source `overview.css` applies24CSS padding to `.ov-detail-modal .hn-global-modal__footer`; footer buttons retain50CSS minimum. A **Desktop-only `padding-block:16px` trial**, keeping inline padding, button size/type, shell/shared bytes and Tablet24CSS unchanged, is within that authority. Use the existing Desktop condition above1100CSS; this does not approve a new breakpoint or global spacing token.

Measured source5 footer span is82 native pixels (divider782 to bottom864). If the actual modal width is confirmed800CSS against reference795 native pixels, the explicitly declared width-normalized footer target is `82×800/795≈82.52CSS`. A50CSS button with16+16 block padding and approximately1CSS divider yields about83CSS, versus approximately99CSS with24+24 padding. Thus the trial predicts roughly16.4 native-pixel reduction and can explain most of Visual QA's reported approximately20 native-pixel excess. These are conditional box calculations, **not recovered sourceDPR, an exact approved CSS footer size, or an accepted pixel tolerance**.

Before acceptance, S00#3 must confirm actual width, computed padding/button/divider/footer boxes and the applicable transform; remeasure final footer/modal residuals and confirm Tablet unchanged. S00#4 verifies no wrapped/clipped CTA, focus/scroll/keyboard regression and preserved44/50CSS targets on the final source. Existing font/icon/token/tolerance gaps remain. No exact-pixel PASS or release approval is granted by this decision.
