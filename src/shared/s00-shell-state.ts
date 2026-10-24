import { useSyncExternalStore } from 'react';

const storageKey = 'hn-wms.s00.sidebar-pinned.v1';
type ShellPreferences = { pinned: boolean; groups: Readonly<Record<string, boolean>> };
const serverSnapshot: ShellPreferences = { pinned: true, groups: {} };
let snapshot = serverSnapshot;
let initialized = false;
const listeners = new Set<() => void>();
function readPreference() {
  try { return window.localStorage.getItem(storageKey) !== 'false'; } catch { return true; }
}
function getSnapshot() {
  if (!initialized && typeof window !== 'undefined') {
    snapshot = { ...snapshot, pinned: readPreference() };
    initialized = true;
  }
  return snapshot;
}
function emit() { listeners.forEach(listener => listener()); }
function onStorage(event: StorageEvent) {
  if (event.key !== storageKey && event.key !== null) return;
  const pinned = readPreference();
  if (pinned !== snapshot.pinned) { snapshot = { ...snapshot, pinned }; emit(); }
}
function subscribe(listener: () => void) {
  if (!listeners.size) window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => { listeners.delete(listener); if (!listeners.size) window.removeEventListener('storage', onStorage); };
}
export function useShellPreferences() {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  return {
    ...preferences,
    setPinned(pinned: boolean) {
      snapshot = { ...getSnapshot(), pinned };
      try { window.localStorage.setItem(storageKey, String(pinned)); } catch { /* Keep session preference when storage is unavailable. */ }
      emit();
    },
    setGroup(key: string, expanded: boolean) {
      snapshot = { ...getSnapshot(), groups: { ...snapshot.groups, [key]: expanded } };
      emit();
    },
  };
}
