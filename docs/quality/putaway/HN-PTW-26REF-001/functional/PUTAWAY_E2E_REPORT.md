# Putaway E2E Report — HN-PTW-26REF-001

## Scope

Candidate: `DEV` / `6ea167125643d10d6545b28df452511af54c6f09` plus the uncommitted PTW seed fix in the working tree; executed 2026-10-28 against local Vite `http://127.0.0.1:5188`.

This is a local **MOCK** browser E2E probe against Vite port 5188. It logs in with the documented Preview credential, completes the browser-local setup gate, and visits S13 queue, S14 orders, S11 trays and S14 history. It does not certify a hosted Site, staging, REAL_API, or physical scanner.

## Observed flow

1. Login/confirm/setup reached `#/preview/S01`; shell loaded with no page errors.
2. S13 operational queue settled to 9 rows: `PUBLIC-DEMO-BOX-0009` plus `BOX-0021`…`BOX-0028`. Each row exposed SKU, source receipt, current quantity and `Tạo lệnh`.
3. Create dialog displayed BOX/SKU/source receipt/current quantity and the whole-BOX/no-stock-change note. It had no tray selector. Submit produced a DRAFT order, quantity 6 for `PUBLIC-DEMO-BOX-0009`, and `Khay đích: Chưa chọn khay`.
4. S14 order detail displayed DRAFT, captured/current BOX version and content revision, current BOX stock, and `Xác nhận xếp khay` / `Hủy lệnh` actions. Confirm editor required a destination tray; selecting a tray and confirming produced a success status and a confirmed row.
5. History after setup and the fresh confirm showed 11 records, page range `1–9 / 11`, and date/action/search controls.
6. Retest S11 rendered nine tray records with exact codes `TRAY-001` through `TRAY-009`, no read error, and opened TRAY-001 details showing the `BOX trong khay` section. The approved seed now supplies complete receipt/line/BOX links; FQ-PTW-004 is FIX VERIFIED.
7. A responsive follow-up reached S13 at viewport 800×1280 with no horizontal overflow. The context reported DPR 1 after resize; the required DPR2 tablet profile therefore remains NOT_RUN.

## Browser console/errors

No application `pageerror` or console error was observed in the successful probe. A first exploratory probe captured transient browser `ERR_NETWORK_CHANGED` messages while Vite was starting; these were excluded from the successful result and are not treated as product failures.

## E2E gaps

- Empty-tray and cross-route refresh assertions remain NOT_RUN. The required DPR2 tablet profile remains NOT_RUN because the Playwright context reports DPR=1 after resize.
- Timeout/network-error injection and pending/lost-response recovery for S13/S14 were not run.
- Real API, staging, public deployment, scanner hardware, CI and actual RBAC are BLOCKED/NOT_RUN.
