# Reference custody — HN-INVENTORY-32REF-001

Owner: S00#6 Design Guardian · Registered: 2026-10-29 (Asia/Bangkok)  
Branch/base: `DEV` / `57b9f399a55d41d43ecad7a31e1b279da2cda717`  
Scope: this design folder only; no application, shared shell, token or deployment changes.

## Custody result

**PASS for reference integrity only:** all 32 extracted PNGs match supplied MANIFEST.csv SHA-256, dimensions and size. Exactly 16 Desktop + 16 Tablet files are present. This is not product/visual/API acceptance. Machine-readable results: [REFERENCE_VALIDATION.json](REFERENCE_VALIDATION.json).

Input root: `C:\Users\Admin\Desktop\HoaNam_TonKho_DoiSoat_32_Anh_DaDuyet_20261029`. Its Desktop/Tablet folders were empty at inspection. The supplied RAR contained all expected originals and was extracted with Windows tar into [references/](references/) without raster transformations. Original archive SHA-256: `7aba32692495b1012128604e451b37cf50e848118a1ed840fb3f24e9005c9ddc`. The supplied prompt is copied alongside extracted README/index/manifest.

| Input | SHA-256 |
|---|---|
| PROMPT_S00-1.md | `23de30dd078d56fcd6d3c4546c9f2a1c4c917660d29cb7df686b02a2ebfced9c` |
| README.md | `af2a333b1565ca9da3d5e649ec22180b1d01fe3779834f77404360d932f84485` |
| IMAGE_INDEX.md | `1300a4df905edd8f8c67f59a840c075c4164d7de90d45760382ba7832d6380d9` |
| MANIFEST.csv | `b056451dd634ae9d9b6afc49af0fa0faa5e598cc55691a008b86b365cbeb3174` |

## Registered originals

| Ref | File under references/ | Raster pixels | Bytes | SHA-256 | Integrity |
|---|---|---:|---:|---|---|
| INV-01-D | [Desktop/01_Tra_cuu_ton_kho_Desktop.png](references/Desktop/01_Tra_cuu_ton_kho_Desktop.png) | 1672×941 | 1569310 | `9ed899985ca8937794686257312b1d2aa13404ebd4df817de24cba4fb5bac088` | PASS |
| INV-01-T | [Tablet/01_Tra_cuu_ton_kho_Tablet.png](references/Tablet/01_Tra_cuu_ton_kho_Tablet.png) | 1024×1536 | 1429145 | `96af162f1ae4017c6d8f21a54f6282d251782759b807b3d519c480ad1991b84a` | PASS |
| INV-02-D | [Desktop/02_Tong_quan_ton_SKU_Desktop.png](references/Desktop/02_Tong_quan_ton_SKU_Desktop.png) | 1672×941 | 1339975 | `b6a3de41aa4e71f8d56464a0c9c277e50168c0bac59a4fa7772cfdf31e5441cc` | PASS |
| INV-02-T | [Tablet/02_Tong_quan_ton_SKU_Tablet.png](references/Tablet/02_Tong_quan_ton_SKU_Tablet.png) | 1024×1536 | 1347206 | `46596d82ad3054c62d193a13c747b5ea3d03712873a74ac6fe8d53ee55997e53` | PASS |
| INV-03-D | [Desktop/03_Phan_bo_theo_BOX_Desktop.png](references/Desktop/03_Phan_bo_theo_BOX_Desktop.png) | 1672×941 | 1251171 | `8cbbf97238d68d5fbbfb37eb63de34dcf2819a76abf3db8da351533c0c2f215a` | PASS |
| INV-03-T | [Tablet/03_Phan_bo_theo_BOX_Tablet.png](references/Tablet/03_Phan_bo_theo_BOX_Tablet.png) | 992×1586 | 1380748 | `511c2909b7f93e13159df5ab37d76282b561dd157c09d7853e998ccce3bb02d1` | PASS |
| INV-04-D | [Desktop/04_Chi_tiet_BOX_Desktop.png](references/Desktop/04_Chi_tiet_BOX_Desktop.png) | 1672×941 | 1245607 | `5f6c3f066b2a4c1cab280f8f00e329b114b0e259cfb9cd9256ab486e281ae6e0` | PASS |
| INV-04-T | [Tablet/04_Chi_tiet_BOX_Tablet.png](references/Tablet/04_Chi_tiet_BOX_Tablet.png) | 992×1586 | 1150589 | `cd992967108ee75f6b743acd0934c15b944dd46f96846cbd89b07c9f1266c907` | PASS |
| INV-05-D | [Desktop/05_Chi_tiet_khay_Desktop.png](references/Desktop/05_Chi_tiet_khay_Desktop.png) | 1672×941 | 1254317 | `70f8a89a9d2a5c36713f080bba3afca9c2fd70fd13404380892f3f80b825a686` | PASS |
| INV-05-T | [Tablet/05_Chi_tiet_khay_Tablet.png](references/Tablet/05_Chi_tiet_khay_Tablet.png) | 1086×1448 | 1162399 | `cc1aa68e475385eb3efc08ee3e5dfbde3b3b3ca44cae4891bae828a26abd3708` | PASS |
| INV-06-D | [Desktop/06_Lich_su_bien_dong_Desktop.png](references/Desktop/06_Lich_su_bien_dong_Desktop.png) | 1672×941 | 1557217 | `655181441e55e6b5bc4b462662f4023968cec3ced4d49f63e69a36196d2dd7ca` | PASS |
| INV-06-T | [Tablet/06_Lich_su_bien_dong_Tablet.png](references/Tablet/06_Lich_su_bien_dong_Tablet.png) | 993×1584 | 1588181 | `4a898932401e3f428c78282312e86fbf8e35b80f6f8b6d9d2b1ba6d31e355307` | PASS |
| INV-07-D | [Desktop/07_Doi_soat_hien_tai_Desktop.png](references/Desktop/07_Doi_soat_hien_tai_Desktop.png) | 1672×941 | 1408981 | `042c8671e4d46ca28171dc895cda437b7d2efcaa54ef0f3e7437c3e48cfa9849` | PASS |
| INV-07-T | [Tablet/07_Doi_soat_hien_tai_Tablet.png](references/Tablet/07_Doi_soat_hien_tai_Tablet.png) | 1024×1536 | 1523261 | `8bc3b8594ceba10e028777c54dfa5aa566a860e1d27ecf0dbd77780168e5437d` | PASS |
| INV-08-D | [Desktop/08_Chi_tiet_chenh_lech_Desktop.png](references/Desktop/08_Chi_tiet_chenh_lech_Desktop.png) | 1672×941 | 1297148 | `2588704f6f06c53b587d4464d22c2a1a09480f29738009ec8b30f71b78fd8e69` | PASS |
| INV-08-T | [Tablet/08_Chi_tiet_chenh_lech_Tablet.png](references/Tablet/08_Chi_tiet_chenh_lech_Tablet.png) | 992×1586 | 1352748 | `2f7520fb2c990da5a690aac3534c9ddd6de8e5e16ef25eb18c1d57383e6f0ef8` | PASS |
| INV-09-D | [Desktop/09_Lich_su_doi_soat_Desktop.png](references/Desktop/09_Lich_su_doi_soat_Desktop.png) | 1672×941 | 1607840 | `7b410e96bb35bf98ffb85cf1894c89884713445601a6fe82f328884a68b21b6c` | PASS |
| INV-09-T | [Tablet/09_Lich_su_doi_soat_Tablet.png](references/Tablet/09_Lich_su_doi_soat_Tablet.png) | 993×1584 | 1345161 | `902cac4f4c2811753f2e6dd8b23084cf35ff814c093abfc1be46059b7ff22ea9` | PASS |
| INV-10-D | [Desktop/10_Chi_tiet_lich_su_doi_soat_Desktop.png](references/Desktop/10_Chi_tiet_lich_su_doi_soat_Desktop.png) | 1672×941 | 1632239 | `308ac0633b92d3b44d7cc7ec2a8ed78d096c7c31413f15c2efa11eae36534d14` | PASS |
| INV-10-T | [Tablet/10_Chi_tiet_lich_su_doi_soat_Tablet.png](references/Tablet/10_Chi_tiet_lich_su_doi_soat_Tablet.png) | 992×1586 | 1486736 | `dc6cedbb600275c6c23644b1db988934ee09045c2b8b4d4c3fd68963bc24a6e7` | PASS |
| INV-11-D | [Desktop/11_Loading_Desktop.png](references/Desktop/11_Loading_Desktop.png) | 1672×941 | 1222290 | `a01885e6a490ffe36a79c107811f94e967a725515d49d71558224dc189e5f1ca` | PASS |
| INV-11-T | [Tablet/11_Loading_Tablet.png](references/Tablet/11_Loading_Tablet.png) | 1086×1448 | 1092826 | `0534058b2270b624831eac4a4a1c51070e9925d2cc29925c3fdfb1cd133aed9e` | PASS |
| INV-12-D | [Desktop/12_Empty_Desktop.png](references/Desktop/12_Empty_Desktop.png) | 1672×941 | 1196348 | `9114106994af5193b09ef18a3762098b0677fe3d46be13b5c1e3f3928b1869ce` | PASS |
| INV-12-T | [Tablet/12_Empty_Tablet.png](references/Tablet/12_Empty_Tablet.png) | 992×1586 | 1086158 | `67ec5b58dce86b5adf3b67e525e549d274b12f941f14f181a9d0c8c292d188b9` | PASS |
| INV-13-D | [Desktop/13_No_result_Desktop.png](references/Desktop/13_No_result_Desktop.png) | 1672×941 | 1210238 | `973bdf6309f7d0558f9a395e3020ef70787e433daa8ea738817501f2eaf37141` | PASS |
| INV-13-T | [Tablet/13_No_result_Tablet.png](references/Tablet/13_No_result_Tablet.png) | 992×1586 | 1385442 | `c8a97f64157ce09f298634398ca3c55ea32f81ab6974b29ba901c38b1d16b2c1` | PASS |
| INV-14-D | [Desktop/14_Load_error_Desktop.png](references/Desktop/14_Load_error_Desktop.png) | 1672×941 | 1198497 | `ccf101912100acb5a592cc1c39ed874a57671aa86e850c8b078a4ed065350d47` | PASS |
| INV-14-T | [Tablet/14_Load_error_Tablet.png](references/Tablet/14_Load_error_Tablet.png) | 992×1586 | 1070402 | `c1c747aa7e9fb6896e9d17812d42e5452be9771d659c535aa07b5a6e911f499d` | PASS |
| INV-15-D | [Desktop/15_Forbidden_Desktop.png](references/Desktop/15_Forbidden_Desktop.png) | 1672×941 | 1531657 | `804e8d61bbd15b010a88ef7e161a6aab01f0b309b591d6049beb64b271ad2d3b` | PASS |
| INV-15-T | [Tablet/15_Forbidden_Tablet.png](references/Tablet/15_Forbidden_Tablet.png) | 992×1586 | 1448217 | `98fca41f08739e2bd2b797dc96508e2c6928f10a5fbe5cbe6bc2eda7732b8ed2` | PASS |
| INV-16-D | [Desktop/16_Not_found_Desktop.png](references/Desktop/16_Not_found_Desktop.png) | 1672×941 | 1226125 | `b7153260f9cabd37d07ab9cce808f8eef4f660bcf7d6f2b65032f04aa7e1c7aa` | PASS |
| INV-16-T | [Tablet/16_Not_found_Tablet.png](references/Tablet/16_Not_found_Tablet.png) | 992×1586 | 1003703 | `54a05fd43f2d5942ce9a37ccf206d853eeab37086b7a605f0108841e43b14a96` | PASS |

## Inspection and profiles

All 32 originals were viewed through eight labeled [contact sheets](contact-sheets/), two design indices per sheet, with both Desktop and Tablet visible. Original 08 Desktop and 15 Tablet were additionally opened at original resolution to inspect reconciliation warnings and forbidden semantics. Sheets are documented analysis derivatives, not replacement originals or runtime screenshots: Desktop resized to 836×471, Tablet to 400px width preserving aspect ratio, white canvas 2472×700; no original was changed.

The 01–16 prefixes are design indices, not route or S identifiers. Desktop originals are all 1672×941; Tablet originals vary across 1024×1536, 992×1586, 1086×1448 and 993×1584. Source pixels never establish CSS viewport or DPR. User target runtime profiles are Desktop 1920×1080 CSS/DPR1, Tablet 800×1280 CSS/DPR2 and supported 768×1024; S00#3 must declare transforms and retain all failing content.

## Authority and rules checked

Read PROMPT_S00-1.md, README.md, IMAGE_INDEX.md and MANIFEST.csv. Checked governing E:\WMS_HoaNam\Scanner_CMS\AGENTS.md and repository AGENTS.md; repository search found no further nested AGENTS outside dependencies. Latest approved final32 replaces intermediate ds01–ds11 for this module. Locked shell/logo/Toast are preserved; their artwork variations are excluded from module authority.
