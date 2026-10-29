# Regression / authorization boundary

Final source `3f8cf44ac531d72d50a42003cafecf6d726085ca`; mode MOCK. Evidence: [final QA report](INDEPENDENT_FUNCTIONAL_QA_FINAL.md).

| Check | Status | Evidence and limit |
|---|---|---|
| Protected candidate URL before authentication | PASS | Fresh normal-app contexts redirected to S07; ordinary login/confirmation/setup required |
| Expired MOCK session | PASS | Normal session advanced9h beyond existing8h lifetime, candidate redirects to login; no auth patch |
| Forbidden history rendering | PASS UI | Shared state visible, sensitive rows/metrics hidden across VI/EN/ZH and light/dark; scenario is explicit fixture input |
| Invalid or cross-warehouse ID fence | PASS fixture | Current and saved difference reject mismatched SKU/warehouse; invalid SKU/BOX/tray/snapshot do not select first row |
| Snapshot read-only behavior | PASS fixture | Frozen saved copies survive changed injected live values; canonical snapshot69 exactly unchanged after normal fixture reads/navigation |
| Default operational S16/S11/S20/S21 | PASS MOCK smoke | Row populations11/9/35/11 and before/after screenshots; does not prove every route mutation or export |
| Production role matrix / least privilege | BLOCKED | No production reconciliation-history permission key, roles, accounts or server authorization contract supplied |
| Real inventory/count/reservation/history APIs | BLOCKED | Approved adapter remains frontend fixture data; canonical ledger is not physical counted stock |
| Backend forbidden versus not-found policy | NOT_RUN | Fixture UI outcomes do not establish server disclosure policy |
| Real server session expiry / token refresh | NOT_RUN | Only MOCK account lifetime exercised |
| Real service failure/retry/concurrent update | NOT_RUN | Error and successful recovery tested with bounded injected component adapter only |

The safe fixture approach preserves known SKU totals while explicitly marking missing allocation coverage unavailable. It never fabricates zero from an incomplete BOX fixture. Only explicit complete coverage permits a zero allocation result. Saved snapshots carry independent frozen rows, boxes, coverage and source identity. No authentication bypass or business mutation was introduced to obtain screenshots or test receipts.
