import { createListController } from '../shared/list-runtime';
import { createInventoryFixtureAdapter } from '../data/adapters/inventory-fixture-adapter';
import { DEFAULT_INVENTORY_QUERY, type InventoryAdapter } from '../contracts/inventory-reconciliation';

/** API adapter replacement point; no endpoint, DTO or permission mapping is assumed. */
export function createInventoryController(adapter: InventoryAdapter = createInventoryFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: { ...DEFAULT_INVENTORY_QUERY },
    queryOptions: { searchKey: 'search', filterKeys: ['itemType', 'stockStatus'], sortKeys: ['sortKey', 'sortDirection'] },
  });
}
