import type { WarrantyReportRow } from '../../contracts/warranty-parts-report';
import { queryTable } from '../../shared/table-query';

export type WarrantyDetailSortKey = 'code' | 'sku' | 'partName' | 'receivedAt' | 'dueAt' | 'status';
export interface WarrantyDetailQuery {
  search: string;
  status: WarrantyReportRow['status'] | '';
  sortKey: WarrantyDetailSortKey;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
export const DEFAULT_WARRANTY_DETAIL_QUERY: WarrantyDetailQuery = {
  search: '', status: '', sortKey: 'receivedAt', sortDirection: 'desc', page: 1, pageSize: 10,
};

/** The report service returns all period rows; shared query semantics apply before paging. */
export function queryWarrantyDetails(rows: readonly WarrantyReportRow[], total: number, query: WarrantyDetailQuery) {
  return queryTable({
    source: { rows, total, completeness: 'complete' },
    query,
    search: { value: query.search, fields: [row => row.code, row => row.serial, row => row.sku, row => row.partName] },
    filters: [row => !query.status || row.status === query.status],
    sort: {
      type: query.sortKey === 'receivedAt' || query.sortKey === 'dueAt' ? 'date' : query.sortKey === 'code' || query.sortKey === 'sku' ? 'code' : 'text',
      value: row => row[query.sortKey], direction: query.sortDirection,
    },
    stableId: row => row.id,
  });
}
