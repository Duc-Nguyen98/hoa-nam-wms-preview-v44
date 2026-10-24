import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, updateTableQuery } from '../shared/table-query';

/** S03 frontend preview contracts. These are not backend DTOs or permissions. */
export type ProductStatus = 'active' | 'inactive';
export type ProductSortKey = 'name' | 'group' | 'skuCount' | 'unit' | 'status' | 'updatedAt';

export interface ProductsQuery {
  search: string;
  group: string;
  status: 'all' | ProductStatus;
  unit: string;
  sortKey: ProductSortKey | null;
  sort: 'asc' | 'desc' | null;
  page: number;
  pageSize: number;
}

export const DEFAULT_PRODUCTS_QUERY: ProductsQuery = Object.freeze({
  search: '', group: 'all', status: 'all', unit: 'all', sortKey: null, sort: null, page: 1, pageSize: DEFAULT_PAGE_SIZE,
});

export interface ProductRow {
  /** Stable render key from the supplied code; not a backend entity or relation ID. */
  key: string;
  code: string;
  name: string;
  group: string;
  skuCount: number;
  unit: string;
  status: ProductStatus;
  statusLabel: string;
  updatedAt: string;
}

export interface ProductsModel {
  query: ProductsQuery;
  rows: ProductRow[];
  summary: {
    productsTotal: number;
    linkedSkus: number;
    active: number;
    inactive: number;
    activePercentage: string;
    inactivePercentage: string;
    scope: 'catalogue';
  };
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
    unfilteredTotal: number;
    start: number;
    end: number;
    pageSizeOptions: typeof PAGE_SIZE_OPTIONS;
  };
  filterOptions: {
    /** Unique values from the entire Owner-approved detail scope, before any query. */
    groups: readonly string[];
    units: readonly string[];
  };
  detailCompleteness: 'PARTIAL_ROWS_ONLY';
  interactionScope: {
    kind: 'source-detail' | 'qa60';
    recordCount: number;
    completeness: 'COMPLETE_WITHIN_CONFIRMED_SCOPE';
  };
  source: {
    /** Shared list metadata describes the approved detail scope, not a backend entity. */
    id: string;
    scope: 'detail';
    completeness: 'complete';
    detailTotal: number;
    contractId: string;
    fixtureVersion: string;
    referenceRevision: string;
    referenceSnapshot: string;
    provenance: 'SOURCE_FIXTURE' | 'QA_SYNTHETIC';
    evidence: 'SOURCE_FIXTURE' | 'QA_SCENARIO';
    fixtureRecordCount: number;
    aggregateTotal: number;
    isLiveData: false;
    productionMatchVerified: false;
    backendMapping: null;
    enumMapping: null;
    permissionKeys: null;
    endpoint: null;
    skuRelationBinding: null;
    searchMatch: 'folded-includes';
    sortKey: ProductSortKey | null;
    sortDirection: 'asc' | 'desc' | null;
    filterOptionsComplete: false;
    filterOptionsScope: 'ALL_DETAIL_ROWS';
  };
}

export type ProductsBlocker =
  | 'PAGE_OUT_OF_RANGE'
  | 'INVALID_QUERY';

export type ProductsMissingFixtureReason =
  | 'STATE_NOT_SUPPLIED';

export type ProductsResult =
  | { kind: 'ready'; model: ProductsModel }
  | { kind: 'blocked'; reason: ProductsBlocker; detail: string; query: ProductsQuery }
  | { kind: 'missing-fixture'; reason: ProductsMissingFixtureReason; evidence: 'BLOCKED_MISSING_FIXTURE'; detail: string; query: ProductsQuery };

export interface ProductsDataAdapter {
  read(query?: ProductsQuery, scenario?: string, context?: { signal?: AbortSignal }): Promise<ProductsResult>;
}

export function updateProductsQuery(current: ProductsQuery, patch: Partial<ProductsQuery>): ProductsQuery {
  return updateTableQuery(current, patch, {
    filterKeys: ['group', 'status', 'unit'], resetPageOnSort: true, sortKeys: ['sortKey', 'sort'],
  });
}

export function resetProductsTableQuery(): ProductsQuery {
  return { ...DEFAULT_PRODUCTS_QUERY };
}
