import type { ListDataAdapter } from '../shared/list-runtime';

/** Frontend view model. All backend bindings remain unconfirmed. */
export const INVENTORY_REPORT_STATUSES = ['Cần kiểm tra', 'Khớp'] as const;
export type InventoryReportStatus = typeof INVENTORY_REPORT_STATUSES[number];
export const INVENTORY_REPORT_NUMERIC_KEYS = ['opening', 'inbound', 'outboundProducts', 'outboundWarranty', 'reversals', 'closing', 'actual', 'difference'] as const;
export type InventoryReportNumericKey = typeof INVENTORY_REPORT_NUMERIC_KEYS[number];
export type InventoryReportRow = {
  renderKey: string; sku: string; name: string; status: InventoryReportStatus;
} & Record<InventoryReportNumericKey, number>;
export const INVENTORY_REPORT_SORT_KEYS = ['sku', 'name', ...INVENTORY_REPORT_NUMERIC_KEYS, 'status'] as const;
export type InventoryReportSortKey = typeof INVENTORY_REPORT_SORT_KEYS[number];
export interface InventoryReportQuery {
  period: { from: string; to: string };
  search: string; sku: string; status: InventoryReportStatus | '';
  sortKey: InventoryReportSortKey; sortDirection: 'asc' | 'desc'; page: number; pageSize: number;
}
export const DEFAULT_INVENTORY_REPORT_QUERY: Readonly<InventoryReportQuery> = Object.freeze({
  period: Object.freeze({ from: '2026-09-04', to: '2026-09-10' }),
  search: '', sku: '', status: '', sortKey: 'sku', sortDirection: 'asc', page: 1, pageSize: 10,
});
export type InventoryReportDaily = { date: string } & Record<Exclude<InventoryReportNumericKey, 'actual' | 'difference'>, number>;
export type InventoryReportSummary = Record<InventoryReportNumericKey, number> & { needsReview: number; daily: InventoryReportDaily[] };
export type InventoryReportAdapter = ListDataAdapter<InventoryReportRow, InventoryReportQuery, InventoryReportSummary>;
export const inventoryDateLabel = (date: string) => date.split('-').reverse().join('/');
export const inventoryNumber = (value: number) => value.toLocaleString('vi-VN').replace('-', '−');
export const inventorySignedNumber = (value: number) => `${value > 0 ? '+' : ''}${inventoryNumber(value)}`;
