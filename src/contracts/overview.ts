/** S01 frontend-only view contracts. Backend DTO, dates, enums and permissions remain unbound. */
import { updateTableQuery } from '../shared/table-query';
import type { OverviewDocumentTarget } from './overview-document';
export interface OverviewPeriod { from: string; to: string }
export type OverviewSortKey = 'number' | 'type' | 'time' | 'actor' | 'quantity' | 'status';
export interface OverviewQuery {
  search: string;
  type: 'all' | 'inbound' | 'outbound';
  status: 'all' | 'waiting' | 'posted';
  sort: 'asc' | 'desc';
  sortKey: OverviewSortKey;
  page: number;
  pageSize: number;
  period: OverviewPeriod;
}

export const DEFAULT_OVERVIEW_QUERY: OverviewQuery = Object.freeze({
  search: '', type: 'all', status: 'all', sort: 'desc', sortKey: 'time', page: 1, pageSize: 4,
  period: Object.freeze({ from: '2026-09-01', to: '2026-09-30' }),
});

export interface OverviewPolicy {
  /** Enable only after a source/Owner decision; observed Web fields are number + actor. */
  searchMatch?: 'folded-includes' | null;
  allowPeriodChange?: boolean;
  pageSizeOptions?: readonly number[];
}

export interface OverviewRow {
  /** Exact destination in the same source snapshot; absent providers remain unavailable. */
  documentTarget?: OverviewDocumentTarget;
  id: string;
  number: string;
  type: 'inbound' | 'outbound';
  typeLabel: string;
  partner: string;
  warehouse: string;
  quantity: number;
  actor: string;
  day: string;
  time: string;
  timeLabel: string;
  /** Unit is only present when the source lines declare one consistently. */
  quantityUnit?: string;
  status: 'waiting' | 'posted';
  statusLabel: string;
}

export interface OverviewModel {
  query: OverviewQuery;
  rows: OverviewRow[];
  /** Same accepted warehouse/period snapshot, independent of activity filters and paging. */
  attention?: OverviewRow[];
  warehouseLabel?: string;
  summary: {
    inbound: number; outbound: number; stockTotal: null; stockDisplay: '—';
    stockHelp: string; openWarranties: number; posted: number; waiting: number;
  };
  chart: Array<{ label: string; inbound: number; outbound: number }>;
  pagination: {
    page: number; pageSize: number; pageCount: number; total: number;
    unfilteredTotal: number; start: number; end: number; pageSizeOptions: readonly number[];
  };
  emptyReason: 'no-documents' | 'no-matches' | null;
  source: {
    commit: string; documentVersion: string; provenance: 'SOURCE_FIXTURE' | 'QA_SYNTHETIC';
    evidence: 'INTERACTIVE_FIXTURE_VERIFIED'; snapshotId: string;
    fixtureRecordCount: number; backendMapping: null; endpoint: null; permissionKeys: null;
    businessDateField: null; timezone: null; sourceDayComparison: 'LEXICAL_INCLUSIVE';
    searchMatch: 'folded-includes' | null;
  };
}

export type OverviewBlocker =
  | 'STATE_NOT_SUPPLIED' | 'SEARCH_SEMANTICS_UNCONFIRMED' | 'PERIOD_CHANGE_UNCONFIRMED'
  | 'PERIOD_OUTSIDE_SNAPSHOT' | 'INVALID_PERIOD' | 'PAGE_SIZE_UNCONFIRMED'
  | 'PAGE_OUT_OF_RANGE' | 'INVALID_QUERY';

export type OverviewResult =
  | { kind: 'ready'; model: OverviewModel }
  | { kind: 'blocked'; reason: OverviewBlocker; detail: string; query: OverviewQuery };

export interface OverviewDataAdapter {
  read(query?: OverviewQuery, scenario?: string, context?: { signal?: AbortSignal }): Promise<OverviewResult>;
}

/** Owner 10/10: search/filter/period, sort and page-size updates reset to page one. */
export function updateOverviewQuery(current: OverviewQuery, patch: Partial<OverviewQuery>): OverviewQuery {
  return updateTableQuery(current, patch, { filterKeys: ['type', 'status', 'period'], sortKeys: ['sortKey', 'sort'], resetPageOnSort: true });
}

/** The S01 table reset keeps the shared period and restores the observed table defaults. */
export function resetOverviewTableQuery(current: OverviewQuery): OverviewQuery {
  return { ...DEFAULT_OVERVIEW_QUERY, period: { ...current.period } };
}
