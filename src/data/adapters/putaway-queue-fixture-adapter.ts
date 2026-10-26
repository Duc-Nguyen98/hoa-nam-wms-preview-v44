import seed from '../fixtures/S13.seed.json';
import { collectFilterOptions, type ListReadResult } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { DEFAULT_PUTAWAY_QUEUE_QUERY as defaults, type PutawayQueueAdapter, type PutawayQueueQuery, type PutawayQueueRow, type PutawayQueueSummary } from '../../contracts/putaway-queue';

/** Seven source records are NOT the full 24-BOX query result. No inferred joins. */
export function createPutawayQueueFixtureAdapter(): PutawayQueueAdapter {
  const f = structuredClone(seed.fixture);
  const rows: PutawayQueueRow[] = f.visibleRows.map(values => {
    const [boxCode, sku, componentName, receiptCode, quantity, status, updatedAt, action] = values;
    if ([boxCode, sku, componentName, receiptCode, status, updatedAt, action].some(v => typeof v !== 'string') || typeof quantity !== 'number') throw Error('Invalid S13 source row');
    return { boxCode, sku, componentName, receiptCode, quantity, status, updatedAt, action } as PutawayQueueRow;
  });
  if (rows.length !== 7 || new Set(rows.map(row => row.boxCode)).size !== 7 || rows.reduce((sum, row) => sum + row.quantity, 0) !== 526 || new Set(rows.map(row => row.sku)).size !== 7 || f.boxCount !== 24 || f.skuCount !== 8 || f.quantityAggregate !== 642 || rows.some(row => row.updatedAt !== '—')) throw Error('S13 source integrity mismatch');
  const summary = { boxCount: f.boxCount, skuCount: f.skuCount, quantityAggregate: f.quantityAggregate };
  const filterOptions = collectFilterOptions(rows, { status: row => row.status, receiptCode: row => row.receiptCode });
  const blocked = (query: PutawayQueueQuery, reason: string, detail: string): ListReadResult<PutawayQueueRow, PutawayQueueQuery, PutawayQueueSummary> => ({ kind: 'blocked', query, reason, detail });
  return { async read(input = { ...defaults }, context) {
    if (context?.signal?.aborted) throw new DOMException('S13 fixture read cancelled', 'AbortError');
    const query = structuredClone(input);
    if (typeof query.search !== 'string' || !Number.isSafeInteger(query.page) || query.page < 1 || query.page > Math.ceil(f.boxCount / query.pageSize) || !PAGE_SIZE_OPTIONS.includes(query.pageSize as 10) || !filterOptions.status.includes(query.status) || (query.receiptCode !== '' && !filterOptions.receiptCode.includes(query.receiptCode))) return blocked(query, 'INVALID_QUERY', 'Điều kiện không thuộc lựa chọn có nguồn S13.');
    if (query.search.trim() || query.receiptCode) return blocked(query, 'INCOMPLETE_SOURCE', 'Thiếu 17 BOX để xác nhận kết quả tìm kiếm/lọc toàn bộ 24 BOX; không trả Empty hoặc tổng giả.');
    if (query.page !== 1) return blocked(query, 'INCOMPLETE_SOURCE', `Chưa có nguồn trang ${query.page}.`);
    if (query.pageSize !== defaults.pageSize) return blocked(query, 'INCOMPLETE_SOURCE', 'Chưa đủ dữ liệu để xác nhận cửa sổ số dòng mới.');
    query.search = '';
    return { kind: 'ready', model: {
      query, rows: structuredClone(rows), summary: structuredClone(summary), filterOptions: structuredClone(filterOptions),
      pagination: { page: 1, pageSize: defaults.pageSize, pageCount: Math.ceil(f.boxCount / defaults.pageSize), total: f.boxCount, unfilteredTotal: f.boxCount, start: 1, end: rows.length, pageSizeOptions: PAGE_SIZE_OPTIONS },
      source: { id: 'S13-P01-r01-default', scope: 'catalogue', completeness: 'partial', detailTotal: rows.length, aggregateTotal: f.boxCount },
    } };
  } };
}
