import { createListController } from '../shared/list-runtime';
import { dateRangeBlocker } from '../shared/date-policy';
import { createInboundReportFixtureAdapter } from '../data/adapters/inbound-report-fixture-adapter';
import { DEFAULT_INBOUND_REPORT_QUERY, type InboundReportAdapter } from '../contracts/inbound-report';

/** Inject a future contract-confirmed API adapter here; never import fixtures in UI. */
export function createInboundReportController(adapter: InboundReportAdapter = createInboundReportFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: structuredClone(DEFAULT_INBOUND_REPORT_QUERY),
    validate: query => dateRangeBlocker(query.period),
    queryOptions: { searchKey: 'search', filterKeys: ['period', 'supplier', 'status'], sortKeys: ['sortKey', 'sortDirection'] },
  });
}
