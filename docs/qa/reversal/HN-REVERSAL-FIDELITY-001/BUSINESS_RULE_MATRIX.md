# Business rule authority matrix

Source `e7b145feb3d8ec4b42bb2ba8fa66bfb5b3d9bf2f`, build `1bebecb3e20357207c7f6eb09c9ed987661c32c553451aeed3fe38a9f8b8b955`; static preview5341 and isolated Vite component harness5340. **Independent local MOCK: PASS, 28 model contracts and one clean full 23-case browser run (22 core plus B23), zero console/page errors.**

[Final acceptance](functional/e7b145f-final/FINAL_ACCEPTANCE.json), [model raw](functional/e7b145f-final/model/results.json), [browser raw](functional/e7b145f-final/browser/results.json), [run report](functional/RUN_REPORT.md).

CONTRACT_CONFIRMED here means a confirmed current local contract; it never approves a generic production partial reversal.

| Rule | Classification | Authority / fresh proof |
|---|---|---|
| Existing whole-unused warranty return | CONTRACT_CONFIRMED legacy | operational-preview contract/reversal-policy requires original WARRANTY issue/events and returnedUnused; separate existing path preserved |
| Generic partial inbound/outbound live DTO | MISSING / BLOCKED | BPD review-ready/screenshots do not approve new commands, schema or stock effects |
| Nine supplied sources, comparison amounts and reference states | INFERRED_FROM_REFERENCE | locked reference fixtures; not live documents; visual QA owns reference custody |
| Draft-only edits / immutable source, type, creation, SKU/unit identity | CONTRACT_CONFIRMED local MOCK | R09 rejects forged/read-only writes; B20 exact selected source/notes |
| Positive finite within document remaining | CONTRACT_CONFIRMED local MOCK | R09 invalid/excess creates no operation; B08/B18 validation/blank lifecycle |
| Remaining counts posted reversals once, excludes unposted drafts/cancellations | CONTRACT_CONFIRMED local MOCK | R05/R08/R09 one receipt/consumption and partial remainder; no actual SKU stock inference |
| Unit precision/scale/rounding and fractional Cái policy | MISSING | local finite/range checks do not establish approved precision |
| Per-line units and unlike-unit groups | CONTRACT_CONFIRMED local presentation | R15/B12 explicit Cái/Mét extension; generic backend unit DTO remains MISSING |
| Actual stock/availability from document arithmetic | MISSING | B09 document-qualified labels; no actual SKU stock reader |
| Pending requested6/received0/available0, cancellation impact0 | INFERRED_FROM_REFERENCE | B10 presentation; no new receive/scan command |
| Original unknown operation/input, never auto-repost | CONTRACT_CONFIRMED local MOCK | R04–R07/B01–B03 journal, zero-dispatch status, immutable original key/input |
| Saved draft/source/query survive navigation | CONTRACT_CONFIRMED local MOCK | B04/B05/B13/B19/B20; no broader reauthentication policy inferred |
| Shared-tab CAS and conflict-safe scratch | CONTRACT_CONFIRMED local MOCK | R08/R11/B06/B07 stale base rejected, one local posting |
| All-record vs filtered/page counts | CONTRACT_CONFIRMED presentation | B09/B19/B22 explicit labels and9/3 pagination |
| Source eligibility/server permissions | MISSING / BLOCKED generic | fixture posted badges do not prove real status or authorization; legacy policy remains separate |
| Backend atomic compensating writes | BLOCKED generic | local journal CAS is not server atomicity; canonical store unchanged |
| Verified server receipt with actor/epoch authority | MISSING / BLOCKED generic | exact local receipt matching R06 is measured; no trusted server identity inferred |
| Session-scope fixture isolation | CONTRACT_CONFIRMED local | R01/R11 mismatch rejection; App current-session keyed remount; display labels are not permissions |
| Normal session expiry | CONTRACT_CONFIRMED local MOCK | B15 login visible/protected module absent; live expiry BLOCKED |
| Cross-actor in-flight generation/re-adoption policy | MISSING / NOT_RUN | no second actor supplied or approved reauthentication policy |
| View08 review-audit event | MISSING | B23 keeps only three known history events; no invented reviewer/time/event |

Before/after application hashes match in both runs; all six model source hashes match browser custody. Every one of the23 browser cases has equal before/after canonical business hashes, compared within each case. Canonical/account contents, cookies, credentials and tokens are not persisted. The28 model contracts use explicit dedicated memory persistence; browser cases use opt-in scoped fixture IndexedDB. Both frozen baseline receipt hashes were rechecked unchanged.

Earlier baseline nine failures, R10 malformed-read failures, R11 stale-scratch proof, source-specific294c9d0 cumulative receipts and the interrupted e7b145f browser progress/failure screenshot remain preserved. The fresh e7b145f-final run uses the same existing assertions in a distinct directory. Interrupted e7b145f B11 recorded a missing-root failure; the fresh full run passes B11 without source/assertion changes. No failed attempt is relabelled or overwritten. Prior294c9d0 report copies are retained in functional/294c9d0-reports/.

Original source audit and classifications are preserved in functional/294c9d0-reports/BUSINESS_RULE_MATRIX.md and functional/PHASE_A_NEGATIVE_AUDIT.md; original baseline frozen source71cfa02/build551357b4 is historical. Current durable rules above supersede those baseline gaps only inside the isolated MOCK boundary.
