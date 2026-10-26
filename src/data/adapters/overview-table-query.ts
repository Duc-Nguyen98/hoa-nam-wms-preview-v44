import type { OverviewQuery, OverviewRow } from '../../contracts/overview';
import { queryTable } from '../../shared/table-query';
import { SCREEN_FOUNDATION, screenSearch, screenSort } from '../../shared/screen-foundation';

export { normalizeSearchText as foldOverviewSearch } from '../../shared/search';

/** The same S01 table pipeline is used by the source adapter and isolated DEV QA. */
export function queryOverviewRows(sourceRows: readonly OverviewRow[], query: OverviewQuery) {
  const inPeriod = sourceRows.filter(row => row.day >= query.period.from && row.day <= query.period.to);
  return queryTable({
    pageSizeOptions: [4, 10, 15, 25, 50],
    source: { rows: inPeriod, scope: 'detail', completeness: 'complete', total: inPeriod.length },
    query,
    filter: row => (query.type === 'all' || row.type === query.type) &&
      (query.status === 'all' || row.status === query.status),
    search: screenSearch(SCREEN_FOUNDATION.S01, query.search),
    sort: screenSort(SCREEN_FOUNDATION.S01, query.sortKey, query.sort),
    stableId: row => row.id,
  });
}
