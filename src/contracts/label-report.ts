import type { ListDataAdapter } from '../shared/list-runtime';

/** Frontend-only view model; not an approved backend DTO. */
export const LABEL_STATUSES = ['In thành công', 'Lỗi in'] as const;
export type LabelStatus = typeof LABEL_STATUSES[number];
export interface LabelReportRow {
  labelCode: string;
  documentCode: string;
  sku: string;
  productName: string;
  printedAt: string;
  status: LabelStatus;
  printCount: number;
}
// SKU/Sản phẩm has no approved merged-column sort binding. Do not infer one.
export const LABEL_SORT_KEYS = ['labelCode', 'documentCode', 'printedAt', 'status', 'printCount'] as const;
export type LabelSortKey = typeof LABEL_SORT_KEYS[number];
export interface LabelReportQuery {
  period: { from: string; to: string };
  search: string;
  status: LabelStatus | '';
  sortKey: LabelSortKey | null;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
export interface LabelReportSummary {
  uniqueLabels: number; successful: number; errors: number; reprints: number; successRate: string;
}
export type LabelReportAdapter = ListDataAdapter<LabelReportRow, LabelReportQuery, LabelReportSummary>;
export const DEFAULT_LABEL_REPORT_QUERY: Readonly<LabelReportQuery> = Object.freeze({
  period: Object.freeze({ from: '2026-09-04', to: '2026-09-10' }),
  search: '', status: '', sortKey: null, sortDirection: 'asc', page: 1, pageSize: 10,
});
export const labelDate = (value: string) => value.split('-').reverse().join('/');
export const labelPeriod = (period: LabelReportQuery['period']) => `${labelDate(period.from)} – ${labelDate(period.to)}`;
export function labelPrintTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value)).replace(', ', ' · ');
}
export const labelAction = (row: LabelReportRow) => row.status === 'Lỗi in' ? 'Thử lại' : 'In lại';
