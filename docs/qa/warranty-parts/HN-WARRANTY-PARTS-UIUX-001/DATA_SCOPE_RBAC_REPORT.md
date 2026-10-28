# Data scope and RBAC report — HN-WARRANTY-PARTS-UIUX-001

**Checkout:** `DEV`, commit `93371f4da9b6659d320a7c66d9b0862f89744a0d`  
**Scope:** S09 `#/preview/S09`; S10 `#/preview/S10`  
**Mode:** local browser preview and fixture adapters only. No REAL_API credentials were used or persisted.

## Scope evidence

| Check | Status | Evidence |
|---|---|---|
| Route registry | **PASS** | `src/app/registry.ts` maps S09 to `#/preview/S09` and S10 to `#/preview/S10`; route registry comments explicitly say hashes are local preview routes, not production API endpoints. |
| Legacy S09 source boundary | **PASS** | `src/data/adapters/warranty-cases-fixture-adapter.ts` validates the 7-row detail set, reports aggregate 186, source `S09-P01-r02-detail`, and does not infer SKU/phone/PII fields. |
| Legacy S10 source boundary | **PASS** | `src/data/adapters/parts-slips-fixture-adapter.ts` validates the 7-row detail set, reports aggregate 84, source `S10-P01-r02-detail`, and allowlists fields so historical/provenance data cannot leak. |
| Query boundaries | **PASS** | Unsupported query shapes/options return `blocked` (`INVALID_QUERY` or `REQUIRES_OWNER_CONFIRMATION`) rather than a partial model. |
| Operational scenario scope | **PASS (MOCK)** | `src/data/http/operational-preview-adapter.ts` requires a preview snapshot with `mode='MOCK'`, complete token/epoch/revision, profiles, receipts and stock events. `operational-policy.ts` checks scenario ID and generation; S09/S10 binding tests reject stale generations and missing FK links. |
| App/Web command surfaces | **PASS (MOCK)** | Warranty intake and parts create/save/post are mapped to APP surfaces; warranty diagnose/transition are WEB. Wrong command surface is rejected with 403. |
| Detail identity fence | **PASS (MOCK)** | S09 uses `(id, epoch, scenarioId, generation)` fences; S10 uses the read token and `findOperationalPartsIssue`. Tests cover reset during reads, same ID in another generation, stale catalog revisions and session expiry. |
| Session/auth gate | **PASS (preview only)** | `PublicDemoGate` requires active account status and initializes browser-local synthetic data. The login route is S07/S08. This does not certify a backend session or production role. |
| RBAC / permission authority | **BLOCKED / DESIGN_GAP** | `warranty-cases.ts` and `parts-slips.ts` explicitly describe frontend-only shapes and say no backend permission enum/DTO is implied. `createOperationalWebAdapter` uses preview availability and maps forbidden/unavailable codes, but no production permission key, actor-role matrix, or REAL_API policy is supplied. S29 is a separate RBAC preview and cannot certify S09/S10 authorization. |
| Data tenancy / warehouse scope | **BLOCKED / DESIGN_GAP** | UI renders “Kho Hoa Nam”, but no backend warehouse-scope contract or REAL_API tenant assertion is present in S09/S10 sources. Preview scope is browser-local and scenario-token fenced only. |

## RBAC conclusion

The implementation is safe to describe as a **MOCK preview** with scenario and generation fencing. It is not evidence of production authorization, warehouse tenancy, or customer-record filtering. A REAL_API test account and approved permission/warehouse matrix are required before release certification.

