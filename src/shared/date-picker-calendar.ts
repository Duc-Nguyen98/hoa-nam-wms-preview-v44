import { PREVIEW_TIME_ZONE } from './foundation';

export type CalendarDate = { year: number; month: number; day: number };
export type CalendarDateRange = { from: string; to: string };

/** Date-only values stay in UTC for arithmetic, so a DST change cannot skip a day. */
function asUtcDate({ year, month, day }: CalendarDate) {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

export function toIsoDate(date: CalendarDate): string {
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

export function parseIsoDate(value: string | null | undefined): CalendarDate | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = asUtcDate({ year, month, day });
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day ? { year, month, day } : null;
}

/** Clamp keyboard focus only; never changes the caller's accepted date or bounds. */
export function clampCalendarFocus(date: CalendarDate, minDate?: string, maxDate?: string): CalendarDate {
  const min = parseIsoDate(minDate), max = parseIsoDate(maxDate);
  if (min && max && minDate! > maxDate!) return date;
  const iso = toIsoDate(date);
  if (min && iso < minDate!) return min;
  if (max && iso > maxDate!) return max;
  return date;
}

const previewDateParts = new Intl.DateTimeFormat('en-CA', { timeZone: PREVIEW_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
/** The retained helper name now follows the shared frontend timezone, not the host timezone. */
export function localToday(now = new Date()): CalendarDate {
  const parts = Object.fromEntries(previewDateParts.formatToParts(now).map(part => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

export type CalendarBounds = { min: string; max: string; empty: boolean };

/** The shared business window includes today and the preceding 90 calendar days. */
export function calendarBounds(today = localToday(), minDate?: string, maxDate?: string): CalendarBounds {
  const todayIso = toIsoDate(today);
  const oldest = toIsoDate(addCalendarDays(today, -90));
  const min = parseIsoDate(minDate) && minDate! > oldest ? minDate! : oldest;
  const max = parseIsoDate(maxDate) && maxDate! < todayIso ? maxDate! : todayIso;
  return { min, max, empty: min > max };
}

export function isCalendarDateAllowed(value: string, bounds: CalendarBounds): boolean {
  return !bounds.empty && Boolean(parseIsoDate(value)) && value >= bounds.min && value <= bounds.max;
}


export function addCalendarDays(value: CalendarDate, amount: number): CalendarDate {
  const date = asUtcDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function addCalendarMonths(value: CalendarDate, amount: number): CalendarDate {
  const monthStart = asUtcDate({ ...value, day: 1 });
  monthStart.setUTCMonth(monthStart.getUTCMonth() + amount);
  const lastDay = new Date(monthStart);
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
  return { year: monthStart.getUTCFullYear(), month: monthStart.getUTCMonth() + 1, day: Math.min(value.day, lastDay.getUTCDate()) };
}

export function calendarWeekday(value: CalendarDate): number {
  return (asUtcDate(value).getUTCDay() + 6) % 7;
}

export function calendarDays(month: CalendarDate): CalendarDate[] {
  const first = { ...month, day: 1 };
  const start = addCalendarDays(first, -calendarWeekday(first));
  return Array.from({ length: 42 }, (_, index) => addCalendarDays(start, index));
}

export function displayCalendarDate(value: CalendarDate): string {
  return `${String(value.day).padStart(2, '0')}/${String(value.month).padStart(2, '0')}/${String(value.year).padStart(4, '0')}`;
}

const accessibleDate = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: PREVIEW_TIME_ZONE });
const accessibleDateEnglish = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: PREVIEW_TIME_ZONE });
const accessibleDateChinese = new Intl.DateTimeFormat('zh-CN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: PREVIEW_TIME_ZONE });
export function calendarDateLabel(value: CalendarDate, language = 'vi'): string {
  return (language === 'en' ? accessibleDateEnglish : language === 'zh-CN' ? accessibleDateChinese : accessibleDate).format(asUtcDate(value));
}

/** A complete inclusive range; either selection direction produces the same endpoints. */
export function normalizeCalendarRange(first: string, second: string): CalendarDateRange | null {
  if (!parseIsoDate(first) || !parseIsoDate(second)) return null;
  return first <= second ? { from: first, to: second } : { from: second, to: first };
}

export function isCalendarDateInRange(value: string, range: CalendarDateRange | null): boolean {
  return Boolean(parseIsoDate(value) && range && parseIsoDate(range.from) && parseIsoDate(range.to) && value >= range.from && value <= range.to);
}
