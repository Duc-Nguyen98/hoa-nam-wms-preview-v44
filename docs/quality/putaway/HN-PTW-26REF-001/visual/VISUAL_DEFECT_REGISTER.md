# Visual Defect Register — HN-PTW-26REF-001

| ID | Severity | Reference(s) | Evidence | Finding | Status |
|---|---|---|---|---|---|
| V-PTW-001 | P1 | REF-03, REF-09 | `BEFORE_MANIFEST.json` S11 records | S11 runtime preview reports INCOMPLETE_POPULATION and does not expose the accepted source needed for tray list/detail capture. | BLOCKED / environment fixture |
| V-PTW-002 | P1 | REF-08 | `REF-10_*\.png` plus runtime controls | Draft confirm editor disables submit until a destination tray is selected; the supplied blank-tray validation state cannot be reproduced without a fixture or approved flow. | BLOCKED / fixture gap |
| V-PTW-003 | P1 | REF-11 | `BEFORE_MANIFEST.json` notes | No stale-version trigger is exposed in the runtime, so the stale-data reference is not runnable. | BLOCKED / fixture gap |
| V-PTW-004 | P1 | REF-12 | `BEFORE_MANIFEST.json` notes | No no-tray/empty-tray fixture is exposed; seeded trays are always available. | BLOCKED / fixture gap |
| V-PTW-005 | P1 | REF-13 | `BEFORE_MANIFEST.json` notes | Forbidden history cannot be exercised because the preview session has read access and no RBAC override fixture is available. | BLOCKED / permission fixture |
| V-PTW-006 | P2 | REF-01 | `before/REF-01_Desktop.png` | Queue row rhythm is taller than the supplied reference; only seven rows are visible in 941px and the footer is below the fold. Runtime fixture also inserts `PUBLIC-DEMO-BOX-0009` ahead of the reference rows. | OPEN visual/data gap |
| V-PTW-007 | P2 | REF-02 | `before/REF-02_Desktop.png` | Orders table is clipped below the 941px viewport and uses preview identifiers (`PUBLIC-DEMO-*`, `PREVIEW-TRAY-*`) absent from the reference. | OPEN visual/data gap |

The register contains reproducibility blockers observed during discovery. No source files were changed.
