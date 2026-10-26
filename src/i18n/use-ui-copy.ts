import { useCallback } from 'react';
import { useShellPreferences } from '../shared/shell-preferences';
import { EMPTY_COPY, translateUiCopy } from './ui-copy';
export { translateUiCopy } from './ui-copy';

/** Translate UI copy only. User records, query values and identifiers stay intact. */
export function useUiCopy(english: Readonly<Record<string, string>> = EMPTY_COPY) {
  const { language } = useShellPreferences();
  return useCallback(<Value,>(vietnamese: Value, values?: Readonly<Record<string, string | number>>): Value => {
    return translateUiCopy(vietnamese,english,language,values);
  }, [language, english]);
}
