import { resolveCanonicalPreviewSelection } from './canonical-preview-route';
import { resolveOverviewDocumentSelection } from './overview-document-route';
/** Local preview hashes only. These do not define business routes or API endpoints. */
export const screenRegistry = [
  { key: 'S01', label: 'Tổng quan vận hành', href: '#/preview/S01', revision: 'DEFAULT_2026-10-08' },
  { key: 'S02', label: 'Danh mục bệnh/lỗi', href: '#/preview/S02', revision: 'P01_REVIEW_2026-10-08' },
  { key: 'S03', label: 'Danh mục sản phẩm', href: '#/preview/S03', revision: 'P01_REVIEW_2026-10-08' },
  { key: 'S04', label: 'Danh mục SKU', href: '#/preview/S04', revision: 'P01_REVIEW_2026-10-08' },
  { key: 'S05', label: 'Danh mục đại lý & nơi nhận', href: '#/preview/S05', revision: 'P01_r02' },
  { key: 'S06', label: 'Quản lý sản phẩm PV', href: '#/preview/S06', revision: 'P01_r02_2026-10-09' },
  { key: 'S09', label: 'Quản lý hồ sơ bảo hành', href: '#/preview/S09', revision: 'PREMIUM_WAVE3_2026-10-17' },
  { key: 'S10', label: 'Quản lý phiếu xuất linh kiện', href: '#/preview/S10', revision: 'PREMIUM_WAVE3_2026-10-17' },
  { key: 'S11', label: 'Danh sách khay', href: '#/preview/S11', revision: 'PREMIUM_WAVE4_2026-10-18' },
  { key: 'S12', label: 'Danh sách phiếu nhập', href: '#/preview/S12', revision: 'PREMIUM_WAVE4_2026-10-18' },
  { key: 'S13', label: 'Hàng chờ xếp khay', href: '#/preview/S13', revision: 'PREMIUM_WAVE4_2026-10-18' },
  { key: 'S14', label: 'Lệnh xếp khay', href: '#/preview/S14', revision: 'PREMIUM_WAVE4_2026-10-18' },
  { key: 'S15', label: 'Phiếu xuất kho', href: '#/preview/S15', revision: 'PREMIUM_WAVE4_2026-10-18' },
  { key: 'S16', label: 'Tra cứu tồn & đối soát', href: '#/preview/S16', revision: 'PREMIUM_WAVE4_2026-10-18' },
  { key: 'S17', label: 'Phiếu đảo tồn kho', href: '#/preview/S17', revision: 'PREMIUM_WAVE4_2026-10-18' },
  { key: 'S18', label: 'Báo cáo nhập kho', href: '#/preview/S18', revision: 'PREMIUM_WAVE5_2026-10-18' },
  { key: 'S19', label: 'Báo cáo xuất kho', href: '#/preview/S19', revision: 'PREMIUM_WAVE5_2026-10-18' },
  { key: 'S20', label: 'Lịch sử nhập - xuất - tồn kho', href: '#/preview/S20', revision: 'PREMIUM_WAVE5_2026-10-18' },
  { key: 'S21', label: 'Báo cáo tồn kho & đối soát', href: '#/preview/S21', revision: 'PREMIUM_WAVE5_2026-10-18' },
  { key: 'S22', label: 'Báo cáo bảo hành linh kiện', href: '#/preview/S22', revision: 'PREMIUM_WAVE5_2026-10-18' },
  { key: 'S23', label: 'Nhãn, đóng gói & in lại', href: '#/preview/S23', revision: 'PREMIUM_WAVE5_2026-10-18' },
  { key: 'S24', label: 'Nhập liệu, đối chiếu & lỗi dữ liệu', href: '#/preview/S24', revision: 'PREMIUM_WAVE5_2026-10-18' },
  { key: 'S25', label: 'Xuất theo người nhận đại lý', href: '#/preview/S25', revision: 'PREMIUM_WAVE5_2026-10-18' },
  { key: 'S26', label: 'Truy vết hàng hóa', href: '#/preview/S26', revision: 'PREMIUM_WAVE5_2026-10-18' },
  { key: 'S27', label: 'Nhật ký hệ thống', href: '#/preview/S27', revision: 'RECOVERY_2026-10-18' },
  { key: 'S28', label: 'Cấu hình kho Hoa Nam', href: '#/preview/S28', revision: 'RECOVERY_2026-10-18' },
  { key: 'S29', label: 'Người dùng & RBAC', href: '#/preview/S29', revision: 'RECOVERY_2026-10-18' },
] as const;

export function resolvePreviewRoute(hash: string) {
  const canonical = resolveCanonicalPreviewSelection(hash) ?? resolveOverviewDocumentSelection(hash);
  const target = canonical ? `#/preview/${canonical.screen}` : hash;
  return [...screenRegistry, ...authScreenRegistry].find(screen => screen.href === target) ?? null;
}

/** Auth routes remain outside CMS navigation; they are resolved for direct
 * preview links and are never rendered as menu leaves. */
export const authScreenRegistry = [
  { key: 'S07', label: 'Đăng nhập', href: '#/preview/S07', revision: 'P01_r01_2026-10-10' },
  { key: 'S08', label: 'Xác nhận phiên làm việc', href: '#/preview/S08', revision: 'P01_r01_2026-10-10' },
] as const;
