import seed from '../fixtures/S26.seed.json';
import { createListFixtureAdapter } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { parseIsoDate } from '../../shared/date-picker-calendar';
import { TRACE_SORT_KEYS, TRACE_STATUSES, type TraceAdapter, type TraceQuery, type TraceRow, type TraceSummary } from '../../contracts/goods-trace-report';

/** Scenario injection is DEV-only; approved whole-period summary is independent. */
export function createTraceRowsAdapter(rows: readonly TraceRow[], sourceId: string): TraceAdapter {
  return createListFixtureAdapter<TraceRow, TraceQuery, TraceSummary>({
    sourceId, source: { rows: structuredClone([...rows]), completeness: 'complete', scope: 'detail', total: rows.length, aggregateTotal: seed.summary.total },
    summary: seed.summary, filterOptions: { status: row => row.status },
    search: query => ({ value: query.search, fields: [row => row.sku, row => row.name, row => row.serial, row => row.lot, row => row.pallet] }),
    filters: query => [row => !query.status || row.status === query.status, row => !query.needsReview || row.status === 'Cần kiểm tra'],
    sort: query => query.sortKey === null ? undefined : ({
      type: query.sortKey === 'updatedAt' ? 'date' : query.sortKey === 'completeness' ? 'number' : ['sku', 'serial', 'lot', 'pallet'].includes(query.sortKey) ? 'code' : 'text',
      direction: query.sortDirection, value: row => row[query.sortKey!],
    }),
    validate: query => {
      if (typeof query.search !== 'string' || query.codeType !== '' || typeof query.needsReview !== 'boolean'
        || !Number.isSafeInteger(query.page) || query.page < 1 || !PAGE_SIZE_OPTIONS.some(size => size === query.pageSize)
        || (query.status !== '' && !TRACE_STATUSES.includes(query.status))
        || (query.sortKey !== null && !TRACE_SORT_KEYS.includes(query.sortKey)) || !['asc', 'desc'].includes(query.sortDirection)
        || !query.period || !parseIsoDate(query.period.from) || !parseIsoDate(query.period.to) || query.period.from > query.period.to) {
        return { reason: 'INVALID_QUERY', detail: 'S26 query has an unsourced option, invalid range or sort/paging value.' };
      }
      if (query.period.from !== seed.period.from || query.period.to !== seed.period.to) return { reason: 'MISSING_PERIOD_SNAPSHOT', detail: 'Only 04–10/09/2026 is sourced; daily chart does not supply arbitrary sub-period snapshots.' };
      return null;
    },
  });
}
export function createTraceFixtureAdapter(): TraceAdapter {
  return createTraceRowsAdapter(seed.rows as TraceRow[], 'S26_P09_P01_FULL_OWNER_SELECTED_2026_10_13');
}
