import { createListController } from '../shared/list-runtime';
import { createWarrantyFixtureAdapter } from '../data/adapters/warranty-cases-fixture-adapter';
import { DEFAULT_WARRANTY_QUERY, type WarrantyAdapter } from '../contracts/warranty-cases';

/** Shared 250ms debounce, intent fencing and accepted-model rollback. */
export function createWarrantyController(adapter: WarrantyAdapter = createWarrantyFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: { ...DEFAULT_WARRANTY_QUERY },
    queryOptions: { filterKeys: ['status', 'identity', 'due'], sortKeys: ['sort'], resetPageOnSort: true },
  });
}
