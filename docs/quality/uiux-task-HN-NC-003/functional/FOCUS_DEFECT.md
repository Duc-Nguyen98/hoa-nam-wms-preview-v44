# FQ-NC-003-A11Y-03 — Hidden toast origin strands keyboard focus

Owner: S00#4 independent QA. Severity: **P2**. Status: **FIXED + independent RETEST PASS**. Environment: LOCAL authenticated Preview mock, no production activity.

## Reproduction evidence

Executed 2026-10-27 on `e5ba486fb82a05fcf6cb7aa7b56fda17dc4bcb16`, runtime source tree `145bdf19c61a908b5d4d7779b7b4401e8d2d2f8b`; start/end identical and working runtime diff empty.

1. Normal S07 demo login → S08 confirmation → setup → S01.
2. Open Notification Center through the real bell; mark all as read.
3. Escape closes the dialog and correctly returns focus to bell.
4. Focus the actual toast's close button and press Enter.
5. Toast dismisses; focus moves to **BODY**, despite visible `#main-content` with `tabIndex=-1` being available.

Recorded hidden origin remains `isConnected=true` with `getClientRects().length=0`; its dialog is closed. `restoreToastFocus` currently checks connection alone then attempts to focus that hidden origin, preventing the safe fallback. Source interpretation supports the actual browser failure; it is not the only evidence.

Test `F-NC-003-TOAST-FOCUS` ran **1/1 FAIL** in32.1s. Console/page/network failure listeners recorded0 errors. See `focus-before/focus-repro.json`, `focus-before/browser-results.json`, before/after screenshots and retained trace; command log `focus-before-command.log`.

Expected: after a focused toast close control is removed, focus returns to a visible, focusable live target. Existing provider fallback `#main-content` is the asserted safe target when the original control is hidden in a closed modal. This changes no business operation or design baseline.

S00#1 was sent this verified failure before authorizing a focus fix. S00#4 made no runtime change and paused final matrix until committed owner fix.

## Independent final retest

The unchanged focused test executed on `76059cce616543356c623ec248c6350ddd07cdf5` and PASS in31.3s. The original mark-all origin still correctly records connected=true/rects0 after dialog closure, but keyboard Enter on focused toast close now returns to **MAIN#main-content**, not BODY. Start/end source custody is identical and clean; errors0. See `focus-final/focus-repro.json`, screenshots, browser-results.json and command log. Shared Desktop/Tablet Light/Dark tests also exercise this path; the first TabletDark environment network failure and unchanged retry are retained separately. Owner fix is commit8e40b6a; S00#4 changed no runtime source.
