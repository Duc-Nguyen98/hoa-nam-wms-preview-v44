import type { ListDataAdapter, ListModel } from '../shared/list-runtime';

/** Preview model, NOT a backend DTO or production permission declaration. */
export interface ReceiptsQuery {
  search: string;
  status: string;
  source: string;
  sort: 'updated-desc' | 'updated-asc';
  page: number;
  pageSize: number;
}
export const DEFAULT_RECEIPTS_QUERY: Readonly<ReceiptsQuery> = Object.freeze({
  search: '', status: '', source: '', sort: 'updated-desc', page: 1, pageSize: 10,
});
export interface ReceiptRow {
  receipt: string;
  source: string;
  reference: string;
  skuCount: number;
  codeCount: number;
  creator: string;
  status: string;
  updatedAt: string;
  action: string;
}
export interface ReceiptsSummary {
  totalReceipts: number;
  received: number;
  draft: number;
  recording: number;
  percentage: string;
  scannedCodeAggregate: number;
}
export type ReceiptsModel = ListModel<ReceiptRow, ReceiptsQuery, ReceiptsSummary>;
export type ReceiptsAdapter = ListDataAdapter<ReceiptRow, ReceiptsQuery, ReceiptsSummary>;
