import type { ListDataAdapter } from '../shared/list-runtime';

/** Frontend-only fields transcribed from the selected Desktop source; not backend DTOs. */
export const WARRANTY_DETAIL_STATUSES = ['Hoàn tất', 'Đang xử lý', 'Chờ tiếp nhận'] as const;
export const WARRANTY_DETAIL_SORT_KEYS = ['component', 'receivedDate', 'dueDate', 'status'] as const;
export type WarrantyDetailStatus = typeof WARRANTY_DETAIL_STATUSES[number];
export type WarrantyDetailSortKey = typeof WARRANTY_DETAIL_SORT_KEYS[number];
export interface WarrantyDetailRow {
  ticketCode: string; serial: string; sku: string; productName: string;
  component: string; receivedDate: string; dueDate: string; status: WarrantyDetailStatus;
}
export interface WarrantyDetailQuery {
  search: string; status: WarrantyDetailStatus | '';
  sortKey: WarrantyDetailSortKey | ''; sortDirection: 'asc' | 'desc'; page: number; pageSize: number;
}
export const DEFAULT_WARRANTY_DETAIL_QUERY: Readonly<WarrantyDetailQuery> = Object.freeze({
  search: '', status: '', sortKey: '', sortDirection: 'asc', page: 1, pageSize: 10,
});
export type WarrantyDetailAdapter = ListDataAdapter<WarrantyDetailRow, WarrantyDetailQuery, null>;
