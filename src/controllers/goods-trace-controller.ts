import { dateRangeBlocker } from '../shared/date-policy';
import { createListController } from '../shared/list-runtime';
import { createTraceFixtureAdapter } from '../data/adapters/goods-trace-fixture-adapter';
import { DEFAULT_TRACE_QUERY, type TraceAdapter } from '../contracts/goods-trace-report';
export function createTraceController(adapter: TraceAdapter = createTraceFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: structuredClone(DEFAULT_TRACE_QUERY),
    validate: query => dateRangeBlocker(query.period),
    queryOptions: { searchKey: 'search', filterKeys: ['period', 'codeType', 'status', 'needsReview'], sortKeys: ['sortKey', 'sortDirection'] },
  });
}
