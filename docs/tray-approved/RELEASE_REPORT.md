# HN_Astra approved tray release

- Site: https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site
- Published version: 53 (`appgprj_6adc45f730d88191ae066e8ff0c936aa~appgver_f23b7ae9d88c8191bea40d062eeb47ca`)
- Deployment: `appgdep_6adf39c7bd348191b1a5eca6113b4d03`
- Source commit: `1fce5dd9b05dfd2f5f82d69838314fd672ae2793`
- Rollback baseline: version 49, commit `d0df01de0453e0872b0ff4f190f2737ad3c89fa9`

## Verification

- `npm run typecheck` — PASS
- `npm run build` — PASS (Vite chunk-size advisory only)
- `npx tsx --test tests/putaway-approved/*.test.ts` — 4/4 PASS
- Canonical setup smoke test — PASS: 29 BOX records (27 approved + 2 existing Demo), 19 putaway orders (9 confirmed + 9 draft + 1 existing Demo), 9 tray masters.
- Local browser QA — PASS for S13 queue, S14 orders, S14 history route, responsive tray shell, dialogs and paging.

The approved tray manifest is descriptor input. Browser setup persists it through the canonical `scenario.seed-approved` QA command, which writes validated receipt, BOX, stock-event, putaway and audit records in one transaction. History reads are separately scoped and return 403 without the explicit history capability.
