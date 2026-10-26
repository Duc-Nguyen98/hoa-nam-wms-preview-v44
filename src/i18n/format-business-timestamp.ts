import {localeForLanguage, type ShellLanguage} from '../shared/shell-preferences';
import {PREVIEW_TIME_ZONE} from '../shared/foundation';
/** Presentation-only timestamp, always in the sourced Vietnam business timezone. */
export function formatBusinessTimestamp(value: string, language: ShellLanguage): string {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return value;
  const locale = localeForLanguage(language);
  const date = new Intl.DateTimeFormat(locale, {timeZone: PREVIEW_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric'}).format(instant);
  const time = new Intl.DateTimeFormat(locale, {timeZone: PREVIEW_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(instant);
  return `${date} · ${time}`;
}
