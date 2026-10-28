# Reference manifest — HN-SIDEBAR-NAV-FIDELITY-001

**Owner:** S00#6 Design Guardian  
**Branch:** `DEV`  
**Evidence checkout:** `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`  
**Evidence HEAD:** `ce691861c02ca14f61dcc930751981cb6a18ff24`  
**Scoped source revision:** `a617604dc722f5e34fd528940c865a4fec2db109` (`feat(shell): apply approved premium sidebar`)  
**Registered:** 2026-10-29 (Asia/Bangkok)  
**Disposition:** `APPROVED_SCOPED_INPUT`; custody and interpretation only, not a visual PASS.

## Custody and hashes

The owner-supplied originals are retained at `C:\Users\Admin\Desktop\HN_Astra\sb1.png` and `sb2.png`. This packet records them without copying, resizing, cropping, recompressing or rewriting. A fresh SHA-256 and raster-dimension pass produced the following values:

| Ref | Original | Scope | Raster dimensions | Bytes | SHA-256 |
|---|---|---|---:|---:|---|
| SB1 | `C:\Users\Admin\Desktop\HN_Astra\sb1.png` | Desktop expanded sidebar context; active S10 | 1672×941 | 1,380,643 | `0701b9d9c606baeda32b34fb3068c2ef84b448b69e554a80f6deae91c4833e69` |
| SB2 | `C:\Users\Admin\Desktop\HN_Astra\sb2.png` | Portrait/tablet drawer context; active S10 | 1024×1536 | 1,370,063 | `4f9aa7eea6be2eb3e8e8d7e7c486e225d7dbaad5af3b921b4ebc6349d660f46a` |

Raster dimensions are artifact pixels only. They do not establish CSS viewport, DPR, browser, zoom, pointer mode, locale or theme. Existing local sidebar QA used CSS profiles 1672×941 (desktop) and 992×1586 (tablet); SB2's 1024×1536 artifact therefore requires an explicit profile declaration before exact pixel comparison.

## Evidence lineage

- Prior static authority: [`docs/qa/sidebar-premium/SIDEBAR_DESIGN_AUTHORITY.md`](../../sidebar-premium/SIDEBAR_DESIGN_AUTHORITY.md).
- Prior source/menu map: [`docs/qa/sidebar-premium/MENU_MAPPING.md`](../../sidebar-premium/MENU_MAPPING.md).
- Current scoped source: `src/shared/s00-navigation.ts`, `src/shared/GlobalShell.tsx`, `src/shared/ShellHeader.tsx`, `src/shared/shell-locale.ts`, `src/shared/Icon.tsx` at `a617604`.
- The prior sidebar task's implementation/QA evidence is historical context. It does not resolve the SB1/SB2 icon conflict recorded in the companion report.

No source or baseline bytes were changed by this registration.
