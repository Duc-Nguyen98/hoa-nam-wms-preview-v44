# Visual Defect Register — HN-PTW-26REF-001

| ID | Severity | Reference(s) | Evidence | Finding | Status |
|---|---|---|---|---|---|
| V-PTW-001 | P1 | REF-03, REF-09 | `BEFORE_MANIFEST.json`; `after/AFTER_MANIFEST.json` | S11 baseline returned INCOMPLETE_POPULATION because approved seed links were incomplete. After the seed repair, fresh S11 list/detail render TRAY-001…009 in both viewports. | FIX VERIFIED; historical BEFORE BLOCKED |
| V-PTW-002 | P1 | REF-08 | `REF-10_*\.png` plus runtime controls | Draft confirm editor disables submit until a destination tray is selected; the supplied blank-tray validation state cannot be reproduced without a fixture or approved flow. | BLOCKED / fixture gap |
| V-PTW-003 | P1 | REF-11 | `BEFORE_MANIFEST.json` notes | No stale-version trigger is exposed in the runtime, so the stale-data reference is not runnable. | BLOCKED / fixture gap |
| V-PTW-004 | P1 | REF-12 | `BEFORE_MANIFEST.json` notes | No no-tray/empty-tray fixture is exposed; seeded trays are always available. | BLOCKED / fixture gap |
| V-PTW-005 | P1 | REF-13 | `BEFORE_MANIFEST.json` notes | Forbidden history cannot be exercised because the preview session has read access and no RBAC override fixture is available. | BLOCKED / permission fixture |
| V-PTW-006 | P2 | REF-01 | `before/REF-01_Desktop.png` | Queue row rhythm is taller than the supplied reference; only seven rows are visible in 941px and the footer is below the fold. Runtime fixture also inserts `PUBLIC-DEMO-BOX-0009` ahead of the reference rows. | OPEN visual/data gap |
| V-PTW-007 | P2 | REF-02 | `before/REF-02_Desktop.png` | Orders table is clipped below the 941px viewport and uses preview identifiers (`PUBLIC-DEMO-*`, `PREVIEW-TRAY-*`) absent from the reference. | OPEN visual/data gap |

The register contains reproducibility blockers observed during discovery. No source files were changed.

## Current DEV HEAD retest

Retested on `6ea167125643d10d6545b28df452511af54c6f09` plus the uncommitted seed repair with the same local preview matrix. REF-01/02 remain FAIL for density and fixture-content gaps; REF-03/04/05/06/07/09/10 are reachable in the combined evidence. REF-08/11/12/13 remain BLOCKED with no synthetic PASS. Visual QA did not modify source files.

## AFTER retest resolution

- FQ-PTW-001 visual reachability is resolved on current HEAD: S11 list and detail rendered in both viewports from a fresh browser context. See `visual/after/AFTER_MANIFEST.json` (`REF-03`, `REF-09`) and the AFTER screenshots.
- Impacted S14 order and history states also rendered without console, failed-request, or horizontal-overflow regressions (`REF-02`, `REF-04`, `REF-07`).
- The previous REF-03/REF-09 BLOCKED entries remain historical BEFORE results; current AFTER evidence is recorded separately and does not rewrite the original baseline.
