# S12 design gap report

HN-S12-UIUX-006 · S00#6 · 2026-10-28 UTC+07 · Source audit SHA `bfec7060cdf422a112ec5e644bf0b51401d9bda2`

This is a task-local register; global design contracts and prior gap records are unchanged. Source registration is complete. Missing acceptance evidence is not PASS. Prior source observations below must be checked against the implementation candidate before final integration.

| ID | Priority / status | Evidence and impact | Required resolution / owner |
|---|---|---|---|
| S12-DG-01 | P1 / DESIGN_GAP | Original Desktop images are1672×941; Tablet992×1586 except21.png992×1585. None identifies CSS viewport or DPR. Existing tray1920×1080/DPR1 and800×1280/DPR2 are tray-scoped; silently applying them or treating992 as CSS pixels would invent normalization | S00#1/S00#3 explicitly declare capture profiles and transforms; retain raw originals, full actuals and derived comparisons. Pixel-level normalized acceptance BLOCKED until documented |
| S12-DG-02 | P1 / DESIGN_GAP | REF-02 shows populated3 rows plus a separately titled empty illustration. REF-04 has populated cards only. Current OperationalReceipts conditionally renders empty only at zero results | S00#1 records whether separate illustration is requested live or represents alternative state. Preserve truthful operational counts; do not infer that the same list is empty and populated |
| S12-DG-03 | P1 / DESIGN_GAP | Detail REF-03/05 shows type `—`, while ReceiptData and header contract require PRODUCT/COMPONENT; current detail renders actual type | Preserve existing business value; S00#1 records source-data discrepancy. Do not introduce missing type or mutate data just for artwork |
| S12-DG-04 | P1 / DESIGN_GAP | Existing public demo creates PN-0012/11/10/09 then advances inbound scans/posts. It is not the artwork's3 draft/zero-code dataset. Legacy S12.seed has different IDs/summary and is not this route cohort | S00#3/4 declare live scenario before capture; separate deterministic synthetic visual diagnostics from actual route evidence. Never reset existing shared session or patch production to match artwork |
| S12-DG-05 | P1 / observed source defect candidate | At audit SHA OperationalReceipts defines artwork-code allowlists and filters snapshot rows through `isVisibleDemoReceipt`; its create action prefills An Phát/reference. Artwork cannot authorize dropping arbitrary real receipts or defaulting customer business input | Implementation owner/S00#1 review task scope and remove artwork-driven runtime behavior where authorized; QA verify arbitrary generated receipt IDs and create input ownership. No source edited by this role |
| S12-DG-06 | P1 / DESIGN_GAP | Current zero-code DRAFT detail has eligible `Sửa thông tin`; detail artwork footer only refresh/close. Extra action is existing behavior, not an approved visual deletion target | S00#1 defines scenario/action disposition; preserve eligibility and permissions; QA certify allowed actions from source contract |
| S12-DG-07 | P2 / DESIGN_GAP | Full201-character reference is cropped in REF-07/08; visible dates/text differ. Exact original string cannot be recovered | QA stores a declared deterministic201-character NFC-normalized scenario string; compare validation state/hierarchy and record synthetic content. Do not claim reconstructed exact source text |
| S12-DG-08 | P1 / DESIGN_GAP | No S12 task-specific locked numerical layout specification located. Existing receipts.css has overlapping561/800/1100 rules and local typography/colors; code values are observations, not baseline approval | Reuse existing tokens/shared controls; scoped changes require provenance and comparison. Any inferred CSS geometry remains PROVISIONAL/DESIGN_GAP rather than newly CONFIRMED |
| S12-DG-09 | P2 / DESIGN_REFERENCE_MISSING | Supplied eight sources cover VI/light; no dark/EN/ZH artwork | QA exercises existing theme/locale behavior and geometry; report visual reference absence without inventing new approved artwork |
| S12-DG-10 | P1 / NOT_RUN | Fresh actual captures/diffs, route smoke, a11y, console and candidate SHA acceptance are outside this design registration run | S00#3 and S00#4 provide evidence; S00#1 integrates; no visual or functional PASS inferred |

## Protected authority

The existing common contract approves shared44 CSS px targets and identifies shared modal/focus ownership. The screenshot raster does not provide permission to reduce these targets. Shell artwork varies among refs18/19/20; this task leaves shell authority unchanged. No lock or shared baseline has been rewritten to close a gap.

## Handoff status

- Original availability/copy custody: PASS8/8.
- Reference-state/content analysis: complete.
- Exact CSS normalization: DESIGN_GAP.
- Live scenario equivalence: DESIGN_GAP pending declared capture setup.
- Implementation visual/functional acceptance: NOT_RUN by S00#6.

Qualitative S12 content remediation can proceed against the acceptance matrix. A final pixel-match claim must cite the normalization and scenario dispositions above.
