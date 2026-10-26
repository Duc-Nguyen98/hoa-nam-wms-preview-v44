# Hoa Nam WMS design contract

Version: 1.1.0-audit
Owner: Design Guardian
Effective scope: S01 + global component audit; preserve approved tray scope
Date: 2026-10-27 (UTC+07)
Status: `ACTIVE_FOR_AUDIT` / `DESIGN_READY_BLOCKED`, not visual acceptance

Change record: `CR-DG-20261027-01`, documentation/provenance clarification only. Base `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`, packet `docs/agent-handoffs/S00-6-DESIGN-PACKAGE-20261027.md`. No runtime token or source-image change. This revision supersedes the draft's blanket “confirmed” reading of token-file comments: missing primary locks and scoped overrides must be resolved before approving exact values.

Package index: [sources](DESIGN_SOURCE_REGISTER.md), [components](COMPONENT_SPEC.md), [mapping](DESIGN_TO_CODE_MAPPING.md), [baselines](BASELINE_MANIFEST.md), [gaps](DESIGN_GAP_REPORT.md).

User decision `DEC-DG-20261027-01`: HN_Astra1–6 are APPROVED for page components only (1/2 Notification Center,3/4 S01 Default,5/6 S01 detail). Sidebar and Menu/Header retain their separately approved earlier design; backdrop chrome in these6 images is excluded from their authority. Earlier shell approval is acknowledged; its exact reference/version has not been recovered. Do not ask the user to reapprove the shell or replace it with an interpretation of these images.

## Authority and precedence

When sources disagree, resolve them in this order and record the decision:

1. Explicit user decision for the exact scope/state and identified source bytes, including a later scoped supersession.
2. Approved reference image and its approval record; approved LOCKED design contract and documented normalization. An unresolved conflict between these is a gap requiring a decision, not an automatic override.
3. For tray scope only: `output/tray-approved/reference/PROMPT_S00-1.md` and `docs/tray-approved/IMPLEMENTATION_MATRIX.md`.
4. Source-backed screen/fixture/business contracts define fields, state meanings, permissions and behavior; they do not independently approve visual geometry.
5. Verified approved tokens/components within their accepted scope. Token comments without recoverable authority are secondary evidence.
6. Observed implementation values and unaccepted actual screenshots are `PROVISIONAL`; they may not be promoted into a reference by reuse.

Missing or contradictory information is a `DESIGN_GAP`. It must be listed in `DEFECT_REGISTER.md`; agents must not infer a final design value from a screenshot or convenience.

## Status vocabulary

- `CONFIRMED`: traceable to an approved source or locked contract.
- `PROVISIONAL`: implementation choice retained for compatibility; requires explicit design review before visual sign-off.
- `DESIGN_GAP`: required information or evidence is missing.
- `BLOCKED`: acceptance cannot proceed because a required artifact or test is absent.

Source classifications are `APPROVED`, `CANDIDATE`, `LEGACY`, `MISSING` in the source register. Mapping: APPROVED supports CONFIRMED only for the approved property/scope; CANDIDATE is PROVISIONAL; LEGACY is historical; MISSING produces DESIGN_GAP. A confirmed artwork does not supply an exact CSS measurement, breakpoint, font weight or business rule absent from its contract.

## Foundation tokens

The implementation token registry is `src/shared/tokens.css`. Its comments cite missing primary locks (DS-11). Keep its values for compatibility while authority is recovered; do not infer that its global geometry is the currently approved S01 geometry. The scoped S00 selector redeclares shell variables. Exact token adoption remains PROVISIONAL unless a row below names approved scope.

| Foundation | Observed values / implementation owner | Authority / action |
|---|---|---|
| Brand and action | `--hn-brand #0a3765`, `--hn-control #004e74`, `--hn-focus #004e74`; `tokens.css:3` | Previously claimed confirmed in draft/foundation.ts; primary lock missing. PROVISIONAL exact global adoption. S01 detail blue `#0067dd` is an unresolved scoped variant, not a new global action color. |
| Light semantic colors | page `#f7f8fa`, surface `#fff`, text `#263c51`, muted `#53677a`, border `#dce4ec`, danger `#a33232`; `tokens.css:18` | PROVISIONAL exact palette; semantic roles retained. No new sampled hex from artwork. |
| Supporting colors | fill `#f6f8fb`, hover `#f7fafc`, action fill `#edf4fa`, control border `#cbd7e1`, subtle border `#e5ebf1` | PROVISIONAL; use semantic aliases only after variant decision. |
| Typography assets | Public Sans 400/500/600/700, local aliases `HN S00 Public Sans` / `HN S01 Public Sans`; `s00-fonts.css`, `S01/fonts.css` | Binary provenance verified, exact design adoption PROVISIONAL. No approved italic or weights 650/800 registered; do not synthesize as an approved weight. |
| Type scale | body 14/22, label 13/20, helper 12/20, title 28/36 CSS px; `tokens.css:38` | PROVISIONAL. S01 overrides title 30/38 (Desktop), 36/44 (portrait range), metric 36/42; these are observations requiring scope decision, not a replacement scale. |
| Spacing | 4/8/12/16/20/24/32px; page gap/panel padding 20px; `tokens.css:52` | PROVISIONAL global scale. Tray-approved: 8px scale, margins 32/24, card/dialog 24, groups 16/24, field gap 8. Do not apply tray values to S01 without normalization decision. |
| Layout/container | tokens default1600/wide1840px; S00 consumes default via `s00-shell.css:290`, wide via `premium.css:106`; S01 root max1600px. README still says1440 boxed | PROVISIONAL exact adoption; README1440 is historical conflicting guidance, not observed current CSS. Need approved source and computed geometry by route/variant. |
| Shell geometry | base sidebar 248/68, header 72/64; S00 scope sidebar 260/70, header 54/64, drawer 280 CSS px | `DESIGN_GAP`, DG-02. Runtime scope explains cascade; neither tier wins design authority automatically. |
| Radius | control 6, card 8, modal 10, status 4 CSS px | PROVISIONAL; local detail 8 and notification-specific radius require registered variants. |
| Elevation | component none; modal `0 18px 42px #10233624`; dark `#00000052` | PROVISIONAL exact values; modal layering/focus remain shared mechanics. |
| Icons | `Icon.tsx`, default 20px SVG; S01 uses 16/18/21/28/30 and scoped larger sizes | PROVISIONAL exact glyphs/optical alignment; canonical assets missing. Decorative SVG does not replace accessible action name. |
| Target | shared `--hn-touch-target 44px`; tray user minimum 44×44 CSS px | CONFIRMED in tray scope; existing shared target retained. S01 32/36/40/42 overrides require review/measurement and explicit exception, never blanket acceptance. |
| Dark theme | `dark-theme.css:14`: page `#101b28`, surface `#172638`, text `#e7eef5`, muted `#aebdca`, border `#35495d`, focus `#72d5eb` | PROVISIONAL palette; both themes are required by tray QA contract. S01 dark visual baseline MISSING. |

### Responsive, locale and text expansion

Approved tray QA profiles remain Desktop 1920×1080 CSS DPR1 and portrait Tablet 800×1280 CSS DPR2 (1600×2560 output). These do not make a 1600px CSS Tablet. S01 may use these as proposed QA profiles, pending explicit scope confirmation; PNG dimensions alone do not establish CSS viewport/DPR.

`GlobalShell.tsx:46` uses pointer/orientation plus 1279px and 599px conditions. S01 CSS adds 560/850/1100px and container rules. These are PROVISIONAL reflow thresholds, not approved device detection. Freeze a viewport/pointer/preference matrix before comparing. Physical-device acceptance is separate.

`shell-preferences.ts:3` supports `vi`, `en`, `zh-CN` and light/dark. DS-01 explicitly requires all three locales/both themes for tray regression; S01 coverage remains to be accepted. Exact ZH font fallback is not supplied by merely naming Noto/YaHei/PingFang. Test long translated labels, Vietnamese diacritics, IME composition, dates/quantities, zoom, wrapping and helper/error text. Do not shrink typography to fit data.

The following roles are required for every new token or override:

| Family | Required record | Current rule |
|---|---|---|
| Color | role, value, contrast intent, source, status | consume foundation variables; feature literals need justification |
| Typography | family, weight, size, line-height, language coverage, provenance | local approved font only; fallback is not font approval |
| Spacing/grid | scale, container, gaps, alignment, source | use token scale or record `PROVISIONAL` |
| Breakpoint | width, capability/orientation rule, source | technical breakpoint is never a device claim |
| Radius/shadow | role, value, elevation intent, source | no screen-local replacement of shared modal/card roles without map entry |
| Icon/asset | semantic name, file/checksum, license/provenance, source | unresolved icon/logo is a `DESIGN_GAP` |
| Component variant | owner, selector/data attribute, allowed overrides | one owner; no copied shared component |

## Locked tray reference profiles

- Desktop: 1920×1080 CSS px, DPR1.
- Portrait Tablet: 800×1280 CSS px, DPR2, generated output 1600×2560.
- Page margins: 32px Desktop and 24px Tablet.
- Card/dialog spacing: 24px; group gaps: 16px/24px; label-to-field gap: 8px.
- Interactive target minimum: 44 CSS px.
- Desktop tabs use one underline; portrait Tablet uses one 2×2 tab grid.
- Numeric cells align right; body scroll is bounded so footer/CTA remains reachable.

These values are locked only for the tray reference scope. Unspecified neutral colors, exact glyph paths, font provenance, and technical reflow thresholds remain `DESIGN_GAP` or `PROVISIONAL` as documented in the audit.

## Reference and evidence contract

`output/tray-approved/reference/reference-manifest.json` maps each state to its Desktop and Tablet source image, route, owner and evidence directory. Source images are immutable inputs. Actual captures and diffs belong under a generated evidence directory and must never overwrite a source image. Each acceptance record must include reference checksum, actual checksum, diff path, test report, open gaps, commit, preview URL, and `PASS`, `FAIL`, or `BLOCKED`.

## Component ownership map

| Concern | Canonical implementation | Allowed feature variation |
|---|---|---|
| Shell/navigation/header/sidebar | `src/shared/GlobalShell.tsx`, `s00-*`, `ShellHeader.tsx` | navigation metadata and approved screen root variant |
| Modal/dialog/focus | `src/shared/GlobalModal.tsx`, focus helpers | tray wrapper may set content/state classes; no copied focus trap |
| Tables/pagination/filter controls | `src/shared/DataTable.tsx`, `Pagination.tsx`, `controls.tsx` | columns, labels, query/controller and approved density variant |
| Notices/toasts | `src/shared/Notice.tsx`, `src/toast/*` | semantic copy and event source |
| Tokens/theme | `src/shared/tokens.css`, `unified.css`, approved theme layers | scoped variant selectors only |
| Screen business behavior | owning `src/features/S*`, contracts and adapters | feature-owned data/validation; no shared CSS duplication |

Any exception requires an entry in the component map and a regression test covering existing consumers.

`COMPONENT_SPEC.md` is the detailed inventory of dimensions, variants, states, usage and unresolved values. `DESIGN_TO_CODE_MAPPING.md` binds S01 sections to reference IDs and acceptance criteria. The live screen currently has no rendered chart; the mere presence of `DocumentChart.tsx` is not authority to add a chart.

## Hoa Nam behavior constraints

- Badge: current user brief requires display cap `99+`; implementation `notification-badge.ts` caps counts >=100 while preserving full count in the accessible bell label. Test 0/1/99/100/large/unknown. Exact badge geometry remains PROVISIONAL.
- Toast: preserve claimed v1.0 values pending primary lock recovery: header right edge, header bottom+16px, max width390, gap10, margin16, entrance350ms, admitted lifetime3000ms, exit300ms, max visible3, pending20, queue budget30000ms (`toast-config.ts`). Code is evidence of behavior, not recovered user approval. Current requirement forbids CTA/Modal/Drawer occlusion; provider suspends on foreground intersection but explicitly permits page-action overlap. Resolve DG-06 with Owner/S00#1; do not invent relocation, longer lifetime or treat historical overlap as current approval.
- Dates: DS-01 §5 confirms tray-history Vietnam timezone, no future and a maximum 90-day past window. Generic `date-policy.ts` has rolling-90 and `business-exception`/`exceptionId`; these do not prove every business field has the same approved policy. Record field, route, timezone, boundary inclusivity, min/max, presets and approved exception before changing a caller. Off-by-one interpretation (today minus90 vs90 dates) remains a decision to verify.
- RBAC: design consumes caller-authorized visibility/disabled/read-only/denied states. Do not add permissions or infer capabilities from visible mockup actions. Denied, expired, empty, unknown and error remain distinct.
- Preview/sample data is permitted without mock/demo banners that alter layout; provenance belongs in reports. QA must use a documented scenario, not mutate production to match artwork.

## Design acceptance gate

S00#6 may approve source registration or a scoped design decision. S00#3 owns visual comparison results; S00#4 owns functional/RBAC results; S00#1 integrates gate status. DESIGN READY requires approved S01/global reference selection, resolved critical typography/token/geometry/variant decisions, registered state/profile coverage and reviewable acceptance criteria. Missing references use `DESIGN_REFERENCE_MISSING`; unresolved exact values remain DESIGN_GAP. Audit completion is not DESIGN READY.

## Change control

Do not update source references, snapshots, token values, or locked geometry to make a failing test pass. A baseline change requires Design Guardian approval, rationale, old/new checksums, visual diff, and a linked test result. Business logic and reference evidence are separate approvals.

Every baseline CR must identify requester, route/state/theme/locale/profile, old/new original SHA-256, reason, affected shared consumers, design approval evidence, S00#3 actual/diff result, candidate SHA and S00#1 integration decision. User approval is required for changing user-approved design; S00#6 records it and cannot invent that approval. Store originals immutably; a failed comparison stays FAIL/BLOCKED until the implementation is corrected or a CR is approved. Derived crop/resize transforms must be documented and never replace original bytes. See `BASELINE_MANIFEST.md` for registration and evidence naming.
