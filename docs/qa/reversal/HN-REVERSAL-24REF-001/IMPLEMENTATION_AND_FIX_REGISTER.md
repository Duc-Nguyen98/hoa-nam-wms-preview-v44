# Implementation and repair register

Task HN-REVERSAL-24REF-001. Application candidate a75ded0c426f8548be2af25e85ed9482b25917ff; build551357b4a3e3ff7448da0ebfc39a0cc5dfbed6263d1ed7cea9b293a512625def. The actual React workspace is an explicit local design candidate, not an image-backed mockup or a live partial-reversal API integration. See ROUTE_API_AND_BUSINESS_BOUNDARY.md for that boundary.

Source changes relative to inventory evidence d9e267cf4765fe5a10ad050fa1a408f5377ca316:

- src/app/App.tsx: opt-in browser-preview adapter/workspace selection; normal authenticated route guard retained.
- src/features/S17/approved/ReversalDesignWorkspace.tsx: all12 view/state compositions, submit/review/status interactions, applied URL context, focus restoration and shared dialogs/DatePicker.
- src/features/S17/approved/adapter.ts: isolated immutable source fixtures, draft/version/payload guards, receipt identity and defensive copies, key-based status recovery, Vietnam posting time and record-specific cancellation metadata.
- src/features/S17/approved/approved.css, copy.ts and presentation.ts: responsive tables/cards, status/projection presentation, local copy and quantity-validity helper.
- src/shared/s00-shell.css and s00-sidebar-tone.css: same existing320px expanded sidebar token moved to common shell scope; workspace derives offset from that token. Sidebar appearance, logo, route registry and permissions unchanged.
- src/features/S09/operational-warranty.css: minmax grid track and local table scroll containment after independently observed content-dependent page overflow. No warranty data or business changes.

| Finding | Actual correction and verification lineage |
|---|---|
| Returned receipt could be mutated by caller | Independent negative unit initially failed; receipt/status/replay now return defensive clones; current guard suite retains that test |
| Applied filters lost through detail/Back/refresh | Applied context and page serialized/restored through URL/history; independent browser reproductions passed |
| Empty adapter list crashed | Safe non-rendered placeholder plus distinct empty/no-results/not-found states; no fake list rows |
| EN/zh fixed copy incomplete | Scoped dictionaries/date/number display; independent bounded list and deep-theme/locale geometry checks |
| New draft could inherit an earlier reference posting time | Current Vietnam clock for new receipts; approved007 fixture time retained explicitly; independent midnight and unknown-status timestamp tests |
| Cancelled001 could show005 cancellation metadata | Metadata is record-specific; unavailable history stays unavailable; independent005/001 browser assertion |
| REF02 showed8 sources and wrong illustrative totals | Isolated fixture now has9 unique sources,010=8,011=12,013=6; QA independently inspected original02 and updated data-dependent arithmetic without weakening guards |
| REV-VQ-001, P1:1440 sidebar covered content | Common320px token/offset repair; all registered routes and compact/drawer representative checks |
| REV-VQ-002, P1: receipt-confirmed success displayed0 instead of−4 | Current record marked posted only after matching receipt; a single confirmed impact value; independent direct and checked-unknown paths |
| REV-VQ-003, P2: Tablet columns initially inaccessible, then generic cards too tall | Three bounded Terra repairs followed by explicit Sol escalation; now mode-specific compact7/8-column tables at600–900, labeled cards below600, one item row per SKU |
| REV-VQ-004, P2: source radios20×44 | Actual input44×44 and independent geometry/keyboard test |
| REV-VQ-005, P2: invalid12+2 projected−14 as usable | Invalid quantity total/projection unavailable; fields/valid second quantity preserved and review blocked |
| Pending-return process/duplicate impact | Read-only four-stage progress, pending request6/received0/available0; no invented future completion/events or new action |
| Crowded item columns/narrow validation text | Sol repair uses mode-specific columns; notes and full-width left-aligned errors outside table, linked by aria-describedby; no extra item rows |

The failed original receipts and all intermediate captures remain available. Current acceptance belongs to independent final reports, not to this implementation list. Missing08 review-event authority and missing live generic partial-reversal contract are open blockers; no audit event, production record or approved baseline was invented to close them.
