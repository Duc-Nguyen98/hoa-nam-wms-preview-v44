import { dateRangeBlocker } from '../shared/date-policy';
import { createListController } from '../shared/list-runtime';
import { createLabelReportFixtureAdapter } from '../data/adapters/label-report-fixture-adapter';
import { DEFAULT_LABEL_REPORT_QUERY, type LabelReportAdapter } from '../contracts/label-report';

export function createLabelReportController(adapter: LabelReportAdapter = createLabelReportFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: structuredClone(DEFAULT_LABEL_REPORT_QUERY),
    validate: query => dateRangeBlocker(query.period),
    queryOptions: { searchKey: 'search', filterKeys: ['period', 'status'], sortKeys: ['sortKey', 'sortDirection'] },
  });
}
