import { DEFAULT_PAGE_SIZE, updateTableQuery, type TableQueryPagination } from '../shared/table-query';

/** Frontend fixture contract only; codes are not confirmed backend identities. */
export const PV_SORT_KEYS = ['product', 'productCode', 'sku', 'group', 'visibility', 'updated'] as const;
export type PvSortKey = typeof PV_SORT_KEYS[number];
export interface PvQuery {
  search: string;
  group: string;
  visibility: string;
  sortKey: PvSortKey;
  sort: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
export const DEFAULT_PV_QUERY: Readonly<PvQuery> = Object.freeze({ search: '', group: 'all', visibility: 'all', sortKey: 'updated', sort: 'desc', page: 1, pageSize: DEFAULT_PAGE_SIZE });
export interface PvProduct {
  key: string;
  productName: string;
  productCode: string;
  sku: string;
  productGroup: string;
  visibilityLabel: string;
  updatedAtLabel: string;
  missingImage: boolean;
  thumbnailUrl: null;
}
export interface PvModel {
  query: PvQuery;
  rows: PvProduct[];
  summary: { total: number; visible: number; hidden: number; missingImage: number };
  pagination: TableQueryPagination;
  scope: { kind: 'source-detail' | 'qa-synthetic'; total: number };
  filterOptions: { groups: readonly string[]; visibility: readonly string[] };
  profile: { displayName: string; initials: string };
}
export type PvResult = { kind: 'ready'; model: PvModel } | {
  kind: 'blocked' | 'missing-fixture';
  reason: 'INVALID_QUERY' | 'STATE_NOT_SUPPLIED' | 'PAGE_OUT_OF_RANGE' | 'INCOMPLETE_SOURCE';
  query: PvQuery;
  detail: string;
};
export interface PvDataAdapter { read(query?: PvQuery, scenario?: string, context?: { signal?: AbortSignal }): Promise<PvResult> }
export interface PvDataset {
  rows: readonly PvProduct[];
  summary: PvModel['summary'];
  kind: PvModel['scope']['kind'];
}
export function updatePvQuery(current: PvQuery, patch: Partial<PvQuery>): PvQuery {
  return updateTableQuery(current, patch, { filterKeys: ['group', 'visibility'], resetPageOnSort: true, sortKeys: ['sortKey', 'sort'] });
}
