import seed from '../fixtures/S14.seed.json';
import { collectFilterOptions, type ListReadResult } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { DEFAULT_PUTAWAY_ORDERS_QUERY as defaults, type PutawayOrdersAdapter, type PutawayOrdersQuery, type PutawayOrderRow, type PutawayOrdersSummary } from '../../contracts/putaway-orders';

/** Keep catalogue aggregates separate from the seven available records.
 * HN-F06 is deliberately NOT joined to S13: BOX/receipt/quantity conflict. */
export function createPutawayOrdersFixtureAdapter(): PutawayOrdersAdapter {
  const f = structuredClone(seed.fixture);
  const rows: PutawayOrderRow[] = f.visibleRows.map(values => {
    const [orderCode, boxCode, sku, sourceReceipt, destinationTray, quantity, status, updatedAt, version, action] = values;
    if ([orderCode, boxCode, sku, sourceReceipt, destinationTray, status, updatedAt, version, action].some(value => typeof value !== 'string') || typeof quantity !== 'number') throw Error('Invalid S14 source row');
    return { orderCode, boxCode, sku, sourceReceipt, destinationTray, quantity, status, updatedAt, version, action } as PutawayOrderRow;
  });
  if (rows.length !== 7 || new Set(rows.map(row => row.orderCode)).size !== 7 || rows.reduce((sum, row) => sum + row.quantity, 0) !== 394 || f.totalOrders !== 82 || f.confirmedOrders !== 76 || f.draftOrders !== 4 || f.cancelledOrders !== 2 || rows.some(row => row.updatedAt !== '—' || row.action !== (row.status === 'Nháp' ? 'Tiếp tục' : 'Chi tiết'))) throw Error('S14 source integrity mismatch');
  const summary: PutawayOrdersSummary = { totalOrders: f.totalOrders, confirmedOrders: f.confirmedOrders, draftOrders: f.draftOrders, cancelledOrders: f.cancelledOrders, relatedQueueBadge: f.relatedQueueBadge };
  const filterOptions = collectFilterOptions(rows, { status: row => row.status, sourceReceipt: row => row.sourceReceipt });
  const blocked = (query: PutawayOrdersQuery, reason: string, detail: string): ListReadResult<PutawayOrderRow, PutawayOrdersQuery, PutawayOrdersSummary> => ({ kind: 'blocked', query, reason, detail });
  return { async read(input = { ...defaults }, context) {
    if (context?.signal?.aborted) throw new DOMException('S14 fixture read cancelled', 'AbortError');
    const query = structuredClone(input);
    if (typeof query.search !== 'string' || !Number.isSafeInteger(query.page) || query.page < 1 || query.page > Math.ceil(f.totalOrders / query.pageSize) || !PAGE_SIZE_OPTIONS.includes(query.pageSize as 10) || (query.status !== '' && !filterOptions.status.includes(query.status)) || (query.sourceReceipt !== '' && !filterOptions.sourceReceipt.includes(query.sourceReceipt))) return blocked(query, 'INVALID_QUERY', 'Điều kiện không thuộc lựa chọn có nguồn S14.');
    if (query.search.trim() || query.status || query.sourceReceipt) return blocked(query, 'INCOMPLETE_SOURCE', 'Thiếu 75 lệnh để xác nhận tìm kiếm/lọc toàn bộ 82 lệnh; không trả Empty hoặc tổng giả.');
    if (query.page !== 1) return blocked(query, 'INCOMPLETE_SOURCE', `Chưa có nguồn trang ${query.page}.`);
    if (query.pageSize !== defaults.pageSize) return blocked(query, 'INCOMPLETE_SOURCE', 'Chưa đủ dữ liệu để xác nhận cửa sổ số dòng mới.');
    query.search = '';
    return { kind: 'ready', model: {
      query, rows: structuredClone(rows), summary: structuredClone(summary), filterOptions: structuredClone(filterOptions),
      pagination: { page: 1, pageSize: defaults.pageSize, pageCount: Math.ceil(f.totalOrders / defaults.pageSize), total: f.totalOrders, unfilteredTotal: f.totalOrders, start: 1, end: rows.length, pageSizeOptions: PAGE_SIZE_OPTIONS },
      source: { id: 'S14-P01-r01-default', scope: 'catalogue', completeness: 'partial', detailTotal: rows.length, aggregateTotal: f.totalOrders },
    } };
  } };
}
