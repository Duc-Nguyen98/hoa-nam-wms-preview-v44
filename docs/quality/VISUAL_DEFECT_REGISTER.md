# S00#3 Visual Defect Register

Candidate tested: `DEV` @ `b287d1294f0aa37b1c38c14275ef8c0a279d4fcc`
Preview: https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/
Run: `output/design-evidence/public-setup-blocker-20261027/`

## VQ-001 — public-demo initialization has no bounded/recoverable completion

- Severity: **P1** (blocks entry to the main product for a clean browser; inconsistent completion exceeds two minutes).
- Route/component/state: `#/preview/S01` → `PublicDemoGate`, fresh authenticated browser.
- Design version: runtime candidate; no approved onboarding artwork is registered.
- Expected: after confirming the session, the user receives a bounded, observable initialization state and reaches S01 or a clear retry/error state without session expiry.
- Actual: “Tiếp tục” becomes `aria-disabled="true"` while the native `disabled` property remains false; the page shows no progress/error. In the captured run the lock remained held at 0/5/20 seconds, then S01 appeared at ~65 seconds. A repeat clean-profile run remained unavailable for >180 seconds and returned to login. No page/console errors were recorded.
- Reproduction: open the public URL in a clean Playwright profile; login `demo` / `HoaNamDemo@2026`; confirm session; click “Tiếp tục”; observe 0s, 5s, 20s and 120s.
- Evidence: [result.json](../../output/design-evidence/public-setup-blocker-20261027/result.json), [20s screenshot](../../output/design-evidence/public-setup-blocker-20261027/setup-020000ms.png), [120s screenshot](../../output/design-evidence/public-setup-blocker-20261027/setup-120000ms.png).
- Suggested correction: make setup initialization idempotent and bounded; expose progress/phase, timeout, cancellation and retry; ensure the account session cannot silently expire while setup commands run. Keep the current data contract and do not hide the setup gate.
- Retest: **OPEN — public cross-device visual run cannot start reliably.**

## VQ-002 — S01 fixture count differs from approved artwork; scenario authority is unresolved

- Severity: **P2 candidate / DESIGN_GAP**, not a production CSS correction until the scenario is approved.
- Route/component/state: `#/preview/S01` Default, `Cần xử lý` summary/list.
- Design version: `BL-S01-D` / `HN_Astra 3` (approved page components only; shell excluded).
- Expected in the artwork: summary badge `3` and three attention rows.
- Actual public capture: summary badge `5`; the visible list still contains three rows. Other hierarchy, card topology, table and CTA placement are present.
- Evidence: [public actual 1440×900](../../output/design-evidence/public-setup-blocker-20261027/setup-060000ms.png), [approved reference 3](references/hn-astra-20261027/3.png).
- Evidence hashes: actual SHA-256 `50f16f5ec397c678d0bf31b759879c74497bea0851b6e48680dabc67245e66b5`; reference 3 SHA-256 `f17af2135653f38503c72139603ad429e437d86248e22f36abe270449c39257e`.
- Suggested correction: S00#1/S00#6 freeze and document the QA data scenario, date anchor, pagination and count semantics (DG-04). Do not hardcode `3` or replace source data solely to match a raster.
- Retest: **BLOCKED_DESIGN** until DG-04 is resolved.

## Closed / not defects

- Notification isolated harness: five Playwright tests passed, including tablet focus/scroll and touch geometry. This is supplemental evidence and does not certify the public deployment.
- No new horizontal overflow, console error, or invalid reference hash was proven in the available run. Missing public viewport captures remain `NOT_RUN`, not PASS.
