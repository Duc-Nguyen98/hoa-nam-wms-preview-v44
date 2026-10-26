import type { ListDataAdapter } from '../shared/list-runtime';

/** Frontend view model only. No backend DTO, permission or status-code mapping is inferred. */
export const OUTBOUND_REPORT_STATUSES = ['Đã xuất', 'Đang đóng hàng', 'Chờ xử lý trên Web', 'Đã hủy'] as const;
export type OutboundReportStatus = typeof OUTBOUND_REPORT_STATUSES[number];
export interface OutboundReportRow {
  renderKey: string;
  code: string;
  shippedDate: string;
  customer: string;
  shippedQuantity: number | null;
  status: OutboundReportStatus;
  creator: string;
}
export const OUTBOUND_REPORT_SORT_KEYS = ['code', 'shippedDate', 'customer', 'shippedQuantity', 'status', 'creator'] as const;
export type OutboundReportSortKey = typeof OUTBOUND_REPORT_SORT_KEYS[number];
export interface OutboundReportQuery {
  period: { from: string; to: string };
  search: string;
  customer: string;
  status: OutboundReportStatus | '';
  sortKey: OutboundReportSortKey;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
export const DEFAULT_OUTBOUND_REPORT_QUERY: Readonly<OutboundReportQuery> = Object.freeze({
  period: Object.freeze({ from: '2026-09-04', to: '2026-09-10' }), search: '', customer: '', status: '',
  sortKey: 'code', sortDirection: 'desc', page: 1, pageSize: 10,
});
export interface OutboundReportSummary {
  products: number;
  receipts: number;
  shipped: number;
  packing: number;
  waiting: number;
  comparison: null;
  daily: { date: string; quantity: number }[];
  progress: { status: OutboundReportStatus; count: number }[];
}
export type OutboundReportAdapter = ListDataAdapter<OutboundReportRow, OutboundReportQuery, OutboundReportSummary>;
export function outboundReportDateLabel(date: string) { return date.split('-').reverse().join('/'); }
