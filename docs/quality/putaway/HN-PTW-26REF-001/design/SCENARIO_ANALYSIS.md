# PTW-01 Scenario Analysis (13 states)

This scenario analysis treats the 13 named reference pairs as a state graph. It is a QA/design planning artifact; it does not fabricate screenshots or mutate fixtures.

| State | Entry | Expected visible state | Transition / invariant | Owner |
|---|---|---|---|---|
| 01 Queue | S13 route, eligible BOX fixture | 9 eligible BOX rows, SKU/product, receipt and current quantity, create action | Open create review; no business write | S13 screen + create binding |
| 02 Orders | S14 route | Paged order list with status/source filters and identity fields | Open read-only detail; no mutation | S14 screen/controller |
| 03 Trays | S11 route | Configured trays with derived BOX/SKU counts and latest confirmation | Open tray detail; projection only | S11 binding |
| 04 History | S14/history with grant | Filtered successful events, date/search/action controls and paging | Query scopes before count/page; timezone policy applies | History screen/adapter |
| 05 Create review | Select one eligible BOX from 01 | Confirmation modal shows BOX/SKU/product/receipt/current quantity and whole-BOX note | Create produces DRAFT only; close returns focus | S13 `TrayDialog` |
| 06 Created draft | Accepted create outcome | Success modal shows order ID, BOX, receipt, captured quantity, DRAFT, tray unselected | View order or close; duplicate create locked | S13 create binding |
| 07 Confirmed detail | S14 confirmed order | Identity, destination tray/location, captured/current values and revision/status | Read-only unless state is DRAFT | S14 detail owner |
| 08 Draft validation | S14 DRAFT + confirm editor | Required tray field; validation and retained context | Missing tray blocks submit; no partial BOX | S14 putaway binding |
| 09 Tray detail | S11 selected tray | Header summary and nine BOX rows with current ledger quantities | Only confirmed mappings appear; bounded scroll/footer | S11 `GlobalModal` |
| 10 Confirming | S14 submit in progress | Busy/disabled controls and pending confirmation copy | Exactly one commit; unknown outcome enters recovery | S14 putaway binding |
| 11 Conflict | S14 stale version/content | Stale warning, reread/check action, captured content retained | Retry only after fence/version validation | S14 putaway binding |
| 12 No tray | S14 DRAFT with no eligible active tray | Empty/no-eligible-tray state and disabled confirm | Distinct from error/forbidden; refresh can recover | S14 editor |
| 13 Permission denied | Direct S14/history without grant | Lock/forbidden state, explanation and return-to-S14 link | No rows/count leak; 403 remains denied | History screen/API |

## Cross-state checks

- `01 → 05 → 06` must leave stock and BOX location unchanged until a later confirmed operation.
- `06 → 02 → 08 → 07` exercises draft creation, selection, validation and confirmation; version/content fences must hold through reload.
- `03` must reflect only mappings established by successful confirmation and must use current ledger balance.
- `04` must show only authorized scoped events; `13` must be tested through direct route and refresh.
- `10` and `11` are separate pending/recovery versus stale-data states; neither may be represented as success.
- Desktop and Tablet pairs are separate visual baselines. Locale/theme expansion, browser/device facts and CSS normalization must be captured before comparison.
