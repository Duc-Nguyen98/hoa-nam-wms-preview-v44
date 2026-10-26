# S00#3 Visual QA Report — S01 / Global Notification

Date: 2026-10-27 (UTC+07)
Candidate: `DEV` @ `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`
Public URL: https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/
References: `BL-NOTIFY-D/T`, `BL-S01-D/T`, `BL-S01-DETAIL-D/T` from `HN_Astra 1–6`, registered in `BASELINE_MANIFEST.md`.

## Verdict

**BLOCKED — no Visual PASS.** Approved source custody is valid, but the current public candidate cannot be accepted as a reproducible cross-device visual run because a clean browser session spends ~60 seconds (and in a repeated run >180 seconds) in the public-demo initialization gate before S01 becomes available. Desktop/tablet/Fold captures and detail/notification public captures therefore remain `NOT_RUN/BLOCKED`.

One public S01 capture was obtained at 1440×900 after initialization. Its page-component topology is visually consistent with reference 3, but it is diagnostic only: the source CSS viewport/DPR, shell reference, and data scenario are not locked. The public fixture shows `Cần xử lý 5` while reference 3 shows `3`; this is registered as a design/scenario gap, not silently treated as a UI defect.

## Executed evidence

| Area | Result | Evidence |
|---|---|---|
| Public login | PASS | Login flow reached `#/preview/S08` with demo credentials. |
| Public-demo initialization | FAIL / BLOCKED | [setup result](../../output/design-evidence/public-setup-blocker-20261027/result.json) and 0/5/20/60/120s screenshots. |
| Public S01 diagnostic | BLOCKED | [1440×900 actual](../../output/design-evidence/public-setup-blocker-20261027/setup-060000ms.png). |
| Public S01 Desktop 1920×1080 | NOT_RUN | Blocked by clean-session setup gate. |
| Public S01 Tablet 800×1280 DPR2 | NOT_RUN | Blocked by clean-session setup gate. |
| Public Galaxy Fold 412×915 and 390×844 | NOT_RUN | Blocked by clean-session setup gate. |
| Public S01 detail refs 5/6 | NOT_RUN | Blocked by clean-session setup gate. |
| Public Notification refs 1/2 | NOT_RUN | Blocked by clean-session setup gate. |
| Isolated Notification visual/interaction harness | PASS (supplemental, not public acceptance) | `npx playwright test --config=playwright.notification-independent.config.ts`: 5/5 passed; geometry and stale-error artifacts under `output/notification-p0-20261025/`. |
| Typecheck | PASS | `npm run typecheck`. |
| Quality contract | PASS | `QUALITY_CONTRACT_PASS: 13 states, 26 references, immutable source policy`. |
| Console/page errors during setup evidence | PASS | `events: []` in setup result. |

## Method and limits

- Fixed locale `vi-VN`, timezone `Asia/Bangkok`, reduced-motion/headless Playwright where applicable.
- Approved originals were not modified. No `--update-snapshots` was used.
- `setup-060000ms.png` is a full public capture at 1440×900; it is not a golden baseline and is not a replacement for reference 3.
- Exact comparison is intentionally withheld because the S01 source raster does not specify CSS viewport/DPR, shell authority is excluded from refs 3–6, and the approved scenario/page-size/date decisions remain DG-02/DG-04/DG-05/DG-07/DG-08.

## Route/state matrix

| Route/state | Desktop | Tablet | Fold | Verdict |
|---|---:|---:|---:|---|
| `#/preview/S01` Default | diagnostic 1440×900 only | not run | not run | BLOCKED |
| S01 outbound detail `PX-0007` | not run | not run | not run | BLOCKED |
| Notification Center list/detail | not run on public; isolated harness pass | not run on public; isolated harness pass | not run | BLOCKED |
| Loading/empty/error/offline/denied/expired | no approved visual baselines | no approved visual baselines | no approved visual baselines | DESIGN_REFERENCE_MISSING |

## Required next action

S00#1/S00#2 must make public-demo initialization deterministic and bounded (with visible progress/error/retry and no session expiry), then rerun `tests/visual/s00-3-public-audit.mjs` at all four profiles. S00#6 must close the S01 viewport/scenario/shell/detail gaps before S00#3 can issue a visual PASS.
