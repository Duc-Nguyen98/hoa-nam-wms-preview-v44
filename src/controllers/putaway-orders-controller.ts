import { createListController } from '../shared/list-runtime';
import { createPutawayOrdersFixtureAdapter } from '../data/adapters/putaway-orders-fixture-adapter';
import { DEFAULT_PUTAWAY_ORDERS_QUERY, type PutawayOrdersAdapter } from '../contracts/putaway-orders';

/** Inject the API adapter here only after DEV agrees the missing contracts. */
export function createPutawayOrdersController(adapter: PutawayOrdersAdapter = createPutawayOrdersFixtureAdapter()) {
  return createListController(adapter, { initialQuery: { ...DEFAULT_PUTAWAY_ORDERS_QUERY }, queryOptions: { searchKey: 'search', filterKeys: ['status', 'sourceReceipt'] } });
}
