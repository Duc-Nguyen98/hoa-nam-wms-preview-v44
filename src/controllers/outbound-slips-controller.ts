import { createListController } from '../shared/list-runtime';
import { createOutboundSlipsFixtureAdapter } from '../data/adapters/outbound-slips-fixture-adapter';
import { DEFAULT_OUTBOUND_SLIPS_QUERY, type OutboundSlipsAdapter } from '../contracts/outbound-slips';

/** Replace with the agreed API adapter after endpoint, DTO, status and permission mapping are confirmed. */
export function createOutboundSlipsController(adapter: OutboundSlipsAdapter = createOutboundSlipsFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: { ...DEFAULT_OUTBOUND_SLIPS_QUERY },
    queryOptions: { searchKey: 'search', filterKeys: ['status', 'recipient'], sortKeys: ['sort'] },
  });
}
