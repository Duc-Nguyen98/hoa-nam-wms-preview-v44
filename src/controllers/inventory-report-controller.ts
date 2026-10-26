import { dateRangeBlocker } from '../shared/date-policy';
import { createListController } from '../shared/list-runtime';
import { createInventoryReportFixtureAdapter } from '../data/adapters/inventory-report-fixture-adapter';
import { DEFAULT_INVENTORY_REPORT_QUERY, type InventoryReportAdapter } from '../contracts/inventory-report';

/** DEV replaces the injected adapter after confirming endpoint, DTO and permissions. */
export function createInventoryReportController(adapter: InventoryReportAdapter = createInventoryReportFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: structuredClone(DEFAULT_INVENTORY_REPORT_QUERY),
    validate: query => dateRangeBlocker(query.period),
    queryOptions: { searchKey: 'search', filterKeys: ['period', 'sku', 'status'], sortKeys: ['sortKey', 'sortDirection'] },
  });
}
