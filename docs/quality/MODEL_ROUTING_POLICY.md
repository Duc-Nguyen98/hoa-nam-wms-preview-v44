# Model Routing Policy v2.0

Project: `S00_Hoa_Nam_Web`  
Mode: `CONTROLLED_AUTOMATION`  
Effective date: 2026-10-27 (UTC+07)

## Runtime audit

- Global Codex configuration inspected at `C:\Users\Admin\.codex\config.toml`.
- Current global model: `gpt-6.1-sol`.
- Current global reasoning effort: `high`.
- No project role-level model configuration was found in this repository or the local Codex configuration.
- The native `spawn_agent` runtime accepted `gpt-6.1-sol` and rejected `gpt-6.1-terra` as unavailable. Terra remains a requested policy target, not an applied runtime setting.
- No global configuration was changed or backed up because role-level configuration is not supported by the active spawn interface and changing global settings would affect other projects.

## Role policy

| Role | Policy target | Runtime status | Routing rule |
|---|---|---|---|
| S00#1 | GPT-6.1 Sol / High | Applied to this orchestrator session | Coordination, integration and complex governance |
| S00#2 | GPT-6.1 Terra / High | Unavailable in current spawn interface | Scoped UI/CRUD fixes; use an explicitly recorded fallback only when Terra cannot be selected |
| S00#3 | GPT-6.1 Terra / High | Unavailable in current spawn interface | Screenshot, geometry and responsive checks; Sol for complex discrepancy analysis |
| S00#4 | GPT-6.1 Sol / High | Available | Functional root cause, regression and data-integrity analysis |
| S00#5 | GPT-6.1 Terra / Medium | Unavailable in current spawn interface | Git/CI/release inspection; Sol for complex provenance analysis |
| S00#6 | GPT-6.1 Sol / High | Available | Design authority and contract conflicts |

No agent may claim a model or reasoning level from a prompt label. The dispatch result and runtime status are the source of truth. If a requested model is unavailable, the task records `UNAVAILABLE` and waits for an allowed fallback or user decision; it does not silently re-label Sol as Terra.

## Adaptive escalation

Terra is the target for scoped fixes and visual inspection. Sol is used for cross-module, concurrency, root-cause and regression-risk work. Astra requires an explicit escalation record with evidence that Sol was insufficient. Missing design authority, blocked CI, unavailable permissions and test-environment failures do not justify escalation.

## Measurement record

The first routing canary uses the Notification badge boundary task. The requested S00#2 Terra High run could not be dispatched because the runtime rejected that model. A Sol High control run is dispatched and its actual result is recorded separately. This is a capability test, not evidence that Terra is active.

Quality acceptance, file ownership, independent QA and fail-closed gates are unchanged by model selection. Model routing cannot authorize baseline changes, merges or deployments.
