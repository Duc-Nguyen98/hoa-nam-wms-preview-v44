# S00#4 RBAC Report — HN-OUTBOUND-GSTATE-001 (S15)

Date: 2026-10-28  
Candidate: `DEV` / `002e291f9005ec5e22c45d7f93350af12f9b26ec`  
Environment: browser-local `MOCK` only

## Mock identity and authorization evidence

The approved synthetic login is `demo`; the account displays `Đức Quang`, `Nhân viên kho`, warehouse `Kho Hoa Nam`, actor `preview:ducquang`. The Preview policy lists `warehouse.view` and `warehouse.manage`. These are fixture capabilities, not production grants.

Operational S15 reads and commands are scoped to `OPERATIONAL_ACTOR = preview:ducquang`, confirmed actor state, `operationalEnabled`, and the `WEB` surface. `outbound.receive` and `outbound.post` are defined for the WEB surface; App scan/submit are separate. The QA run intentionally did not execute either command.

## Permission matrix

| Capability / operation | MOCK | STAGING | REAL_API | Evidence / boundary |
|---|---|---|---|---|
| Current-session snapshot read | PASS | NOT_RUN | BLOCKED | `operations/snapshot`, response mode MOCK, complete snapshot/fence. |
| S15 list/search/filter/detail | PASS | NOT_RUN | BLOCKED | UI/client behaviour; no backend grant checked. |
| Legacy `GET outbound-slips` | NOT_RUN | NOT_RUN | BLOCKED | Public source switch hidden; fixture remains partial. |
| `outbound.receive` | NOT_RUN (write avoided) | NOT_RUN | BLOCKED | Static policy checks actor, confirmation, WEB surface and status/proof. |
| `outbound.post` | NOT_RUN (write avoided) | NOT_RUN | BLOCKED | Static policy checks actor, confirmation, WEB surface and status/proof. |
| 401/403 / expired session | NOT_RUN actual route | NOT_RUN | BLOCKED | Synthetic harness renders forbidden, but no actual HTTP denial was injected. |
| Cross-warehouse / least privilege | NOT_RUN | NOT_RUN | BLOCKED | No production tenant/warehouse users or grants available. |
| Backend permission keys | NOT_RUN | NOT_RUN | BLOCKED | `S15.seed.json` `backend_binding.permission_keys` is null. |

## Findings

1. The role label and capabilities demonstrate only the approved Demo policy.
2. Operational command authorization is keyed to the synthetic actor/surface; it is not evidence of backend endpoint, tenant or warehouse authorization.
3. S15 endpoint, DTO and permission mapping are unresolved. The 7-row reference fixture and 84 aggregate are source-bound UI data, not an access grant.
4. No denial, expiry, cross-warehouse or least-privilege scenario was run. These are `NOT_RUN`/`BLOCKED`.

## Gate

MOCK read-path PASS is suitable for local Preview demonstration. Staging/REAL_API RBAC certification requires a named S15 endpoint, DTO/status mapping, permission keys, allowed and denied test users, and 401/403 evidence. Until supplied, S15 RBAC is **BLOCKED**.
