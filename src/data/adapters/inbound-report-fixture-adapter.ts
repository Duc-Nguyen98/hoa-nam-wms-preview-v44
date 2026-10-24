import seed from '../fixtures/S18.seed.json';
import { createListFixtureAdapter } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { parseIsoDate } from '../../shared/date-picker-calendar';
import { INBOUND_REPORT_SORT_KEYS, INBOUND_REPORT_STATUSES, type InboundReportAdapter, type InboundReportQuery, type InboundReportRow, type InboundReportSummary } from '../../contracts/inbound-report';

/** Same read path for source and isolated QA; summary never comes from detail rows. */
export function createInboundReportRowsAdapter(input: readonly InboundReportRow[], sourceId: string): InboundReportAdapter {
  const rows = structuredClone([...input]);
  const suppliers = new Set(rows.map(row => row.supplier));
  return createListFixtureAdapter<InboundReportRow, InboundReportQuery, InboundReportSummary>({
    sourceId,
    source: { rows, completeness: 'complete', scope: 'detail', total: rows.length, aggregateTotal: seed.summary.receipts },
    summary: seed.summary as InboundReportSummary,
    optionCatalogue: { status: seed.statusOptions },
    filterOptions: { supplier: row => row.supplier },
    search: query => ({ value: query.search, fields: [row => row.code, row => row.supplier] }),
    filters: query => [row => !query.supplier || row.supplier === query.supplier, row => !query.status || row.status === query.status],
    sort: query => ({
      type: query.sortKey === 'receivedQuantity' ? 'number' : query.sortKey === 'receivedDate' ? 'date' : query.sortKey === 'code' ? 'code' : 'text',
      direction: query.sortDirection, value: row => row[query.sortKey],
    }),
    // Render keys are not business IDs. Ties retain source order in both directions.
    validate: query => {
      if (typeof query.search !== 'string' || !Number.isSafeInteger(query.page) || query.page < 1
        || !PAGE_SIZE_OPTIONS.some(size => size === query.pageSize)
        || (query.status !== '' && !INBOUND_REPORT_STATUSES.includes(query.status))
        || (query.supplier !== '' && !suppliers.has(query.supplier))
        || !INBOUND_REPORT_SORT_KEYS.includes(query.sortKey) || !['asc', 'desc'].includes(query.sortDirection)
        || !query.period || !parseIsoDate(query.period.from) || !parseIsoDate(query.period.to) || query.period.from > query.period.to) {
        return { reason: 'INVALID_QUERY', detail: 'Điều kiện không thuộc lựa chọn hợp lệ của S18.' };
      }
      if (query.period.from !== seed.period.from || query.period.to !== seed.period.to) {
        return { reason: 'MISSING_PERIOD_SNAPSHOT', detail: 'Chỉ có snapshot toàn màn cho kỳ 04/09/2026–10/09/2026; chuỗi bảy ngày không chứng minh snapshot khoảng con.' };
      }
      return null;
    },
  });
}
export function createInboundReportFixtureAdapter(): InboundReportAdapter {
  return createInboundReportRowsAdapter(seed.rows as InboundReportRow[], 'S18_MD_P01r01_SOURCE_DETAIL5');
}
