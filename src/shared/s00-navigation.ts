import type { ShellNavigationItem } from './GlobalShell';
import { S03_SHELL_NAVIGATION } from './s03-shell-navigation';

// UI navigation metadata for the delivered shell and explicitly registered preview leaves.
export const S00_SHELL_NAVIGATION: readonly ShellNavigationItem[] = S03_SHELL_NAVIGATION.map<ShellNavigationItem>(item =>
  item.key === 'operations'
    ? { ...item, children: [
      { key: 'inbound-management', label: 'Phiếu nhập kho', icon: 'download' as const, defaultExpanded: false,
        children: [{ key: 'S12', label: 'Phiếu nhập kho', href: '#/preview/S12', icon: 'documents' as const, leafIcon: true }] },
      { key: 'outbound-management', label: 'Xuất kho', icon: 'upload' as const, defaultExpanded: false,
        children: [{ key: 'S15', label: 'Phiếu xuất kho', href: '#/preview/S15', icon: 'documents' as const, leafIcon: true }] },
      { key: 'putaway-management', label: 'Xếp khay', icon: 'tray' as const, defaultExpanded: false,
        children: [
          { key: 'S13', label: 'Hàng chờ xếp khay', href: '#/preview/S13', icon: 'box' as const, leafIcon: true },
          { key: 'S14', label: 'Lệnh xếp khay', href: '#/preview/S14', icon: 'tray' as const, leafIcon: true },
          { key: 'S11', label: 'Danh sách khay', href: '#/preview/S11', icon: 'tray' as const, leafIcon: true },
        ] },
      { key: 'warranty-management', label: 'Bảo hành & sửa chữa', icon: 'shield' as const, defaultExpanded: false,
        children: [
          { key: 'S09', label: 'Hồ sơ bảo hành', href: '#/preview/S09', icon: 'documents' as const, leafIcon: true },
          { key: 'S10', label: 'Phiếu xuất linh kiện', href: '#/preview/S10', icon: 'upload' as const, leafIcon: true },
        ] },
      { key: 'inventory-management', label: 'Tồn kho & đối soát', icon: 'warehouse' as const, defaultExpanded: false,
        children: [
          { key: 'S16', label: 'Tra cứu tồn & đối soát', href: '#/preview/S16', icon: 'search' as const, leafIcon: true },
          { key: 'S17', label: 'Phiếu đảo tồn kho', href: '#/preview/S17', icon: 'refresh' as const, leafIcon: true },
        ] },
    ] }
  : item.key === 'reports'
    ? { ...item, hasSubmenu: false, defaultExpanded: false, children: [
      { key: 'S18', label: 'Báo cáo nhập kho', href: '#/preview/S18', icon: 'chart' as const, leafIcon: true },
      { key: 'S19', label: 'Báo cáo xuất kho', href: '#/preview/S19', icon: 'chart' as const, leafIcon: true },
      { key: 'S20', label: 'Lịch sử nhập - xuất - tồn kho', href: '#/preview/S20', icon: 'chart' as const, leafIcon: true },
      { key: 'S21', label: 'Báo cáo tồn kho & đối soát', href: '#/preview/S21', icon: 'chart' as const, leafIcon: true },
      { key: 'S22', label: 'Báo cáo bảo hành linh kiện', href: '#/preview/S22', icon: 'chart' as const, leafIcon: true },
      { key: 'S23', label: 'Nhãn, đóng gói & in lại', href: '#/preview/S23', icon: 'chart' as const, leafIcon: true },
      { key: 'S24', label: 'Nhập liệu, đối chiếu & lỗi dữ liệu', href: '#/preview/S24', icon: 'chart' as const, leafIcon: true },
      { key: 'S25', label: 'Xuất theo người nhận đại lý', href: '#/preview/S25', icon: 'chart' as const, leafIcon: true },
      { key: 'S26', label: 'Truy vết hàng hóa', href: '#/preview/S26', icon: 'chart' as const, leafIcon: true },
    ] }
  : item.key === 'catalog'
    ? { ...item, children: [
      { key: 'S04', label: 'SKU', href: '#/preview/S04', icon: 'tag', leafIcon: true },
      ...(item.children ?? []).flatMap(child => child.key === 'S03' ? [child, { key: 'S05', label: 'Đại lý & nơi nhận', href: '#/preview/S05', icon: 'building' as const, leafIcon: true }] : [child]),
    ] }
    : item.key === 'users' ? { ...item, key: 'S29', label: 'Người dùng & phân quyền', href: '#/preview/S29' }
    : item.key === 'settings' ? { ...item, key: 'S28', label: 'Cấu hình hệ thống', href: '#/preview/S28' }
    : item.key === 'audit' ? { ...item, key: 'S27', href: '#/preview/S27' }
    : item,
).flatMap(item => item.key === 'catalog' ? [item, {
  key: 'sku-management', label: 'Quản lý mã SKU', icon: 'barcode' as const, defaultExpanded: false,
  children: [{ key: 'S06', label: 'Sản phẩm trên App PV', href: '#/preview/S06', icon: 'eye' as const, leafIcon: true }],
}] : [item],
);
export interface ShellDestination { searchText?: string; key: string; label: string; href: string; group?: string; icon?: ShellNavigationItem['icon'] }
export function getShellDestinations(items: readonly ShellNavigationItem[], group?: string): ShellDestination[] {
  return items.flatMap(item => item.children?.length
    ? getShellDestinations(item.children, item.label)
    : item.href ? [{ key: item.key, label: item.label, href: item.href, group, icon: item.icon }] : []);
}

/** Local menu-label matching only; never applies to feature data or query adapters. */
export function matchShellDestinations(items: readonly ShellDestination[], query: string): readonly ShellDestination[] {
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi').trim();
  const needle = normalize(query);
  return needle ? items.filter(item => normalize(`${item.group ?? ''} ${item.label} ${item.searchText ?? ''}`).includes(needle)) : items;
}
