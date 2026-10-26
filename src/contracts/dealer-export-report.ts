import type { ListDataAdapter } from '../shared/list-runtime';

/** Frontend view contract. Names and rowKey are NOT backend dealer identities. */
export interface DealerExportRow {
  rowKey: string;
  dealer: string;
  recipient: string;
  documents: number;
  products: number;
  completed: number;
  incomplete: number;
  lastExport: string;
}
export interface DealerExportSummary {
  documents: number; completed: number; incomplete: number; dealers: number;
  top: { dealer: string; documents: number; completed: number; incomplete: number }[];
}
export const DEALER_EXPORT_SORT_KEYS = ['documents', 'products', 'lastExport'] as const;
export type DealerExportSortKey = typeof DEALER_EXPORT_SORT_KEYS[number];
export interface DealerExportQuery {
  search: string; dealer: string; status: '';
  period: { from: string; to: string };
  sortKey: DealerExportSortKey; sortDirection: 'asc' | 'desc';
  page: number; pageSize: number;
}
export type DealerExportAdapter = ListDataAdapter<DealerExportRow, DealerExportQuery, DealerExportSummary>;
export const DEFAULT_DEALER_EXPORT_QUERY: Readonly<DealerExportQuery> = Object.freeze({
  search: '', dealer: '', status: '', period: Object.freeze({ from: '2026-09-04', to: '2026-09-10' }),
  sortKey: 'documents', sortDirection: 'desc', page: 1, pageSize: 10,
});
export const dealerExportDate = (iso: string) => iso.split('-').reverse().join('/');
export const dealerExportPeriod = (period: DealerExportQuery['period']) => `${dealerExportDate(period.from)} – ${dealerExportDate(period.to)}`;
export const dealerExportPercent = (value: number, total: number) => total > 0
  ? `${(value / total * 100).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : '—';
