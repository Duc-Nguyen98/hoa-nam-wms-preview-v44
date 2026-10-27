# S27 scenario and component source analysis

Base `bde0e4292ae4a7db569c7a5d56bce0c7ffa8e703`, DEV; read-only source investigation by S00#6. Browser evidence belongs to S00#3/#4.

## Reference scenario, what is actually visible

All four references show25/10/2026,14:24 Vietnam time, actor `preview:ducquang`,3events: two `stock-profiles.create` (WEB), then `scenario.reset-own` (QA), versions `— → 1`. Selected event is the first profile creation. The full IDs below are legible in11/12 and may be recorded as screenshot facts:

| Field | Original visible value |
|---|---|
| Event | `audit:3581228c-660f-4264-a31d-5f037f0d64a5` |
| Entity | `profile:0d3e1cf3-e692-4af5-8c12-988452cb5b80` |
| Command | `3581228c-660f-4264-a31d-5f037f0d64a5` |
| Commit | `commit-snapshot:722c7f59-1731-41b2-8bd2-806781fb98bd` |

First modal has no stock events and no related IDs. The other list identifiers are truncated or background-only; this audit does not reconstruct their full values. `e2f9877d…`, `399982dd…`, `74df4752…`, `c0d52656…` are prefixes only. No synthetic suffixes may be invented.

## Existing browser preview: does it match?

**Source verdict: exact reference scenario NOT ESTABLISHED; default period/clock mismatch CONFIRMED.** Recursive source/test search for the four complete first-event identifier prefixes found no matches. `src/preview-mock/browser-runtime.ts` fixes `businessNow` at2026-10-26T14:24:00+07:00 and uses persisted `:s27-design-v1` business/recovery namespaces. `OperationalAudit.tsx` defaults the preview date period to25Oct2026. `public-demo-setup.ts` issues `crypto.randomUUID()` commands; onboarding can create/reset a scenario and2profiles, plus additional approved tray/transaction setup. Thus semantic action similarity is possible, but fixed date, exactly3events and exact IDs are not proven. Persisted state can vary further. A live capture might find old local state; it must identify that state/hash and cannot establish portable scenario provenance.

Do not rewrite shared browser runtime, time, existing fixtures, IndexedDB or business transactions under this design lease. A deterministic S27 comparison adapter/harness may be proposed through S00#1 and verified by S00#4 using source-consistent relationships. If it cannot recover a full reference snapshot, label it MOCK/semantic scenario, use its real IDs, and mark exact data comparison BLOCKED. Reference facts alone do not supply proof objects or missing IDs.

## Component map and behavior authority

| Source | Responsibility | Visual / semantic distinction |
|---|---|---|
|`SystemAuditScreen.tsx`| Operational/legacy/PV cohort routing, shared shell | `IS_BROWSER_PREVIEW` makes operational adapter available; legacy/PV are alternate data cohorts, not replacements for references9–12. Cohort buttons absent in artwork; any removal/hiding needs context analysis. |
|`OperationalAudit.tsx`| Header/date/reload, filter toolbar,7column table, tablet cards, pagination, detail selection | Matches reference information architecture; actual geometry awaits browser measurement. Module filter explicitly disabled because module mapping is unavailable. Artwork cannot authorize fabricated module data. |
|`audit-operational-binding.ts`| Immutable audit projection and related commit proof; date validation, query/search/sort/filter/page | `pinOperationalReports` and commit relationship checks are business/source authority. Default time descending/page1/10; action+actor filters; sort whole results then paginate. No module field supplied. |
|`OperationalDetail.tsx`| Selected immutable identity, information, stock/related,4trace IDs, copy, refresh/close | `eligibleRow` only when open/ready/no error; copy uses raw value; revision/scenario/generation pinning prevents silently swapping selected event. Source semantics must survive any layout repair. |
|`system-audit.css`| Feature presentation and media/container rules | Existing values are observed implementation, including comments saying approved; comments do not confer approval. Source uses1120container and1100viewport conditions. They are technical reflow choices. |
|`GlobalModal.tsx`, shared controls/table/pagination/date picker| Shared focus/dialog/control mechanics | Protected outside S27 lease. Inherited semantics and44px target retained. |

Desktop modal event fields are authored in alternating order `[time,previous,actor,new,source]` for2column flow. Tablet CSS reorders previous toleft row2,actor toright row1,new toright row2, hides duplicate source field and exposes identity source label. Related cards stack at tablet range. Existing source already attempts these structures; do not report their mere presence as a rendered PASS.

Search covers event/entity/command/commit/actor/action/source/stock/related identifiers; action and actor filter together. Reader rejects incomplete relationship proof. Selection closes on query/period changes, remains pinned for permitted refresh, and invalidates on scope changes. Loading, error, forbidden, unavailable and record-not-found are source-backed distinct states. Raster references only approve ready VI/light content, not exact geometry for those additional states, EN/zh-CN or dark.
