import type { ShellLanguage } from '../shared/shell-preferences';
import { parseIsoDate } from '../shared/date-picker-calendar';
import { formatBusinessDate } from '../i18n/format-business-date';
/** Short chart ticks intentionally omit the year and retain each language's calendar order. */
export function reportDateTick(value: string, language: ShellLanguage = 'vi'): string {
  if (!parseIsoDate(value)) return value;
  const [, month, day] = value.split('-');
  return language === 'zh-CN' ? month + '/' + day : day + '/' + month;
}
/** Unbounded role windows retain their existing em-dash placeholders. */
export function roleWindowDisplay(from: string | null, to: string | null, language: ShellLanguage = 'vi'): string {
  if (!from && !to) return 'Không giới hạn';
  return (from ? formatBusinessDate(from, language) : '—') + ' – ' + (to ? formatBusinessDate(to, language) : '—');
}
