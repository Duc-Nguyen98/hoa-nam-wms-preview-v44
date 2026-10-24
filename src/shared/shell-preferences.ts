import { useSyncExternalStore } from 'react';

export type ShellLanguage = 'vi' | 'en' | 'zh-CN';
export type ShellTheme = 'light' | 'dark';

const LANGUAGE_KEY = 'hn-wms.s00.language.v1';
const THEME_KEY = 'hn-wms.s00.theme.v1';
const DEFAULT_LANGUAGE: ShellLanguage = 'vi';
const DEFAULT_THEME: ShellTheme = 'light';

export function parseShellLanguage(value: unknown): ShellLanguage {
  return value === 'en' || value === 'vi' || value === 'zh-CN' ? value : DEFAULT_LANGUAGE;
}

export function localeForLanguage(language: ShellLanguage): 'vi-VN' | 'en' | 'zh-CN' {
  return language === 'vi' ? 'vi-VN' : language;
}

export function parseShellTheme(value: unknown): ShellTheme {
  return value === 'dark' || value === 'light' ? value : DEFAULT_THEME;
}

function read(key: string): string | null {
  try { return typeof window === 'undefined' ? null : window.localStorage.getItem(key); }
  catch { return null; }
}

type ShellUiSnapshot = Readonly<{ language: ShellLanguage; theme: ShellTheme }>;
const serverSnapshot: ShellUiSnapshot = { language: DEFAULT_LANGUAGE, theme: DEFAULT_THEME };
let snapshot: ShellUiSnapshot = serverSnapshot;
let initialized = false;
const listeners = new Set<() => void>();

function getSnapshot(): ShellUiSnapshot {
  if (!initialized && typeof window !== 'undefined') {
    snapshot = { language: parseShellLanguage(read(LANGUAGE_KEY)), theme: parseShellTheme(read(THEME_KEY)) };
    initialized = true;
  }
  return snapshot;
}

function emit() { listeners.forEach(listener => listener()); }

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== LANGUAGE_KEY && event.key !== THEME_KEY) return;
  const next = {
    language: parseShellLanguage(read(LANGUAGE_KEY)),
    theme: parseShellTheme(read(THEME_KEY)),
  } as const;
  if (next.language !== snapshot.language || next.theme !== snapshot.theme) {
    snapshot = next;
    emit();
  }
}

function subscribe(listener: () => void) {
  if (!listeners.size && typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

function persist(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* Keep the preference for this session. */ }
}

export function useShellPreferences() {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  return {
    ...preferences,
    setLanguage(language: ShellLanguage) {
      const next = parseShellLanguage(language);
      snapshot = { ...getSnapshot(), language: next };
      persist(LANGUAGE_KEY, next);
      emit();
    },
    setTheme(theme: ShellTheme) {
      const next = parseShellTheme(theme);
      snapshot = { ...getSnapshot(), theme: next };
      persist(THEME_KEY, next);
      emit();
    },
  };
}

export const SHELL_PREFERENCE_STORAGE_KEYS = Object.freeze({ language: LANGUAGE_KEY, theme: THEME_KEY });
