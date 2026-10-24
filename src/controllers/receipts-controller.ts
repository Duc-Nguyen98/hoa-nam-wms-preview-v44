import { createListController } from '../shared/list-runtime';
import { createReceiptsFixtureAdapter } from '../data/adapters/receipts-fixture-adapter';
import { DEFAULT_RECEIPTS_QUERY, type ReceiptsAdapter } from '../contracts/receipts';

/** Replace this adapter after endpoint, DTO, query scope and permissions are confirmed. */
export function createReceiptsController(adapter: ReceiptsAdapter = createReceiptsFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: { ...DEFAULT_RECEIPTS_QUERY },
    queryOptions: { searchKey: 'search', filterKeys: ['status', 'source'], sortKeys: ['sort'] },
  });
}
