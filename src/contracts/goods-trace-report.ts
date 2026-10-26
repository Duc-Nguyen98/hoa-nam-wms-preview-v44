import type { ListDataAdapter } from '../shared/list-runtime';

/** Frontend source contract, not an API DTO. Owner chose full P01 on 13/10/2026. */
export const TRACE_STATUSES = ['Đang tồn kho', 'Cần kiểm tra', 'Đã xuất kho'] as const;
export type TraceStatus = typeof TRACE_STATUSES[number];
export interface TraceRow {
  sku: string; name: string; serial: string; lot: string; pallet: string;
  status: TraceStatus; location: string | null; lastEvent: string;
  updatedAt: string; completeness: number;
}
export const TRACE_SORT_KEYS = ['sku', 'name', 'serial', 'lot', 'pallet', 'status', 'location', 'lastEvent', 'updatedAt', 'completeness'] as const;
export type TraceSortKey = typeof TRACE_SORT_KEYS[number];
export interface TraceQuery {
  period: { from: string; to: string }; search: string; codeType: '';
  status: TraceStatus | ''; needsReview: boolean;
  sortKey: TraceSortKey | null; sortDirection: 'asc' | 'desc'; page: number; pageSize: number;
}
export interface TraceSummary {
  total: number; events: number; needsReview: number; qualityRate: string;
  complete: number; missingEvents: number; statusMismatch: number;
  daily: { date: string; events: number }[];
}
export type TraceAdapter = ListDataAdapter<TraceRow, TraceQuery, TraceSummary>;
export const DEFAULT_TRACE_QUERY: Readonly<TraceQuery> = Object.freeze({
  period: Object.freeze({ from: '2026-09-04', to: '2026-09-10' }),
  search: '', codeType: '', status: '', needsReview: false,
  sortKey: null, sortDirection: 'asc', page: 1, pageSize: 10,
});
export const traceDate = (date: string) => date.split('-').reverse().join('/');
export const tracePeriod = (period: TraceQuery['period']) => `${traceDate(period.from)} – ${traceDate(period.to)}`;
export function traceTime(value: string) {
  const parts = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  const part = (key: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === key)!.value;
  return `${part('day')}/${part('month')}/${part('year')} · ${part('hour')}:${part('minute')}`;
}
