# HN-S12-UIUX-006 Functional QA

**Baseline candidate:** `bfec7060cdf422a112ec5e644bf0b51401d9bda2` on `DEV`  
**After-fix retest candidate:** working tree at `HEAD bfec7060cdf422a112ec5e644bf0b51401d9bda2`, with the uncommitted S12 source diff identified by hash `ea80a673eac344167451974841f42364abe7d7a2` and fixed `OperationalReceipts.tsx` blob `d8896efb843ec248dd684afbe9a5ab2487b1008f`  
**Route:** `#/preview/S12`  
**Workspace:** `E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026`  
**Preview:** `http://127.0.0.1:5287`  
**Owner:** S00#4 Functional QA  
**Environment:** local `MOCK` harness and preview; `REAL_API` **NOT_CONNECTED**. No credentials, auth storage, tokens, or customer data were persisted.

## Verdict

**Baseline:** **FAIL / BLOCKED.** P1 V01 was confirmed: an adapter-valid receipt outside a hard-coded demo-code allowlist was hidden.  
**After-fix retest:** **PASS for synthetic adapter visibility and filtering.** The focused visibility suite passes with arbitrary receipt codes and refresh replacement. Actual authenticated route and `REAL_API` coverage remain **BLOCKED / NOT_RUN** because no credential environment variables were available and the fresh route probe correctly stopped at the S07 login screen.

## Evidence matrix

| Area | Result | Layer and evidence |
|---|---|---|
| Ready list, count, no horizontal overflow | PASS | Synthetic `tests/reference-exact/receipts.html`, desktop1672×941 and tablet992×1586; `s12-results.json` |
| Search by code/source/reference | PASS | Synthetic harness: PN-0012 returns one matching receipt |
| Status filter and reset | PASS | Synthetic harness, both viewports |
| Detail exact record identity | PASS | Synthetic detail opens exact selected receipt ID and shows read-only fields |
| Copy receipt code | PASS | Synthetic clipboard read-back equals displayed raw code |
| Create modal | PASS | Synthetic create modal opens at both viewports |
| Validation required field/focus | PASS | Empty save reports one missing mode and focuses first invalid control |
| Validation max length | PASS | Source/reference >200 plus missing mode reports three invalid fields; no command issued |
| Create writes | PASS | `receiptqa.commands === 0` after validation probes; harness adapter is read-only |
| Tablet keyboard / ESC / focus return | PASS | Detail ESC returns opener; modal validation focuses first invalid field |
| Empty state | PASS | Synthetic `state=empty` behavior harness |
| Loading state | PASS | Synthetic `state=loading` behavior harness |
| Read error and retry | PASS | Synthetic `state=error`, then state switched to ready and “Đọc lại dữ liệu” restores 3 rows |
| Forbidden state | PASS | Synthetic `state=forbidden` behavior harness |
| Selected record missing | PASS | Synthetic record removal on detail refresh shows record-not-found; zero commands |
| Allowlist data integrity | **PASS after V01 fix** (baseline **FAIL P1 V01**) | Baseline `allowlist-repro.json` records the hidden `PN-AUTHORIZED-EXTRA`; after-fix focused suite records arbitrary codes visible after refresh, search, and status filtering |
| Focused after-fix visibility suite | **PASS** | `npx playwright test --config=tests/s12/receipt-visibility.config.ts`: 2 passed (26.6s) at the after-fix working-tree candidate |
| Actual authenticated route / REAL_API | **BLOCKED / NOT_RUN** | Fresh `functional_probe.mjs` sees S07 login at direct S12 URL; no credential env supplied; no live API configured |
| Production RBAC/append-only/server behavior | NOT_RUN | No REAL_API or production role matrix available |
| Automated axe/full screen-reader/physical device | NOT_RUN | Not part of this read-only functional run |

## Test commands and provenance

```powershell
node docs/quality/uiux-task-HN-S12-UIUX-006/functional/reference-behavior.mjs
node docs/quality/uiux-task-HN-S12-UIUX-006/functional/s12-functional.mjs
node docs/quality/uiux-task-HN-S12-UIUX-006/functional/allowlist-repro.mjs
node docs/quality/uiux-task-HN-S12-UIUX-006/functional/functional_probe.mjs
npx playwright test --config=tests/s12/receipt-visibility.config.ts
```

`reference-behavior.mjs` is derived from the existing S12 reference harness and covers S12 adapter ready/empty/loading/error/forbidden plus missing-record retry. `s12-functional.mjs` is an independent read-only browser probe covering desktop/tablet list/search/status/detail/create validation/focus/ESC/no-write/error states. `allowlist-repro.mjs` is the source-backed V01 reproduction. `functional_probe.mjs` auto-discovers the actual route and records that it requires login; it does not print or save credentials.

The first `s12-functional.mjs` attempt is preserved in `s12-failure.json`: it incorrectly expected three visible card elements at desktop where the table presentation is visible. The corrected probe asserts the shared results count and passes all ten profile groups with zero page or console errors. This was a QA selector correction, not a product defect.

The after-fix focused suite passed both tests: arbitrary adapter codes remained visible through list/search/status filtering, and refresh replaced the visible pool while preserving the empty state. The test ran against the working tree described above; the source fix was not authored by this QA task.

## Scope limitations

- Synthetic reference rows (`PN-0012`, `PN-0011`, `PN-0010`) are harness data and are not asserted as actual production rows.
- The allowlist defect is source-backed and reproducible without fabricating production IDs; `PN-AUTHORIZED-EXTRA` is an isolated adapter-shaped test record only.
- Real authenticated create/save/post, actual persisted reload, live permission/session expiry, offline transport, HTTP5xx and REAL_API responses are **NOT_RUN/BLOCKED**.
- This QA task did not author source or test implementation changes. The V01 source fix is present as an uncommitted working-tree change from the implementation task; the after-fix result is tied to the HEAD and source-diff hash recorded above.
