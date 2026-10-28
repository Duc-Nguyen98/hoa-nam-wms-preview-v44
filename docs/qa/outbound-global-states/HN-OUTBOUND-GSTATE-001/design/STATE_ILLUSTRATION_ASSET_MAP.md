# State illustration asset map — HN-OUTBOUND-GSTATE-001

REF-06 is one visual specification sheet containing six alternatives. It is not a six-panel runtime screenshot. Each panel maps to one `PageState` kind and one S15 branch.

| Panel position | Visual label | Runtime `PageState` | S15 source branch | Icon/tone intent | CTA |
|---|---|---|---|---|---|
| Top-left | `Chưa có phiếu` | `empty` | `snapshot && !filtered.length && !search && !status` | Document, neutral | `Đọc lại dữ liệu` |
| Top-middle | `Không có kết quả` | `no-results` | `snapshot && !filtered.length && (search || status)` | Search, neutral | `Xóa bộ lọc` |
| Top-right | `Lỗi tải dữ liệu` | `error` | `!snapshot`, non-auth/non-forbidden/non-reconcile error | Alert, error | `Thử lại` |
| Bottom-left | `Đang tải` | `loading` | `!snapshot && (state.busy || !state.error)` | Skeleton/neutral | None while busy |
| Bottom-middle | `Không có quyền` | `forbidden` | `state.error === FORBIDDEN` or `MOCK_COMMAND_FORBIDDEN` | Lock, warning | `Tổng quan`/close in detail |
| Bottom-right | `Không tìm thấy phiếu` | `record-not-found` | Selected row absent from current valid snapshot | Document + search, neutral | `Quay lại danh sách` |

### Detail and recovery variants

`GlobalModal` detail uses the same `PageState` vocabulary for missing row, loading, forbidden and error. `stale` is a recovery-specific warning and is not represented by an additional REF-06 panel; map it to the shared warning treatment and the exact reconcile copy in `outbound-feedback.ts`. `unauthorized` is likewise a shared auth treatment and must not be collapsed into forbidden.

### Asset and icon custody

REF-06 remains immutable at `references/REF-06_Global_State_Visual_Kit.png` (SHA-256 in `REFERENCE_MANIFEST.md`). The sheet's document/search/alert/lock/not-found icons express semantic intent; implementation uses the canonical `Icon` registry and accessible labels, not copied raster icons. S00#3 must compare geometry and tone at a declared profile; S00#4 verifies accessible names and keyboard actions.
