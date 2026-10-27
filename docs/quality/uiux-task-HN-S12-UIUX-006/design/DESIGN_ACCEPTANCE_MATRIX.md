# S12 design acceptance matrix

Task HN-S12-UIUX-006 · S00#6 · 2026-10-28 UTC+07

Route for every row: `#/preview/S12`, current-session `OperationalReceipts`. Source state IDs follow task order, not numerical PNG order alone. Scope: S12 content; protected shell excluded. VI/light artwork coverage is confirmed; no source artwork for dark/EN/ZH has been supplied. Every actual/diff/test result below is **NOT_RUN** by this role.

## Eight required source states

| ID / source / raster | State setup | Reviewable content criteria | Evidence required / status |
|---|---|---|---|
| REF-01 · 15.png · 1672×941 | Desktop create; open form over empty-session content, type unselected; source `Nhà cung cấp An Phát`, reference `NCC-1025-01` as scenario-entered values | Titled dialog, description, close; stacked required type/source and optional reference; helper text for one line/200 characters; required note; desktop footer refresh at start, cancel/save at end | Full actual + dialog crop/diff; source/copy hash; scenario/profile/transform; NOT_RUN |
| REF-02 · 16.png · 1672×941 | Desktop populated example: PN-0012/11/10, draft `Mới tạo`, each zero recorded codes | Page title/description; panel heading and refresh/create; search and status filter; five-column table with code, source/reference, status, count, detail action; result count3. Separate `Khi chưa có phiếu nhập` card is an explicit empty illustration in this artwork, requiring composition disposition before literal live duplication | Full actual plus content diff, real scenario identity and count; empty state captured separately when mutually exclusive; NOT_RUN |
| REF-03 · 17.png · 1672×941 | Desktop detail selected from adapter record; example PN-0012, draft, no lines | Dialog title/close; code+copy+status; two-column information group; code/source/reference and actual type; recorded-code title with zero badge and empty panel; refresh/close footer. Artwork missing type and absent edit action are declared scenario gaps | Full actual + dialog crop/diff; selected entity ID and actual field provenance; copy/focus/close/refresh tests; NOT_RUN |
| REF-04 · 18.png · 992×1586 | Tablet populated example, same3 draft rows with zero counts | Page heading/description; refresh/create pair; full-width stacked search/status; three cards, identity/status, source/reference, separator, count and detail link; result count3. No second empty illustration visible | Full actual + content diff; card ordering and width/overflow geometry; NOT_RUN |
| REF-05 · 19.png · 992×1586 | Tablet detail, same selected draft/no-lines record | Detail identity; information rendered as label/value rows; copy actions at row ends; count0 and empty panel; refresh/close reachable. Actual business type retained; shell backdrop is outside authority | Full actual + dialog crop/diff; footer reachability, selected-ID continuity and keyboard return; NOT_RUN |
| REF-06 · 20.png · 992×1586 | Tablet create, same draft values as REF-01 | Stacked form; required labels/helper/note; refresh full-width row then cancel/save pair; all actions reachable with bounded dialog scroll | Full actual + dialog crop/diff; long-content/keyboard geometry and scroll; NOT_RUN |
| REF-07 · 21.png · 992×1585 | Tablet invalid submit: mode empty, source empty, reference201 characters | Summary `Có 3 trường cần kiểm tra.`; all3 controls invalid; mode/source required messages; reference maximum message, right-aligned201/200 counter; input keeps full data; footer refresh then cancel/save pair; first invalid field receives focus | Full actual + dialog crop/diff; exact test input and NFC count; zero write commands on invalid submission; NOT_RUN |
| REF-08 · 22.png · 1672×941 | Desktop same invalid state | Same3 errors and counter; summary before fields; red semantic error treatment; bounded single-line input; desktop footer refresh then cancel/save; retain input after attempted submit | Full actual + dialog crop/diff; invalid/valid boundary results, console and keyboard report; NOT_RUN |

## Shared acceptance conditions

| Area | Criterion | Authority / result |
|---|---|---|
| Original integrity | Original/copy SHA-256 matches before and after capture; originals never overwritten by actuals or diffs | Manifest; custody PASS8/8 at registration |
| Capture normalization | Record CSS viewport, DPR, pointer/touch/orientation, locale, theme, zoom, URL, scenario, commit and actual raster. Any crop/scale is derived, explicit and retained beside originals | DESIGN_GAP until capture record; source raster is not a CSS profile |
| Responsive geometry | No horizontal page overflow, clipped labels or unreachable CTA; table/card presentation follows profile; actions/copy meet existing44 CSS px target | S00#3 geometry + S00#4 keyboard; NOT_RUN |
| Modal mechanics | Shared GlobalModal focus containment, Escape/cancel when allowed, return focus and bounded body scrolling; pending/unknown state retains existing close/submit policy | Existing component contract; NOT_RUN |
| Data truth | Record IDs come from adapter; count/status/type derive from real snapshot; artwork labels are scenario values; absent/denied/error/loading/no-results differ | Existing source/business contracts; NOT_RUN |
| Empty | Actual zero-row session shows empty message and create-first CTA; filtered zero rows shows no-results/reset; neither is inferred merely from missing data | Existing PageState/ReadState; NOT_RUN |
| Validation | Empty mode/source and201 reference produce3 errors; 200-character valid source/reference preserve current single-line/NFC rules; errors associated with fields; invalid submit makes no business write | receipt-header-form.ts / ReceiptHeaderForm.tsx; NOT_RUN |
| Theme/locales | Dark/EN/ZH and long labels preserve visibility, wrapping, contrast and accessible names using existing contracts | Regression requirement; visual artwork unavailable, semantic/geometry test only; NOT_RUN |
| Protected consumers | Preserve shell and other screen behavior; existing shared primitives retained | Ownership/gates; NOT_RUN |

No unexplained whole-image pixel threshold can certify mismatched profile/raster sizes. A diagnostic harness can isolate S12 styling but cannot certify public-route runtime behavior. Visual PASS belongs to S00#3, functional PASS to S00#4 and integrated readiness to S00#1.
