import seed from '../fixtures/S17.seed.json';
import { createListFixtureAdapter } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { REVERSAL_SORT_KEYS, REVERSAL_STATUS_LABELS, reversalDateSortValue, type ReversalAdapter, type ReversalQuery, type ReversalRow, type ReversalScope } from '../../contracts/reversal-slips';

/** Shared read path for reference and DEV-only QA rows. The product imports no QA generator. */
export function createReversalRowsAdapter(input: readonly ReversalRow[], sourceId: string, scopeLabel: string): ReversalAdapter {
  const rows = structuredClone([...input]);
  return createListFixtureAdapter<ReversalRow, ReversalQuery, ReversalScope>({
    sourceId,
    source: { rows, completeness: 'complete', scope: 'detail', total: rows.length },
    summary: { detailRows: rows.length, scopeLabel },
    optionCatalogue: { status: seed.statusOptions },
    search: query => ({ value: query.search, fields: [row => row.code, row => row.originalDocument, row => row.reason, row => row.reasonDetail] }),
    filters: query => [row => query.status === '' || row.status === query.status],
    sort: query => query.sortKey ? {
      type: query.sortKey === 'totalQuantity' ? 'number' : query.sortKey === 'createdAt' ? 'date' : ['code', 'originalDocument'].includes(query.sortKey) ? 'code' : 'text',
      direction: query.sortDirection,
      value: row => query.sortKey === 'createdAt' ? reversalDateSortValue(row.createdAt)
        : query.sortKey === 'status' ? REVERSAL_STATUS_LABELS[row.status] : row[query.sortKey as keyof ReversalRow],
    } : undefined,
    // No source business ID: equal values preserve original fixture order in either direction.
    validate: query => typeof query.search !== 'string' || !Number.isSafeInteger(query.page) || query.page < 1
      || !PAGE_SIZE_OPTIONS.some(size => size === query.pageSize)
      || (query.status !== '' && !seed.statusOptions.includes(query.status))
      || (query.sortKey !== '' && !REVERSAL_SORT_KEYS.includes(query.sortKey))
      || !['asc', 'desc'].includes(query.sortDirection)
      ? { reason: 'INVALID_QUERY', detail: 'Điều kiện không thuộc lựa chọn đã xác nhận của S17.' } : null,
  });
}
export function createReversalFixtureAdapter(): ReversalAdapter {
  const rows = seed.rows.map((row, index) => ({ ...row, status: row.status as ReversalRow['status'], renderKey: `s17-source-${index + 1}` }));
  return createReversalRowsAdapter(rows, 'S17_REV00_P01r01_SOURCE', 'Phạm vi hiển thị: 1 phiếu trong bộ nguồn đối chiếu.');
}
