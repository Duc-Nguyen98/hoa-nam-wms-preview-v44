import { dateRangeBlocker } from '../shared/date-policy';
import { createListController } from '../shared/list-runtime';
import { createDealerExportFixtureAdapter } from '../data/adapters/dealer-export-fixture-adapter';
import { DEFAULT_DEALER_EXPORT_QUERY, type DealerExportAdapter } from '../contracts/dealer-export-report';

export function createDealerExportController(adapter: DealerExportAdapter = createDealerExportFixtureAdapter()) {
  const controller = createListController(adapter, {
    initialQuery: structuredClone(DEFAULT_DEALER_EXPORT_QUERY),
    validate: query => dateRangeBlocker(query.period),
    queryOptions: { searchKey: 'search', filterKeys: ['period', 'dealer', 'status'], sortKeys: ['sortKey', 'sortDirection'] },
  });
  return { ...controller, resetDefault() {
    const state = controller.getSnapshot();
    const pageSize = state.intendedQuery?.pageSize ?? state.acceptedQuery?.pageSize ?? 10;
    return controller.reset({ ...structuredClone(DEFAULT_DEALER_EXPORT_QUERY), pageSize });
  } };
}
