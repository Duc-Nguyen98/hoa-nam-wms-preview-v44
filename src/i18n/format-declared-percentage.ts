import type {ShellLanguage} from '../shared/shell-preferences';
/** Localize only an explicitly numeric percentage; never parse or rewrite arbitrary business text. */
export function formatDeclaredPercentage(value: string, language: ShellLanguage): string {
  if (language === 'vi') return value;
  const match = /^([+-]?\d+)(?:([,.])(\d+))?\s*%$/.exec(value.trim());
  if (!match) return value;
  // VI/EN/ZH use the same decimal digits; transform punctuation only to retain
  // every declared digit even beyond JavaScript's floating-point precision.
  return `${match[1]}${match[3] === undefined ? '' : '.' + match[3]}%`;
}
