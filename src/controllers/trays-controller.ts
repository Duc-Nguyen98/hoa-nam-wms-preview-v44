import { createListController } from '../shared/list-runtime';
import { createTraysFixtureAdapter } from '../data/adapters/trays-fixture-adapter';
import { DEFAULT_TRAYS_QUERY, type TraysAdapter } from '../contracts/trays';

/** Replace only this adapter when the S11 endpoint/DTO/permission contract is confirmed. */
export function createTraysController(adapter: TraysAdapter = createTraysFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: { ...DEFAULT_TRAYS_QUERY },
    queryOptions: { searchKey: 'search' },
  });
}
