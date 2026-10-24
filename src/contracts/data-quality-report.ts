import type { ListDataAdapter } from '../shared/list-runtime';

/** Frontend presentation contract only; backend DTO/endpoint/permissions remain unassigned. */
export const DATA_QUALITY_RESULTS = ['Khớp', 'Chênh lệch', 'Lỗi dữ liệu'] as const;
export type DataQualityResult = typeof DATA_QUALITY_RESULTS[number];
export interface DataQualityRow {
  referenceCode: string;
  object: string;
  systemValue: string | null;
  comparisonValue: string | null;
  result: DataQualityResult;
  detail: string;
  updatedAt: string;
}
export const DATA_QUALITY_SORT_KEYS = ['referenceCode', 'object', 'systemValue', 'comparisonValue', 'result', 'detail', 'updatedAt'] as const;
export type DataQualitySortKey = typeof DATA_QUALITY_SORT_KEYS[number];
export interface DataQualityQuery {
  period: { from: string; to: string };
  search: string;
  dataType: ''; // Only “Tất cả” is sourced; never derive enums from document prefixes.
  result: DataQualityResult | '';
  needsReview: boolean;
  sortKey: DataQualitySortKey | null;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
export interface DataQualityDay { date: string; matched: number; different: number; errors: number }
export interface DataQualitySummary {
  total: number; matched: number; different: number; errors: number; needsReview: number;
  qualityRate: string;
  daily: DataQualityDay[];
}
export type DataQualityAdapter = ListDataAdapter<DataQualityRow, DataQualityQuery, DataQualitySummary>;
export const DEFAULT_DATA_QUALITY_QUERY: Readonly<DataQualityQuery> = Object.freeze({
  period: Object.freeze({ from: '2026-09-04', to: '2026-09-10' }),
  search: '', dataType: '', result: '', needsReview: false, sortKey: null, sortDirection: 'asc', page: 1, pageSize: 10,
});
export const qualityDate = (iso: string) => iso.split('-').reverse().join('/');
export const qualityPeriod = (period: DataQualityQuery['period']) => `${qualityDate(period.from)} – ${qualityDate(period.to)}`;
export function qualityTime(value: string): string {
  const parts = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)!.value;
  return `${part('day')}/${part('month')}/${part('year')} · ${part('hour')}:${part('minute')}`;
}
