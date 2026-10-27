# Design Source Register

Version: `1.1.0-recovery` · Date: 2026-10-27 (UTC+07) · Owner: S00#6
Repository: `E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026`
Inspected base: `DEV`, `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`
Package status: `DESIGN_READY_BLOCKED`

## Wave B recovery — current disposition

Task `HN-NC-MA-PILOT-002`, base `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`, 2026-10-27. Recovered this package from evidence commit `fbd5b3cd11a8d5ecb7fb40cf7bce7d7ba0ea3646`; previous pilot evidence is unchanged. [Design Gap Closure](DESIGN_GAP_CLOSURE.md) is the current per-fact authority/CR disposition. Eleven historical authority documents are preserved byte-for-byte in [recovery manifest](references/recovered-foundation-20261027/RECOVERY_MANIFEST.json). Historical approval is property/scope specific; no blanket screen PASS is inferred.

## Evidence rules

`APPROVED` requires a user decision or recoverable approval text for a stated scope. `CANDIDATE` includes code, proposed contracts, supplied material whose exact approval/supersession is unresolved, and actual screenshots without acceptance. `LEGACY` means historical/superseded; it does not authorize restoring old values. `MISSING` means required authority was not located in the audited checkout/source folder. Availability, a filename containing “approved”, a code comment, a hash match and a passing test do not independently prove approval.

This register records evidence, not a new visual design. `DESIGN_CONTRACT.md` maps evidence status to value status; `BASELINE_MANIFEST.md` records custody and capture eligibility. Paths below are relative to this repository unless explicitly absolute.

## Source inventory and authority

| ID | Source / location | Classification and scope | Approval evidence / limitation |
|---|---|---|---|
| DS-01 | `output/tray-approved/reference/PROMPT_S00-1.md:3`; `README.txt:1` | APPROVED — 13 tray states, 26 original mockups | Recoverable user text “Tôi duyệt bộ thiết kế gồm 26 ảnh riêng”; README records 2026-10-26. Approver identity recorded only as project user. |
| DS-02 | `output/tray-approved/reference/{Desktop,Tablet}/*.png`; `DANH-MUC-ANH.json`; `reference-manifest.json` | APPROVED inputs within DS-01 scope | All 26 SHA-256 and PNG dimensions match inventory on 2026-10-27; all 26 are tracked. This audit visually inspected only state 05 Desktop/Tablet, not all 26. No implementation acceptance inferred. |
| DS-03 | `docs/tray-approved/IMPLEMENTATION_MATRIX.md:25` | APPROVED scoped normalization record backed by DS-01 | Tray margins, dialog spacing, tabs and target profiles. Does not choose a new S01 shell or universal DatePicker rule. |
| DS-04 | User's 2026-10-27 chat reply: `C:/Users/Admin/Desktop/HN_Astra` | APPROVED source location selection | Folder contains 57 PNGs; no Figma, Markdown spec, JSON lock or approval ledger found there. Follow-up explicitly approves1–6 for page components only; Sidebar and Menu/Header were approved separately before. |
| DS-05 | `references/hn-astra-20261027/3.png`, `4.png` beside this register | APPROVED — S01 Default Desktop/portrait page components; excludes Sidebar and Menu/Header | User reconfirmed exact6-file scope on2026-10-27; visually inspected; byte-preserving custody. Original design version/date unknown. Not claimed equivalent to historical five-image Page set. |
| DS-06 | `references/hn-astra-20261027/5.png`, `6.png` | APPROVED — S01 outbound-document detail page/dialog components; excludes Sidebar and Menu/Header | Same user reconfirmation. Tablet source793×1983, not1600×2560; no stretching or global adoption of backdrop shell. |
| DS-07 | `references/hn-astra-20261027/1.png`, `2.png`; `tests/visual/README.md:3` | APPROVED — Notification Center components only; excludes Sidebar and Menu/Header | Same user reconfirmation; originals visually inspected and pinned. Original historical approval date remains unknown. Derived crops are not originals. |
| DS-08 | Remaining DS-04 numeric PNGs `9..22` where present, `x1..x6`, `xk1..xk7` | CANDIDATE — outside S01/global source lock | 9/10 and x1..x6 inspected for scope: system audit / outbound / state-board examples. Others inventoried only. No blanket approval or route inferred from folder membership. |
| DS-09 | DS-04 named tray files `01_Hang-cho_*` through `13_Khong-co-quyen_*` | APPROVED only where identical to DS-02 | 26 filenames/hashes match repository originals; no replacement performed. |
| DS-10 | `src/shared/README.md:86`; `src/data/fixtures/S01.presentation.json:2` | LEGACY trace of temporarily approved 2026-10-08 Page set | Page `page_d79b0a4265688191a26d6bae9aeed838`, sequence 3; claims five viewed library images. Original files and approval metadata absent here; source text is not a recoverable baseline. |
| DS-11 | Recovered custody RF-01/02/03/08/09, original Foundation contracts/context lock | RECOVERED; APPROVED only for recorded common decisions | See recovery manifest for exact paths/hashes. Brand/control, Public Sans, common R3 and query/paging/date conventions recovered. Latest exact shell/neutral/type/variant and primary release payload remain incomplete. Root lock location is not invented. |
| DS-12 | RF-10 S01 snapshot in recovered source-pack; original release directory | RECOVERED snapshot / MISSING original five-image payload and release | Historical Page/state/approval trace available, not a substitute for selected3/4 or exact shell. RF-08/09 recover S01 export targets. Original image bytes remain missing. |
| DS-13 | `src/shared/tokens.css`; `foundation.ts`; `s00-shell.css`; theme layers | CANDIDATE values; source-backed implementation inventory | Brand/control, Public Sans and shared44 target now supported by recovered common contracts. Exact neutral/type/shell geometry still unresolved. Geometry conflicts are unresolved. Code does not approve itself. |
| DS-14 | `public/assets/fonts/s01/FONT_PROVENANCE.json`, four WOFF2 files, OFL/LICENSE/AUTHORS; `src/shared/s00-fonts.css`, `src/features/S01/fonts.css` | APPROVED Public Sans family via RF-01/02; verified local provenance; exact scale CANDIDATE | Four binary hashes match. Three license texts match declared hashes after CRLF→LF normalization only. Provenance present, exact approved type scale and ZH font asset not established. |
| DS-15 | `src/shared/Icon.tsx:5`; `public/assets/S07/bg_warehouse_main_4k_enhanced.jpg`; `src/shared/s00-sidebar-tone.css:1` | CANDIDATE asset adoption | Icon source explicitly disclaims approved exact glyph fidelity. CSS approval comments are secondary claims. RF-02 records official Tabler outline family/pinned upstream commit; canonical current glyph/brand/background mapping and hashes remain unresolved. |
| DS-16 | `src/toast/toast-config.ts:1`; `global-toast.css:1`; `GlobalToastProvider.tsx:125` | CANDIDATE preservation of claimed LOCKED v1.0 behavior | Config gives 350/3000/300ms; code allows page-action overlap by claimed Owner approval. Original lock/exception unavailable; current brief requires no CTA occlusion. Record conflict, do not silently change timing/placement. |
| DS-17 | `src/shared/date-policy.ts`; `DatePicker.tsx`; DS-01 §5 | APPROVED 90-day/no-future/Vietnam-time rule for tray history only; other callers CANDIDATE | Generic rolling-90 default and exception mechanism are implementation. No approved per-field exception register found. |
| DS-18 | `src/data/fixtures/DESIGN_FIXTURE_SNAPSHOT.json:5`; `S01_SCANNER_PINNED.json`; `src/contracts/overview.ts` | CANDIDATE for visual contract; separate data authority | Fixture snapshot explicitly says production matching false and aggregate-only detail. Existing pinned records do not certify production or a screenshot layout. |
| DS-19 | `tests/visual/BeforeNotificationCenter.tsx`, historical outputs cited in `PILOT_REPORT.md` | LEGACY actual / test history | Never use as approved artwork. Historical 22/24 plus 5/5 tests have known failures and do not certify current S01. |
| DS-20 | `E:/WMS_HoaNam/Scanner_CMS/{GLOBAL_LAYOUT_REVIEW,DASHBOARD_REVIEW}.md` | LEGACY contextual reviews, dated 2026-10-04 | Explicitly leave exact values/baselines unapproved; supersession not inferred from unrelated gallery. |
| DS-21 | Figma/editable Design Master, current S01 loading/empty/error/denied/dark/locale images, global shell accepted capture set | MISSING artifacts | User confirms prior Sidebar and Menu/Header approval exists; approved artifact/version and parameters have not been recovered. No `.fig` file or pinned Figma authority found in audited repository and supplied folder. No connector access claimed. |

## Recovery and classification policy

Historical claims remain useful pointers, but DS-10/11/12 must not override a later explicit user choice. The user's exact scope clarification is: “Cả 6 đã duyệt nhưng chỉ duyệt thành phần giao diện trang còn Sidebar và Menu header tôi đã duyệt trước đó rồi”. Record this as `DEC-DG-20261027-01`: content components1–6 APPROVED; background shell excluded. This does not revoke prior shell approval or request a redesign. Recover the earlier shell artifact/version before adjudicating its exact geometry. Original approval date remains unknown;2026-10-27 is reconfirmation/source-registration date, not a fabricated earlier approval date. Unseen/unaccepted implementation outputs remain CANDIDATE.

The user permits Preview/sample data without in-product demo/mock labels (`AGENTS.md` and DS-01 §4). Keep provenance in QA documents. This is not authority to change production data or invent permissions, KPI formulas, IDs or records to match artwork.

## Document ownership

`DESIGN_CONTRACT.md` is updated in place. `DESIGN_AUDIT.md` remains the dated 2026-10-26 audit. `DEFECT_REGISTER.md` remains the project issue summary; `DESIGN_GAP_REPORT.md` is the detailed design investigation keyed to those issues. Existing tray JSON/PNG inputs remain canonical and unchanged. No new full-app baseline is created by this register.

## Wave B source decisions

DEC-DG-20261027-02 records recovery of historical common authority, with original scope/exclusions intact. RF-01/02 approve the recorded Foundation/control conventions; RF-03 explicitly retains pending header-backdrop visual review. RF-08/09 approximate shell dimensions are not exact tokens. RF-10 historical chart/scroll-table content cannot replace selected3/4. All11 source copies match two historical trees; this verifies custody, not a new approval. See DESIGN_GAP_CLOSURE.md for DG-01/02/04/05/06/07/08/11 and CR-02/03/04.
