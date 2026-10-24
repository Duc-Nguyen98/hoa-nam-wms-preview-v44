import type { ShellNavigationItem } from './GlobalShell';
import { S01_SHELL_NAVIGATION } from './s01-shell-navigation';

/** OBSERVED_PREVIEW: S02 P01 REVIEW 2026-10-08 uses the shared shell, both source groups expanded.
 * This is preview navigation metadata only. No S03+ leaves or production destinations are introduced.
 */
export const S02_SHELL_NAVIGATION: readonly ShellNavigationItem[] = S01_SHELL_NAVIGATION.map((item) =>
  item.key === 'catalog' ? { ...item, defaultExpanded: true } : item,
);
