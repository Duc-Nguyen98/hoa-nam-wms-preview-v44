import { dateRangeBlocker } from '../shared/date-policy';
import { createListController } from '../shared/list-runtime';
import { createDataQualityFixtureAdapter } from '../data/adapters/data-quality-fixture-adapter';
import { DEFAULT_DATA_QUALITY_QUERY, type DataQualityAdapter } from '../contracts/data-quality-report';
import { trackListRead } from '../data/read-diagnostics';

export function createDataQualityController(adapter: DataQualityAdapter = createDataQualityFixtureAdapter()) {
  const diagnosedAdapter: DataQualityAdapter = {
    read(query, context) { return trackListRead('S24', () => adapter.read(query, context)); },
  };
  return createListController(diagnosedAdapter, {
    initialQuery: structuredClone(DEFAULT_DATA_QUALITY_QUERY),
    validate: query => dateRangeBlocker(query.period),
    queryOptions: { searchKey: 'search', filterKeys: ['period', 'dataType', 'result', 'needsReview'], sortKeys: ['sortKey', 'sortDirection'] },
  });
}
