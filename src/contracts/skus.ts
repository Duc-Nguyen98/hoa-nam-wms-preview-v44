import { DEFAULT_PAGE_SIZE, updateTableQuery, type TableQueryPagination } from '../shared/table-query';

/** S04 frontend preview contracts. These are not backend DTOs or permissions. */
export type SkuStatus = 'active' | 'inactive';
export type SkusSortKey = 'code' | 'group' | 'unit' | 'barcode' | 'status' | 'updatedAt';

export interface SkusQuery {
  search: string;
  group: string;
  status: 'all' | SkuStatus;
  unit: string;
  sortKey: SkusSortKey;
  sort: 'asc' | 'desc' | null;
  page: number;
  pageSize: number;
}

export const DEFAULT_SKUS_QUERY: SkusQuery = Object.freeze({
  search: '', group: 'all', status: 'all', unit: 'all', sortKey: 'code', sort: null, page: 1, pageSize: DEFAULT_PAGE_SIZE,
});

export interface SkuRow {
  /** Stable render key from the supplied code; not a backend entity or relation ID. */
  key: string;
  code: string;
  name: string;
  group: string;
  unit: string;
  /** Source text preserved verbatim; no barcode validation or numeric normalization is inferred. */
  barcode: string;
  status: SkuStatus;
  statusLabel: string;
  updatedAt: string;
}

export interface SkusModel {
  query: SkusQuery;
  rows: SkuRow[];
  summary: {
    skusTotal: number;
    active: number;
    inactive: number;
    activePercentage: string;
    inactivePercentage: string;
    scope: 'catalogue';
  };
  pagination: TableQueryPagination;
  filterOptions: {
    /** Unique values from the entire accepted detail dataset, independent of its current page/filter. */
    groups: readonly string[];
    units: readonly string[];
  };
  detailCompleteness: 'PARTIAL_ROWS_ONLY' | 'QA_SYNTHETIC_RECORDS';
  source: {
    id: string;
    scope: 'detail';
    completeness: 'complete';
    detailTotal: number;
    contractId: string;
    fixtureVersion: string;
    referenceRevision: string;
    referenceSnapshot: string;
    provenance: 'SOURCE_FIXTURE' | 'QA_SYNTHETIC';
    evidence: 'INTERACTIVE_FIXTURE_VERIFIED';
    fixtureRecordCount: number;
    aggregateTotal: number;
    isLiveData: false;
    productionMatchVerified: false;
    backendMapping: null;
    enumMapping: null;
    permissionKeys: null;
    endpoint: null;
    relationBinding: null;
    searchMatch: 'folded-includes';
    sortKey: SkusSortKey | null;
    sortDirection: 'asc' | 'desc' | null;
    filterOptionsComplete: false;
    queryScope: 'provided-source-rows' | 'qa-rows';
    filterOptionsScope: 'whole-query-dataset';
  };
}

export type SkusBlocker =
  | 'PAGE_OUT_OF_RANGE'
  | 'INVALID_QUERY';

export type SkusMissingFixtureReason =
  | 'STATE_NOT_SUPPLIED';

export type SkusResult =
  | { kind: 'ready'; model: SkusModel }
  | { kind: 'blocked'; reason: SkusBlocker; detail: string; query: SkusQuery }
  | { kind: 'missing-fixture'; reason: SkusMissingFixtureReason; evidence: 'BLOCKED_MISSING_FIXTURE'; detail: string; query: SkusQuery };

export interface SkusDataAdapter {
  read(query?: SkusQuery, scenario?: string, context?: { signal?: AbortSignal }): Promise<SkusResult>;
}

export function updateSkusQuery(current: SkusQuery, patch: Partial<SkusQuery>): SkusQuery {
  return updateTableQuery(current, patch, { filterKeys: ['group', 'status', 'unit'], resetPageOnSort: true, sortKeys: ['sortKey', 'sort'] });
}

export function resetSkusTableQuery(): SkusQuery {
  return { ...DEFAULT_SKUS_QUERY };
}
