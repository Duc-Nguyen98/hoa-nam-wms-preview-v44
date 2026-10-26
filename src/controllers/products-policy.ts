import { PAGE_SIZE_OPTIONS } from '../shared/table-query';
import { normalizeSearchText } from '../shared/search';
import { previewDateSortValue } from '../shared/screen-foundation';

/** Owner decision 10/10/2026: operations cover all seven supplied detail rows. */
export const PRODUCTS_RUNTIME_POLICY = Object.freeze({
  searchMatch: 'folded-includes' as const,
  searchFields: Object.freeze(['code', 'name'] as const),
  pageSizeOptions: PAGE_SIZE_OPTIONS,
  sortKeys: Object.freeze(['name', 'group', 'skuCount', 'unit', 'status', 'updatedAt'] as const),
  resetPageOnSort: true,
  summaryScope: 'catalogue' as const,
  queryScope: 'source-detail' as const,
});

export const normalizeProductsSearch = normalizeSearchText;

/** Reuse the confirmed shared preview date projection; never rewrite the source label. */
export function productsUpdatedValue(value: string): number {
  const projected = previewDateSortValue(value);
  if (projected === null) throw new Error('S03 update timestamp is invalid');
  return Date.parse(projected);
}
