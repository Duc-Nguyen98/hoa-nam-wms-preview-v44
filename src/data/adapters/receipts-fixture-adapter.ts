import seed from '../fixtures/S12.seed.json';
import { collectFilterOptions } from '../../shared/list-runtime';
import type { ListReadResult } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { DEFAULT_RECEIPTS_QUERY, type ReceiptRow, type ReceiptsAdapter, type ReceiptsQuery, type ReceiptsSummary } from '../../contracts/receipts';

/** Only the Default snapshot is sourced. Never sort/filter seven rows as all 84. */
export function createReceiptsFixtureAdapter(): ReceiptsAdapter {
  const f = structuredClone(seed.fixture);
  const rows: ReceiptRow[] = f.rows.map(values => {
    const [receipt, source, reference, skuCount, codeCount, creator, status, updatedAt, action] = values;
    if ([receipt, source, reference, creator, status, updatedAt, action].some(v => typeof v !== 'string') || typeof skuCount !== 'number' || typeof codeCount !== 'number') throw Error('Invalid S12 source row');
    return { receipt, source, reference, skuCount, codeCount, creator, status, updatedAt, action } as ReceiptRow;
  });
  if (rows.length !== 7 || new Set(rows.map(row => row.receipt)).size !== 7 || rows.reduce((sum, row) => sum + row.codeCount, 0) !== f.visiblePageCodeSum || f.visiblePageCodeSum !== 320 || f.totalReceipts !== 84 || f.received + f.draft + f.recording !== f.totalReceipts || f.scannedCodeAggregate !== 1284) throw Error('S12 source integrity mismatch');
  const summary: ReceiptsSummary = { totalReceipts: f.totalReceipts, received: f.received, draft: f.draft, recording: f.recording, percentage: f.percentage, scannedCodeAggregate: f.scannedCodeAggregate };
  const filterOptions = collectFilterOptions(rows, { status: row => row.status, source: row => row.source });
  const blocked = (query: ReceiptsQuery, reason: string, detail: string): ListReadResult<ReceiptRow, ReceiptsQuery, ReceiptsSummary> => ({ kind: 'blocked', query, reason, detail });
  return {
    async read(input = { ...DEFAULT_RECEIPTS_QUERY }, context) {
      if (context?.signal?.aborted) throw new DOMException('S12 fixture read cancelled', 'AbortError');
      const query = structuredClone(input);
      if (typeof query.search !== 'string' || !Number.isSafeInteger(query.page) || query.page < 1 || query.page > Math.ceil(f.totalReceipts / query.pageSize) || !PAGE_SIZE_OPTIONS.includes(query.pageSize as 10) || !['updated-desc', 'updated-asc'].includes(query.sort) || (query.status !== '' && !filterOptions.status.includes(query.status)) || (query.source !== '' && !filterOptions.source.includes(query.source))) {
        return blocked(query, 'INVALID_QUERY', 'Điều kiện không thuộc các lựa chọn có nguồn của S12.');
      }
      if (query.search.trim() || query.status || query.source) return blocked(query, 'INCOMPLETE_SOURCE', 'Thiếu 77 phiếu để xác nhận kết quả tìm kiếm/lọc toàn danh mục.');
      if (query.sort !== DEFAULT_RECEIPTS_QUERY.sort) return blocked(query, 'INCOMPLETE_SOURCE', 'Thiếu 77 phiếu để sắp xếp toàn danh mục theo cập nhật cũ nhất.');
      if (query.page !== 1) return blocked(query, 'INCOMPLETE_SOURCE', `Không có fixture của trang ${query.page}.`);
      if (query.pageSize !== DEFAULT_RECEIPTS_QUERY.pageSize) return blocked(query, 'INCOMPLETE_SOURCE', 'Chưa đủ dữ liệu để xác nhận cửa sổ số dòng mới.');
      // Whitespace-only search has the same meaning as Default, not a new result set.
      query.search = '';
      return { kind: 'ready', model: {
        query, rows: structuredClone(rows), summary: structuredClone(summary), filterOptions: structuredClone(filterOptions),
        pagination: { page: 1, pageSize: 10, pageCount: Math.ceil(f.totalReceipts / 10), total: f.totalReceipts, unfilteredTotal: f.totalReceipts, start: 1, end: rows.length, pageSizeOptions: PAGE_SIZE_OPTIONS },
        source: { id: 'S12-P01-r01-default', scope: 'catalogue', completeness: 'partial', detailTotal: rows.length, aggregateTotal: f.totalReceipts },
      } };
    },
  };
}
