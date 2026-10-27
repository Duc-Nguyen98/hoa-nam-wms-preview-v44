# S27 scoped authorization evidence

## Final ebcf0d3

Exact final tested SHA **ebcf0d360e52bf2036c5a3c531563675ebf3580c**; fresh24scoped Node checks PASS, including independent absent/wrong/unconfirmed/expired MOCK authority denials, unavailable service, actor fence and reader safe states. Final six actual800card profiles use normal demo login/S08/Continue, authorized source62 and original exact detail IDs. Runtime difference from d80255b is solely metadata-label CSS wrapping; authority/read/state contracts unchanged. Earlier scoped fault/negative checks transfer by documented exact diff.

**Scoped MOCK only. Production RBAC NOT_RUN; production backend NOT_CONNECTED.** No server role/tenant/direct API/append-only/security acceptance claim. Module filtering remains blocked by absent approved mapping.

## Latest tested d80255b

Exact tested committed SHA **d80255b94a3d6ad37e7c65eb34bb4f075e48deaf**. Fresh24-test run includes scoped reader/service authority checks. Preview normal login/confirmation/source62/profile detail was retested;12actual and12long fixture modal profiles check original clipboard IDs and read-only detail behavior. Authorization/data/detail state logic is byte-identical to cc030be; its scoped negative/fault checks transfer by exact diff. **MOCK only; production RBAC NOT_RUN; production backend NOT_CONNECTED**. Full production role/tenant/direct-API/append-only claims remain unsupported.

## Candidate cc030be

Exact committed tested SHA **cc030be40552845881d0a234a26e1e783f5e6e4f**; fresh independent rerun 2026-10-27. **PASS scoped MOCK checks only**; production RBAC **NOT_RUN**, production backend **NOT_CONNECTED**.

Candidate24 scoped tests include actual local MOCK service denying absent/wrong/unconfirmed/expired actors before repository access, rechecking authority and fence after read, unavailable service denial, reader forbidden/session/confirmation errors, wrong actor/incomplete-source denial and selection scope rollback/revocation checks. Candidate fixture browser flow23 checks confirms forbidden hides protected raw details and retry restores the exact selected event. These are service/reader and injected UI fault tests, not live production role tests.

Normal browser demo login/S08/Continue and actual62-row authorized scope were exercised without persisting authentication state. All62 exact details and post-setup GET-only source reads preserve the same original complete snapshot. Module mapping remains a contract gap, unrelated to a permission PASS. No claim is made about server role matrices, tenant isolation, direct API bypass or production event-storage permissions.

## Historical base audit

2026-10-27; S00#4; tested SHA `bde0e4292ae4a7db569c7a5d56bce0c7ffa8e703`. Environment **MOCK**. Production backend **NOT_CONNECTED**; production RBAC **NOT_RUN**.

| Scope/check | Result | Evidence |
|---|---|---|
| Normal demo login, S08 confirmation, browser-local setup | PASS | actual-route results; no auth state persisted |
| Actual MOCK read service denies null actor, wrong actor, unconfirmed actor, expired actor before repository access | PASS scoped unit | independent-audit.test.ts; base-tests.txt |
| MOCK service rechecks actor after read and invokes authority fence | PASS scoped unit | valid preview actor, two authority reads, fence called |
| Disabled/unavailable MOCK service | PASS scoped unit | COMMAND_UNAVAILABLE before repository access |
| Reader receives FORBIDDEN/UNAUTHENTICATED/SESSION_EXPIRED/CONFIRMATION_REQUIRED | PASS scoped unit | model null, original error retained |
| Wrong actorKey / incomplete source | PASS scoped unit | INCOMPLETE_POPULATION, model null |
| Detail permission/read error hides raw values; retry restores same event | PASS isolated UI | base-flow results; adapter-injected forbidden, not a live production-role test |
| Changed scenario/epoch/generation/revision or revoked scope cannot resolve selected row | PASS scoped unit | existing audit-state tests |
| Production role matrix / direct API bypass / tenant scoping / server append-only | NOT_RUN | no connected production contract/environment |

UI has no mutation controls in S27 detail. Four copy actions copy original values; safe clipboard rejection gives shared toast. These facts do not prove server RBAC. Browser preview entry explicitly says it is not an authorization boundary. Module filter availability is a missing mapping contract, not a user-permission result.
