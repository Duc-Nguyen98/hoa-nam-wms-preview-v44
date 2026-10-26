# Approved tray UI implementation matrix — 26 October 2026

Source: output/tray-approved/reference/PROMPT_S00-1.md and all 26 individually reviewed PNGs extracted from the user-approved ZIP. Visual review covers every Desktop/Tablet pair listed below. The supplied HN_Astra files are the accessible replacements for the earlier missing attachment paths.

Candidate: W:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026. Baseline at opening: v49, d0df01de0453e0872b0ff4f190f2737ad3c89fa9. S00#3 has concurrent notification-only work in the previous checkout; its subsequent published commit must be integrated before this release. Publication is serialized.

| Image pair (Desktop + Tablet) | S / route | Component and state | Owner | Required evidence |
|---|---|---|---|---|
| 01 Hang-cho | S13 / #/preview/S13 | OperationalPutawayQueue: eligible BOX queue | S00#1 UI; S00#2 contracts | 9 coherent rows, ledger quantity, search/page, create eligibility |
| 02 Lenh-xep-khay | S14 / #/preview/S14 | OperationalPutawayOrders: paged orders | S00#1 UI; S00#2 contracts | distinct order/BOX/receipt codes, status filter, 9 visible rows |
| 03 Danh-sach-khay | S11 / #/preview/S11 | OperationalTrays: scoped tray list | S00#1 UI; S00#2 projection | 9 trays, derived BOX/SKU totals, latest confirmation |
| 04 Lich-su | S14 / #/preview/S14/history | PutawayHistoryScreen: authorized data | S00#1 UI; S00#2 history API | 9 events, date/search/action filters, data scope before count/page |
| 05 Xac-nhan-tao-lenh | S13 | Create confirmation, one BOX | S00#1 UI; S00#2 create | full BOX only, current ledger qty, creation changes neither location nor stock |
| 06 Tao-lenh-thanh-cong | S13 | Creation result, one DRAFT | S00#1 UI; S00#2 recovery | accepted order ID, unselected tray, View order route/focus, no repeat create |
| 07 Chi-tiet-lenh-da-xac-nhan | S14 | One confirmed order | S00#1 UI; S00#2 read | identity and tray/location, captured/current qty and revisions |
| 08 Lenh-nhap-validation | S14 | One draft, required tray validation | S00#1 UI; S00#2 confirm | field error and focus, retain context, no partial BOX |
| 09 Chi-tiet-khay | S11 | One tray with 9 BOX | S00#1 UI; S00#2 projection | 9 coherent SKU/source/ledger records, bounded body scroll, footer accessible |
| 10 Dang-xac-nhan | S14 | Confirm pending | S00#1 UI; S00#2 journal | duplicate submit lock, safe dismissal, exactly one commit |
| 11 Du-lieu-thay-doi | S14 | Stale operation/conflict | S00#1 UI; S00#2 validation | retained selection, reread before retry, captured content not silently rewritten |
| 12 Khong-co-khay | S14 | No eligible tray | S00#1 UI; S00#2 scope | distinct empty state, refresh list, disabled confirmation |
| 13 Khong-co-quyen | S14 / #/preview/S14/history | Missing history grant | S00#1 route/UI; S00#2 API | 403 at API, direct route/refresh, no rows/count leak, authorized return link |

History is a subroute of S14; S20 remains inventory movement history and is not reused. Existing S11/S13/S14 feature ownership and command bindings are retained. S00#1 owns app/navigation and all feature/shared presentation; S00#2 owns new history contracts/adapters/projection, scoped repository service changes, separate Candidate fixture and business tests. S00#3 owns its existing notification files in the earlier checkout. No fourth execution task or new chat is opened.

## Normalization locked before implementation

Retain the existing approved Hoa Nam shell/logo and global toast behavior. Desktop tabs use a single underline style; portrait Tablet uses one 2-by-2 tab grid. Use GlobalModal through a tray-specific shared wrapper: one neutral header with title/status/44px close action, 24px body/footer padding, bounded scrolling body and accessible footer. Do not copy inconsistent blue/white headers or generated logo variants. Card and dialog spacing 24px, group gaps 16/24px, label-field 8px. Page left/right margins 32px Desktop and 24px Tablet. Numeric cells align right. Tablet control targets >=44 CSS px. No reduced font sizes to fit data.

## QA matrix

Desktop 1920x1080 CSS, DPR1; portrait Tablet 800x1280 CSS, DPR2 (1600x2560 output). Each of 13 states receives a separate VI/light screenshot at each viewport. Additional interaction/overflow/long-content tests cover VI/EN/zh-CN and Light/Dark at both viewports; include narrow-width and long-dialog checks where needed. Report computed padding/margin/control bounds, shared left alignment, whole-page overflow, focus return/trap, and safe scroll/CTA access. Verify create/view/select/confirm/history, reload, query/page preservation, permission and cross-warehouse scope, duplicate/unknown-outcome replay and quantity invariance. Recheck unrelated GlobalModal/shared-shell consumers and existing v47 return workflow. Builds alone do not satisfy acceptance.

## Release contract resolution

Existing .openai/hosting.json and native get_site confirm project appgprj_6adc45f730d88191ae066e8ff0c936aa, public audience, and current domain https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site. No new Site/domain. Resolve latest published version immediately before packaging; preserve its saved ID and source for rollback. Publish only after required QA gates; verify anonymous fresh QA login, direct routes, refresh and build. Fixtures stay isolated from real data and retain provenance outside product UI.
