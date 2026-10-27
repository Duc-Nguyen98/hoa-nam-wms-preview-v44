# S12 scenario and source analysis

HN-S12-UIUX-006 · S00#6 · 2026-10-28 UTC+07

Read-only source audit at SHA `bfec7060cdf422a112ec5e644bf0b51401d9bda2`. No business data, runtime source, shared contract or fixture was changed by this role.

## Route and data source

Canonical route **`#/preview/S12`** is declared in `src/app/registry.ts:15`, mounted through `src/app/App.tsx:170`. `ReceiptsScreen.tsx` initializes cohort `scenario` when `createOperationalWebAdapter(...,{scope:'S12'})` is available; otherwise `legacy`. The current-session path mounts `OperationalReceipts`; the historical path uses receipts-controller / S12 seed and `ReceiptDetail`. They are distinct scenarios.

`src/data/http/operational-preview-adapter.ts` gates availability on its options or `IS_BROWSER_PREVIEW`, and owns command journal scope. `receipt-binding.ts` reads both catalog and operational snapshots, checks epoch/actor, validates command proofs, protects scenario generation/fence/version and preserves unknown-operation recovery. This task's screenshots cannot supersede those mechanisms.

## Where do PN-0012/0011/0010 exist?

| Source | Exact identity/content found | Meaning and limits |
|---|---|---|
| Supplied original16.png and18.png | PN-0012 / An Phát / NCC-1025-01; PN-0011 / Kho trung chuyển / DC-1025-02; PN-0010 / Minh Long / NCC-1025-03; each `Mới tạo`, count0 | Artwork examples; no entity IDs/epoch/actor or API proof. Ref16 additionally contains separate empty illustration |
| `src/data/fixtures/S12.seed.json` | Seven historical rows PN-260910-084 through PN-260907-078; summary84/64/12/8; frontend seed with null endpoint/DTO/permission binding | **PN-0012/11/10 are absent.** Historical P01 visual approval does not make this seed the current operational scenario |
| `src/preview-mock/public-demo-setup.ts:129` onward | Creates PN-0012 PRODUCT, PN-0011 PRODUCT, PN-0010 COMPONENT, PN-0009 COMPONENT with matching sources/references using existing inbound commands | Real public preview setup source; also scans/submits/posts these records so ready-state is4 POSTED receipts with recorded codes. Existing session records are preserved, no reset is implied |
| `src/data/fixtures/S01_SCANNER_PINNED.json` | S01 document numbers PN-0010/0011/0009 and IDs prefixed `p12-stock-...` | S01 fixture/navigation identity, not proof that current S12 operational snapshot contains matching entity IDs. PN-0012 absent in this file |
| `tests/reference-exact/receipts.tsx` | Synthetic snapshot overwrites receipts with3 examples; entity IDs `reference-receipt:0/1/2`, all PRODUCT/DRAFT, version1, no recorded lines | Explicit **synthetic diagnostic harness** at `tests/reference-exact/receipts.html`. Not canonical route, not public session proof. It imports actual component/CSS but supplies an adapter; `execute` throws QA_READ_ONLY and catalog is synthetic |
| `src/features/S12/OperationalReceipts.tsx:40` onward at audit SHA | `REFERENCE_RECEIPT_CODES` PN-0012/11/10; `LIVE_DEMO_RECEIPT_CODES` PN-0009; accepts `PV-PN-` codes; filters render through predicate | Observed artwork-specific runtime filter. Presence in code is not permission to hide other adapter records; flagged for implementation review |

IDs and display codes are different. Actual selected detail must resolve `record.id` from the current adapter snapshot. Never hardcode `reference-receipt:0`, PN-0012 or a S01 fixture ID as a production routing/selection fallback. The public setup's code check does not prove a live browser completed setup; inspect the snapshot in the declared run.

## Eight-state setup requirements

| Group | Scenario values | Safe evidence method |
|---|---|---|
| Populated Desktop/Tablet |3 draft receipts/zero codes in artwork; sources/references as above | Declare deterministic synthetic harness for isolated visual comparison; separately capture canonical route with existing actual dataset and disclose differences. Never relabel public POSTED data as draft |
| Create Desktop/Tablet | Unselected type; source An Phát/reference NCC-1025-01 are already typed in artwork | Open actual create action, enter scenario values via normal input. Treat them as test input, not permanent runtime defaults. No valid save required to capture |
| Validation Desktop/Tablet | Mode/source empty; reference201 NFC characters | Enter declared deterministic string, attempt save, record3 errors/201 counter and no executed write. Do not reconstruct hidden cropped source suffix |
| Detail Desktop/Tablet | Draft/zero-lines example PN-0012; displayed missing type is an artwork inconsistency | Select actual entity by resolved row ID; preserve actual type and eligible actions. Synthetic detail diagnostic may reproduce layout while clearly documenting data differences |
| Actual empty/no-results (additional behavior check) | Actual scenario with zero rows versus filter yielding zero matches | Use an isolated declared scenario or test adapter. Empty gets create-first; no-results gets reset. Never mutate existing public session to manufacture emptiness |

## Constraint and action source

`receipt-header-form.ts` requires PRODUCT or COMPONENT mode, nonempty trimmed/NFC source, optional reference, each at most200 Unicode code points after normalization, no control/newline characters. Update additionally locks receipt identity/type and requires an unscanned draft. `ReceiptHeaderForm.tsx` derives validation errors on attempted submit, associates them with fields and focuses the first invalid field. Displayed counter uses NFC code-point length of the draft; no whitespace boundary behavior is changed here.

`receipt-binding.ts` counts recorded codes from physical IDs plus BOX IDs, not number of line rows. Detail count must not be hardcoded0 or inferred from artwork; empty recorded-code panel is truthful only with no recorded lines. Post action requires SUBMITTED status and current App submission proof; draft/zero-code artwork never authorizes posting.

Existing detail can offer header edit for a zero-code DRAFT. Current public setup records are POSTED and have different eligibility. Capture metadata must explain state/action differences rather than changing business rules to match an incomplete artwork footer.

## Evidence classification

- **Original source:** byte-identical15–22 PNGs, immutable, hashes in manifest.
- **Synthetic diagnostic:** harness with controlled adapter/IDs; supports component layout diagnosis only.
- **Actual canonical-route evidence:** browser capture of `#/preview/S12`, declared build/SHA, profile, local storage/session and snapshot identity.
- **Derived comparison:** crop/scale/diff with explicit transform; original and full actual retained.

No synthetic capture is relabeled as the original or as proof of public-route/API/RBAC acceptance. No scenario mutation was performed in this audit.
