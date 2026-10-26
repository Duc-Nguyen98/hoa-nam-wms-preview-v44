import type { ShellNavigationItem } from './GlobalShell';

/** OBSERVED_PREVIEW: S01 Default 2026-10-08, all five approved reference variants.
 * Navigation metadata only. Missing href deliberately means no production/module destination is invented.
 */
export const S01_SHELL_NAVIGATION: readonly ShellNavigationItem[] = [
  { key: 'S01', label: 'Tổng quan', href: '#/preview/S01', icon: 'home' },
  { key: 'operations', label: 'Nghiệp vụ', icon: 'documents', defaultExpanded: true, children: [
    { key: 'inbound', label: 'Nhập kho', icon: 'download' },
    { key: 'outbound', label: 'Xuất kho', icon: 'upload' },
    { key: 'tray', label: 'Xếp khay', icon: 'tray' },
    { key: 'warranty', label: 'Bảo hành', icon: 'shield' },
  ] },
  // S02 is now implemented; exposing its child preserves S01's initially collapsed catalogue appearance.
  { key: 'catalog', label: 'Danh mục', icon: 'catalog', defaultExpanded: false, children: [
    { key: 'S02', label: 'Bệnh / lỗi', href: '#/preview/S02', icon: 'catalog' },
  ] },
  { key: 'reports', label: 'Báo cáo', icon: 'chart', hasSubmenu: true },
  { key: 'users', label: 'Người dùng & RBAC', icon: 'users' },
  { key: 'settings', label: 'Cấu hình', icon: 'settings' },
  { key: 'audit', label: 'Nhật ký hệ thống', icon: 'audit' },
];
