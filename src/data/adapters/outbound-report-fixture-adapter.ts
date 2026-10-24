import seed from '../fixtures/S19.seed.json';
import { createListFixtureAdapter } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { parseIsoDate } from '../../shared/date-picker-calendar';
import { OUTBOUND_REPORT_SORT_KEYS, OUTBOUND_REPORT_STATUSES, type OutboundReportAdapter, type OutboundReportQuery, type OutboundReportRow, type OutboundReportSummary } from '../../contracts/outbound-report';

/** Summary and charts are independent snapshots, never calculated from table results. */
export function createOutboundReportRowsAdapter(input: readonly OutboundReportRow[], sourceId: string): OutboundReportAdapter {
  const rows = structuredClone([...input]);
  const customers = new Set(rows.map(row => row.customer));
  return createListFixtureAdapter<OutboundReportRow, OutboundReportQuery, OutboundReportSummary>({
    sourceId,
    source: { rows, completeness: 'complete', scope: 'detail', total: rows.length, aggregateTotal: seed.summary.receipts },
    summary: seed.summary as OutboundReportSummary,
    optionCatalogue: { status: seed.statusOptions },
    filterOptions: { customer: row => row.customer },
    search: query => ({ value: query.search, fields: [row => row.code, row => row.customer] }),
    filters: query => [row => !query.customer || row.customer === query.customer, row => !query.status || row.status === query.status],
    sort: query => ({
      type: query.sortKey === 'shippedQuantity' ? 'number' : query.sortKey === 'shippedDate' ? 'date' : query.sortKey === 'code' ? 'code' : 'text',
      direction: query.sortDirection, value: row => row[query.sortKey],
    }),
    // Omit stableId: the shared stable fallback preserves supplied order for ties.
    validate: query => {
      if (typeof query.search !== 'string' || !Number.isSafeInteger(query.page) || query.page < 1
        || !PAGE_SIZE_OPTIONS.some(size => size === query.pageSize)
        || (query.status !== '' && !OUTBOUND_REPORT_STATUSES.includes(query.status))
        || (query.customer !== '' && !customers.has(query.customer))
        || !OUTBOUND_REPORT_SORT_KEYS.includes(query.sortKey) || !['asc', 'desc'].includes(query.sortDirection)
        || !query.period || !parseIsoDate(query.period.from) || !parseIsoDate(query.period.to) || query.period.from > query.period.to) {
        return { reason: 'INVALID_QUERY', detail: 'Điều kiện không thuộc lựa chọn hợp lệ của S19.' };
      }
      if (query.period.from !== seed.period.from || query.period.to !== seed.period.to) {
        return { reason: 'MISSING_PERIOD_SNAPSHOT', detail: 'S19 chỉ có snapshot 04/09/2026–10/09/2026; không suy khoảng con từ chuỗi sản lượng.' };
      }
      return null;
    },
  });
}
export function createOutboundReportFixtureAdapter(): OutboundReportAdapter {
  return createOutboundReportRowsAdapter(seed.rows as OutboundReportRow[], 'S19_MD_P10_R07_DETAIL5');
}
