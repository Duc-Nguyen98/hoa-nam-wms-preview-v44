import { useSyncExternalStore } from 'react';
import { normalizeShortcutKeys, readShortcutKeys, SHORTCUT_STORAGE_KEY } from './shortcut-model';

let initialized = false;
let snapshot: string | null = null;
const listeners = new Set<() => void>();
function readStorage() { try { return window.localStorage.getItem(SHORTCUT_STORAGE_KEY); } catch { return null; } }
function getSnapshot() {
  if (!initialized && typeof window !== 'undefined') { snapshot = readStorage(); initialized = true; }
  return snapshot;
}
function emit() { listeners.forEach(listener => listener()); }
function onStorage(event: StorageEvent) {
  if (event.key !== SHORTCUT_STORAGE_KEY && event.key !== null) return;
  const next = readStorage();
  if (next !== snapshot) { snapshot = next; emit(); }
}
function subscribe(listener: () => void) {
  if (!listeners.size) window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => { listeners.delete(listener); if (!listeners.size) window.removeEventListener('storage', onStorage); };
}

export function useShortcutPreferences(availableKeys: readonly string[]) {
  const serialized = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return {
    keys: readShortcutKeys(serialized, availableKeys),
    save(keys: readonly string[]) {
      snapshot = JSON.stringify(normalizeShortcutKeys(keys, availableKeys));
      let persisted = true;
      try { window.localStorage.setItem(SHORTCUT_STORAGE_KEY, snapshot); } catch { persisted = false; }
      emit();
      return persisted;
    },
  };
}
