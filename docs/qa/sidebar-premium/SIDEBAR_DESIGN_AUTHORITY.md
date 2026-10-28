# Sidebar design authority

## Owner references

| Reference | File | SHA-256 | Image size | Authority |
|---|---|---|---|---|
| SB-REF-01 | `C:\Users\Admin\Desktop\HN_Astra\sb1.png` | `0701B9D9C606BAEDA32B34FB3068C2EF84B448B69E554A80F6DEAE91C4833E69` | 1672×941 | Approved desktop sidebar context |
| SB-REF-02 | `C:\Users\Admin\Desktop\HN_Astra\sb2.png` | `4F9AA7EEA6BE2EB3E8E8D7E7C486E225D7DBAAD5AF3B921B4EBC6349D660F46A` | 1024×1536 | Approved tablet drawer context |

PNG dimensions are recorded as artifact dimensions, not assumed CSS viewport dimensions. Browser QA used CSS viewports 1672×941 and 992×1586.

## Contract mapping

- Surface: flat Hoa Nam navy/blue; no warehouse-photo background in sidebar/drawer.
- Default: readable white/light-blue text and consistent icons.
- Hover: transparent surface, color transition about 150ms, no geometry shift.
- Active: semibold text and small white dot; no cyan rail or raised block.
- Search: `Tìm chức năng…`; normalized Vietnamese search matches diacritics and non-diacritic input.
- Touch/focus: 48px navigation rows in QA CSS, visible focus ring, Escape/backdrop close for drawer, reduced-motion override.
- Menu labels: `Phiếu nhập kho`, `Người dùng & phân quyền`, `Cấu hình hệ thống`.

GlobalShell, business contracts, fixture data, Toast and page-level components remain outside this change.
