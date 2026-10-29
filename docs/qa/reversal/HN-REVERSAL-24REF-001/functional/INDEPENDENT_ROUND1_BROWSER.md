# Independent current-build browser audit

Tested source `1e2a37860f944fec2db4e09ffc701fe71e6c7285`, static build `723b54201fa559c2e35467513167bc783f899b4fb3fd7b72f365396d0a37794b`. Normal protected application on5341 plus the actual component with bounded instrumented adapters on5340. Source hashes match before/after each completed run. Browser closed before repair-window release.

[Initial18-case result](independent-round1/results.json): **12 PASS /6 FAIL**. Three failures were confirmed application defects below; three were exact wrapping-select label mismatches in QA locators. Corrected combobox-prefix locators retained the original behavior assertions. [Four-case correction retest](independent-round1-select-retest-final/results.json): **4 PASS /0 FAIL**, zero recorded browser errors. An intermediate filtered retest is retained separately: its canonical-store check used the active isolated component context instead of the original authenticated context. The final correction explicitly restores the authenticated context and passes equality. No application source changed for these harness corrections.

## Confirmed defects

| ID | Priority | Reproduction and exact observation | Required behavior |
|---|---|---|---|
| REV-QA-F02 | P2 | Search REV-20261028-009→one row→detail→Back/Forward→refresh→Về danh sách. Detail URL retains the correct id, but returned list has9 rows instead of1. | Persist accepted search/filter/page/return context across detail refresh. Existing short-viewport return scroll/focus without refresh passes and is a separate result. |
| REV-QA-F03 | P1 defensive state failure | Actual component supplied a contract-valid empty `list():[]`. It fails before `.rev` mounts with pageerror `Cannot read properties of undefined (reading 'note')`. | Render the shared empty state with zero business rows; filtered no-results must remain distinct. Do not create a fake selected business record. |
| REV-QA-F04 | P2 locale coverage | EN/Light heading and buttons translate, but fixed subtitle `Tra cứu giao dịch đảo và chứng từ gốc`, breadcrumb, type/reason/quantity labels remain VI. Initial locale loop stops at the first assertion; zh/dark are NOT_RUN in that receipt. | Translate fixed module copy consistently across required locale/theme combinations. User names/document identifiers are source content and are not translation defects. |

The corresponding screenshots are linked from the raw initial receipt. No baseline or assertion was weakened to hide these defects.

## Current passing behavior

- Nine fixture identities and4posted/2draft/1pending/2cancelled distribution.
- Draft search versus Enter application, source-ID query, status filtering and reset after locator correction.
- Reversed accepted date range rejected with visible feedback while preserving9 rows; future manual DatePicker entry rejected within the shared popup.
- Invalid direct id renders record-not-found instead of a successful unrelated draft.
- Pending-return/cancelled records keep their exact3/1 rows and zero current stock impact; no posting action on them.
- Posted inbound/outbound signs, source dialog relation and Escape return focus; blocked BOX/source chain and disabled posting.
- Short640px viewport restores list scroll and meaningful focus.
- Missing reason/excess quantity retains valid second line and blocks review after locator correction.
- Header draft note is present in both saved and posted instrumented payloads.
- Twelve records paginate9/3 with total12.
- Unknown submission makes exactly one POST; status query uses that exact key and reaches success only after matching proof.
- Mismatched receipt identity does not show success.
- Conflict disables posting, reloads current source model and requires review; one POST only.
- Canonical operational business state is equal before/after all model-only/candidate interactions.

## Boundaries and next retest

All posting behavior above is **MOCK**, using an isolated in-memory design adapter. There are no production mutations or server atomicity/RBAC claims. Loading/read-error/forbidden cannot be certified from a synchronous list adapter; real partial inbound/outbound endpoints and approved permission mapping remain **BLOCKED**. Runtime model telemetry remains **NOT_VERIFIED**.

The next bounded suite additionally probes chooser→new draft creation timestamp/source/payload and disabled repeat submission with a delayed matching receipt. Those additions are prepared, **NOT_RUN** on this source. Static source currently inherits the source document's creation timestamp when constructing a new draft; that is reported for repair review, not claimed as an already executed browser failure.
