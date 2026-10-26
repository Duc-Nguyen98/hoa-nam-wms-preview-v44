# Hoa Nam WMS design contract

Version: 1.0.0-draft  
Owner: Design Guardian  
Effective scope: approved tray flow and shared WMS foundation  
Status: `ACTIVE_FOR_AUDIT`, not a visual approval by itself

## Authority and precedence

When sources disagree, resolve them in this order and record the decision:

1. User-approved reference image and its manifest entry.
2. `output/tray-approved/reference/PROMPT_S00-1.md` and `docs/tray-approved/IMPLEMENTATION_MATRIX.md`.
3. Source-backed screen/fixture contract in `src/data/fixtures/`, `src/contracts/`, and the owning feature README.
4. Confirmed shared tokens in `src/shared/tokens.css` and the accepted shared UI contract.
5. Implementation proposal, which must be marked `PROVISIONAL` and may not be described as approved.

Missing or contradictory information is a `DESIGN_GAP`. It must be listed in `GAP_REGISTER.md`; agents must not infer a final design value from a screenshot or convenience.

## Status vocabulary

- `CONFIRMED`: traceable to an approved source or locked contract.
- `PROVISIONAL`: implementation choice retained for compatibility; requires explicit design review before visual sign-off.
- `DESIGN_GAP`: required information or evidence is missing.
- `BLOCKED`: acceptance cannot proceed because a required artifact or test is absent.

## Foundation tokens

The canonical token file is `src/shared/tokens.css`. Confirmed foundation roles currently include `--hn-brand: #0a3765`, `--hn-control: #004e74`, expanded/collapsed shell widths `248px/68px`, drawer `280px`, header `72px/64px`, and minimum target `44px`. The current page/surface/text/border/radius/spacing roles in that file are the implementation registry; each value must be classified as confirmed or provisional before visual sign-off.

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

## Change control

Do not update source references, snapshots, token values, or locked geometry to make a failing test pass. A baseline change requires Design Guardian approval, rationale, old/new checksums, visual diff, and a linked test result. Business logic and reference evidence are separate approvals.
