import type { ListDataAdapter, ListModel } from '../shared/list-runtime';

/** Frontend Default snapshot contract; not a backend DTO or permission grant. */
export interface OutboundSlipsQuery {
  search: string;
  status: string;
  recipient: string;
  sort?: 'created-desc' | 'created-asc';
  page: number;
  pageSize: number;
}

export const DEFAULT_OUTBOUND_SLIPS_QUERY: Readonly<OutboundSlipsQuery> = Object.freeze({
  search: '', status: '', recipient: '', sort: 'created-desc', page: 1, pageSize: 10,
});

export interface OutboundSlipRow {
  issueCode: string;
  requestCode: string;
  recipient: string;
  createdAt: string;
  note: string;
  reconciliation: string;
  status: string;
  action: string;
}

export interface OutboundSlipsSummary {
  totalDocuments: number;
  draftDocuments: number;
  scanningDocuments: number;
  exportedDocuments: number;
  cancelledDocuments: number;
}

export type OutboundSlipsModel = ListModel<OutboundSlipRow, OutboundSlipsQuery, OutboundSlipsSummary>;
export type OutboundSlipsAdapter = ListDataAdapter<OutboundSlipRow, OutboundSlipsQuery, OutboundSlipsSummary>;
