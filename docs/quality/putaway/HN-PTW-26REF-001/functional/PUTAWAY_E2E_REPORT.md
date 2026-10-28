# Putaway E2E Report — HN-PTW-26REF-001

## Scope

This is a local **MOCK** browser E2E probe against Vite port 5188. It logs in with the documented Preview credential, completes the browser-local setup gate, and visits S13 queue, S14 orders, S11 trays and S14 history. It does not certify a hosted Site, staging, REAL_API, or physical scanner.

## Observed flow

1. Login/confirm/setup reached `#/preview/S01`; shell loaded with no page errors.
2. S13 operational queue settled to 9 rows: one demo BOX plus `BOX-0021`…`BOX-0027` (remaining rows were visible after settling). Each row exposed SKU, source receipt, current quantity and `Tạo lệnh`.
3. Create dialog displayed BOX/SKU/source receipt/current quantity and the whole-BOX/no-stock-change note. It had no tray selector. Submit produced a DRAFT order, quantity 6 for `PUBLIC-DEMO-BOX-0009`, and `Khay đích: Chưa chọn khay`.
4. S14 order detail displayed DRAFT, captured/current BOX version and content revision, current BOX stock, and `Xác nhận xếp khay` / `Hủy lệnh` actions. Confirm editor required a destination tray; an unselected tray kept the confirm button disabled. Selecting a tray and confirming produced a success status and a confirmed row.
5. History after setup showed 10 successful confirm records (9 approved fixture records plus one existing demo record), page range `1–9 / 10`, and date/action/search controls.
6. A responsive follow-up reached S13 at viewport 800×1280 with no horizontal overflow. The context reported DPR 1 after resize; the required DPR2 tablet profile therefore remains NOT_RUN.

## Browser console/errors

No application `pageerror` or console error was observed in the successful probe. A first exploratory probe captured transient browser `ERR_NETWORK_CHANGED` messages while Vite was starting; these were excluded from the successful result and are not treated as product failures.

## E2E gaps

- S11 table/details, empty tray, and cross-route refresh were not captured with a retained artifact after a follow-up probe was interrupted; mark PARTIAL/NOT_RUN.
- Timeout/network-error injection and pending/lost-response recovery for S13/S14 were not run.
- Real API, staging, public deployment, scanner hardware, CI and actual RBAC are BLOCKED/NOT_RUN.
