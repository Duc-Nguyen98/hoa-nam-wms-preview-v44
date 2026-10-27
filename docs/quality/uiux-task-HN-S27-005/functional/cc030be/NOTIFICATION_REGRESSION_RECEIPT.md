# Notification/shared regression receipt

Tested candidate cc030be40552845881d0a234a26e1e783f5e6e4f; source unchanged throughout. Existing notification.spec.ts was copied into this owner's evidence lease; only screenshot output path changed for initial run. No production test or runtime was edited. All contexts closed after runs.

## Original suite:23 PASS,1 FAIL

Command: `npx playwright test --config docs/quality/uiux-task-HN-S27-005/functional/cc030be/regression.config.ts`.

Original bounded result from tool console (retained here as transcript excerpt):

```text
x 24 ... actual local S01 shell opens approved data and persists read state without extra labels (3.0m)
Test timeout of 180000ms exceeded.
Error: locator.click: Test timeout of 180000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /^Thông báo(?: · \d+)?$/ })
1 failed
23 passed (4.1m)
```

Read failure context showed normal application's setup screen, `Bắt đầu phiên làm việc`, `Thử lại`, and alert `Chưa hoàn tất khởi tạo. Dữ liệu đã lưu được giữ lại; bấm thử lại để tiếp tục.` The legacy test fixes runtime25Oct while current operational source commits26Oct. This creates invalid setup time for the current source, before the notification button exists. It is not attributed to S27 source changes. The full original reporter JSON was overwritten by the filtered rerun because the reporter output path was relative to its config; this receipt preserves the observed failure and does not represent a recovered raw JSON. Raw initial execution remains in the tool transcript. No failure was changed into PASS.

The23 passing cases cover desktop/tablet modal structure; old component regression captures; notification selection/read/unread/search/filter/page/focus/persistence; empty/loading/error/long/many states; VI/EN/ZH light/dark; five additional responsive profiles; dark selected-row contrast/determinism; unavailable document semantics and verified navigation. Capture names inherited from suite do not grant reference approval.

## Narrow current-date rerun:1 PASS

Changed only the evidence copy's actualS01 test clock from25Oct to27Oct; retained historical harness clocks for its other23 tests. Command adds `--grep 'actual local S01 shell'`. Result:1 passed in23.7s. Machine result `notification-currentdate-1pass.json`.

Actual normal S01 shell opens6 notification rows, desktop→tablet reflows, read state updates2→1, ESC returns to bell, browser reload preserves1unread; zero pageerrors. This is a source-aligned targeted retest, not a claim the original unchanged24-test command passed.

The reporter config was then corrected to output directly under this evidence directory. Historical screenshots are candidate regression outputs only, not baseline replacements.
