export const SHORTCUT_LIMIT = 6;
export const SHORTCUT_STORAGE_KEY = 'hn-wms.s00.shortcuts.v1';
export const DEFAULT_SHORTCUT_KEYS: readonly string[] = ['S01', 'S12', 'S15', 'S16', 'S03', 'S20'];

/** Persist only unique keys from the existing navigation registry, never URLs. */
export function normalizeShortcutKeys(value: unknown, availableKeys: readonly string[]): string[] {
  if (!Array.isArray(value)) return normalizeShortcutKeys(DEFAULT_SHORTCUT_KEYS, availableKeys);
  const available = new Set(availableKeys);
  return [...new Set(value.filter((key): key is string => typeof key === 'string' && available.has(key)))].slice(0, SHORTCUT_LIMIT);
}

export function readShortcutKeys(serialized: string | null, availableKeys: readonly string[]): string[] {
  if (serialized === null) return normalizeShortcutKeys(DEFAULT_SHORTCUT_KEYS, availableKeys);
  try { return normalizeShortcutKeys(JSON.parse(serialized), availableKeys); }
  catch { return normalizeShortcutKeys(DEFAULT_SHORTCUT_KEYS, availableKeys); }
}
