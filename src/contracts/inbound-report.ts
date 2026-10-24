import type { ListDataAdapter, ListModel } from '../shared/list-runtime';

/** Frontend-only view model. Names and values are not a backend DTO/enum. */
export const INBOUND_REPORT_STATUSES = ['Hoàn tất', 'Đang nhập', 'Chờ duyệt', 'Đã hủy'] as const;
export type InboundReportStatus = typeof INBOUND_REPORT_STATUSES[number];
export interface InboundReportRow {
  renderKey: string;
  code: string;
  receivedDate: string;
  supplier: string;
  receivedQuantity: number | null;
  status: InboundReportStatus;
  creator: string;
}
export const INBOUND_REPORT_SORT_KEYS = ['code', 'receivedDate', 'supplier', 'receivedQuantity', 'status', 'creator'] as const;
export type InboundReportSortKey = typeof INBOUND_REPORT_SORT_KEYS[number];
export interface InboundReportQuery {
  period: { from: string; to: string };
  search: string;
  supplier: string;
  status: InboundReportStatus | '';
  sortKey: InboundReportSortKey;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
export const DEFAULT_INBOUND_REPORT_QUERY: Readonly<InboundReportQuery> = Object.freeze({
  period: Object.freeze({ from: '2026-09-04', to: '2026-09-10' }), search: '', supplier: '', status: '',
  sortKey: 'code', sortDirection: 'desc', page: 1, pageSize: 10,
});
export interface InboundReportSummary {
  products: number;
  receipts: number;
  completed: number;
  completedPercentage: string;
  suppliers: number;
  needsAttention: number;
  previousProducts: number;
  increasePercentage: number;
  daily: { date: string; quantity: number }[];
  progress: { status: InboundReportStatus; count: number }[];
}
export type InboundReportAdapter = ListDataAdapter<InboundReportRow, InboundReportQuery, InboundReportSummary>;
export type InboundReportModel = ListModel<InboundReportRow, InboundReportQuery, InboundReportSummary>;
export function inboundReportDateLabel(date: string) { return date.split('-').reverse().join('/'); }
