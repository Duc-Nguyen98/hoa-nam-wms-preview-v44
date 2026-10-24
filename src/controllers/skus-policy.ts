import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../shared/table-query';

/** Owner decision 10/10/2026. Query scope is the supplied detail rows, not the catalogue aggregate. */
export const SKUS_RUNTIME_POLICY = Object.freeze({
  searchMatch: 'folded-includes' as const,
  defaultPageSize: DEFAULT_PAGE_SIZE,
  pageSizeOptions: PAGE_SIZE_OPTIONS,
  queryScope: 'provided-source-rows' as const,
  sortKeys: Object.freeze(['code', 'group', 'unit', 'barcode', 'status', 'updatedAt'] as const),
  defaultSort: null,
});
