# Base functional defect receipts

Task HN-S27-UIUX-005; S00#4; tested 2026-10-27; DEV `bde0e4292ae4a7db569c7a5d56bce0c7ffa8e703`; `http://127.0.0.1:5287`. Browser Chromium/Playwright; Windows. All data below is browser-local **MOCK**. Production backend **NOT_CONNECTED**.

## S27-F002 — P1 — valid approved seed subevents make operational list unreadable

Status CONFIRMED on base. Normal login → S08 confirm → Continue (allow full browser-local demo initialization) → S27 → DatePicker from/to 26/10/2026 → Apply. Expected: complete accepted source audit rows can be listed and exact event details opened. Actual: `INCOMPLETE_AUDIT_RELATIONSHIP`; integrity error; no row openers. Reproduced independently by Visual QA.

Actual fresh source has 62 audit rows, with 18 approved seed subaudits affected. `audit:approved:BOX-0001` is an example; its canonical audit contains one stock ID, `stock-event:approved:BOX-0001`. Its shared batch proof contains 27 stock events. Each affected row passes traced actor/command/time/entity/version/FK/audit-membership checks; whole-proof event-array equality alone fails. The other affected IDs are BOX-0002..0008, HN-BOX-0009, BOX-0011..0019.

Source: `operational-policy.ts:118` creates an audit per putaway with its own event; `business-atomic.ts:53` aggregates stock events for the shared commit. `audit-operational-binding.ts:30` assumes every audit must list the entire commit event population. The current complete-source canonical audit validation already protects immutable audit content. Fix acceptance: accept valid same-commit subevent relationships without broadening each audit's IDs; retain canonical/source/actor/version/FK validation; reject tampered, duplicate, missing or foreign event relationships; normal 26 October route lists all accepted rows and opens exact details.

Raw receipt: `actual-route/results.json` (`source.rows`, `source.invalid`, unique `source.proofs`), `actual-route/source-integrity-error.png`. No IDs were copied from reference artwork.

## S27-F001 — P2 — preview initial period is stale relative to its source clock

Status CONFIRMED on base. Fresh login and S27 initial UI shows `25/10/2026 – 25/10/2026`, count 0, openers 0. Browser runtime commits demo data at `2026-10-26T07:24:00Z`; real initial raw source has 62 rows on 26 October. `OperationalAudit.tsx:40` hardcodes 25 October while `browser-runtime.ts:14` uses 26 October. This is a preview initialization mismatch. An explicitly chosen 25 October empty period is legitimate and must remain a truthful empty state. F001 does not imply every zero-result list is defective. Fix acceptance: initial period uses the authorized preview business clock or explicit supplied scenario date; choosing an empty date remains empty. F002 must also be fixed to render 26 October rows.

## S27-F003 — P2 — desktop original-ID copy controls below shared target height

Status CONFIRMED on base. At 1672 CSS px desktop width all four modal copy buttons measure 44×36 CSS px. At 800 touch width each is 44×44. Shared contract lists confirmed 44px control targets; no explicit S27 desktop exception supplied. Scoped `.s27-detail-trace__value > .hn-button` height override is the source. Acceptance: four copy controls at least 44×44 CSS px in desktop/tablet while full raw ID remains selectable/copyable. Evidence `targets.json`; Visual QA independently reported same measurement.

## Gaps, not automatically feature defects

- Module mapping is absent from the operational contract; filter is deliberately disabled with accessible explanatory text. Filtering by module is BLOCKED_CONTRACT_GAP until an approved mapping exists.
- Reference artwork's three events/IDs are not the fresh normal source. Actual normal setup creates 62 rows with generated UUIDs. Synthetic test fixture has its own three source records and is explicitly QA-only.
- Older checked-in browser scripts target removed `.s27-no-result`, `.s27-read-state`, alert-only forbidden state and tablet sort dropdown. These script failures are stale automation assumptions, not confirmed product failures. Functional evidence script adapts selectors without runtime changes; old failure receipts remain.
