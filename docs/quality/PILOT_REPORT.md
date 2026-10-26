# Quality pilot report — 2026-10-26

Pilot type: existing Notification Center visual/interaction harness smoke  
Workspace: `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
Preview URL: `https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/#/preview/S01`

## Commands and results

- `npm run quality:pr` — PASS: typecheck, immutable 13-state/26-reference manifest validation, build, 4/4 putaway tests.
- `node node_modules/@playwright/test/cli.js test -c playwright.notification.config.ts` — **22 passed, 2 failed**.
- `node node_modules/@playwright/test/cli.js test -c playwright.notification-independent.config.ts` — **5 passed, 0 failed**.

The main suite covered Desktop 1920×1080 DPR1, portrait Tablet 800×1280 DPR2, VI/EN/zh-CN, light/dark, loading/empty/error/long/many states, responsive widths, focus/persistence, console page errors and overflow assertions. Evidence is under `output/notification-p0-20261025/` and `output/notification-design-data-20261025/`.

## Open failures

1. The unverified-document test expected a verified `#/preview/S15` primary link after reopening the fixture; the link was absent. This is a functional/fixture contract failure, not a visual baseline approval.
2. The actual local S01 shell test timed out waiting for the notification button after the setup flow. This is an integration/setup failure and blocks the shell acceptance claim.

No snapshot was updated and no source reference was overwritten. These failures remain open in `GAP_REGISTER.md` until reproduced, diagnosed, and rerun successfully.

## Acceptance status

`BLOCKED` for the Notification Center pilot because the main suite has two failures. The suite is useful evidence for the automated harness, but it does not satisfy the requested S14 Putaway Orders pilot, which still requires list/search/filter/modal/form/loading/empty/error/success and responsive evidence.
