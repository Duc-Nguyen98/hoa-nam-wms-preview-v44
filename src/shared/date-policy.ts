import { addCalendarDays, calendarBounds, localToday, parseIsoDate, toIsoDate } from './date-picker-calendar';

export const BUSINESS_DATE_TIME_ZONE = 'Asia/Ho_Chi_Minh';
export const BUSINESS_DATE_LOOKBACK_DAYS = 90;
export type DatePolicyKind = 'rolling-90' | 'business-exception';
export interface DatePolicyOptions {
  policy?: DatePolicyKind;
  exceptionId?: string;
  minDate?: string;
  maxDate?: string;
  now?: Date;
}
export type DateValidationCode = 'DATE_REQUIRED' | 'DATE_INVALID' | 'DATE_BEFORE_MIN' | 'DATE_AFTER_MAX' | 'DATE_RANGE_REVERSED' | 'DATE_POLICY_EMPTY' | 'DATE_EXCEPTION_REQUIRED';
export interface BusinessDateWindow { today: string; minDate?: string; maxDate?: string; empty: boolean; policy: DatePolicyKind; exceptionId?: string }
export type DateValidation = { valid: true; code: null; window: BusinessDateWindow } | { valid: false; code: DateValidationCode; window: BusinessDateWindow };

/** Boundaries are calendar dates in Vietnam, independent of the browser timezone. */
export function getBusinessDateWindow(options: DatePolicyOptions = {}): BusinessDateWindow {
  const today = localToday(options.now ?? new Date());
  if (options.policy === 'business-exception') {
    const minDate = parseIsoDate(options.minDate) ? options.minDate : undefined;
    const maxDate = parseIsoDate(options.maxDate) ? options.maxDate : undefined;
    return { today: toIsoDate(today), minDate, maxDate, empty: Boolean(minDate && maxDate && minDate > maxDate), policy: options.policy, exceptionId: options.exceptionId };
  }
  const bounds = calendarBounds(today, options.minDate, options.maxDate);
  return { today: toIsoDate(today), minDate: bounds.min, maxDate: bounds.max, empty: bounds.empty, policy: 'rolling-90' };
}

/** Never changes invalid submitted or persisted values. */
export function validateBusinessDate(value: unknown, options: DatePolicyOptions = {}): DateValidation {
  const window = getBusinessDateWindow(options);
  const fail = (code: DateValidationCode): DateValidation => ({ valid: false, code, window });
  if (window.policy === 'business-exception' && !window.exceptionId?.trim()) return fail('DATE_EXCEPTION_REQUIRED');
  if (window.empty) return fail('DATE_POLICY_EMPTY');
  if (value === null || value === undefined || value === '') return fail('DATE_REQUIRED');
  if (typeof value !== 'string' || !parseIsoDate(value)) return fail('DATE_INVALID');
  if (window.minDate && value < window.minDate) return fail('DATE_BEFORE_MIN');
  if (window.maxDate && value > window.maxDate) return fail('DATE_AFTER_MAX');
  return { valid: true, code: null, window };
}

export function validateBusinessDateRange(value: unknown, options: DatePolicyOptions = {}): DateValidation {
  const fixedOptions = { ...options, now: options.now ?? new Date() };
  if (!value || typeof value !== 'object') return { valid: false, code: 'DATE_REQUIRED', window: getBusinessDateWindow(fixedOptions) };
  const range = value as { from?: unknown; to?: unknown };
  const from = validateBusinessDate(range.from, fixedOptions);
  if (!from.valid) return from;
  const to = validateBusinessDate(range.to, fixedOptions);
  if (!to.valid) return to;
  if ((range.from as string) > (range.to as string)) return { valid: false, code: 'DATE_RANGE_REVERSED', window: from.window };
  return from;
}

/** Presets include today; the allowed window separately includes today minus 90. */
export function businessDatePreset(days: 1 | 7 | 30 | 90, now = new Date()) {
  const today = localToday(now);
  return { from: toIsoDate(addCalendarDays(today, -(days - 1))), to: toIsoDate(today) };
}

export function parseManualBusinessDate(value: string): string | null {
  const text = value.trim();
  if (parseIsoDate(text)) return text;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  const iso = match ? `${match[3]}-${match[2]}-${match[1]}` : '';
  return parseIsoDate(iso) ? iso : null;
}

export const DATE_VALIDATION_COPY: Record<DateValidationCode, string> = {
  DATE_REQUIRED: 'Vui lòng chọn đủ ngày.',
  DATE_INVALID: 'Ngày không hợp lệ. Nhập dd/MM/yyyy hoặc yyyy-MM-dd.',
  DATE_BEFORE_MIN: 'Ngày nằm trước giới hạn cho phép ({min}). Vui lòng chọn lại.',
  DATE_AFTER_MAX: 'Ngày nằm sau giới hạn cho phép ({max}). Vui lòng chọn lại.',
  DATE_RANGE_REVERSED: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.',
  DATE_POLICY_EMPTY: 'Không có ngày phù hợp với giới hạn của trường này.',
  DATE_EXCEPTION_REQUIRED: 'Chưa xác định quy tắc ngày cho trường nghiệp vụ này.',
};

export function dateValidationMessage(result: DateValidation): string {
  if (result.valid) return '';
  return DATE_VALIDATION_COPY[result.code].replace('{min}', result.window.minDate ?? '—').replace('{max}', result.window.maxDate ?? '—');
}

/** Shared ListController preflight; a stable UI key keeps errors localizable. */
export function dateRangeBlocker(value: unknown, options: DatePolicyOptions = {}) {
  const result = validateBusinessDateRange(value, options);
  if (result.valid) return null;
  return { reason: 'INVALID_PERIOD' as const, detail: result.code === 'DATE_RANGE_REVERSED' ? DATE_VALIDATION_COPY.DATE_RANGE_REVERSED : 'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.' };
}
