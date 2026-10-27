# Baseline Manifest and Governance

Version: `1.1.0-recovery` · Registered2026-10-27 (UTC+07) · Custodian S00#6
Base SHA: `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`
Status: approved source custody established; S01/global acceptance `BLOCKED`.

## Wave B recovery — current disposition

Task `HN-NC-MA-PILOT-002`, base `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`, 2026-10-27. Recovered this package from evidence commit `fbd5b3cd11a8d5ecb7fb40cf7bce7d7ba0ea3646`; previous pilot evidence is unchanged. [Design Gap Closure](DESIGN_GAP_CLOSURE.md) is the current per-fact authority/CR disposition. Eleven historical authority documents are preserved byte-for-byte in [recovery manifest](references/recovered-foundation-20261027/RECOVERY_MANIFEST.json). Historical approval is property/scope specific; no blanket screen PASS is inferred.

## Approval and identity

`DEC-DG-20261027-01`: the project user reconfirmed HN_Astra1–6 as approved **page components** in this chat on2026-10-27. Sidebar and Menu/Header were approved separately earlier and are explicitly excluded from these6 images' authority. Original approval date, design revision and named approver identity are unknown; do not fabricate them. Registration version above is an audit version, not a design revision. User confirmation is preserved in `DESIGN_SOURCE_REGISTER.md`.

Each source below was opened visually, copied without transform from `C:/Users/Admin/Desktop/HN_Astra/{n}.png`, and verified against original bytes. New custody paths are relative to `docs/quality/`; original bytes are immutable. Capturing the current implementation cannot produce a replacement source baseline.

| Baseline ID | Route / state / content scope | Original / custody path | Original raster px | Original SHA-256 | Approval / capture eligibility |
|---|---|---|---|---|---|
| BL-NOTIFY-D | Global Notification Center; source background shows outbound route; actual host route recorded per test; VI/light selected detail | `references/hn-astra-20261027/1.png` |1774×887 |`fa1a5615926a3a15b4cdf72d3482f53f4755931f9b881f8f34874a35233ae22c` | APPROVED content,2026-10-27 reconfirmation; source CSS viewport/DPR unknown. |
| BL-NOTIFY-T | Notification Center; VI/light portrait list, two unread | `references/hn-astra-20261027/2.png` |992×1586 |`65606c1c19e7124340cdf18f41d201b136be755059275dd2b777847b268569f4` | APPROVED content; source CSS viewport/DPR unknown. |
| BL-S01-D | `#/preview/S01`; VI/light Default; September2026; table4 visible of16 | `references/hn-astra-20261027/3.png` |1672×941 |`f17af2135653f38503c72139603ad429e437d86248e22f36abe270449c39257e` | APPROVED page components; excluded Sidebar/Menu/Header. QA profile/scenario not yet locked. |
| BL-S01-T | `#/preview/S01`; VI/light Default; portrait2×2 KPI + activity cards | `references/hn-astra-20261027/4.png` |992×1586 |`111daa7bf29165c614ab6d7d1fc047e381addd292385c9037b43bd51860a47f7` | APPROVED page components; source CSS viewport/DPR unknown. |
| BL-S01-DETAIL-D | `#/preview/S01`; VI/light outbound PX-0007 accepted-row detail | `references/hn-astra-20261027/5.png` |1672×941 |`eaba73d476bf0b9b92fc12e3271a9177493c75b7cd16bc040e939acdbfd5643b` | APPROVED detail components only; background table/shell not new design authority. |
| BL-S01-DETAIL-T | `#/preview/S01`; VI/light outbound PX-0007 detail, long portrait composition | `references/hn-astra-20261027/6.png` |793×1983 |`ba996d6843288f0d5248246c2bde876d759f016e41e3e44a0577725fe13fabea` | APPROVED detail components; tall aspect ratio is not approved CSS height or full-page capture instruction. |

The six source rows do not certify exact font family/weight or CSS measurements from raster sampling. Use approved topology and semantic hierarchy; unresolved exact parameters remain in the contract/gap report. Rendered fixture data may differ only under an explicit scenario/normalization record, never an unexplained waiver.

## Existing tray baseline registry — no duplicate or replacement

Canonical machine index: `output/tray-approved/reference/reference-manifest.json` version1, status active-for-audit. Canonical source hashes/dimensions: `DANH-MUC-ANH.json` in that same directory. Approval text: `PROMPT_S00-1.md` and `README.txt` (2026-10-26, project user). The following table is a routing index; the JSON files remain the sole byte/hash lists for tray inputs.

| State ID / original name stem | Route | State intent |
|---|---|---|
|01 /`01_Hang-cho` | `#/preview/S13` | Queue |
|02 /`02_Lenh-xep-khay` | `#/preview/S14` | Orders |
|03 /`03_Danh-sach-khay` | `#/preview/S11` | Tray list |
|04 /`04_Lich-su` | `#/preview/S14/history` | Authorized history |
|05 /`05_Xac-nhan-tao-lenh` | `#/preview/S13` | Create confirmation |
|06 /`06_Tao-lenh-thanh-cong` | `#/preview/S13` | Created draft result |
|07 /`07_Chi-tiet-lenh-da-xac-nhan` | `#/preview/S14` | Confirmed detail |
|08 /`08_Lenh-nhap-validation` | `#/preview/S14` | Draft validation |
|09 /`09_Chi-tiet-khay` | `#/preview/S11` | Tray detail |
|10 /`10_Dang-xac-nhan` | `#/preview/S14` | Confirming |
|11 /`11_Du-lieu-thay-doi` | `#/preview/S14` | Stale conflict |
|12 /`12_Khong-co-khay` | `#/preview/S14` | No eligible tray |
|13 /`13_Khong-co-quyen` | `#/preview/S14/history` | Permission denied |

Each stem resolves to `Desktop/{stem}_Desktop.png` and `Tablet/{stem}_Tablet.png` under the canonical directory. All26 original files are tracked; audit2026-10-27 verified all SHA-256 and IHDR dimensions against the catalogue, including final Tablet10. Every Desktop raster1672×941; every Tablet raster992×1586. External HN_Astra named tray copies match these same26 hashes. Original images are design mockups, not browser acceptance captures.

Approved **tray QA capture profiles** remain Desktop1920×1080 CSS DPR1 and portrait Tablet800×1280 CSS DPR2 →1600×2560 output (`IMPLEMENTATION_MATRIX.md:31`). Native source raster sizes differ. Do not resize originals or infer CSS dimensions/DPR from PNG pixels. S01 export targets1920×1080 and logical800×1280 @2x have now been recovered in RF-08/09; exact source-to-capture transform, pointer and QA scenario still require explicit records. Notification harness uses these as explicit test assumptions; it does not certify physical devices.

## Missing baseline slots

| Slot | Route / state | Status / action |
|---|---|---|
| BL-SHELL-* | Global expanded/collapsed/rail/portrait Drawer, Header/Menu and popup states | `DESIGN_REFERENCE_MISSING` artifact/version; user's prior approval acknowledged. Recover and register that earlier source; do not substitute backdrop chrome from1–6. |
| BL-S01-STATE-* | S01 loading/refreshing/empty/no-results/error/offline/forbidden/expired/unavailable | `DESIGN_REFERENCE_MISSING`; approved state treatment or explicit scoped design decision required. |
| BL-S01-DETAIL-INBOUND-* | S01 inbound detail | `DESIGN_REFERENCE_MISSING` or explicit accepted reuse of5/6 structure with declared inbound differences. Do not infer approval. |
| BL-S01-LOCALE-THEME-* | S01 EN/zh-CN, dark and long content | Approved reference/normalization missing; run exploratory robustness checks separately from visual approval. |
| BL-TOAST-LOCK-* | Global top-right rail, timing,3-stack, Modal/Drawer/CTA collision | Original timing lock+exception record missing; current no-CTA/Modal/Drawer-occlusion requirement governs. CR-04 records conflict; code captures are diagnostic only. |
| BL-S02-* | S02 bounded CRUD pilot | Outside this S01-first source registration; approved full visual/state mapping missing. Tray/S01 images cannot substitute. |

## S00#3 evidence manifest contract

Before capture, record source ID + original hash, approval scope/version/date, route, exact state and trigger, data scenario/hash/query/selection, role/capability fixture, clock/timezone, locale/theme, CSS viewport/DPR/pointer/orientation, shell preferences, browser/OS/font load status, candidate SHA/build and tested Preview URL. Store each actual/diff/measurement/report under an immutable run directory such as `output/design-evidence/<candidate-sha>/<run-id>/<baseline-id>/<profile>/<locale>/<theme>/<state>/`. These are generated results, not new reference inputs.

Every row requires `sourceOriginal`, `sourceSha256`, `actual`, `actualSha256`, `diff`, `measurementReport`, `testReport`, `openGapIds`, `result`, `reviewer`, `capturedAt`. Result is PASS/FAIL/BLOCKED/NOT_RUN; no missing field counts as PASS. S00#3 owns comparison verdict; S00#6 owns source/decision registration; S00#4 supplies functional evidence. Candidate-local URL must be verified by the capture owner rather than copied from a historical report.

Full captures retain context. Content/modal crops may exclude Sidebar/Menu/Header as explicitly scoped by the user; record crop bounds/scale and retain full actual + original. Any comparison derived from a crop/resize must name the transform and remain distinguishable from source bytes. Do not apply unexplained whole-image pixel thresholds to different raster/profile sizes or exclude visible component defects as antialiasing.

## Change Request rule

No silent refresh after FAIL and no `--update-snapshots` in CI. A source/baseline change requires a CR naming old/new originals and SHA-256, affected route/state/scope/profile, rationale, designer/user approval for changed approved design, S00#6 registration, visual diff/test from S00#3, candidate SHA, reviewer/date and S00#1 integration decision. Preserve the previous baseline/version. Capturing a passing implementation twice only proves stability, not design approval.

`CR-DG-20261027-01` registers source custody and clarifies documentation only; it does not approve new design values or replace any existing baseline. No actual/diff/browser PASS was generated by S00#6 in this audit.

## Wave B preservation receipt

Original six PNG bytes/hashes and all26 tray references remain unchanged. New historical document custody uses its own recovery manifest; it is not a second baseline index. Historical shell approval is acknowledged but its latest exact artifact/version remains DESIGN_REFERENCE_MISSING. S01 export targets are recovered; neither whole-shell acceptance nor unknown state/locale/theme baseline approval follows. CR-02/03/04 are pending decisions, not source replacements; no new original SHA is accepted. Use DESIGN_GAP_CLOSURE.md profile/evidence table before S00#3 captures.
