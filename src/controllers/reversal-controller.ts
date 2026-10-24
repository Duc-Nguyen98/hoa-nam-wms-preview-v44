import { createListController } from '../shared/list-runtime';
import { createReversalFixtureAdapter } from '../data/adapters/reversal-fixture-adapter';
import { DEFAULT_REVERSAL_QUERY, type ReversalAdapter } from '../contracts/reversal-slips';

/** Future API adapter injection boundary. No endpoint or write operation is present. */
export function createReversalController(adapter: ReversalAdapter = createReversalFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: { ...DEFAULT_REVERSAL_QUERY },
    queryOptions: { searchKey: 'search', filterKeys: ['status'], sortKeys: ['sortKey', 'sortDirection'] },
  });
}
