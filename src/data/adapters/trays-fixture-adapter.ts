import seed from '../fixtures/S11.seed.json';
import type { ListReadResult } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS, type TableQueryPagination } from '../../shared/table-query';
import { DEFAULT_TRAYS_QUERY, type TrayRow, type TraysAdapter, type TraysModel, type TraysQuery } from '../../contracts/trays';

function blocked(query: TraysQuery, reason: string, detail: string): ListReadResult<TrayRow, TraysQuery, TraysModel['summary']> {
  return { kind: 'blocked', query: structuredClone(query), reason, detail };
}

/**
 * Only seven Default rows are supplied; even the first ten-row window is partial.
 * The catalogue total remains the sourced aggregate of twelve; unknown rows
 * are never synthesized to make page 2 or a filtered total look successful.
 */
export function createTraysFixtureAdapter(): TraysAdapter {
  const fixture = structuredClone(seed.fixture);
  if (fixture.visibleRows.length !== 7 || fixture.hiddenPageRows !== 5 || fixture.trayCount !== 12 || fixture.boxCount !== 76 || fixture.visibleBoxSum !== 50) {
    throw new Error('S11 source integrity mismatch');
  }
  const rows: TrayRow[] = fixture.visibleRows.map(([trayCode, boxCount, skuCount, latestPackingOrder]) => {
    if (typeof trayCode !== 'string' || typeof boxCount !== 'number' || typeof skuCount !== 'number' ||
        (latestPackingOrder !== null && typeof latestPackingOrder !== 'string')) throw new Error('Invalid S11 source row.');
    return { trayCode, boxCount, skuCount, latestPackingOrder, updatedAtLabel: '—' };
  });
  const pagination = (page: number): TableQueryPagination => ({
    page,
    pageSize: 10,
    pageCount: 2,
    total: fixture.trayCount,
    unfilteredTotal: fixture.trayCount,
    start: page === 1 ? 1 : 11,
    end: page === 1 ? rows.length : 12,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  });
  return {
    async read(input = { ...DEFAULT_TRAYS_QUERY }, context) {
      if (context?.signal?.aborted) throw new DOMException('The S11 fixture read was cancelled.', 'AbortError');
      const query = structuredClone(input);
      if (typeof query.search !== 'string' || !PAGE_SIZE_OPTIONS.includes(query.pageSize as 10) || !Number.isSafeInteger(query.page) || query.page < 1 || query.page > 2) {
        return blocked(query, 'INVALID_QUERY', 'Điều kiện không thuộc các lựa chọn của bản xem trước S11.');
      }
      if (query.search.trim()) {
        return blocked(query, 'INCOMPLETE_SOURCE', 'Không đủ năm khay còn thiếu để tính kết quả tìm kiếm trên toàn danh mục.');
      }
      if (query.page === 2) {
        return blocked(query, 'INCOMPLETE_SOURCE', 'Năm khay còn thiếu chưa được cung cấp; không đủ dữ liệu cho trang 2.');
      }
      if (query.pageSize !== 10) {
        return blocked(query, 'INCOMPLETE_SOURCE', 'Chưa có đủ mười hai khay để xác nhận cửa sổ dữ liệu theo kích thước trang mới.');
      }
      const model: TraysModel = {
        query,
        rows: structuredClone(rows),
        pagination: pagination(1),
        summary: { trayCount: fixture.trayCount, boxCount: fixture.boxCount },
        filterOptions: {},
        source: {
          id: 'S11-P01-r01-detail-page-1',
          scope: 'catalogue',
          completeness: 'partial',
          detailTotal: rows.length,
          aggregateTotal: fixture.trayCount,
        },
      };
      return { kind: 'ready', model };
    },
  };
}
