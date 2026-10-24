import { DEFAULT_PAGE_SIZE, updateTableQuery } from '../shared/table-query';
import type { TableQueryPagination } from '../shared/table-query';
import type { ListSourceInfo } from '../shared/list-runtime';

/** S05 frontend view contract; owner decision 10/10/2026, not a backend DTO. */
export const RECIPIENT_SORT_KEYS = ['name', 'type', 'market', 'contact', 'address', 'statusLabel'] as const;
export type RecipientSortKey = typeof RECIPIENT_SORT_KEYS[number];
export interface RecipientSort { key: RecipientSortKey; direction: 'asc' | 'desc' }
export interface RecipientsQuery {
  search: string;
  type: string;
  status: 'all' | 'active' | 'inactive';
  sort: RecipientSort | null;
  page: number;
  pageSize: number;
}
export const DEFAULT_RECIPIENTS_QUERY: Readonly<RecipientsQuery> = Object.freeze({search:'',type:'all',status:'all',sort:null,page:1,pageSize:DEFAULT_PAGE_SIZE});
export interface RecipientRow {
  key: string; code: string; name: string; type: string; market: string; area: string;
  contact: string; phone: string; address: string; status: 'active' | 'inactive'; statusLabel: string;
}
export interface RecipientsModel {
  query: RecipientsQuery;
  rows: RecipientRow[];
  summary: { total: number; staticLabels: string[]; scope: 'catalogue-audit-snapshot'; auditDate: string; statusCounts: null };
  pagination: TableQueryPagination;
  filterOptions: { observedTypes: string[] };
  detailCompleteness: 'PARTIAL_ROWS_ONLY';
  source: ListSourceInfo & {
    contractId: string; fixtureVersion: string; referenceRevision: 'P01_r02'; referenceSnapshot: string;
    rowProvenance: 'PROPOSED_FIXTURE' | 'QA_SYNTHETIC'; totalProvenance: 'SOURCE_FIXTURE'; recordCount: number;
    queryScope: 'supplied-detail-records' | 'qa-60'; catalogueComplete: false;
    defaultPageComplete: true; isLiveData: false; productionMatchVerified: false;
    backendMapping: null; endpoint: null; permissionKeys: null; enumMapping: null; recipientIdMapping: null;
    geographyMapping: 'BLOCKED_BY_SOURCE_CONFLICT'; searchMatch: 'substring-normalized-vi'; sortKey: RecipientSortKey | null; summaryAfterFilter: 'unchanged-catalogue-audit';
  };
}
export type RecipientsResult =
  | { kind: 'ready'; model: RecipientsModel }
  | { kind: 'blocked'; reason: 'INVALID_QUERY' | 'PAGE_OUT_OF_RANGE'; query: RecipientsQuery; detail: string }
  | { kind: 'missing-fixture'; reason: 'STATE_NOT_SUPPLIED' | 'PAGE_NOT_SUPPLIED' | 'SEARCH_FIXTURE_INCOMPLETE' | 'FILTER_FIXTURE_INCOMPLETE'; evidence: 'BLOCKED_MISSING_FIXTURE'; query: RecipientsQuery; detail: string };
export interface RecipientsDataAdapter { read(query?: RecipientsQuery, scenario?: string, context?: { signal?: AbortSignal }): Promise<RecipientsResult> }
export function updateRecipientsQuery(current: RecipientsQuery, patch: Partial<RecipientsQuery>): RecipientsQuery {
  return updateTableQuery(current, patch, { filterKeys: ['type', 'status'], resetPageOnSort: true, sortKeys: ['sort'] });
}
export const resetRecipientsQuery = (): RecipientsQuery => ({...DEFAULT_RECIPIENTS_QUERY});
