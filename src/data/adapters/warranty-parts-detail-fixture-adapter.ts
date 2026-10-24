import fixture from '../fixtures/S22.desktop.json';
import { createListFixtureAdapter } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { WARRANTY_DETAIL_SORT_KEYS, WARRANTY_DETAIL_STATUSES, type WarrantyDetailAdapter, type WarrantyDetailQuery, type WarrantyDetailRow } from '../../contracts/warranty-parts-detail';

/** Injection supports an isolated QA scenario, never generated product rows. */
export function createWarrantyPartsDetailRowsAdapter(input: readonly WarrantyDetailRow[], sourceId: string): WarrantyDetailAdapter {
  const rows = structuredClone([...input]);
  return createListFixtureAdapter<WarrantyDetailRow, WarrantyDetailQuery, null>({
    sourceId, source: { rows, completeness: 'complete', scope: 'detail', total: rows.length }, summary: null,
    filterOptions: { status: row => row.status },
    search: query => ({ value: query.search, fields: [row => row.ticketCode, row => row.serial, row => row.sku, row => row.component] }),
    filters: query => [row => !query.status || row.status === query.status],
    sort: query => query.sortKey ? {
      type: query.sortKey === 'receivedDate' || query.sortKey === 'dueDate' ? 'date' : 'text',
      direction: query.sortDirection, value: row => row[query.sortKey as keyof WarrantyDetailRow],
    } : undefined,
    stableId: row => row.ticketCode,
    validate: query => typeof query.search !== 'string' || !Number.isSafeInteger(query.page) || query.page < 1
      || !PAGE_SIZE_OPTIONS.some(size => size === query.pageSize)
      || (query.status !== '' && !WARRANTY_DETAIL_STATUSES.includes(query.status))
      || (query.sortKey !== '' && !WARRANTY_DETAIL_SORT_KEYS.includes(query.sortKey))
      || !['asc', 'desc'].includes(query.sortDirection)
      ? { reason: 'INVALID_QUERY', detail: 'Điều kiện không thuộc lựa chọn hợp lệ của chi tiết S22.' } : null,
  });
}
export function createWarrantyPartsDetailFixtureAdapter(): WarrantyDetailAdapter {
  return createWarrantyPartsDetailRowsAdapter(fixture.rows as WarrantyDetailRow[], fixture.sourceId);
}
