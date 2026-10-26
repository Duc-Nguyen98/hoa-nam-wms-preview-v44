import { useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { localeForLanguage, useShellPreferences } from './shell-preferences';

/** Apply the chosen theme across the main Preview, including sign-in and session confirmation. */
export function ShellPreferencesRuntime({ children }: { children: ReactNode }) {
  const { theme, language } = useShellPreferences();
  useLayoutEffect(() => { document.documentElement.lang = localeForLanguage(language); }, [language]);
  useLayoutEffect(() => {
    document.documentElement.dataset.hnTheme = theme;
    return () => { delete document.documentElement.dataset.hnTheme; };
  }, [theme]);
  return children;
}
