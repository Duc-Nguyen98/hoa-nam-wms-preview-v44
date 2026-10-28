# HN-WARRANTY-PARTS-UIUX-001 reference manifest

Owner: S00#6 Design Guardian  
Branch: `DEV`  
Checkout: `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
Audit base: `93371f4da9b6659d320a7c66d9b0862f89744a0d`  
Registered: 2026-10-28 (Asia/Bangkok)  
Status: `APPROVED_SCOPED_INPUT`; this manifest registers custody and interpretation. It is not a visual PASS.

## Custody and hashing

The originals are the immutable inputs at `C:\Users\Admin\Desktop\HN_Astra\bh-01.png` through `bh-14.png`. A byte-preserving copy is present under [`references/`](./references/). SHA-256 was calculated independently for each original and custody copy; every pair matched. No resize, crop, recompression, or metadata rewrite was used.

| Ref | Original | Custody copy | Raster | Bytes | SHA-256 (original = custody) |
|---|---|---|---:|---:|---|
| BH-01 | `C:\Users\Admin\Desktop\HN_Astra\bh-01.png` | `references/bh-01.png` | 1672×941 | 1,417,432 | `adb4ff4c719f1dbb2fd017e528dd2db4d4694d1a3950cc5216ba633fa15c8bcc` |
| BH-02 | `C:\Users\Admin\Desktop\HN_Astra\bh-02.png` | `references/bh-02.png` | 1672×941 | 1,382,237 | `1f59dc758e50ff120b0fbcebebc576aa64ac61ab8368d2bef4b4c9a9a24e7127` |
| BH-03 | `C:\Users\Admin\Desktop\HN_Astra\bh-03.png` | `references/bh-03.png` | 1672×941 | 1,333,613 | `4ad984920c5fc5a0d644d853dac7ad382d89744db3d5f3edb8b2cf4e4acf2099` |
| BH-04 | `C:\Users\Admin\Desktop\HN_Astra\bh-04.png` | `references/bh-04.png` | 1672×941 | 1,383,036 | `bca2448647114d8997e284485aa8afcc854a913f33876fe0821a46b64caf4b5e` |
| BH-05 | `C:\Users\Admin\Desktop\HN_Astra\bh-05.png` | `references/bh-05.png` | 992×1586 | 1,283,599 | `48f6387c5cdd3821f1187b46dc0bd0116c7935a9356afe0372935bac77abdafe` |
| BH-06 | `C:\Users\Admin\Desktop\HN_Astra\bh-06.png` | `references/bh-06.png` | 1672×941 | 1,325,332 | `5f701422defb77ccde3a3cc262af3ab47b3f64e86efcb2365579f0ce45cfd55f` |
| BH-07 | `C:\Users\Admin\Desktop\HN_Astra\bh-07.png` | `references/bh-07.png` | 992×1586 | 1,253,640 | `7133cf5d8dcad257cbad9113870b8e97a205ad1e6392ca16829dc25f088cea3b` |
| BH-08 | `C:\Users\Admin\Desktop\HN_Astra\bh-08.png` | `references/bh-08.png` | 992×1586 | 1,222,939 | `72c1f33cda706a255cda7de2beeffc320ff5086b5c0c51ecfc1a8a6f1fc167da` |
| BH-09 | `C:\Users\Admin\Desktop\HN_Astra\bh-09.png` | `references/bh-09.png` | 992×1586 | 1,235,894 | `b0e31157d380d45fe8dd9c948018f2b0c0b62f4d99807688f437955681953ebb` |
| BH-10 | `C:\Users\Admin\Desktop\HN_Astra\bh-10.png` | `references/bh-10.png` | 1672×941 | 1,520,103 | `d1514378b6579d722f2e16d012dafe029c7021aaee1b4effef6ede9edd89f5d3` |
| BH-11 | `C:\Users\Admin\Desktop\HN_Astra\bh-11.png` | `references/bh-11.png` | 992×1586 | 1,232,904 | `0b0d3016add8e503f3c89e5ed9383dc5b0891ecbbfb46a35f70b79ee16ddd087` |
| BH-12 | `C:\Users\Admin\Desktop\HN_Astra\bh-12.png` | `references/bh-12.png` | 992×1586 | 1,360,812 | `b4414751409518c27cbd0838ff9c1260c31eafdc65887b78c56edf1763699119` |
| BH-13 | `C:\Users\Admin\Desktop\HN_Astra\bh-13.png` | `references/bh-13.png` | 992×1586 | 1,274,101 | `684dff1276c5225cfdd04829df4789b06b5a8722bb2c754f1d1e415967ad18f1` |
| BH-14 | `C:\Users\Admin\Desktop\HN_Astra\bh-14.png` | `references/bh-14.png` | 992×1586 | 1,372,447 | `921a8e5707e5886c0d3098264f34c5b565ac839caa8e76bfff57601a16b94d5e` |

## Interpretation rules

- `1672×941` is treated as the supplied desktop raster and `992×1586` as the supplied portrait/tablet raster. The files do not declare CSS viewport, DPR, browser, zoom, locale, theme, or capture date; those remain `DESIGN_GAP`.
- The blurred shell/backdrop is visible in the images but does not supersede the separately governed shared shell. It is excluded from route/component visual authority unless a later shell decision names these bytes.
- Visible IDs, names, dates, status labels, timeline entries, and component rows are screenshot observations. They do not authorize fixture mutation, new backend fields, joins, permissions, or business transitions.
- BH-12 and BH-14 are different bytes with the same apparent S09 portrait card-list composition; no state marker distinguishes them. They are retained as separate references and mapped as an unresolved S09 tablet-list variant pair.
- BH-06/BH-13 show a sparse S10 slip-detail composition, while BH-10/BH-11 show a richer slip-detail composition with actor/reason/timestamp and a nine-line heading. The source currently has one `PartsSlipDetail` projection and no approved variant/state enum; both are registered, with the variant decision open.

See [`COMPONENT_ROUTE_MAPPING.md`](./COMPONENT_ROUTE_MAPPING.md) for the per-image route and component mapping.




