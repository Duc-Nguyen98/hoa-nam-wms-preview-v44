# Canary packet — HN-AUTO-NC-BADGE-001

- Input: autonomous operating mode activation, section IX: check Notification badge 0,1,9,10,99,100,999; negative fixture FAIL then restore PASS.
- Base/runtime SHA: `613ae50ab30c7372f9533aabab740c46d5fc079a`, branch `DEV`.
- Owner: native canary QA subagent `/root/canary_badge`, independent from runtime implementation owner S00#2.
- Lease: `tests/canary/**`, `docs/quality/canary/**` only.
- Authority: `docs/quality/DESIGN_CONTRACT.md` v1.2.0-recovery, badge cap `99+` >=100; zero hidden; full count retained in accessible label. Exact badge visual baseline remains provisional.
- Acceptance: formatter values correct; actual component DOM with production style imports shows nonzero badge; zero absent; full accessible count; no console errors/viewport overflow; negative fixture causes nonzero exit and restored fixture passes.
- Environment: isolated actual `NotificationBell`, local Vite/Chromium, no public authentication/API/deployment certification.
- Defect handoff: runtime changes must be done by S00#2 and independently retested; do not modify baseline or accepted assertions.
