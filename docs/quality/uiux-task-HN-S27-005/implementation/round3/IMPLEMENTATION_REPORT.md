# S27 repair round 3 — V10

S00#2; DEV base `d80255b94a3d6ad37e7c65eb34bb4f075e48deaf`. Coordinator released the serialized write lease after independent VQA/FQA closed their base contexts. Actual runtime model telemetry UNVERIFIED. **READY_FOR_INDEPENDENT_QA**, source frozen for root integration; no commit/push.

## Confirmed cause and minimal repair

Independent VQA receipt `visual/v10-range-d80255b/receipt.json` measured the actual800 source label text at122.6406px in its109.7344px grid column, intersecting adjacent object label text by0.90625px. The owning card `dt` rule forced `white-space:nowrap` while tablet typography used16px/24px.

Changed only that existing S27 CSS declaration to `white-space:normal`. Existing column tracks, five metadata fields, font sizes, gap, minimum widths, values, IDs and button targets remain unchanged. Natural label wrapping resolves the defect; no fixed label height, clipping, ellipsis, font reduction or hidden data added. No modal spacing or business logic changes.

The existing actual app cascade script now measures every visible card's label Range fragments at800/992. It asserts five tracks, all five original labels and values,16px font size, containment of each text fragment within its own column and zero adjacent label text overlap. Existing actual source identity, copy-border/44px, modal footer/overflow and responsive description/reload checks remain active.

## Local actual app results

`green-worktree/results.json`: PASS at desktop native1672, tablet native992 and tablet800; stable source/CSS custody and zero page/console errors. Authorized local demo login was supplied only through child environment; no embedded credential/session.

| Profile | Source column | Source text fragments | Adjacent overlap |
|---|---|---|---|
|992|x265.0625–408.3594|one line x265.0625–387.7031|0|
|800|x220.3281–330.0625|line1 x220.3281–307.5938; line2 x220.3281–251.8125|0|

At992 the five-column reference arrangement and one-line labels remain intact. At800 the source label wraps naturally to two lines and every fragment is contained. Two actual profile-create cards were measured per tablet profile, each preserving all five metadata values. Desktop card presentation remains hidden as before. Modal heights stay789/1156/1180 across the diagnostic profiles; all four full original trace IDs, copy targets and reachable footer checks PASS.

## Checks and custody

- `npm run typecheck`: PASS.
- Existing CSS-hook Node command for S27 integrity/state/presentation tests: PASS18/18.
- Actual app `tests/s27/copy-border-cascade.mjs`: PASS3 profiles, including bounded V10 Range assertions at800/992.
- `git diff --check`: PASS; Git emits its existing LF-to-CRLF informational warning for the browser script, with no whitespace error.

Only runtime CSS and existing browser regression script changed. `source-hashes.json` records both exact hashes; `runtime.patch` contains the one-declaration runtime change. Independent final candidate SHA retest, numeric design authority gaps and release gates remain coordinator-owned. Prior round artifacts were preserved unchanged.
