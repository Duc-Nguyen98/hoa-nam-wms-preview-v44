import { createListController } from '../shared/list-runtime';
import { createPartsFixtureAdapter } from '../data/adapters/parts-slips-fixture-adapter';
import { DEFAULT_PARTS_QUERY, type PartsAdapter } from '../contracts/parts-slips';

export function createPartsController(adapter: PartsAdapter = createPartsFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: { ...DEFAULT_PARTS_QUERY },
    queryOptions: { filterKeys: ['status'], sortKeys: ['sort'], resetPageOnSort: true },
  });
}
