import type {ShellLanguage} from '../shared/shell-preferences';
import {parseIsoDate, displayCalendarDate, toIsoDate} from '../shared/date-picker-calendar';
/** Date-only presentation preserves approved VI/EN order and never normalizes input. */
export function formatBusinessDate(value: string, language: ShellLanguage): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return language === 'zh-CN' ? toIsoDate(date).replaceAll('-', '/') : displayCalendarDate(date);
}
export function formatBusinessPeriod(period: {from: string; to: string}, language: ShellLanguage): string {
  return `${formatBusinessDate(period.from, language)} – ${formatBusinessDate(period.to, language)}`;
}
/** Known date/period interpolation only. Other source text is returned byte-for-byte. */
export function formatDeclaredDateText(value: string, language: ShellLanguage): string {
  if (language !== 'zh-CN') return value;
  const dates = value.split(' – ');
  if (dates.length > 2) return value;
  const converted = dates.map(part => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(part);
    if (!match) return null;
    const iso = `${match[3]}-${match[2]}-${match[1]}`;
    return parseIsoDate(iso) ? formatBusinessDate(iso, language) : null;
  });
  return converted.every(Boolean) ? converted.join(' – ') : value;
}
