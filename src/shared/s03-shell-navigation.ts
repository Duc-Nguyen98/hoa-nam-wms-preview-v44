import type { ShellNavigationItem } from './GlobalShell';
import { S01_SHELL_NAVIGATION } from './s01-shell-navigation';

/** OBSERVED_PREVIEW: S03 P01 REVIEW has Danh mục expanded with Sản phẩm active. */
export const S03_SHELL_NAVIGATION: readonly ShellNavigationItem[] = S01_SHELL_NAVIGATION.map(item =>
  item.key === 'catalog'
    ? { ...item, defaultExpanded: true, children: [
      { key: 'S03', label: 'Sản phẩm', href: '#/preview/S03', icon: 'box' },
      { key: 'S02', label: 'Bệnh / lỗi', href: '#/preview/S02', icon: 'catalog' },
    ] }
    : item,
);
