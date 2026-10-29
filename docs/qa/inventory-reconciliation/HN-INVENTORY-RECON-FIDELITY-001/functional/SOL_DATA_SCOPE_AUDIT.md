# Independent data and scope audit

Task HN-INVENTORY-RECON-FIDELITY-001. Candidate `0dd709236cb43f497f9e349349eebd9144e7175d`. Static build `1ef2777576367344d9f5e63bf6b345b310d334b10a5659b9da9f55eef374ea74`. This report records current source inspection and 27 freshly executed pure/memory tests. Browser execution is reported separately; older baseline receipts are lineage only.

## Executed unit evidence

Command: `npx tsx --test tests/inventory-recon-fidelity/*.test.ts tests/inventory-fidelity/*.test.ts tests/inventory-recon-shared/*.test.tsx tests/putaway-approved/*.test.ts tests/warranty-parts/s21-operational-binding.test.ts`.

Result: **27 PASS / 0 FAIL**. [Raw output](sol-independent-unit.txt) and [source hashes](sol-independent-unit-provenance.json). The run preceded the integration commit; all nine audited implementation/fixture-test SHA256 values were rechecked against the committed candidate and match exactly. This is an explicit equivalence check, not a claim that an older build was retested.

| Requirement | Executed proof | Practical boundary |
|---|---|---|
| Null versus zero | null/NaN/infinite counted values remain unknown; explicit zero remains counted zero; partial BOX counts produce unknown totals | Defensive frontend model behavior; no real API nullable payload discovered |
| Signed quantities | negative, zero, positive and large safe quantities remain distinct | Locale rendering requires browser checks |
| Scope | selected location aggregates only same SKU/warehouse BOXes; incompatible warehouse/location returns null; known single-location SKU remains selectable | Fixture scope fencing; no server data-authorization claim |
| Completeness | approved DRV complete allocation reconciles120/20/100 and120/118/−2; remaining SKU coverage is explicitly unavailable | An absent allocation is not promoted into authoritative zero |
| Saved results | rows/BOXes/coverage are separately copied and frozen; mutation throws; fixture invariants unchanged | JavaScript object immutability, not immutable database snapshots |
| Navigation | version1 route roundtrip retains scope/query/date/movement/result/page/sort; history state preserved; old context versions rejected | Browser Back/Forward/focus/scroll requires separate E2E |
| Date | Vietnam midnight at17:00UTC advances business day; rolling90-day lower bound and reversed/future dates rejected | Test uses explicit business clock inputs; runtime picker checks separate |
| Shared failures | session/permission/missing resource/network remain distinct; domain code wins over incidental HTTP status | Numeric status and exact domain code contract; no real server roles |
| Putaway | approved tray/BOX/order/confirmation identities and typed history query/forbidden surface retained | Fixture/memory evidence, separate from actual route browser tests |
| S21 operational binding | units, catalog identity, pinned exports, midnight boundaries, incomplete proof/FK, coherent retries/reset/export fencing | Explicit in-memory MOCK business persistence; no production mutation |

## Source and API boundaries

`src/features/S16/approved/adapter.ts` defines the opt-in approved inventory workspace's read-only fixture model:9 SKUs,9 DRV BOXes,9 saved results. It provides static scenario outcomes and an optional `retry():Promise<Scenario>`. It has no backend stock read, count write, reservation write, real saved-result read, source revision, or role contract. `src/app/App.tsx` opts in only when the existing browser-preview gate and `?inventoryDesign=20261029` are present; normal S16 remains the operational inventory route.

`src/contracts/inventory-reconciliation.ts` independently identifies its older model as a fixture frontend contract, not a backend DTO. The approved workspace and operational stock/event repository must not be treated as one authoritative stock source.

`src/preview-mode.ts` explicitly sets `IS_BROWSER_PREVIEW=true` and describes this dedicated candidate as browser-local synthetic Demo only. `api-client.ts` supports a configurable API base URL in the generic client, but that option does not establish a real backend binding for this candidate or approved adapter. No environment configuration supplying a real backend was found in the checkout's root configuration discovery.

`projection.ts` scopes by exact warehouse/location and preserves unknown counts. `navigation.ts` serializes accepted UI context at version1 and validates restored dates through the shared business policy. These are frontend guarantees. Neither module proves API authorization, consistency across concurrent backend writes, or server snapshot immutability.

The S21 and putaway changes consume `readFailureKind` through existing shared `PageState`. The new S21 component harness intentionally supplies actual report adapters with bounded injected failures; it disables the operational reader through its existing `available:false` dependency. Component tests cannot certify protected application navigation or production access control.

## Acceptance blockers and claim limits

- **REAL_API: BLOCKED.** Required inventory/count/reservation/saved-result DTOs, endpoints, authoritative quantities/units/completeness, source versions and role matrix have not been supplied or discovered. No real API suite or production mutation was attempted.
- **Backend RBAC/session expiry/snapshots: BLOCKED.** A normal synthetic MOCK login,403 illustration, immutable JavaScript object, or simulated clock expiry cannot certify server roles, real session invalidation or immutable database history.
- **A11y scope:** browser checks cover semantic roles, focus/keyboard/date entry and selected contrast. A complete automated WCAG audit is not inferred from them.
- **Runtime model identity: NOT_VERIFIED.** The worker cannot inspect model/effort telemetry. A requested label alone is not execution evidence.

No reference image, fixture value, business assertion or production record was changed by this independent QA worker. The original broad browser file remains unchanged. A separately named current-interaction copy adapts native date-input operations to the implemented shared DatePicker; both original execution results and current-interaction results must be reported with their actual outcomes.
