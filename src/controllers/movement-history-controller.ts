import { dateRangeBlocker } from '../shared/date-policy';
import { createListController } from '../shared/list-runtime';
import { createMovementFixtureAdapter } from '../data/adapters/movement-history-fixture-adapter';
import { DEFAULT_MOVEMENT_QUERY, type MovementAdapter } from '../contracts/movement-history';

/** DEV replaces the adapter after confirming endpoints/DTOs/permission; no UI fixture imports. */
export function createMovementController(adapter: MovementAdapter = createMovementFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: structuredClone(DEFAULT_MOVEMENT_QUERY),
    validate: query => dateRangeBlocker(query.period),
    queryOptions: { searchKey:'search', filterKeys:['period','type','performer'], sortKeys:['sortKey','sortDirection'] },
  });
}
