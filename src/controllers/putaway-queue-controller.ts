import { createListController } from '../shared/list-runtime';
import { createPutawayQueueFixtureAdapter } from '../data/adapters/putaway-queue-fixture-adapter';
import { DEFAULT_PUTAWAY_QUEUE_QUERY, type PutawayQueueAdapter } from '../contracts/putaway-queue';

/** Replace the injected adapter only after query/DTO/permission contracts are agreed. */
export function createPutawayQueueController(adapter: PutawayQueueAdapter = createPutawayQueueFixtureAdapter()) {
  return createListController(adapter, { initialQuery: { ...DEFAULT_PUTAWAY_QUEUE_QUERY }, queryOptions: { searchKey: 'search', filterKeys: ['status', 'receiptCode'] } });
}
