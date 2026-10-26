import { createListController } from '../shared/list-runtime';
import { createWarrantyPartsDetailFixtureAdapter } from '../data/adapters/warranty-parts-detail-fixture-adapter';
import { DEFAULT_WARRANTY_DETAIL_QUERY, type WarrantyDetailAdapter } from '../contracts/warranty-parts-detail';

export function createWarrantyPartsDetailController(adapter: WarrantyDetailAdapter = createWarrantyPartsDetailFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: structuredClone(DEFAULT_WARRANTY_DETAIL_QUERY),
    queryOptions: { searchKey: 'search', filterKeys: ['status'], sortKeys: ['sortKey', 'sortDirection'] },
  });
}
