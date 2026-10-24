import seed from '../fixtures/S21.seed.json';
import { createListFixtureAdapter } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { parseIsoDate } from '../../shared/date-picker-calendar';
import { INVENTORY_REPORT_NUMERIC_KEYS, INVENTORY_REPORT_SORT_KEYS, INVENTORY_REPORT_STATUSES, type InventoryReportAdapter, type InventoryReportQuery, type InventoryReportRow, type InventoryReportSummary } from '../../contracts/inventory-report';

/** The report snapshot is independent of the detail set and all list filters. */
export function createInventoryReportRowsAdapter(input: readonly InventoryReportRow[], sourceId: string): InventoryReportAdapter {
  const rows = structuredClone([...input]);
  const skus = new Set(rows.map(row => row.sku));
  return createListFixtureAdapter<InventoryReportRow, InventoryReportQuery, InventoryReportSummary>({
    sourceId, source: { rows, completeness: 'complete', scope: 'detail', total: rows.length },
    summary: seed.summary,
    optionCatalogue: { status: seed.statusOptions },
    filterOptions: { sku: row => row.sku },
    search: query => ({ value: query.search, fields: [row => row.sku, row => row.name] }),
    filters: query => [row => !query.sku || row.sku === query.sku, row => !query.status || row.status === query.status],
    sort: query => ({
      type: (INVENTORY_REPORT_NUMERIC_KEYS as readonly string[]).includes(query.sortKey) ? 'number' : query.sortKey === 'sku' ? 'code' : 'text',
      direction: query.sortDirection, value: row => row[query.sortKey],
    }),
    // Shared sort preserves input order on equal values; no invented business ID.
    validate: query => {
      if (typeof query.search !== 'string' || !Number.isSafeInteger(query.page) || query.page < 1
        || !PAGE_SIZE_OPTIONS.some(size => size === query.pageSize)
        || (query.sku !== '' && !skus.has(query.sku))
        || (query.status !== '' && !INVENTORY_REPORT_STATUSES.includes(query.status))
        || !INVENTORY_REPORT_SORT_KEYS.includes(query.sortKey) || !['asc', 'desc'].includes(query.sortDirection)
        || !query.period || !parseIsoDate(query.period.from) || !parseIsoDate(query.period.to) || query.period.from > query.period.to) {
        return { reason: 'INVALID_QUERY', detail: 'Điều kiện không thuộc lựa chọn hợp lệ của S21.' };
      }
      if (query.period.from !== seed.period.from || query.period.to !== seed.period.to) return {
        reason: 'MISSING_PERIOD_SNAPSHOT', detail: 'S21 chỉ có snapshot 04–10/09/2026. Chuỗi tồn cuối ngày không cung cấp tồn thực tế cho kỳ khác.',
      };
      return null;
    },
  });
}
export function createInventoryReportFixtureAdapter(): InventoryReportAdapter {
  return createInventoryReportRowsAdapter(seed.rows as InventoryReportRow[], 'S21_P08_W06_SOURCE4');
}
