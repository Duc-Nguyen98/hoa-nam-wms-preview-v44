import { createListController } from '../shared/list-runtime';
import { dateRangeBlocker } from '../shared/date-policy';
import { createOutboundReportFixtureAdapter } from '../data/adapters/outbound-report-fixture-adapter';
import { DEFAULT_OUTBOUND_REPORT_QUERY, type OutboundReportAdapter } from '../contracts/outbound-report';

/** Replace only the injected adapter after DEV confirms the API contract. */
export function createOutboundReportController(adapter: OutboundReportAdapter = createOutboundReportFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: structuredClone(DEFAULT_OUTBOUND_REPORT_QUERY),
    validate: query => dateRangeBlocker(query.period),
    queryOptions: { searchKey: 'search', filterKeys: ['period', 'customer', 'status'], sortKeys: ['sortKey', 'sortDirection'] },
  });
}
