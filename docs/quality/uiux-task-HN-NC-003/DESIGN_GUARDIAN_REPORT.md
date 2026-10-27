# Design Guardian — HN-NC-003

Date: 2026-10-27 (UTC+07). Owner: S00#6. Reviewer/integration: S00#1. Audit base: `DEV`, `78752811af4b0434c958d604dc52ca445cdbeede`; clean working tree at audit start.

## Verdict and scope

**APPROVED_REFERENCE_IDENTITY / SCOPED_VISUAL_AUDIT_READY.** The user's current request expressly supplies Desktop and Tablet Notification Center references and limits their authority to the Notification Center. This agrees with `DEC-DG-20261027-01` in `DESIGN_CONTRACT.md` v1.2.0-recovery and `BASELINE_MANIFEST.md` v1.1.0-recovery. These references permit measuring and correcting verified differences in the depicted VI/light Notification Center composition. They do not approve current runtime, unprovided states, new business rules, exact CSS values inferred from raster alone, or global shell changes.

Broader `DESIGN_READY_BLOCKED` status of the historical global/S01 contract remains. This scoped audit does not reopen previously approved Sidebar/Header. S00#3 owns actual/reference/diff and visual verdict; S00#4 owns behavioral results. No visual or functional PASS is asserted by this report.

## Reference custody and version

Originals were opened visually and their PNG IHDR dimensions and SHA-256 were checked. Both are byte-identical to existing tracked custody; no duplicate baseline is needed. The registration version is an audit/custody version, not an invented design revision.

| ID | User original | Tracked custody relative to `docs/quality/` | Raster px | SHA-256 |
|---|---|---|---|---|
| BL-NOTIFY-D | `C:/Users/Admin/Desktop/HN_Astra/1.png` | `references/hn-astra-20261027/1.png` | 1774×887 | `fa1a5615926a3a15b4cdf72d3482f53f4755931f9b881f8f34874a35233ae22c` |
| BL-NOTIFY-T | `C:/Users/Admin/Desktop/HN_Astra/2.png` | `references/hn-astra-20261027/2.png` | 992×1586 | `65606c1c19e7124340cdf18f41d201b136be755059275dd2b777847b268569f4` |

Current authority: explicit user request, 2026-10-27, Notification Center only. Exact original design revision/date, source CSS viewport, device scale factor, zoom and export transform are not supplied. Do not label them known from PNG dimensions.

## Auto-discovered route and source mapping

Notification Center is a global modal opened by `NotificationBell` in the application shell, not a dedicated business screen route. It is available on authenticated browser Preview screens such as `#/preview/S01` and `#/preview/S15`. The reference backdrop depicts S15; using S15 offers comparable context without replacing its locked shell. `#/account/notifications` is account settings and must not be substituted for this modal.

| Concern | Owning source / selector | Acceptance responsibility |
|---|---|---|
| Open/close trigger and actor binding | `src/shared/ShellHeader.tsx`, `NotificationBell`, `aria-controls=hn-preview-notification-center` | S00#3 capture real bell/modal; S00#4 auth/session/focus |
| Modal content and behavior | `src/notifications/PreviewNotificationCenter.tsx`, `NotificationCenterView`, `.hn-notification-center` | Preserve shared modal mechanics and existing state/dispatch |
| Modal focus, close and scroll locking | `src/shared/GlobalModal.tsx` | Do not copy or replace shared focus logic |
| Desktop/list/detail skin | `src/notifications/notifications.css` | Scoped corrections only after verified defects |
| Bell/count formatter | `NotificationBell.tsx`, `notification-badge.ts` | 0/unknown hidden, >=100 `99+`, full known accessible count |
| Titles, summaries, localization | `notification-copy.ts`, feed presentation data | VI/light reference; no numeral or sample text becomes a business constant |
| State/repository/deep link | `notification-state.ts`, `notification-preview-store.ts`, `notification-target.ts`, `src/app/notification-document-route.ts` | S00#4; design does not grant permission/business changes |
| Isolated diagnostics only | `#/harness/notifications`, `#/harness/notifications-repository`, `tests/visual/notification.html` | Cannot replace real application before/after evidence |

## Design acceptance matrix

| Property/state | Approved by references | Measurement / implementation guard |
|---|---|---|
| Desktop structure | Backdrop, single modal, icon/title/subtitle/unread badge/close, left search/tabs/list, right selected detail, business summary card, actions/footer/navigation | Compare modal content with source; preserve full capture and declared crop. Column boundary is about 46.5% of modal width in source, not authority for every viewport. |
| Tablet structure | Single list column; search, all/unread tabs, mark-all, two dated groups, timestamps, unread dots/tinted rows, chevrons and count footer | Detail appears through an interaction under existing tablet contract; no supplied tablet detail screenshot or new pixel baseline is inferred. |
| Selection versus unread | Desktop selected first read row has separate accent/tint; unread rows show dots. Tablet unread rows tinted; selected read row does not inherit desktop selection stripe | Test these independently; do not conflate read state with business document status. |
| Typography | Clear heading/body/metadata hierarchy and VI text shaping | Public Sans family is confirmed by recovered RF-01/02. Exact component font weight/size/line-height are unresolved unless measured as candidate values, not promoted to approved tokens. Existing 650 weights are observations. |
| Colors/icons | Semantic blue action/info, amber warning, green inbound, purple warranty; outline icons; white/light modal and subtle dividers | Shared approved brand/control family remains; notification-specific exact palette/glyph paths need source/computed measurement. No global palette/font/icon replacement from these images. |
| Geometry | Desktop two-pane and Tablet portrait composition; consistent rows, aligned timestamps, no clipping | Raster measurements may be recorded as pixel evidence. They do not establish CSS dimensions, source DPR or breakpoint authority. |
| Footer/actions | Desktop document CTA, read toggle, note that read status does not mutate document status, previous/next | Preserve real verified target and permission gating; do not invent CTA success for unsupported links. Footer must be reachable. |
| Keyboard/accessibility/scroll | Existing shared focus/keyboard/scroll contract applies; screenshots alone do not certify it | S00#4 verifies focus trap, Escape/return, accessible names, tab operation, scroll containment and safe target sizes. |
| Light/VI | Both references directly support this visual scope | Primary fidelity comparison. |
| Dark/EN/zh-CN | Runtime and general robustness requirement; no matching Notification baseline supplied here | Run functional, contrast/reflow/translation diagnostics; visual reference assertion remains `DESIGN_REFERENCE_MISSING`, not pixel PASS or permission to invent a baseline. |
| Loading/empty/error/offline/denied/expired | Existing semantic state contracts apply; no state-specific source art here | Exercise deterministic safe test states; distinguish behavioral PASS from missing approved state artwork. |

## Normalization and evidence requirements

1. Capture the real local application when the public deployed SHA cannot be proved. Record exact commit/build, URL, auth/test account scope, browser, font readiness, theme/locale, CSS viewport/DPR, pointer/orientation, clock/timezone, data scenario and selected notification. Use fresh isolated Preview storage; no production writes.
2. For same-raster diagnosis, captures at 1774×887 and 992×1586 CSS/DPR1 may help locate source differences; these are **diagnostic assumptions**, not claims of original source CSS dimensions. Additionally run existing declared 1920×1080 DPR1 and 800×1280 DPR2 profiles with documented transform. Do not call 1600×2560 a CSS Tablet viewport.
3. Preserve original full PNG, full actual, modal/content crops, overlay/diff and computed geometry. Store exact crop/scale transforms and hashes. Never stretch source to an actual modal and then omit the size/placement defect from the report.
4. Sample fixture text is not constant. Prefer the existing approved safe Preview six-item scenario and fixed QA clock where practical. Record intentional date/data differences so image-wide diff noise is not mistaken for a geometry defect or silently waived.
5. `PreviewNotificationCenter.tsx` currently formats/groups time with `Asia/Bangkok`; historical shared contract states `Asia/Ho_Chi_Minh`. Equal UTC offset on test dates is not timezone identity approval. Preserve business logic and record the discrepancy for S00#4 rather than changing it as a CSS task.

## Explicit design gaps / guardrails

| ID | Gap | Disposition |
|---|---|---|
| NC-DG-01 | Source CSS viewport/DPR/export transform and exact font/token parameters unknown | Record assumptions and quantitative deltas; do not invent approved CSS measurements. Scope-backed composition fixes can proceed under S00#1 lease. |
| NC-DG-02 | User says centered modal, while Desktop source appears offset relative full viewport | Source raster modal approximately x390/y113/w1087/h728, with center about +46/+34 from raster center. These are visual diagnostic estimates, not automated bounds. Current desktop CSS translates up to48/34. S00#3 must measure the centering frame before classifying this as a defect; do not remove translation solely from generic centering language. |
| NC-DG-03 | Unprovided Tablet detail/alternate-state/dark/locale artwork | Functional/reflow/a11y checks allowed. Exact visual approval remains missing. |
| NC-DG-04 | Toast CTA/modal non-occlusion has current user authority, but old timing/presentation lock remains unresolved | Test collision; preserve timing and avoid redesigning global Toast without a separate lease. |
| NC-DG-05 | Shell artifact/version still not recovered | Excluded from these reference comparisons and source edits; do not ask user to reapprove shell or replace it from backdrop. |

## Commands and delivery

Read repository `AGENTS.md`, contract, baseline manifest, component spec, owning notification sources, shell integration and QA fixtures. Ran `git rev-parse HEAD`, `git status --short --branch`, targeted `rg`, SHA-256 and PNG IHDR dimension checks on both originals/custody files. Opened both originals visually. No browser/test execution by this Design Guardian and no actual/diff acceptance claim.

Requested model/reasoning: `gpt-6.1-sol` / `high`. `ACTUAL_MODEL=UNVERIFIED`, `ACTUAL_REASONING=UNVERIFIED`: no authoritative runtime execution metadata is exposed to this child. Parent dispatch configuration is not independent model telemetry.

Only this new report was created. No runtime, test, original baseline, contract or prior report was modified; no commit/push/deploy performed.

## Addendum — bounded Tablet placement / close control decision

Date: 2026-10-27. Requested by S00#1 after real-application browser capture; base remains the audit SHA above. This decision authorizes only a scoped implementation candidate followed by independent retest; it does not assert runtime PASS or redefine reference custody.

### Placement decision

S00#3/S00#1 report measured same-raster Tablet reference bounds `x61/y261/w881/h1262` and actual bounds `x56/y162/w880/h1262`, using the explicitly assumed `992x1586 CSS px / DPR1` diagnostic profile. Desktop is reported within 1px. The supplied reference depicts the Tablet composition below the full-viewport center; its modal bounds also match the current height/width closely. Correcting the confirmed placement within Notification Center is authorized by the current user fidelity request. It must remain labeled a reference-derived implementation hypothesis: original CSS viewport/DPR/export transform is still unknown.

Retain Desktop placement. An implementation candidate confined to the existing `801px..1100px` portrait geometry rule can use an approximately `0.55vw` horizontal and `6.25dvh` vertical positive translation. Clamp each translation to available free space minus a 24px edge allowance. With the current nominal 880px width /1262px height in this rule, the following values are testable candidates:

```css
translate:
  min(0.55vw, max(0px, calc((100vw - 880px) / 2 - 24px)))
  min(6.25dvh, max(0px, calc((100dvh - 1262px) / 2 - 24px)));
```

At 992x1586 they yield approximately +5.46px/+99.13px, bringing the measured origin to approximately 61.46/261.13. If height/width later change, recalculate guards using actual available geometry; do not retain obsolete constants. At short or width-constrained viewports the permitted shift must reach zero before clipping. Do not add a global dialog transform, override desktop centering, or move the locked shell.

Acceptance: independently capture full real application, modal bounds and visible footer at 992x1586; compare placement with the unaltered original reference; check no clipping/overflow at neighboring portrait widths/heights, existing 800x1280 DPR2, and mobile/landscape profiles. Nonmatching source profiles establish responsive safety and behavior only. No pixel approval for an unprovided profile may be inferred. Preserve list/detail scrolling and shared focus restoration.

### Close glyph decision

The actual source uses shared `Icon name="close" size={18}` in `GlobalModal.tsx`; its existing shared path spans coordinates6..18 inside the24-unit SVG viewBox (`Icon.tsx`). Thus SVG element bounds and visible painted cross bounds are different measures. The opened Tablet reference visibly contains a substantially larger cross, approximately20px painted extent; a reported28px box must not be mislabeled28px painted extent. A notification-only portrait CSS candidate is approximately36px SVG dimensions with a44px control and reduced padding near4px; the current shared path would paint about20px including stroke. Inspect resulting bounding boxes/painted crop and ensure the button does not flex-shrink the icon or clip its stroke.

This permits size correction inside this notification breakpoint only, retaining the existing shared close path, accessible label,44px hit target, keyboard/Escape behavior and focus return. It does not authorize changing `GlobalModal.tsx`, the global icon glyph, global icon sizing, or icon color. If actual ink measurement disagrees, choose the measured scoped size and record it as candidate calibration, not an approved global token.

### Remaining gaps

Exact typography/glyph design family/color parameters are not recoverable from this placement evidence and remain DESIGN_GAP. Retain the existing approved font/icon/token families. Do not report all-pixel visual PASS merely because placement and close size improve. S00#3 owns independent after/reference/diff and geometry evidence; S00#4 owns functional regression. No runtime/test/baseline edits were made by Design Guardian for this addendum.

## Addendum — residual geometry classification after bounded CSS fix

Task: HN-NC-UIUX-003. Date:2026-10-27. Requested by S00#1 after CSS commit `3ca0ef24e4f3db4e90bbb1e26f0d117c356246fe`; source inspected at interim semantic candidate `e5ba486fb82a05fcf6cb7aa7b56fda17dc4bcb16`. Final independent capture/retest is pending the final functional-fix SHA. Only this report is leased to S00#6.

Read contract v1.2.0-recovery, current task packet, S00#3 report, owning Notification source/CSS and immutable before/reference captures. Reopened full Desktop before and original1.png, and full Tablet before; original2.png was visually inspected during the earlier decision. This is a property-specific design disposition, not final visual acceptance.

| Residual | Classification | Decision |
|---|---|---|
| Tablet adjacent unread fills touch; source has separated rounded surfaces with approximately2px light strip (reference vertical fill runs752–865 and867–980 atx104) | IMPLEMENTATION_DEVIATION, scoped P3 composition | Actionable under the approved Tablet artwork and declared992x1586@1 normalization. Distinct rounded rows and visible separation are directly shown; no font/token authority is needed to restore that composition. Implement a bounded candidate and independently measure it. |
| Desktop heading painted ink starts about5px high; heading icon about2px high | DESIGN_GAP for exact type metrics; P3 optical discrepancy retained | Ink extents alone do not establish the line-box/baseline, source typeface metrics or original CSS. Search/card geometry is already close. Do not move the entire header, substitute fonts or alter weights/line-height to chase raster ink. A separate header-geometry candidate would require bounding-box/root-cause evidence proving a position error independently of glyph metrics. |
| Desktop business card top source424 vs actual425 | Small measured residual, P3 | Preserve current implementation; 1px raster-edge difference under unresolved source transform is insufficient to justify another override or a pixel PASS. |
| Desktop footer divider source765 vs actual770 | Actionable P3 geometric residual, optional within pilot | Divider is a geometric edge, unlike glyph ink. Record it; correction is not a critical acceptance invariant. If corrected, preserve already aligned footer controls and CTA. Check flex behavior before choosing property. |
| Exact typography, color/glyph paths, source export/DPR and pixel threshold | DESIGN_GAP | These remain unresolved; no blanket authority or all-pixel PASS is conferred by the user's two screenshots. |

### Minimal Tablet separation candidate

Current CSS uses `.hn-notification-center .hn-notification-list > li+li { border-top:1px solid var(--hn-border-subtle); }` and, in the existing801–1100px portrait scope, `.hn-notification-item { min-height:116px; }`. The button owns unread fill and rounding. Only the boundary between two adjacent unread siblings needs correction; do not replace all list borders or add a global row gap.

Within that same existing801–1100px portrait media rule, a precise candidate selector is:

```css
.hn-notification-center .hn-notification-list >
li:has(> .hn-notification-item[data-unread='true']) +
li:has(> .hn-notification-item[data-unread='true']) {
  border-top: 2px solid var(--hn-surface);
}
```

This adds one occupied pixel compared with the existing1px border. If measured row/section/footer geometry must stay fixed, apply `min-height:115px` to the direct `.hn-notification-item` child of that same matched second `li` only, keeping its overall117px occupied slot (2+115 rather than1+116). Treat this compensation as conditional on measured natural content height: translated/wrapped content must be allowed to grow, with no fixed height, clipping or typography shrinking. Keep this selector independent of particular IDs or sample texts. Existing browser targets support `:has`; if a supported runtime does not, use an explicit semantic boundary marker from existing state under a separately approved lease, never a sample-data workaround.

Acceptance: same reference hashes, source and real-app992x1586@1 capture; approximately2px light separation between the two unread fills at the measured shared horizontal coordinate, independently rounded surfaces, no merged-looking block; record both row bounds and total list geometry. Verify read/unread changes, unread filter, keyboard focus and Tablet detail/Back remain correct. Verify no horizontal overflow, clipped list/footer or viewport-edge violation at neighboring portrait sizes and800x1280 DPR2; unprovided profiles certify safety/behavior only. Preserve Desktop and read-row divider behavior. No baseline rewrite.

### Desktop divider recommendation, if leased later

Current `.hn-notification-detail-content { flex:1; }` means reducing footer margin may simply be absorbed by content flex and fail to move the divider. In before/reference captures, footer controls appear already vertically aligned. If computed bounds confirm that, a desktop-only footer `padding-top` candidate19px instead of current14px increases the footer box5px, allowing its top border to move up while keeping bottom-aligned controls stable. This is provisional local calibration, not a recovered spacing token. If content overflows or controls do not remain aligned, retain the P3 residual and evidence rather than stack compensating overrides. This optional suggestion supersedes an earlier message proposing a margin reduction before flex ownership was checked.

No runtime, test, immutable reference, global token, contract or historical evidence was edited by S00#6. The pending final source must be independently captured by S00#3 and functionally retested by S00#4. Scoped correction authority does not close the remaining DESIGN_GAPs or establish visual PASS.

## Addendum — scoped contrast remediation disposition

Task:HN-NC-UIUX-003. Date:2026-10-27. Clean inspected source `e57f6aed038e81d8b6a3b4f0eeccbb4c853012dc`; S00#4 evidence `functional/shared-final-diagnostic/contrast-1920-light.json`, source tree `83a136cf4d39e9591f3721b37dc444d5151e2098`, empty working source diff at sampling. S00#6 read this receipt and opened `1920-light-detail-0.png`; this is an actual browser screenshot, not approved design.

### Authority decision

**SCOPED_ACCESSIBILITY_REMEDIATION_AUTHORIZED / INDEPENDENT_RETEST_REQUIRED.** The current user explicitly requests Notification accessibility audit, confirmed-defect correction and regression. Contract1.2.0-recovery classifies exact light semantic palette and feature values as PROVISIONAL, with no recovered locked Notification-specific text hex. The supplied art approves composition/semantic color family; it does not approve failing contrast or specify an exact text color. A minimal Notification-only repair using an already implemented semantic status text family is within the requested scope. No new global palette, baseline replacement or user reapproval of unrelated locked shell is needed. This disposition does not make the implementation-derived candidates approved pixel tokens; retain the original art and disclose the local appearance delta in visual evidence.

No existing named warning/success text CSS variables were found in the inspected foundation registry. Do not invent one or describe an implementation literal as an approved design token. Existing shared status styles provide actual reusable family values: `src/shared/components.css:109` success `#286645`, line110 warning `#835811`, repeated in `src/shared/unified.css:94`. Their historical exact-color approval is not established here. Reusing these scoped values is a controlled accessibility candidate, not proof of a new global color lock.

### Measurements and exact candidates

The following ratios were independently recalculated in tool-executed JavaScript using sRGB channels normalized to0..1, linearized at0.04045 (`s/12.92` below, `((s+.055)/1.055)^2.4` above), luminance weights.2126/.7152/.0722 and `(Llighter+.05)/(Ldarker+.05)`. Fractional channels were retained for alpha composition. Candidate arithmetic is not browser retest PASS.

| Concern | Current / evidence | Local candidate | Calculated contrast |
|---|---|---|---|
| Search placeholder | Existing `--hn-muted #53677a`, opacity.75 onwhite;14px400 in S00#4 actual. Effective RGB126/141/155.25 | Same existing `--hn-muted`, opacity1; no font/layout change | Current3.402425; candidate5.851331 |
| Warning business status | Actual `#c66a00` on`#fff0d8`,14px400; S00#4 observed default and three detail views, all below requested4.5 | Existing shared warning text family `#835811`, retain Notification fill`#fff0d8` | Current3.424567; candidate5.552797 |
| Success business status | CSS sibling uses`#009d48` on`#def7e6`; no reachable success receipt in inspected contrast file | Existing shared success text family`#286645`, retain Notification fill`#def7e6`, only after confirming reachable state | Current CSS-derived3.135855; candidate6.030105 |

Minimal notification-only selectors/candidates:

```css
.hn-notification-center .hn-notification-search input::placeholder {
  opacity: 1;
}
html:not([data-hn-theme='dark']) .hn-notification-center
.hn-notification-business-status--warning {
  color: #835811;
}
html:not([data-hn-theme='dark']) .hn-notification-center
.hn-notification-business-status--success {
  color: #286645;
}
```

The light-only semantic selectors intentionally preserve current dark treatment. Placeholder opacity1 applies within Notification only; independently verify the existing theme-aware muted value in both themes. Keep list/category icon accent variables, status fills, font metrics, modal geometry, disabled appearance, global status classes and all business logic unchanged. A status badge's decorative inline icon may inherit its text color consistently; no shared glyph or icon-family change is authorized. Do not darken the feature-wide warning/success variables, because they also affect list/category artwork outside the confirmed text defect.

Success is currently a source-backed sibling risk rather than a browser-confirmed defect in the inspected S00#4 receipt. Ask S00#4 to open the supported safe successful notification/detail and measure before classifying it as reproduced. The same scoped text-family repair is permitted if confirmed; do not add a success feature/state solely for this test. If it is unreachable under the approved scenario, retain NOT_RUN for its actual measurement and report the CSS-derived risk separately.

### Acceptance and limits

S00#2 receives a serialized lease for `src/notifications/notifications.css` through S00#1. S00#4 must retain before receipts, then independently sample computed actual colors, effective opacity, text metrics and solid background for final SHA in Desktop/Tablet VI/light and corresponding dark controls. Required executed ordinary text cases must meet4.5 without rounding up. Exercise warning detail variants and reachable success variant; fail if a text override is canceled by cascade or an ancestor alpha layer changes the result. Run focus/read/unread/search/filter/detail and impacted shared regression. S00#3 recaptures final before/after/diff with original references unchanged and records the justified contrast-related color delta separately from unresolved typography/optical gaps. Other locales require reflow/behavior, not invented pixel baselines.

This is a bounded authorization to remediate confirmed a11y defects. It is not blanket WCAG certification, pixel fidelity PASS, proof of approved token identity, or release permission. No source, test, baseline, contract or global palette was changed by S00#6; only this report was appended.

## Addendum — coherent Tablet toolbar/list/footer calibration

Task:HN-NC-UIUX-003. Date:2026-10-27. Inspected clean candidate `76059cce616543356c623ec248c6350ddd07cdf5`; unchanged original2.png, full `visual/after-76059cc/tablet-native-after.png`, `capture-results.json`, `geometry-paint-summary.json`, owning CSS and S00#3's measured residual handoff. Reference/candidate profile remains explicitly assumed992x1586 CSS/DPR1; exact original export remains unknown. Source is held while independent Functional QA runs. Only this report is leased to S00#6.

### Disposition

**SCOPED_GEOMETRY_CANDIDATE_AUTHORIZED / INDEPENDENT_RETEST_REQUIRED.** The modal envelope is now correctly positioned. Search/filter boundaries, row/icon boxes, distinct unread surfaces and footer divider are geometric shapes directly supported by the approved artwork. Their remaining coherent Tablet composition deviation is actionable under the user's current fidelity request; an exact font lock is not needed to correct these box measurements. This does not authorize typography/glyph/color changes or redefine a baseline/tolerance. Global Header/Sidebar remain excluded.

Measured current boxes: searchx98.456/y422.125/h56; filtery480.125/h77,bottom557.125; first group headingy557.125/h65,bottom622.125; row heights116/116/115/116/116/116; icons70x70 atx116.456, y645.125/762.125/879.625/996.125/1206.125/1323.125; next group headingy1118.125/h65,bottom1183.125; footerx88.456/y1453.125/h69. Modalx61.456/y261.125/w880/h1262.

S00#3 measured reference raster edges with approximately1–2px edge uncertainty: search431..488, filterbottom574, first group divider643, second group top divider1125/bottom1191, iconsx112,y661/773/889/1006/1212/1328; footer divider1439. Unread fill reference extends to aboutx922 while search/group divider ends aboutx909. Current toolbar-only shift would overshoot later rows: row/group pitch must be addressed together.

### Complete bounded candidate, not recovered CSS constants

Apply only inside existing `(min-width:801px) and (max-width:1100px) and (orientation:portrait)`. Consolidate/adjust the owning rules in the serialized Notification CSS lease; avoid competing late overrides. These are measured implementation candidates, subject to below interaction/overflow guards:

```css
.hn-notification-center .hn-notification-center-toolbar {
  padding-top:29px;
  padding-inline:32px;
}
.hn-notification-center .hn-notification-filter-row { min-height:85px; }
.hn-notification-center .hn-notification-groups { padding-inline:32px; }
.hn-notification-center .hn-notification-group h3 { padding-bottom:16px; }
.hn-notification-center .hn-notification-group + .hn-notification-group {
  margin-top:26px;
}
.hn-notification-center .hn-notification-group + .hn-notification-group h3 {
  padding-bottom:14px;
}
.hn-notification-center .hn-notification-item {
  column-gap:36px;
  width:calc(100% + 14px);
  min-height:116px;
}
.hn-notification-center .hn-notification-group:first-child
.hn-notification-item[data-selected='true'][data-unread='false'] {
  min-height:108px;
}
.hn-notification-center .hn-notification-item[data-unread='true'] {
  min-height:114px;
}
.hn-notification-center .hn-notification-group + .hn-notification-group
.hn-notification-item:not([data-unread='true']) {
  min-height:114px;
}
.hn-notification-center .hn-notification-list >
li:has(> .hn-notification-item[data-unread='true']) +
li:has(> .hn-notification-item[data-unread='true']) > .hn-notification-item {
  min-height:113px;
}
.hn-notification-center .hn-notification-list-footer {
  margin-inline:32px;
  padding-bottom:42px;
}
```

Retain the already corrected2px surface border between adjacent unread siblings, row padding18px,70px icons, existing fonts, text line heights, read semantics and scroll/focus mechanics. Keep footer top padding16px; unresolved text ink does not justify adjusting it. No pixel-selected IDs, date/title content, nth-child per-record offsets or sample count constants may enter runtime. The first-group selected/read density uses existing semantic attributes, not a sample ID. It is a candidate derived from this depicted state, not authority that selection must change row geometry in all states; the interaction guard below is mandatory.

Predicted default-state boxes under unchanged text natural height: searchtop431.125; filterbottom574.125; first group divider643.125; first four iconsy662.125/774.125/889.625/1005.125; second group headingy1125.125,bottom1192.125; final iconsy1214.125/1329.125; footer divider1439.125. Existing flex scroll slot will contract while rows compress, retaining the six-item scenario without fixing row height. These are arithmetic predictions, not executed results or a newly approved tolerance. Keep `min-height`, not fixed height: translated/wrapped text must grow.

Horizontal reasoning: inline gutters36→32 move iconx116.456→112.456 and searchleft98.456→94.456. A14px row extension within the remaining32px modal gutter gives row/fillright about922.456, matching the artwork bleed beyond the search/group divider; it must remain inside the modal's safe inner edge at every tested width. The gap28→36 yields non-unread title box about218.456 while preserving icon alignment; date/chevron right alignment benefits from the controlled row extension. Do not extend the group divider/search itself to the unread fill edge; these are distinct approved boundaries.

### Unread text and interaction guard

With this box correction, unread dot center is predicted around219.96, close to the source220, while title ink may still start around242.46 versus source247. The remaining approximately5px ink delta has not been established independently of font shaping/metrics. Keep DESIGN_GAP; do not displace a correctly aligned dot, add text-indent hacks, substitute font or alter glyph paths to chase it. S00#3 must distinguish title box, dot box and painted ink in final evidence.

Changing selection/read state must not introduce an unapproved visible list jump or destroy scroll restoration. S00#2/S00#4 must inspect the compact selected/read density in normal open/detail/Back, previous/next, mark-unread/read, search and unread filter. If it causes selection-dependent row jumping, reject that part of the candidate and derive a stable slot/inset mechanism with measured evidence under the same Notification-only lease; do not land an interaction regression just to match the default screenshot. A failed candidate remains FAIL and is not evidence of a locked design decision. Any remaining small default optical residual must be recorded rather than concealed by sample-specific selectors.

### Required one-batch acceptance

S00#1 may hand the complete candidate to S00#2 only after the current QA read lease finishes. Run one measured implementation calibration, then independent S00#3/S00#4 on the resulting exact SHA. Compare unchanged full reference/actual and crops; record search/filter/group/icon/fill/footer bounds and actual effective row heights. Measure predicted improvement before proposing further changes. At992@1 ensure distinct unread surfaces, approximately source-aligned group boundaries, visible footer and no clipping. At801/900 short/neighbor portraits and800x1280 DPR2 verify safe containment, reachable scrolled content, no page or modal horizontal overflow, touch targets and state/focus behavior. Existing800 profile is outside this CSS scope; it establishes regression safety, not a missing pixel baseline. Check Desktop remains unchanged, both themes/locales retain functional/reflow/contrast results. No global shell, baseline, font, business/API or palette change is allowed by this decision.

If source edge measurements or natural content invalidate these predictions, preserve the failed evidence and make a bounded owning correction; do not call a candidate PASS or repeatedly add unexplained one-pixel overrides. No concrete locked-contract conflict prevents trying this scoped composition repair. Original CSS/DPR, unprovided state art, typography ink and absent accepted pixel threshold remain explicit gaps for final acceptance.

No runtime/test/reference/contract changes made by S00#6. This report disposition is ready for S00#1 integration and the serialized implementation lease.

## Final candidate disposition — stable113px Tablet row slots

Task:HN-NC-UIUX-003. Date:2026-10-27. Reviewed S00#2's actual injected screenshot and raw `implementation/coherent-tablet-113/candidate-results.json` / `geometry-improvement.json`. Their capture identifies clean source `76059cce616543356c623ec248c6350ddd07cdf5` with empty source diff and browser-injected candidate CSS. At this later report read HEAD remains76059cc and owning CSS is being modified under the serialized implementation lease; this report does not claim the present working source is still clean. No source was edited by S00#6.

**STABLE113_CANDIDATE_AUTHORIZED / COMMIT_AND_INDEPENDENT_RETEST_REQUIRED.** This lies within the previous addendum's explicit permission to derive a stable slot/inset mechanism when selected/read compaction jumps. The108px selected/read proposal is **REJECTED / SUPERSEDED** as an unnecessary state-dependent geometry risk, superseded by the state-independent stable candidate below. Raw proposedDefault/proposedAfterSelection bounds are identical because the normal detail/Back flow restores first selection; a browser-confirmed selection-jump defect was not demonstrated. The earlier native handoff description of a measured jump was inaccurate. Do not use that description as failure evidence. The superseded candidate must not be reintroduced to force screenshot matching.

Retain the coherent toolbar/group/grid/controlled-bleed/footer candidate from the previous addendum. Replace all proposed selected/read, unread-only and later-group row density rules with uniform Notification Tablet `min-height:113px`. Preserve the existing2px adjacent-unread separation by setting that matched second unread child's `min-height:112px`; this compensates the extra1px border and keeps its occupied sibling slot stable. Use the existing precise adjacent-unread semantic selector; no selected-row density, sample ID, text/date/count, per-record nth-child offsets or font/glyph changes. This supersedes the prior candidate's108/114/116/113 state/group row values, not any immutable artwork.

Measured actual992x1586@1 injected result:

| Geometric property | Reference raster estimate | Candidate actual |
|---|---:|---:|
| Search origin /width | x94,y431,width~814 | x94.456,y431.125,width814,height56 |
| Filter bottom |574 |574.125 |
| First group divider |643 |643.125 |
| Second group heading start/end |1125/1191 |1125.125/1192.125 |
| Icon X /size |112 /70x70 |112.456 /70x70 |
| Icon Y1..6 |661/773/889/1006/1212/1328 |664.625/778.625/893.125/1006.625/1213.625/1327.625 |
| Row/fill right edge |922 |922.456 |
| Footer divider /height |1439 /~83 |1439.125 /83 |

The screenshot visibly preserves separate rounded unread surfaces, six-item composition, footer, hit targets and modal envelope. S00#2's receipts report selection/read occupied-LI slots stable and owner-local neighbor/short/Desktop/800 guards successful. These are real implementation-owner diagnostics, not independent final QA results.

### Remaining discrepancy disposition

The macro search/filter/group/gutter/bleed/footer P2 composition defect is materially corrected by this candidate, **pending independent verification on its committed SHA**. Do not close it based only on injected CSS or owner diagnostics.

Individual icon vertical offsets remain approximately+3.625/+5.625/+4.125/+0.625/+1.625/−0.375px under the declared normalization. Record this as **P3 / OPEN — local row-density geometry residual**, separate from unknown font ink. The largest measured difference5.625px is not dismissed as source edge noise and is not an invented acceptable threshold. Severity is based on observed impact: no clipped/overlapped content, lost action, reduced hit target, unread merging or blocked workflow is visible in these receipts; the modal and core composition boundaries align closely. If independent tests show such an impact or a required geometric invariant fails, severity must be reevaluated and the gate stays FAIL. The inherited typography/ink/source-export/tolerance gaps remain DESIGN_GAP; do not relabel known box deviations as font uncertainty.

No all-pixel visual PASS is approved. Keep original reference checksums, owner-local raw capture, rejected-candidate evidence and final actual/reference/diff. No extra per-row offsets are authorized to remove the remaining few-pixel differences. Independent S00#3 must quantify them; S00#1 must report any retained P3 as open with disposition. S00#4 must verify stable row slots under read/unread, mark-all, search/filter and detail/Back, no page/modal overflow or clipped footer at all scoped short/neighbor/canonical profiles, plus impacted theme/locale/a11y regression. Final acceptance/release status remains evidence-dependent and CI/provenance limitations remain unchanged.

## Evidence correction — superseded108px candidate

Date:2026-10-27. S00#2 and S00#1 corrected the earlier native description after rereading the raw candidate receipts. `proposedDefault` and `proposedAfterSelection` bounds for the108px candidate are identical: the normal detail/Back path restores first selection. No measured selection-jump bug is established by that run. The final disposition text above is corrected accordingly; historical native messages and raw artifacts are retained unchanged.

The108px candidate remains rejected/superseded on design-governance grounds as state-dependent geometry risk, not as a confirmed browser failure. The selected final uniform113px rows plus112px adjacent-unread compensation have actual owner-local measured selection/read occupied-LI invariance evidence. Final implementation commit reported by S00#1 is `830f83d`; independent QA is ongoing. The remaining maximum5.625px icon-Y residual stays P3/OPEN, with no all-pixel PASS or fabricated tolerance. No additional calibration is requested by this correction. Only this Design Guardian report was edited.

## Final narrow disposition — unread boundary compensation at830f83d

Date:2026-10-27. Inspected HEAD `830f83d48eac84c3e2467de7f41c388439cc7eb2`, owning CSS lines274/299–300, and independent S00#3 raw `visual/after-830f83d-recovery-ignored-temp/geometry-paint-summary.json` plus `final-correction-verification.json` (start/end same SHA; successful captures source-clean).

The observed next-unread button transition `y872.125/h112 → y871.125/h113 → y872.125/h112` during preceding-row read/unread is **EXPECTED_STATE_BOUNDARY_COMPENSATION**, not a list-slot jump. The existing normal sibling border is1px; adjacent unread siblings have2px surface separation. The owned slot remains114px (`2+112` versus `1+113`), with derived slot origin870.125 in both states. Its interior button moves1px as the leading border changes; later row origins and footer remain unchanged. This directly implements the previously authorized extra-border compensation. Existing800 profile is outside this override; its rows remain unchanged. Independent Functional QA separately reports selection-only geometry invariant across four profiles.

The earlier no-list-jump guard means stable occupied slots, no cumulative reflow, preserved scroll/focus and no clipped actions. It does not require every interior button box to be identical across an intentionally changed state border. Retain the measured1px interior transition explicitly; do not report strict all-button-box equality PASS. A test asserting that stronger equality would observe a real difference but would not, by that fact alone, demonstrate violation of the approved occupied-slot invariant. Record and verify the actual semantic invariant; do not suppress failure or alter artwork to conceal the measurement.

No further source/calibration/retest is requested by this disposition. This is not a new numerical tolerance or all-pixel visual PASS. The separately measured maximum5.625px reference icon-Y difference remains **P3/OPEN**, and missing typography/export/tolerance authority remains DESIGN_GAP. Independent QA owns its full recorded results and S00#1 integrates the final verdict. Only this report was appended; no source, raw evidence, baseline or historical event was altered.
