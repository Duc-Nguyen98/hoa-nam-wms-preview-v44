# Visual Gap Report — HN-PTW-26REF-001

Branch `DEV`, base SHA `bca3db9062c9246d1fe780fc9e52110128d40859`, preview `http://127.0.0.1:5291`. Capture matrix: Desktop 1672×941 DPR1 and Tablet 992×1586 DPR1, locale vi-VN, theme light.

Real runtime capture completed for 14/26 reference-device states. See [BEFORE_MANIFEST.json](./BEFORE_MANIFEST.json) and [before](./before/) for evidence.

## Captured states

- REF-01 queue list, REF-02 orders list, REF-04 history list, REF-05 create confirmation, REF-06 create success, REF-07 confirmed order detail, and REF-10 draft confirmation editor: both viewports captured.
- REF-06 was created in browser fixture memory only; no production endpoint was contacted.

## Blocked / not run

- REF-03 and REF-09 (S11 tray list/detail): runtime S11 operational source returned `INCOMPLETE_POPULATION`; the route did not expose the accepted source switch.
- REF-08: blank destination tray leaves the confirm control disabled, so the reference validation state cannot be reached without a fixture mutation.
- REF-11: no stale-version trigger is exposed by the runtime.
- REF-12: no empty/no-tray fixture is exposed; seeded trays are available.
- REF-13: forbidden history requires an RBAC permission fixture; actual preview history is readable.

No visual PASS is inferred for blocked references.

## Additional observed visual gaps

- REF-01 actual queue capture shows a taller table row rhythm and only seven rows within the 941px desktop viewport; the supplied reference fits nine rows plus pagination/footer. The first runtime row is `PUBLIC-DEMO-BOX-0009`, while the reference starts at `BOX-0021`, so fixture ordering/content is visibly different.
- REF-02 actual orders capture likewise clips the table at the viewport bottom and uses preview fixture identifiers (`PUBLIC-DEMO-*`, `PREVIEW-TRAY-*`) that are absent from the supplied reference. These are recorded as visual/data fixture gaps rather than PASS.
